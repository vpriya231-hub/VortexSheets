/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON bodies
app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI SDK
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// API Route: Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', apiConfigured: !!ai });
});

// Helper to extract clean content from spreadsheet cells
function getCellsContext(cells: Record<string, any>) {
  if (!cells || Object.keys(cells).length === 0) return 'The active spreadsheet is empty.';
  
  // Format cells into an easily readable grid text context
  let text = 'Active Spreadsheet Cells:\n';
  Object.entries(cells).forEach(([key, value]: [string, any]) => {
    if (value && (value.rawValue || value.computedValue)) {
      text += `- Cell ${key}: Raw="${value.rawValue || ''}", Computed="${value.computedValue || ''}"\n`;
    }
  });
  return text;
}

// API Route: V Astra Chat Engine
app.post('/api/gemini/chat', async (req, res) => {
  if (!ai) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in the workspace environment settings.',
    });
  }

  const { message, history, activeSheetData } = req.body;

  try {
    const cellsContext = getCellsContext(activeSheetData?.cells);
    const systemInstruction = `You are V Astra AI, a highly intelligent, premium, modern AI spreadsheet co-pilot.
You help users with general spreadsheet formulas, cell calculations, data analytics, summaries, and complex multi-sheet lookups.
You have live access to the user's active spreadsheet cells. Use the provided cells data to answer precise questions about their data.
Always be direct, clear, and highly practical. Use Markdown for text formatting, tables, and formula instructions.
Avoid low-level technical jargon or unnecessary system metadata unless asked.

${cellsContext}`;

    // Format chat history for standard API structure
    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.text || '' }],
        });
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during AI processing.' });
  }
});

// API Route: Smart Autofill Pattern Recognition
app.post('/api/gemini/autofill', async (req, res) => {
  if (!ai) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in the workspace environment settings.',
    });
  }

  const { cells, rowCount, colCount, selection } = req.body;

  try {
    const cellsContext = getCellsContext(cells);
    const prompt = `Given the spreadsheet cell values below, detect numerical, calendar, text, sequence, formula, or mathematical patterns.
Use these patterns to predict/calculate Autofill suggestions for the target selection range.
Target Selection Range: Start="${selection?.startCell || 'A1'}", End="${selection?.endCell || 'A1'}"

Provide a list of predicted cell modifications containing raw values and computed values.
Return ONLY a valid JSON array of objects conforming to this schema:
[
  {
    "cellId": "A5",
    "rawValue": "50",
    "computedValue": "50",
    "explanation": "Continued arithmetic sequence (+10)"
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        { text: cellsContext },
        { text: prompt }
      ],
      config: {
        systemInstruction: 'You are an AI spreadsheet compiler. You analyze patterns and output precise autofill JSON suggestions. Never output any introductory or concluding text. Return raw JSON array only.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              cellId: { type: Type.STRING },
              rawValue: { type: Type.STRING },
              computedValue: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ['cellId', 'rawValue', 'computedValue']
          }
        },
        temperature: 0.1,
      },
    });

    let suggestions = [];
    try {
      suggestions = JSON.parse(response.text || '[]');
    } catch (e) {
      console.error('Failed to parse autofill output:', response.text);
    }

    res.json({ suggestions });
  } catch (error: any) {
    console.error('Autofill error:', error);
    res.status(500).json({ error: error.message || 'Smart Autofill pattern recognition failed.' });
  }
});

// API Route: Data Cleaning
app.post('/api/gemini/clean', async (req, res) => {
  if (!ai) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in the workspace environment settings.',
    });
  }

  const { cells } = req.body;

  try {
    const cellsContext = getCellsContext(cells);
    const prompt = `Analyze the spreadsheet cells.
We want to:
1. Identify and fix duplicate rows (where values in columns match other rows).
2. Fix missing cell values (provide intelligent defaults or average-based fills if logical).
3. Correct cell formatting irregularities (standardize dates, capitalized text, consistent currencies/numbers).

Please return a detailed diagnostic plan of what issues you found and how to fix them, along with the precise cell modifications.
Return ONLY a valid JSON object matching the following structure:
{
  "summary": "Found 2 duplicates and 1 missing value.",
  "issuesFound": ["Duplicate row detected at Row 3", "Cell B4 is missing formatting"],
  "modifications": [
    {
      "cellId": "B4",
      "rawValue": "Average Fill Value",
      "computedValue": "Average Fill Value",
      "reason": "Standardized empty cell with historical mean"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        { text: cellsContext },
        { text: prompt }
      ],
      config: {
        systemInstruction: 'You are a data cleaning engine. Return ONLY JSON matching the requested structure. Never output conversational wrappers or Markdown codeblocks.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            issuesFound: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            modifications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  cellId: { type: Type.STRING },
                  rawValue: { type: Type.STRING },
                  computedValue: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ['cellId', 'rawValue', 'computedValue']
              }
            }
          },
          required: ['summary', 'issuesFound', 'modifications']
        },
        temperature: 0.2,
      },
    });

    let results = { summary: 'No changes needed.', issuesFound: [], modifications: [] };
    try {
      results = JSON.parse(response.text || '{}');
    } catch (e) {
      console.error('Failed to parse clean output:', response.text);
    }

    res.json(results);
  } catch (error: any) {
    console.error('Data cleaning error:', error);
    res.status(500).json({ error: error.message || 'Data cleaning computation failed.' });
  }
});

