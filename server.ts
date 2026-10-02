import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Gemini Client with mandatory telemetry header
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint for Cloud Run and container monitoring
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini Q&A Endpoint for Students
app.post('/api/ai/ask', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { question, subject, mode, history } = req.body;

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

    // Models with automatic fallback for high availability
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
      } catch (modelErr) {
        lastError = modelErr;
        console.warn(`Model ${model} failed, attempting next candidate:`, modelErr instanceof Error ? modelErr.message : modelErr);
      }
    }

    if (!answer && lastError) {
      throw lastError;
    }

    return res.json({ answer: answer || 'I could not generate an explanation for this question. Please try rephrasing.' });
  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error from Gemini API';
    return res.status(500).json({ error: msg });
  }
});

// Mount Vite middleware for dev or serve static files in production
async function startServer() {
  const distDir = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.resolve(distDir, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasDist) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`StudyTracker server running on http://localhost:${port}`);
  });
}

// Only start listening when executed directly, not when imported on Vercel
if (!process.env.VERCEL) {
  startServer();
}

export default app;
