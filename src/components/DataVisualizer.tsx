/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon, Sparkles, X, ChevronDown, Check, HelpCircle } from 'lucide-react';
import { CellData, SpreadsheetData } from '../types';
import { parseCoordinate, colLetterToIndex, indexToColLetter, expandRange } from '../utils/formula';

interface DataVisualizerProps {
  data: SpreadsheetData;
  startCell: string | null;
  endCell: string | null;
  isDarkMode: boolean;
  onClose: () => void;
  chartType: 'bar' | 'pie' | 'line';
  setChartType: (type: 'bar' | 'pie' | 'line') => void;
  paletteName: string;
  setPaletteName: (name: string) => void;
  chartTitle: string;
  setChartTitle: (title: string) => void;
  chartRange: string;
  setChartRange: (range: string) => void;
}

// Creative distinct color palettes
const PALETTES = {
  vortex: ['#EA580C', '#F97316', '#FB923C', '#FDBA74', '#FFEDD5', '#9A3412', '#C2410C'],
  sunset: ['#FF6B6B', '#FF8E53', '#FF4E50', '#F9D423', '#E15554', '#FC913A', '#F9D423'],
  tech: ['#0EA5E9', '#38BDF8', '#7DD3FC', '#0284C7', '#0369A1', '#075985', '#0C4A6E'],
  forest: ['#10B981', '#34D399', '#6EE7B7', '#059669', '#047857', '#065F46', '#064E3B']
};

