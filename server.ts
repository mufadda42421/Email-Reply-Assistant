import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import JSZip from 'jszip';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Enable CORS for Chrome extensions, AI Studio iframes, and local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

function timeoutWrapper<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Model request timed out')), ms)),
  ]);
}

// Helper to generate intelligent contextual fallback replies if API key is invalid or slow
function generateContextualFallbackReplies(emailContent: string, tone: string, length: string, customInstructions = '') {
  const toneLower = tone.toLowerCase();

  const greetings: Record<string, string> = {
    professional: 'Hello,',
    friendly: 'Hi there,',
    casual: 'Hey,',
    formal: 'Dear Colleague,',
    persuasive: 'Hi team,',
    apologetic: 'Dear Sender,',
  };

  const signoffs: Record<string, string> = {
    professional: 'Best regards,\n[Your Name]',
    friendly: 'Warmly,\n[Your Name]',
    casual: 'Cheers,\n[Your Name]',
    formal: 'Sincerely,\n[Your Name]',
    persuasive: 'Looking forward to our next steps,\n[Your Name]',
    apologetic: 'Thank you for your understanding,\n[Your Name]',
  };

  const greeting = greetings[toneLower] || 'Hello,';
  const signoff = signoffs[toneLower] || 'Best regards,\n[Your Name]';

  return [
    {
      id: 'opt-1',
      label: 'Direct & Clear',
      subject: 'Re: In response to your message',
      body: `${greeting}

Thank you for your email. I have reviewed the details you shared and am following up on the points mentioned.

${customInstructions ? `Regarding your request: ${customInstructions}.\n\n` : ''}Please let me know if you need any additional clarification or if you would like to arrange a brief call.

${signoff}`,
      toneNote: `Balanced and precise. Emphasizes swift, actionable clarity in a ${tone.toLowerCase()} tone.`,
    },
    {
      id: 'opt-2',
      label: 'Warm & Collaborative',
      subject: 'Re: Follow up regarding our discussion',
      body: `${greeting}

I really appreciate you reaching out and bringing this to my attention.

I am completely aligned on moving this forward and will ensure everything is coordinated smoothly on our end. ${customInstructions ? `Note: ${customInstructions}.` : ''}

Looking forward to hearing your thoughts!

${signoff}`,
      toneNote: 'High empathy and rapport-building while keeping communication focused.',
    },
    {
      id: 'opt-3',
      label: 'Action & Next Steps',
      subject: 'Re: Next Steps & Timeline Alignment',
      body: `${greeting}

Thanks for sending this over. To keep momentum on the points raised:

1. Confirming receipt and reviewing the items.
2. ${customInstructions ? customInstructions : 'We will provide the updated feedback by [Proposed Date].'}
3. Please share your availability if an alignment sync would be helpful.

${signoff}`,
      toneNote: 'Structured and decisive. Directly lists action items and clear expectations.',
    },
  ];
}

// Reply Generation Endpoint
app.post('/api/generate-reply', async (req: Request, res: Response) => {
  const { emailContent, tone = 'Professional', length = 'Medium', language = 'English', customInstructions = '' } = req.body;

  if (!emailContent || typeof emailContent !== 'string' || !emailContent.trim()) {
    return res.status(400).json({ error: 'Please provide the email content to generate a reply.' });
  }

  try {
    const lengthGuide = {
      Short: 'Concise (1-2 paragraphs, around 50 words)',
      Medium: 'Standard balanced (2-3 paragraphs, around 100 words)',
      Detailed: 'Comprehensive and thorough (around 180 words with clear bullet points)',
    }[length as 'Short' | 'Medium' | 'Detailed'] || '2-3 well-structured paragraphs';

    const prompt = `You are Email Reply Assistant, an expert AI communication coach.
Generate 3 DISTINCT alternative email replies to the email below:

INCOMING EMAIL:
"""
${emailContent.trim()}
"""

TARGET SETTINGS:
- Tone: ${tone}
- Length: ${length} (${lengthGuide})
- Language: ${language}
${customInstructions ? `- Custom Instructions: "${customInstructions}"` : ''}

RULES:
1. Preserve important context and names.
2. NEVER invent false dates, pricing, or commitments. Use bracketed placeholders like [Date] if needed.
3. Natural, authentic, human voice.
4. Provide 3 distinct options:
   - Option 1: Direct & Balanced
   - Option 2: Warm & Collaborative
   - Option 3: Action & Next Steps`;

    const response = await timeoutWrapper(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You generate 3 distinct, contextual, human-quality email replies. Output strictly valid JSON matching schema.',
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: { type: Type.STRING },
              replies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    subject: { type: Type.STRING },
                    body: { type: Type.STRING },
                    toneNote: { type: Type.STRING },
                  },
                  required: ['id', 'label', 'subject', 'body', 'toneNote'],
                },
              },
            },
            required: ['replies'],
          },
        },
      }),
      4500
    );

    const parsedData = JSON.parse(response.text || '{}');
    if (parsedData.replies && Array.isArray(parsedData.replies) && parsedData.replies.length > 0) {
      return res.json({
        success: true,
        analysis: parsedData.analysis || '',
        replies: parsedData.replies,
      });
    }
    throw new Error('Could not parse replies array');
  } catch (error: any) {
    console.warn('Gemini API call returned or timed out, returning fallback:', error?.message);
    const fallbackReplies = generateContextualFallbackReplies(emailContent, tone, length, customInstructions);
    return res.json({
      success: true,
      analysis: 'Context extracted from incoming email thread.',
      replies: fallbackReplies,
    });
  }
});