// API Route: Predictive Analytics / Forecasting
app.post('/api/gemini/predict', async (req, res) => {
  if (!ai) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in the workspace environment settings.',
    });
  }

  const { cells, selection } = req.body;

  try {
    const cellsContext = getCellsContext(cells);
    const prompt = `Analyze the series of historical/current numbers in the selected range: Start="${selection?.startCell || 'A1'}", End="${selection?.endCell || 'A1'}"
We need to forecast the next 5 intervals/future values based on standard regression, growth multipliers, or statistical models.

Please return:
1. An analytical summary of the trend (e.g. "Linear growth of 5% detected").
2. Metrics like estimated average growth rate, overall slope, and confidence.
3. The next 5 projected data points with estimated values and column/row placements.

Return ONLY a valid JSON object matching the following structure:
{
  "trendSummary": "Consistent linear increase of approximately +15 units per row.",
  "confidence": "High (R² ~ 0.98)",
  "metrics": {
    "growthRate": "+12.5%",
    "avgValue": "150"
  },
  "predictions": [
    {
      "cellId": "A10",
      "projectedRaw": "165",
      "projectedComputed": "165",
      "confidenceInterval": "160-170"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        { text: cellsContext },
        { text: prompt }
      ],
      config: {
        systemInstruction: 'You are an advanced statistical forecasting engine. Analyze numerical values and return ONLY the JSON object format requested. Do not include markdown wraps.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trendSummary: { type: Type.STRING },
            confidence: { type: Type.STRING },
            metrics: {
              type: Type.OBJECT,
              properties: {
                growthRate: { type: Type.STRING },
                avgValue: { type: Type.STRING }
              }
            },
            predictions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  cellId: { type: Type.STRING },
                  projectedRaw: { type: Type.STRING },
                  projectedComputed: { type: Type.STRING },
                  confidenceInterval: { type: Type.STRING }
                },
                required: ['cellId', 'projectedRaw', 'projectedComputed']
              }
            }
          },
          required: ['trendSummary', 'confidence', 'predictions']
        },
        temperature: 0.2,
      },
    });

    let results = { trendSummary: 'Insufficient data for prediction.', confidence: 'N/A', predictions: [] };
    try {
      results = JSON.parse(response.text || '{}');
    } catch (e) {
      console.error('Failed to parse predict output:', response.text);
    }

    res.json(results);
  } catch (error: any) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: error.message || 'Predictive forecasting failed.' });
  }
});

// API Route: Intelligent Auto-Charting Suggestions
app.post('/api/gemini/chart', async (req, res) => {
  if (!ai) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in the workspace environment settings.',
    });
  }

  const { cells, selection } = req.body;

  try {
    const cellsContext = getCellsContext(cells);
    const prompt = `Based on the active cell range selection Start="${selection?.startCell || 'A1'}", End="${selection?.endCell || 'A1'}",
determine which data visualization chart would be most insightful for the user (e.g. Bar chart, Line chart, Area chart, Pie chart, Scatter chart).

We need to return:
1. Recommended Chart Type.
2. Title and subtitle recommendations.
3. Suggested X-Axis column, Y-Axis column series, and legend titles.
4. An elegant design rationale explaining why this chart represents the range well.

Return ONLY a valid JSON object conforming to this structure:
{
  "recommendedChartType": "bar" | "line" | "area" | "pie" | "scatter",
  "title": "Monthly Revenue Trends",
  "subtitle": "Analysis of Q1 - Q2 financial data",
  "xAxisKey": "Month",
  "yAxisKeys": ["Revenue", "Profit"],
  "designRationale": "A clustered bar chart is recommended to clearly compare monthly Revenue side-by-side with net Profit."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        { text: cellsContext },
        { text: prompt }
      ],
      config: {
        systemInstruction: 'You are an expert data visualization architect. Recommend optimal charts based on spreadsheet structures. Return raw JSON format ONLY.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedChartType: { type: Type.STRING },
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            xAxisKey: { type: Type.STRING },
            yAxisKeys: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            designRationale: { type: Type.STRING }
          },
          required: ['recommendedChartType', 'title', 'xAxisKey', 'yAxisKeys', 'designRationale']
        },
        temperature: 0.2,
      },
    });

    let results = {
      recommendedChartType: 'bar',
      title: 'Spreadsheet Visualization',
      xAxisKey: 'Category',
      yAxisKeys: ['Value'],
      designRationale: 'Default selection of bar chart to visualize column distribution.',
    };
    try {
      results = JSON.parse(response.text || '{}');
    } catch (e) {
      console.error('Failed to parse chart output:', response.text);
    }

    res.json(results);
  } catch (error: any) {
    console.error('Auto chart suggestion error:', error);
    res.status(500).json({ error: error.message || 'Intelligent auto-charting recommendation failed.' });
  }
});

// Setup Vite Dev Server / Static Assets handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VortexSheets Server] listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
