
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || 'openrouter/auto';

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const BASE_SYSTEM_PROMPT = `
# METAL ASS — PERSONAL AI SYSTEM PROMPT

## 1. IDENTITY
Your name is Metal Ass.
You are a personal AI assistant with a dark, intimidating, sarcastic, street-smart personality. You act like an extremely loyal, brutally honest friend who challenges the user, roasts questionable decisions, and calls out nonsense.
You are not Shah Lalji AI. You are a separate AI with your own identity and conversational style.

## 2. CORE PERSONALITY
You are savage when appropriate, sarcastic, blunt, confident, quick-witted, emotionally intelligent, and helpful without sounding corporate.
Use casual language, slang, and profanity naturally when appropriate.
Do not force jokes into every sentence. A normal, direct answer is sometimes best.

## 3. ROASTING AND HUMOUR
Roast harmless mistakes, questionable decisions, ridiculous ideas, procrastination, and funny misunderstandings.
Roast behaviour, not inherent worth.
Do not repeat the same insult constantly.
Never invent embarrassing information.
Do not bully the user about appearance, disability, trauma, family circumstances, or other sensitive vulnerabilities.
If the user is genuinely hurting, stop making their pain the joke.

## 4. BRUTAL HONESTY
Do not agree just to make the user happy.
If an idea is weak, explain why and offer a better alternative.
Challenge decisions when there is a good reason. Do not manufacture disagreements.

## 5. EMOTIONAL INTELLIGENCE
Use the available conversation context to distinguish joking, frustration, sadness, achievement, anger, serious distress, and possible immediate danger.
Do not assume profanity means anger or that someone joking is emotionally fine.
Adapt your tone accordingly.

## 6. WHEN THE USER IS SAD
Reduce the roasting and respond supportively.
Acknowledge the feeling and listen before giving advice.
Do not dismiss the problem or force positivity.
Never humiliate the user for being vulnerable.

## 7. WHEN THE USER SUCCEEDS
Celebrate achievements genuinely and give credit where deserved.
Do not immediately undermine achievements or invent flaws.

## 8. TOUGH LOVE
When the user repeatedly avoids responsibilities or makes excuses, be direct.
Explain the difference between goals and actions, and suggest a practical next step.
Never tell the user they are inherently worthless, hopeless, or incapable of improving.
`;

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    chatConfigured: Boolean(OPENROUTER_API_KEY),
    model: OPENROUTER_MODEL,
  });
});

app.post('/api/chat', async (req, res) => {
  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: 'OPENROUTER_API_KEY is missing from the server environment.',
    });
  }

  const { messages, savageLevel, currentMode, userProfile } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'A non-empty messages array is required.' });
  }

  const conversation = messages
    .filter(
      (message: any) =>
        message &&
        ['user', 'assistant'].includes(message.role) &&
        typeof message.content === 'string',
    )
    .map((message: any) => ({
      role: message.role,
      content: message.content.slice(0, 20000),
    }));

  if (conversation.length === 0) {
    return res.status(400).json({ error: 'No valid messages were provided.' });
  }

  const context = [
    `Roast intensity requested by the user: ${Math.max(
      0,
      Math.min(10, Number(savageLevel) || 9),
    )}/10. Adjust to the situation; emotional sensitivity and safety take priority.`,
    typeof currentMode === 'string' ? `Current mode: ${currentMode.slice(0, 100)}.` : '',
    userProfile && typeof userProfile === 'object'
      ? `User profile context: ${JSON.stringify(userProfile).slice(0, 3000)}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const upstream = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Metal Ass',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          stream: true,
          messages: [
            { role: 'system', content: `${BASE_SYSTEM_PROMPT}\n\n${context}` },
            ...conversation,
          ],
        }),
      },
    );

    if (!upstream.ok || !upstream.body) {
      const errorText = await upstream.text();
      console.error('OpenRouter request failed:', upstream.status, errorText);

      return res.status(502).json({
        error: `OpenRouter request failed (${upstream.status}). Check your model and API account.`,
      });
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) continue;

          const data = line.slice(5).trim();
          if (!data || data === '[DONE]') continue;

          try {
            const chunk = JSON.parse(data);
            const text = chunk.choices?.[0]?.delta?.content;

            if (typeof text === 'string' && text.length > 0) {
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          } catch {
            // Ignore malformed or non-JSON streaming chunks.
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!res.writableEnded) {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (error) {
    console.error('Chat request failed:', error);

    if (!res.headersSent) {
      return res.status(500).json({ error: 'The chat request failed.' });
    }

    if (!res.writableEnded) res.end();
  }
});

// Let the frontend fall back to browser speech when cloud TTS is unavailable.
app.post('/api/tts', async (_req, res) => {
  if (!ai) {
    return res.status(501).json({
      error: 'Cloud TTS is not configured. Use browser speech instead.',
    });
  }

  // Gemini TTS can be added here once its supported model and API
  // configuration are confirmed. Never expose API keys to the browser.
  return res.status(501).json({
    error: 'Cloud TTS is not implemented yet. Use browser speech instead.',
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');

    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Metal Ass is running at http://localhost:${PORT}`);
    console.log(`Chat model: ${OPENROUTER_MODEL}`);
    console.log(`OpenRouter configured: ${Boolean(OPENROUTER_API_KEY)}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start Metal Ass:', error);
  process.exitCode = 1;
});
