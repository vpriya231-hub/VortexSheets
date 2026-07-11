/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  BarChart2,
  Sparkle,
  Grid,
  Trash
} from 'lucide-react';
import { SpreadsheetData, SelectionState } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  type?: 'normal' | 'clean_result' | 'predict_result' | 'chart_result' | 'autofill_result';
  metadata?: any;
}

interface AiPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  activeSheetData: SpreadsheetData;
  setData: (value: SpreadsheetData | ((prev: SpreadsheetData) => SpreadsheetData)) => void;
  selection: SelectionState;
  onOpenVisualizer: (chartType: 'bar' | 'pie' | 'line', chartTitle: string, chartRange: string) => void;
}

export default function AiPanel({
  isOpen,
  onClose,
  isDarkMode,
  activeSheetData,
  setData,
  selection,
  onOpenVisualizer
}: AiPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello! I am **V Astra AI**, your intelligent spreadsheet co-pilot. I have live access to your active sheet. How can I assist you with your calculations, formulas, or data analysis today?\n\nYou can ask me complex questions like:\n* *\"Summarize my data\"*\n* *\"What is the average of Column B?\"*\n* *\"Predict future trends based on the selected cells\"*",
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text: string = inputText) => {
    const messageToSend = text.trim();
    if (!messageToSend) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: messageToSend
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setErrorText(null);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          history: messages.map(m => ({ role: m.role, text: m.text })),
          activeSheetData
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server-side chat failure');
      }

      const data = await response.json();
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.text || 'I analyzed your sheet and formulas, but was unable to formulate a response.'
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Unable to connect to V Astra AI.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Action: Summarize Data
  const handleSummarizeData = () => {
    handleSend('Summarize the active sheet data and provide key observations.');
  };

  // Quick Action: Clean Data
  const handleCleanData = async () => {
    setIsLoading(true);
    setErrorText(null);
    try {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: 'Clean spreadsheet (identifying duplicates, formats, and missing values)'
      };
      setMessages(prev => [...prev, userMsg]);

      const response = await fetch('/api/gemini/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cells: activeSheetData.cells })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Clean data API request failed');
      }

      const cleanDataResult = await response.json();

      let formattedText = `### V Astra AI Data Cleaning Diagnostics\n\n**Summary:** ${cleanDataResult.summary}\n\n`;
      if (cleanDataResult.issuesFound && cleanDataResult.issuesFound.length > 0) {
        formattedText += `**Issues Identified:**\n`;
        cleanDataResult.issuesFound.forEach((issue: string) => {
          formattedText += `- ⚠️ ${issue}\n`;
        });
      } else {
        formattedText += `✨ No major formatting, structural, or duplication issues were identified!\n`;
      }

      if (cleanDataResult.modifications && cleanDataResult.modifications.length > 0) {
        formattedText += `\n**Proposed Corrections (${cleanDataResult.modifications.length}):**\n`;
        cleanDataResult.modifications.slice(0, 8).forEach((mod: any) => {
          formattedText += `- Cell **${mod.cellId}**: Set value to \`${mod.rawValue}\` (*Reason: ${mod.reason || 'Standardization'}*)\n`;
        });
        if (cleanDataResult.modifications.length > 8) {
          formattedText += `- *And ${cleanDataResult.modifications.length - 8} more proposed corrections...*\n`;
        }
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: formattedText,
        type: 'clean_result',
        metadata: cleanDataResult.modifications
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Data cleaning request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Action: Predict Trends
  const handlePredictTrends = async () => {
    setIsLoading(true);
    setErrorText(null);
    try {
      const startCell = selection.startCell || 'A1';
      const endCell = selection.endCell || 'A1';
      const rangeStr = startCell === endCell ? `${startCell}:${startCell}` : `${startCell}:${endCell}`;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: `Predict trends for selection range ${rangeStr}`
      };
      setMessages(prev => [...prev, userMsg]);

      const response = await fetch('/api/gemini/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cells: activeSheetData.cells, selection })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Prediction API request failed');
      }

      const predictResult = await response.json();

      let formattedText = `### Predictive Analytics Forecast\n\n**Trend Analysis:** ${predictResult.trendSummary}\n`;
      formattedText += `**Prediction Confidence:** ${predictResult.confidence || 'Medium'}\n\n`;
      
      if (predictResult.metrics) {
        formattedText += `**Key Estimations:**\n`;
        if (predictResult.metrics.growthRate) formattedText += `- Average Growth Rate: \`${predictResult.metrics.growthRate}\`\n`;
        if (predictResult.metrics.avgValue) formattedText += `- Overall Mean: \`${predictResult.metrics.avgValue}\`\n`;
      }

      if (predictResult.predictions && predictResult.predictions.length > 0) {
        formattedText += `\n**Next 5 Projected Intervals:**\n`;
        predictResult.predictions.forEach((pred: any) => {
          formattedText += `- Cell **${pred.cellId}**: \`${pred.projectedRaw}\` (*Confidence Interval: ${pred.confidenceInterval || 'N/A'}*)\n`;
        });
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: formattedText,
        type: 'predict_result',
        metadata: predictResult.predictions
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Trend prediction failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Action: Generate Chart
  const handleGenerateChart = async () => {
    setIsLoading(true);
    setErrorText(null);
    try {
      const startCell = selection.startCell || 'A1';
      const endCell = selection.endCell || 'A1';
      const rangeStr = startCell === endCell ? `${startCell}:${startCell}` : `${startCell}:${endCell}`;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: `Recommend chart options for active range ${rangeStr}`
      };
      setMessages(prev => [...prev, userMsg]);

      const response = await fetch('/api/gemini/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cells: activeSheetData.cells, selection })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Chart suggestions API request failed');
      }

      const chartResult = await response.json();

      let formattedText = `### AI Visualization Recommendation\n\n`;
      formattedText += `**Recommended Chart Type:** \`${chartResult.recommendedChartType.toUpperCase()}\`\n`;
      formattedText += `**AI-Generated Title:** "${chartResult.title || 'Data Insights'}"\n`;
      formattedText += `**X-Axis Field Key:** \`${chartResult.xAxisKey || 'Label'}\`\n`;
      if (chartResult.yAxisKeys) formattedText += `**Y-Axis Value Keys:** \`${chartResult.yAxisKeys.join(', ')}\`\n\n`;
      formattedText += `**Design & Analytical Rationale:**\n${chartResult.designRationale}\n`;

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: formattedText,
        type: 'chart_result',
        metadata: {
          chartType: chartResult.recommendedChartType,
          title: chartResult.title || 'AI Generated Chart',
          range: rangeStr
        }
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Auto chart recommendation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Smart Autofill Column Pattern Suggestion
  const handleSmartAutofill = async () => {
    setIsLoading(true);
    setErrorText(null);
    try {
      const startCell = selection.startCell || 'A1';
      const endCell = selection.endCell || 'A1';
      const rangeStr = startCell === endCell ? `${startCell}:${startCell}` : `${startCell}:${endCell}`;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: `Run Smart Autofill on selected column/range ${rangeStr}`
      };
      setMessages(prev => [...prev, userMsg]);

      const response = await fetch('/api/gemini/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cells: activeSheetData.cells,
          rowCount: activeSheetData.rowCount,
          colCount: activeSheetData.colCount,
          selection
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Autofill pattern API request failed');
      }

      const autofillResult = await response.json();

      let formattedText = `### Smart Autofill Pattern Engine\n\n`;
      if (!autofillResult.suggestions || autofillResult.suggestions.length === 0) {
        formattedText += `Could not identify any numerical, series, or growth patterns in the surrounding cells to auto-populate.`;
      } else {
        formattedText += `Detected mathematical or list sequences. Proposed autofill coordinates:\n\n`;
        autofillResult.suggestions.forEach((item: any) => {
          formattedText += `- Cell **${item.cellId}**: \`${item.rawValue}\` (*Explanation: ${item.explanation || 'Sequence continuation'}*)\n`;
        });
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: formattedText,
        type: 'autofill_result',
        metadata: autofillResult.suggestions
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Smart Autofill sequence detection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Write modifications directly into spreadsheet state
  const applyModifications = (modifications: any[]) => {
    if (!modifications || modifications.length === 0) return;

    setData((prevData) => {
      const updatedCells = { ...prevData.cells };
      modifications.forEach((mod) => {
        updatedCells[mod.cellId] = {
          rawValue: mod.rawValue || mod.projectedRaw,
          computedValue: mod.computedValue || mod.projectedComputed || mod.rawValue || mod.projectedRaw,
          style: updatedCells[mod.cellId]?.style || {}
        };
      });
      return {
        ...prevData,
        cells: updatedCells
      };
    });

    // Add visual success message
    const alertMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      text: `✨ **Successfully applied ${modifications.length} modifications directly to your spreadsheet!**`
    };
    setMessages(prev => [...prev, alertMsg]);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: "Hello! I am **V Astra AI**, your intelligent spreadsheet co-pilot. How can I assist you today?",
      }
    ]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Transparent Backdrop Overlay for Mobile screens */}
          <motion.div
            key="ai-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-black md:hidden"
          />

          {/* Sliding Side Panel from Right */}
          <motion.div
            key="ai-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className={`fixed top-0 right-0 h-full w-full max-w-md z-[160] flex flex-col shadow-2xl border-l ${
              isDarkMode
                ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                : 'bg-white border-gray-200 text-zinc-800'
            }`}
          >
            {/* Header */}
            <div className={`p-4 flex items-center justify-between border-b shrink-0 ${
              isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-orange-50/20 border-gray-100'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-4.5 h-4.5 text-orange-500" />
                </div>
                <div>
                  <span className="font-extrabold text-sm tracking-tight">V Astra AI</span>
                  <span className="text-[9px] block font-mono text-orange-500 -mt-0.5 font-bold">VIRTEX CO-PILOT v4.0</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  title="Clear conversation history"
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
                <button
                  id="ai-panel-close-btn"
                  onClick={onClose}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Chat History Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 max-w-[88%] ${
                    msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <span className="text-[9px] font-mono opacity-50 uppercase tracking-widest px-1">
                    {msg.role === 'user' ? 'You' : 'V Astra AI'}
                  </span>
                  <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-orange-500 border-transparent text-white rounded-tr-none'
                      : isDarkMode
                        ? 'bg-zinc-850 border-zinc-800 text-zinc-200 rounded-tl-none'
                        : 'bg-gray-50 border-gray-150 text-gray-800 rounded-tl-none'
                  }`}>
                    {/* Simplified markdown parser for bold, lists, and code blocks */}
                    <div className="space-y-1.5 whitespace-pre-wrap select-text">
                      {msg.text.split('\n').map((line, idx) => {
                        let content = line;
                        
                        // Bullet point rendering
                        const isBullet = content.trim().startsWith('* ') || content.trim().startsWith('- ');
                        if (isBullet) {
                          content = content.replace(/^[*-\s]+/, '');
                        }

                        // Bold matches **text**
                        const boldParts = content.split('**');
                        const boldRendered = boldParts.map((part, pIdx) => {
                          if (pIdx % 2 === 1) {
                            return <strong key={pIdx} className="font-extrabold text-orange-500 dark:text-orange-400">{part}</strong>;
                          }
                          
                          // Code matches `code`
                          const codeParts = part.split('`');
                          return codeParts.map((cPart, cIdx) => {
                            if (cIdx % 2 === 1) {
                              return <code key={cIdx} className="bg-orange-500/10 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-[11px] text-orange-600 dark:text-orange-400 font-bold">{cPart}</code>;
                            }
                            return cPart;
                          });
                        });

                        if (isBullet) {
                          return (
                            <div key={idx} className="flex gap-1.5 pl-2">
                              <span className="text-orange-500">•</span>
                              <div className="flex-1">{boldRendered}</div>
                            </div>
                          );
                        }

                        // Heading headers e.g. ###
                        if (content.startsWith('### ')) {
                          return (
                            <h4 key={idx} className="font-bold text-sm tracking-tight text-orange-500 mt-2 mb-1">
                              {content.replace(/^### /, '')}
                            </h4>
                          );
                        }

                        return <p key={idx}>{boldRendered}</p>;
                      })}
                    </div>

                    {/* Interactive Actions within AI Message Responses */}
                    {msg.type === 'clean_result' && msg.metadata && msg.metadata.length > 0 && (
                      <button
                        onClick={() => applyModifications(msg.metadata)}
                        className="mt-3.5 flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md transition-all active:translate-y-px cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Apply Proposed Cleaning Fixes ({msg.metadata.length})
                      </button>
                    )}

                    {msg.type === 'predict_result' && msg.metadata && msg.metadata.length > 0 && (
                      <button
                        onClick={() => applyModifications(msg.metadata)}
                        className="mt-3.5 flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md transition-all active:translate-y-px cursor-pointer"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        Inject Forecast Values into Sheet
                      </button>
                    )}

                    {msg.type === 'autofill_result' && msg.metadata && msg.metadata.length > 0 && (
                      <button
                        onClick={() => applyModifications(msg.metadata)}
                        className="mt-3.5 flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md transition-all active:translate-y-px cursor-pointer"
                      >
                        <Grid className="w-3.5 h-3.5" />
                        Apply Autofill Suggestions ({msg.metadata.length})
                      </button>
                    )}

                    {msg.type === 'chart_result' && msg.metadata && (
                      <button
                        onClick={() => {
                          onOpenVisualizer(
                            msg.metadata.chartType,
                            msg.metadata.title,
                            msg.metadata.range
                          );
                          onClose();
                        }}
                        className="mt-3.5 flex items-center justify-center gap-1.5 w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-md transition-all active:translate-y-px cursor-pointer"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        Generate & Open Recommended Chart
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Loader */}
              {isLoading && (
                <div className="flex flex-col gap-1 max-w-[80%] mr-auto items-start">
                  <span className="text-[9px] font-mono opacity-50 uppercase tracking-widest px-1">V Astra AI</span>
                  <div className={`p-3.5 rounded-2xl border text-xs shadow-sm flex items-center gap-2 ${
                    isDarkMode ? 'bg-zinc-850 border-zinc-800' : 'bg-gray-50 border-gray-150'
                  }`}>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                    <span className="opacity-75">Analyzing grid configurations & thinking...</span>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {errorText && (
                <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
                  isDarkMode ? 'bg-red-950/20 border-red-900/35 text-red-400' : 'bg-red-50 border-red-150 text-red-700'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">AI Engine Issue</span>
                    <p className="opacity-90">{errorText}</p>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Fixed Controls & Actions Area at Bottom */}
            <div className={`p-4 border-t space-y-3.5 shrink-0 ${
              isDarkMode ? 'bg-zinc-950/20 border-zinc-800' : 'bg-gray-50/50 border-gray-150'
            }`}>
              {/* Interactive Quick Action Chips Container */}
              <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-0.5">
                <button
                  onClick={handleSummarizeData}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all shrink-0 hover:scale-[1.02] ${
                    isDarkMode
                      ? 'bg-zinc-800 border-zinc-700 hover:border-orange-500/40 text-zinc-300'
                      : 'bg-white border-gray-250 hover:border-orange-500/35 text-gray-700'
                  }`}
                >
                  <Sparkle className="w-3 h-3 text-orange-500" />
                  Summarize Data
                </button>

                <button
                  onClick={handleCleanData}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all shrink-0 hover:scale-[1.02] ${
                    isDarkMode
                      ? 'bg-zinc-800 border-zinc-700 hover:border-orange-500/40 text-zinc-300'
                      : 'bg-white border-gray-250 hover:border-orange-500/35 text-gray-700'
                  }`}
                >
                  <Sparkle className="w-3 h-3 text-emerald-500" />
                  Clean Data
                </button>

                <button
                  onClick={handlePredictTrends}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all shrink-0 hover:scale-[1.02] ${
                    isDarkMode
                      ? 'bg-zinc-800 border-zinc-700 hover:border-orange-500/40 text-zinc-300'
                      : 'bg-white border-gray-250 hover:border-orange-500/35 text-gray-700'
                  }`}
                >
                  <Sparkle className="w-3 h-3 text-blue-500" />
                  Predict Trends
                </button>

                <button
                  onClick={handleGenerateChart}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all shrink-0 hover:scale-[1.02] ${
                    isDarkMode
                      ? 'bg-zinc-800 border-zinc-700 hover:border-orange-500/40 text-zinc-300'
                      : 'bg-white border-gray-250 hover:border-orange-500/35 text-gray-700'
                  }`}
                >
                  <Sparkle className="w-3 h-3 text-amber-500" />
                  Generate Chart
                </button>

                <button
                  onClick={handleSmartAutofill}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all shrink-0 hover:scale-[1.02] ${
                    isDarkMode
                      ? 'bg-zinc-800 border-zinc-700 hover:border-orange-500/40 text-zinc-300'
                      : 'bg-white border-gray-250 hover:border-orange-500/35 text-gray-700'
                  }`}
                >
                  <Sparkle className="w-3 h-3 text-purple-500" />
                  Smart Autofill
                </button>
              </div>

              {/* Chat Input Area */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask V Astra AI or choose action..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isLoading}
                  className={`flex-1 text-xs px-3.5 py-2.5 rounded-xl border outline-none font-sans ${
                    isDarkMode
                      ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-600 focus:border-orange-500/50 text-white'
                      : 'bg-white border-gray-255 hover:border-gray-300 focus:border-orange-500/50 text-gray-800'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className={`p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 hover:scale-[1.02] text-white transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center justify-center ${
                    (isLoading || !inputText.trim()) ? 'opacity-40 cursor-not-allowed scale-100 shadow-none' : ''
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
