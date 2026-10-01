import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Gemini Client with mandatory telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Gemini Q&A Endpoint for Students
app.post('/api/ai/ask', async (req, res) => {
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

    const contents = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history) {
        if (h.role && h.text) {
          contents.push({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] });
        }
      }
    }
    contents.push({ role: 'user', parts: [{ text: question }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents.length === 1 ? question : contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const answer = response.text || 'I could not generate an explanation for this question. Please try rephrasing.';
    res.json({ answer });
  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error from Gemini API';
    res.status(500).json({ error: msg });
  }
});

// Mount Vite middleware for dev or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
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

startServer();
