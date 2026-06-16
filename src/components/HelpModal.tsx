/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Sparkles, Keyboard, HelpCircle, FileSpreadsheet, ArrowUpDown } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export default function HelpModal({ isOpen, onClose, isDarkMode }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Container */}
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-gray-200 text-gray-800'
      }`}>
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-semibold">VortexSheets Manual & Reference</h2>
          </div>
          <button 
            id="help-modal-close-btn"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Contents */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-left">
          
          {/* Quick Start */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-orange-500 font-mono tracking-wide flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> Formulas & Calculations
            </h3>
            <p className="opacity-80 leading-relaxed">
              VortexSheets supports fully reactive equation parsing. Excel/Google Sheets style expressions starting with an equal sign (<span className="font-mono bg-orange-500/10 px-1 py-0.5 rounded text-orange-600 dark:text-orange-400">=</span>) recalculate automatically when target cell data shifts:
            </p>
            
            <div className={`p-4 rounded-xl space-y-3.5 border ${
              isDarkMode ? 'bg-zinc-950/50 border-zinc-850' : 'bg-gray-50 border-gray-150'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                <div>
                  <span className="font-bold text-orange-600 dark:text-orange-400">=SUM(A1:A5)</span>
                  <p className="text-[10px] opacity-70 mt-0.5">Totals all numeric numbers in cells A1 up to A5</p>
                </div>
                <div>
                  <span className="font-bold text-orange-600 dark:text-orange-400">=AVERAGE(B1:B10)</span>
                  <p className="text-[10px] opacity-70 mt-0.5">Calculates mean value of cells B1 to B10</p>
                </div>
                <div>
                  <span className="font-bold text-orange-600 dark:text-orange-400">=COUNT(A1:E1)</span>
                  <p className="text-[10px] opacity-70 mt-0.5">Counts defined/non-empty coordinates in range</p>
                </div>
                <div>
                  <span className="font-bold text-orange-600 dark:text-orange-400">=MIN(C1:C8) , =MAX(...)</span>
                  <p className="text-[10px] opacity-70 mt-0.5">Finds minimum or maximum number in bounds</p>
                </div>
              </div>
              <div className="h-px bg-gray-200 dark:bg-zinc-800" />
              <div>
                <p className="font-mono text-xs opacity-90">
                  <strong className="text-orange-500">Algebraic Equations:</strong> e.g., <span className="font-bold bg-orange-500/5 px-1 py-0.5 rounded">=A1+B2</span> or <span className="font-bold bg-orange-500/5 px-1 py-0.5  rounded">=A3*10 - C1/2</span>. Supports <span className="bg-gray-200/50 dark:bg-zinc-800 px-1 rounded font-bold">+</span>, <span className="bg-gray-200/50 dark:bg-zinc-800 px-1 rounded font-bold">-</span>, <span className="bg-gray-200/50 dark:bg-zinc-800 px-1 rounded font-bold">*</span>, <span className="bg-gray-200/50 dark:bg-zinc-800 px-1 rounded font-bold">/</span>, and parenthesis.
                </p>
              </div>
            </div>
          </div>

          {/* Keyboard Controls */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-orange-500 font-mono tracking-wide flex items-center gap-1">
              <Keyboard className="w-4 h-4" /> Cell Controls & Keyboard Shortcuts
            </h3>
            <p className="opacity-80">
              Navigate fluidly throughout the active workspace grid using standard system shortcuts:
            </p>
            <div className="grid grid-cols-2 gap-3.5">
              <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                isDarkMode ? 'bg-zinc-950/50 border-zinc-850' : 'bg-gray-50 border-gray-150'
              }`}>
                <span className="font-semibold text-[11px] opacity-60">Grid Navigation</span>
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between border-b border-gray-200/50 dark:border-zinc-800/80 pb-1">
                    <span>Arrow Keys:</span>
                    <span className="font-bold">Move selected highlighted border</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200/50 dark:border-zinc-800/80 pb-1 pt-1 col-span-2">
                    <span>Double Click cell:</span>
                    <span className="font-bold">Instantly trigger Inline Editing</span>
                  </div>
                  <div className="flex justify-between pt-1 col-span-2">
                    <span>Type directly:</span>
                    <span className="font-bold">Overwrites cell contents & enters edit</span>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                isDarkMode ? 'bg-zinc-950/50 border-zinc-850' : 'bg-gray-50 border-gray-150'
              }`}>
                <span className="font-semibold text-[11px] opacity-60">Modifying Mode Keys</span>
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between border-b border-gray-200/50 dark:border-zinc-800/80 pb-1">
                    <span>Enter:</span>
                    <span className="font-bold">Save active edit or open inline</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200/50 dark:border-zinc-800/80 pb-1 pt-1 col-span-2">
                    <span>Tab:</span>
                    <span className="font-bold">Commit & move one Column Right</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200/50 dark:border-zinc-800/80 pb-1 pt-1 col-span-2">
                    <span>Shift + Tab:</span>
                    <span className="font-bold">Commit & move selection Left</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Escape:</span>
                    <span className="font-bold">Cancel current edits</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Sheet Actions */}
            <div className={`p-3 rounded-xl border ${
              isDarkMode ? 'bg-zinc-950/50 border-zinc-850' : 'bg-orange-50/10 border-orange-100'
            }`}>
              <span className="font-semibold text-[11px] text-orange-500 font-mono tracking-wide flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Import & Export
              </span>
              <p className="opacity-85 mt-1.5 leading-relaxed">
                Seamlessly upload local CSV catalogs or export grids instantly. Press <strong>Export .XLSX</strong> to download a fully compliant Microsoft Excel workbook complete with styled components.
              </p>
            </div>

            {/* Sorting Actions */}
            <div className={`p-3 rounded-xl border ${
              isDarkMode ? 'bg-zinc-950/50 border-zinc-850' : 'bg-orange-50/10 border-orange-100'
            }`}>
              <span className="font-semibold text-[11px] text-orange-500 font-mono tracking-wide flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sorting & Filtering
              </span>
              <p className="opacity-85 mt-1.5 leading-relaxed">
                Choose any column under <strong>Sort & Filter</strong>. Organize rows quickly ascending/descending, or apply a real-time text query filter to highlight custom values instantly.
              </p>
            </div>
          </div>

          {/* About/Settings Section */}
          <div className={`p-4 rounded-xl border ${
            isDarkMode ? 'bg-zinc-950/50 border-zinc-850' : 'bg-gray-50 border-gray-150'
          }`}>
            <h3 className="text-xs font-bold text-orange-500 font-mono tracking-wide mb-2 uppercase flex items-center gap-1.5">
              About & Legal Settings
            </h3>
            <div className="space-y-2 text-[11px] opacity-90 leading-relaxed">
              <p>
                <strong>VortexSheets</strong> is an ultra-fast, premium cloud-connected spreadsheet platform designed for responsive calculation parsing, real-time formula mapping, and beautiful interactive graphics.
              </p>
              <div className="h-px bg-gray-200 dark:bg-zinc-800 my-2" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5 text-[10px]">
                <span className="text-zinc-500 font-mono">Platform Release v1.2 (Active Sync Web Mode)</span>
                <div className="flex items-center gap-3">
                  <a 
                    href="https://sites.google.com/view/vortexsheets-privacy-policy/home" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:text-orange-600 hover:underline transition-colors font-semibold"
                  >
                    Privacy Policy
                  </a>
                  <span className="text-zinc-300 dark:text-zinc-700">|</span>
                  <a 
                    href="https://sites.google.com/view/vortexsheetstermsandconditions/home" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:text-orange-600 hover:underline transition-colors font-semibold"
                  >
                    Terms & Conditions
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <button 
            id="help-modal-close-ok-btn"
            onClick={onClose}
            className="px-4 py-2 hover:bg-orange-600 bg-orange-500 text-white font-semibold rounded-xl text-xs cursor-pointer transition-all"
          >
            Start Computing
          </button>
        </div>
      </div>
    </div>
  );
}