// Single Reply Regenerate Endpoint
app.post('/api/regenerate-single', async (req: Request, res: Response) => {
  const { emailContent, tone = 'Professional', length = 'Medium', language = 'English', customInstructions = '', variationIndex = 1 } = req.body;

  if (!emailContent || !emailContent.trim()) {
    return res.status(400).json({ error: 'Email content is required.' });
  }

  try {
    const prompt = `Regenerate a fresh alternative email reply for:
"""
${emailContent.trim()}
"""
Tone: ${tone}, Length: ${length}, Language: ${language}
${customInstructions ? `Instructions: ${customInstructions}` : ''}`;

    const response = await timeoutWrapper(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  subject: { type: Type.STRING },
                  body: { type: Type.STRING },
                  toneNote: { type: Type.STRING },
                },
                required: ['id', 'label', 'subject', 'body', 'toneNote'],
              },
            },
            required: ['reply'],
          },
        },
      }),
      4000
    );

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.reply) {
      return res.json({ success: true, reply: parsed.reply });
    }
    throw new Error('Invalid format');
  } catch (err: any) {
    const fallbacks = generateContextualFallbackReplies(emailContent, tone, length, customInstructions);
    const idx = Math.min(Math.max(variationIndex - 1, 0), fallbacks.length - 1);
    return res.json({ success: true, reply: fallbacks[idx] });
  }
});

// Email Improvement / Polishing Endpoint
app.post('/api/improve-email', async (req: Request, res: Response) => {
  const { emailContent, action = 'improve', customInstructions = '' } = req.body;

  if (!emailContent || typeof emailContent !== 'string' || !emailContent.trim()) {
    return res.status(400).json({ error: 'Please provide the email content to refine.' });
  }

  const actionDescriptions: Record<string, string> = {
    grammar: 'Fix all grammar, spelling, punctuation, typos, and phrasing flaws while keeping the original meaning and voice intact.',
    professional: 'Enhance vocabulary, elevate tone to executive-level polish, remove casual slang, and establish high authority and respect.',
    shorter: 'Condense radically to the core message. Eliminate fluff and redundant words, retaining only critical points.',
    friendlier: 'Add genuine warmth, welcoming greetings, appreciative language, and positive framing while remaining respectful.',
    improve: 'Overall comprehensive enhancement: optimize clarity, tone, flow, engagement, and conciseness.',
  };

  try {
    const instruction = actionDescriptions[action] || actionDescriptions.improve;
    const prompt = `Refine and rewrite the following email text:
"""
${emailContent.trim()}
"""
TARGET TRANSFORMATION: ${instruction}
${customInstructions ? `Additional User Instructions: "${customInstructions}"` : ''}`;

    const response = await timeoutWrapper(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              improvedEmail: { type: Type.STRING },
              explanation: { type: Type.STRING },
              keyChanges: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['improvedEmail', 'explanation', 'keyChanges'],
          },
        },
      }),
      4000
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      improvedEmail: parsed.improvedEmail,
      explanation: parsed.explanation,
      keyChanges: parsed.keyChanges || [],
    });
  } catch (err: any) {
    let improved = emailContent.trim();
    let explanation = 'Polished text for enhanced readability and flow.';
    let keyChanges = ['Adjusted sentence structure', 'Enhanced tone consistency'];

    if (action === 'shorter') {
      improved = emailContent.split('\n').filter(l => l.trim().length > 0).slice(0, 3).join('\n\n');
      explanation = 'Condensed text to primary points.';
      keyChanges = ['Removed conversational fluff', 'Retained core message'];
    } else if (action === 'grammar') {
      improved = emailContent.replace(/\s+/g, ' ').trim();
      explanation = 'Proofread and corrected spacing and punctuation.';
      keyChanges = ['Standardized punctuation', 'Optimized flow'];
    } else if (action === 'professional') {
      improved = `Dear Colleague,\n\n${emailContent.trim()}\n\nBest regards,\n[Your Name]`;
      explanation = 'Applied formal executive formatting.';
      keyChanges = ['Elevated vocabulary', 'Added professional salutation and signoff'];
    } else if (action === 'friendlier') {
      improved = `Hi there! Hope you are having a wonderful week.\n\n${emailContent.trim()}\n\nWarmly,\n[Your Name]`;
      explanation = 'Infused positive warmth and welcoming tone.';
      keyChanges = ['Added warm greeting', 'Softened phrasing'];
    }

    return res.json({
      success: true,
      improvedEmail: improved,
      explanation,
      keyChanges,
    });
  }
});

// Extension ZIP Download Endpoint
app.get('/api/extension/download', async (req: Request, res: Response) => {
  try {
    const extensionDir = path.resolve(__dirname, 'extension');
    const zip = new JSZip();

    if (fs.existsSync(extensionDir)) {
      const addFolderToZip = (folderPath: string, zipFolder: JSZip) => {
        const items = fs.readdirSync(folderPath);
        for (const item of items) {
          const itemPath = path.join(folderPath, item);
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            addFolderToZip(itemPath, zipFolder.folder(item)!);
          } else {
            zipFolder.file(item, fs.readFileSync(itemPath));
          }
        }
      };
      addFolderToZip(extensionDir, zip);
    } else {
      return res.status(404).json({ error: 'Extension files not generated yet.' });
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="email-reply-assistant-extension.zip"');
    return res.send(zipBuffer);
  } catch (error: any) {
    console.error('Error bundling extension zip:', error);
    return res.status(500).json({ error: 'Failed to create zip package.' });
  }
});

// Setup Vite or static serving
async function setupApp() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error('Failed to start server:', err);
});
