import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Content-Type', 'application/json');

  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not set. Please add GEMINI_API_KEY to your Vercel Environment Variables.'
    });
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  try {
    const { question, subject, mode, history } = req.body || {};

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    const systemInstruction = `You are an expert, encouraging study tutor in StudyTracker.
Your mission is to help students thoroughly understand complex concepts, solve problems step-by-step, and ace their exams.
Subject: ${subject || 'General Academic'}.
Response Style: ${mode || 'Comprehensive Explanation'}.

Guidelines:
- Explain difficult ideas simply with analogies and concrete examples.
- For math/science/coding, provide structured step-by-step breakdowns with formulas and code blocks.
- End with a short comprehension check or pro study tip.
- Keep the tone encouraging, bright, and scholar-focused.`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history) {
        if (h.role && h.text) {
          contents.push({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] });
        }
      }
    }
    contents.push({ role: 'user', parts: [{ text: question }] });

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let answer = '';
    let lastError: unknown = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: contents.length === 1 ? question : contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        if (response.text) {
          answer = response.text;
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model ${model} failed on Vercel:`, err);
      }
    }

    if (!answer && lastError) {
      throw lastError;
    }

    return res.status(200).json({
      answer: answer || 'I could not generate an explanation for this question. Please try rephrasing.'
    });
  } catch (error: unknown) {
    console.error('Gemini API Error (Vercel):', error);
    const msg = error instanceof Error ? error.message : 'Unknown error from Gemini API';
    return res.status(500).json({ error: msg });
  }
}
