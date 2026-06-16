/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

interface FormulaBarProps {
  activeCellCoord: string | null;
  value: string;
  onChange: (newValue: string) => void;
  isDarkMode: boolean;
}

export default function FormulaBar({
  activeCellCoord,
  value,
  onChange,
  isDarkMode
}: FormulaBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className={`flex items-center gap-2 px-3 py-2 border-b text-sm transition-colors ${
      isDarkMode ? 'bg-zinc-900 border-zinc-850 text-zinc-250' : 'bg-white border-gray-200 text-gray-700'
    }`}>
      {/* Active Cell Reference Indicator */}
      <div 
        className={`flex items-center justify-center font-mono font-medium px-2.5 py-1 rounded border text-xs min-w-[50px] text-center select-none ${
          activeCellCoord 
            ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50' 
            : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700'
        }`}
        title="Active cell coordinate reference"
      >
        {activeCellCoord || '---'}
      </div>

      {/* Function FX Label Accent */}
      <div className={`font-serif italic font-bold select-none text-md px-1.5 opacity-60 text-orange-500`}>
        fx
      </div>

      {/* Main Formula Input Bar */}
      <input
        id="formula-bar-input"
        ref={inputRef}
        type="text"
        placeholder={activeCellCoord ? "Enter values or formulas like =SUM(A1:A5)..." : "Select a cell to enter values"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!activeCellCoord}
        className={`px-3 py-1.5 rounded-lg border outline-none text-xs font-mono transition-all flex-1 ${
          activeCellCoord
            ? isDarkMode
              ? 'bg-zinc-800 border-zinc-700 focus:border-orange-500/80 text-white'
              : 'bg-gray-50/50 border-gray-200 focus:bg-white focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/20 text-gray-900'
            : 'bg-gray-100 border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 text-gray-400 cursor-not-allowed'
        }`}
      />
      
      {activeCellCoord && value.startsWith('=') && (
        <span className="flex items-center gap-1 text-[10px] text-orange-500 bg-orange-100/40 dark:bg-orange-950/30 px-2 py-1 rounded font-mono select-none">
          <Sparkles className="w-2.5 h-2.5" /> Formula mode
        </span>
      )}
    </div>
  );
}