export default function DataVisualizer({
  data,
  startCell,
  endCell,
  isDarkMode,
  onClose,
  chartType,
  setChartType,
  paletteName,
  setPaletteName,
  chartTitle,
  setChartTitle,
  chartRange: rangeInput,
  setChartRange: setRangeInput
}: DataVisualizerProps) {
  // Configured states
  const [dataset, setDataset] = useState<{ name: string; value: number }[]>([]);
  const [hasError, setHasError] = useState(false);

  // Derive initial range input from active cell selection
  useEffect(() => {
    if (startCell && endCell) {
      if (startCell === endCell) {
        // Look if we can expand around it or just suggest range
        setRangeInput(`${startCell}:${startCell}`);
      } else {
        setRangeInput(`${startCell}:${endCell}`);
      }
    }
  }, [startCell, endCell]);

  // Data mining execution on selection shift
  useEffect(() => {
    try {
      const mined = mineChartData(rangeInput, data.cells);
      if (mined.length > 0) {
        setDataset(mined);
        setHasError(false);
      } else {
        setDataset([]);
      }
    } catch {
      setHasError(true);
      setDataset([]);
    }
  }, [rangeInput, data.cells]);

  // Extensively robust layout mining
  function mineChartData(rangeStr: string, cells: Record<string, CellData>): { name: string; value: number }[] {
    const parts = rangeStr.split(':');
    if (parts.length === 1) {
      const coord = parts[0].trim().toUpperCase();
      const valStr = cells[coord]?.computedValue || '';
      const num = parseFloat(valStr);
      return [{ name: coord, value: isNaN(num) ? 0 : num }];
    }
    if (parts.length !== 2) return [];

    const start = parseCoordinate(parts[0].trim());
    const end = parseCoordinate(parts[1].trim());
    if (!start || !end) return [];

    const startColIdx = colLetterToIndex(start.col);
    const endColIdx = colLetterToIndex(end.col);
    const minColIdx = Math.min(startColIdx, endColIdx);
    const maxColIdx = Math.max(startColIdx, endColIdx);
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);

    const resultList: { name: string; value: number }[] = [];

    // Case 1: 2-Columns grid selected (e.g. A1:B5). Col 1 is label names, Col 2 is values
    if (maxColIdx - minColIdx === 1) {
      for (let r = minRow; r <= maxRow; r++) {
        const lblCoord = `${indexToColLetter(minColIdx)}${r}`;
        const valCoord = `${indexToColLetter(maxColIdx)}${r}`;
        const rawLabel = cells[lblCoord]?.computedValue || lblCoord;
        const valStr = cells[valCoord]?.computedValue || '0';
        const rawNum = parseFloat(valStr);
        resultList.push({
          name: rawLabel,
          value: isNaN(rawNum) ? 0 : rawNum
        });
      }
    }
    // Case 2: Multi-row, 1-Column selected (e.g. B2:B10).
    // Let's grab labels from the adjacent left column, or fallback to Row IDs
    else if (maxColIdx === minColIdx) {
      for (let r = minRow; r <= maxRow; r++) {
        const valCoord = `${indexToColLetter(minColIdx)}${r}`;
        const valStr = cells[valCoord]?.computedValue || '0';
        
        let labelName = '';
        if (minColIdx > 0) {
          const leftCellCoord = `${indexToColLetter(minColIdx - 1)}${r}`;
          labelName = cells[leftCellCoord]?.computedValue || '';
        }

        if (!labelName) {
          labelName = valCoord;
        }

        const rawNum = parseFloat(valStr);
        resultList.push({
          name: labelName,
          value: isNaN(rawNum) ? 0 : rawNum
        });
      }
    }
    // Case 3: 2-Rows selected (labels row, values row)
    else if (maxRow - minRow === 1) {
      for (let c = minColIdx; c <= maxColIdx; c++) {
        const colLetter = indexToColLetter(c);
        const lblCoord = `${colLetter}${minRow}`;
        const valCoord = `${colLetter}${maxRow}`;
        const rawLabel = cells[lblCoord]?.computedValue || lblCoord;
        const valStr = cells[valCoord]?.computedValue || '0';
        const rawNum = parseFloat(valStr);
        resultList.push({
          name: rawLabel,
          value: isNaN(rawNum) ? 0 : rawNum
        });
      }
    }
    // Fallback: list of coordinates
    else {
      const expanded = expandRange(rangeStr);
      expanded.forEach((coord) => {
        const valStr = cells[coord]?.computedValue || '0';
        const rawNum = parseFloat(valStr);
        resultList.push({
          name: coord,
          value: isNaN(rawNum) ? 0 : rawNum
        });
      });
    }

    return resultList.slice(0, 30); // Limiting graph points to 30 for elegant look
  }

  const palette = PALETTES[paletteName as keyof typeof PALETTES] || PALETTES.vortex;

  return (
    <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-5 transition-all ${
      isDarkMode ? 'bg-zinc-900 border-zinc-850 text-zinc-100' : 'bg-gray-50/50 border-gray-200 text-zinc-800'
    }`}>
      {/* Configuration Settings Column */}
      <div className="w-full md:w-80 flex flex-col gap-3.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500">Live Chart Engine</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
            title="Close visualizer panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input parameters */}
        <div className="space-y-3 font-sans text-xs">
          {/* Range selection coordinates */}
          <div className="flex flex-col gap-1 text-left">
            <label className="font-semibold opacity-75">Target Cell Range:</label>
            <input
              type="text"
              placeholder="e.g. A3:B7"
              value={rangeInput}
              onChange={(e) => setRangeInput(e.target.value.toUpperCase())}
              className={`px-3 py-1.5 rounded-lg border font-mono outline-none text-xs ${
                isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-800'
              }`}
            />
            <p className="text-[9px] opacity-50 font-mono">
              Protip: Select adjacent columns (e.g., A1:B5) or click shift/drag. First column maps to Labels.
            </p>
          </div>

          {/* Chart title parameter */}
          <div className="flex flex-col gap-1 text-left">
            <label className="font-semibold opacity-75">Chart Heading/Title:</label>
            <input
              type="text"
              placeholder="Venture Budget Metrics"
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              className={`px-3 py-1.5 rounded-lg border outline-none text-xs ${
                isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-800'
              }`}
            />
          </div>

          {/* Chart visual types selection */}
          <div className="flex flex-col gap-1 text-left">
            <label className="font-semibold opacity-75">Select Chart Type:</label>
            <div className="grid grid-cols-3 gap-1 px-0.5">
              {[
                { type: 'bar' as const, label: 'Bar', icon: <BarChart3 className="w-3.5 h-3.5" /> },
                { type: 'pie' as const, label: 'Pie', icon: <PieIcon className="w-3.5 h-3.5" /> },
                { type: 'line' as const, label: 'Line', icon: <LineIcon className="w-3.5 h-3.5" /> }
              ].map((c) => (
                <button
                  key={c.type}
                  onClick={() => setChartType(c.type)}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border font-medium cursor-pointer transition-all ${
                    chartType === c.type
                      ? 'bg-orange-500 border-transparent text-white shadow-sm'
                      : isDarkMode
                        ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-750 text-zinc-300'
                        : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {c.icon}
                  <span className="text-[10px]">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color theme selectors */}
          <div className="flex flex-col gap-1 text-left">
            <label className="font-semibold opacity-75">Color Scheme Brand:</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(PALETTES) as Array<keyof typeof PALETTES>).map((key) => {
                const colors = PALETTES[key];
                const active = paletteName === key;
                return (
                  <button
                    key={key}
                    onClick={() => setPaletteName(key)}
                    className={`flex items-center justify-between p-1.5 rounded-lg border cursor-pointer text-[10px] uppercase font-bold tracking-wider ${
                      active
                        ? 'border-orange-500 dark:bg-zinc-800 bg-orange-50 text-orange-600'
                        : isDarkMode
                          ? 'border-zinc-700 bg-zinc-800/40 text-zinc-400'
                          : 'border-gray-200 bg-white text-gray-500'
                    }`}
                  >
                    <span>{key}</span>
                    <div className="flex -space-x-1 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[0] }}></span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[1] }}></span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Live Graph Visual Area and Legend box */}
      <div className={`flex-1 rounded-xl p-4 border flex flex-col justify-center min-h-[280px] relative ${
        isDarkMode ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-gray-150'
      }`}>
        <h4 className="text-center font-bold text-sm mb-4 tracking-tight text-zinc-800 dark:text-zinc-200">
          {chartTitle || '---'}
        </h4>

        {dataset.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 select-none space-y-1.5">
            <HelpCircle className="w-8 h-8 text-orange-500 opacity-60 animate-bounce" />
            <p className="text-xs font-semibold">No valid numerical dataset coordinates parsed.</p>
            <p className="text-[10px] opacity-75 max-w-sm">
              Please write numbers in column cells (like <span className="font-mono text-orange-500">A1: 10, B1: 20</span>), then select the cell range to render.
            </p>
          </div>
        ) : (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={dataset} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#27272a' : '#f1f5f9'} />
                  <XAxis dataKey="name" stroke={isDarkMode ? '#9ca3af' : '#4b5563'} fontSize={10} tickLine={false} />
                  <YAxis stroke={isDarkMode ? '#9ca3af' : '#4b5563'} fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
                      borderRadius: '8px',
                      color: isDarkMode ? '#ffffff' : '#000000',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {dataset.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : chartType === 'pie' ? (
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
                      borderRadius: '8px',
                      color: isDarkMode ? '#ffffff' : '#000000',
                      fontSize: '11px',
                    }}
                  />
                  <Pie
                    data={dataset}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {dataset.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={24} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '9px' }} />
                </PieChart>
              ) : (
                <LineChart data={dataset} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#27272a' : '#f1f5f9'} />
                  <XAxis dataKey="name" stroke={isDarkMode ? '#9ca3af' : '#4b5563'} fontSize={10} tickLine={false} />
                  <YAxis stroke={isDarkMode ? '#9ca3af' : '#4b5563'} fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
                      borderRadius: '8px',
                      color: isDarkMode ? '#ffffff' : '#000000',
                      fontSize: '11px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={palette[0]}
                    strokeWidth={3}
                    dot={{ r: 4, fill: palette[0], strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
