/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Download,
  Upload,
  ArrowUpDown,
  Filter,
  Type,
  Paintbrush,
  Sparkles,
  HelpCircle,
  Sun,
  Moon,
  Trash2,
  Bookmark,
  FileSpreadsheet,
  Cloud
} from 'lucide-react';
import { CellStyle } from '../types';

interface ToolbarProps {
  activeStyle: CellStyle;
  onStyleChange: (style: Partial<CellStyle>) => void;
  onImportCSV: (file: File) => void;
  onExportCSV: () => void;
  onExportXLSX: () => void;
  activeCell: string | null;
  selectedRange: { start: string; end: string } | null;
  onInsertFormula: (formulaTemplate: string) => void;
  onClearCell: () => void;
  onResetGrid: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenHelp: () => void;
  // Sort and Filter hooks
  onSort: (col: string, direction: 'asc' | 'desc') => void;
  onApplyFilter: (col: string, query: string) => void;
  colCount: number;
  onToggleVisualizer: () => void;
  isVisualizerOpen: boolean;
  onOpenSupabaseModal: () => void;
  activeCloudFileName: string | null;
  supabaseUserEmail: string | null;
}

// Sleek aesthetic colors for font text color
const TEXT_COLORS = [
  { name: 'Default', hex: '' },
  { name: 'Charcoal', hex: '#1F2937' },
  { name: 'Elegant Orange', hex: '#EA580C' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Forest Green', hex: '#16A34A' },
  { name: 'Cobalt Blue', hex: '#2563EB' },
  { name: 'Royal Purple', hex: '#9333EA' },
];

// Sleek pastel / faint background fills
const BG_COLORS = [
  { name: 'No Fill', hex: '' },
  { name: 'Subtle Orange', hex: '#FFF7ED' },
  { name: 'Subtle Gray', hex: '#F3F4F6' },
  { name: 'Subtle Red', hex: '#FEF2F2' },
  { name: 'Subtle Green', hex: '#F0FDF4' },
  { name: 'Subtle Blue', hex: '#EFF6FF' },
  { name: 'Subtle Purple', hex: '#FAF5FF' },
];

export default function Toolbar({
  activeStyle,
  onStyleChange,
  onImportCSV,
  onExportCSV,
  onExportXLSX,
  activeCell,
  selectedRange,
  onInsertFormula,
  onClearCell,
  onResetGrid,
  isDarkMode,
  onToggleDarkMode,
  onOpenHelp,
  onSort,
  onApplyFilter,
  colCount,
  onToggleVisualizer,
  isVisualizerOpen,
  onOpenSupabaseModal,
  activeCloudFileName,
  supabaseUserEmail
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States for toolbar dropdowns
  const [showTextColor, setShowTextColor] = React.useState(false);
  const [showBgColor, setShowBgColor] = React.useState(false);
  const [showFormulaHelper, setShowFormulaHelper] = React.useState(false);
  const [showSortFilter, setShowSortFilter] = React.useState(false);

  // States for sorting/filtering inputs
  const [selectedSortCol, setSelectedSortCol] = React.useState('A');
  const [selectedFilterCol, setSelectedFilterCol] = React.useState('A');
  const [filterQuery, setFilterQuery] = React.useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportCSV(e.target.files[0]);
    }
  };

  // Convert columns 0..N into user facing letters
  const colLetters = Array.from({ length: Math.min(26, colCount) }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className={`p-3 border-b flex flex-col gap-2 transition-colors ${
      isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-gray-50 border-gray-200 text-zinc-800'
    }`}>
      {/* Top row: Brand & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-hidden">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/20">
            <span className="text-lg">V</span>
          </div>
          <div>
            <h1 className="text-md font-semibold tracking-tight leading-none animate-fade-in">
              Vortex<span className="text-orange-500">Sheets</span>
            </h1>
            <p className="text-[8px] font-mono opacity-60 mt-0.5">High-Performance Grid Engine</p>
          </div>
        </div>

        {/* Import/Export & Actions block - scrollable on tiny mobile devices */}
        <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1 sm:pb-0 shrink-0 max-w-full">
          {/* File Input */}
          <input
            id="csv-file-import-input"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <button
            id="toolbar-import-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Import local CSV file"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-all shrink-0 ${
              isDarkMode
                ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 hover:border-orange-500/50'
                : 'bg-white hover:bg-orange-50/50 border-gray-200 hover:border-orange-500/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-orange-500" />
            <span className="whitespace-nowrap">Import CSV</span>
          </button>

          {/* Export dropdown custom or simple buttons */}
          <button
            id="toolbar-export-csv-btn"
            onClick={onExportCSV}
            title="Export as CSV standard format"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-all shrink-0 ${
              isDarkMode
                ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700'
                : 'bg-white hover:bg-gray-100 border-gray-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span className="whitespace-nowrap">Export CSV</span>
          </button>

          <button
            id="toolbar-export-xlsx-btn"
            onClick={onExportXLSX}
            title="Export as premium Microsoft Excel spreadsheet"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm border-transparent shrink-0`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Export .XLSX</span>
          </button>

          <button
            id="toolbar-visualize-btn"
            onClick={onToggleVisualizer}
            title="Visualize selected data using pie, bar or line charts"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all shrink-0 ${
              isVisualizerOpen
                ? 'bg-orange-500 text-white border-transparent shadow-sm'
                : isDarkMode
                  ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700 text-orange-400'
                  : 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span className="whitespace-nowrap">Data Visualization</span>
          </button>

          <button
            id="toolbar-supabase-sync-btn"
            onClick={onOpenSupabaseModal}
            title={activeCloudFileName ? `Synced with cloud: "${activeCloudFileName}"` : "Connect to cloud database and backup sheets"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all shrink-0 ${
              activeCloudFileName
                ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : isDarkMode
                  ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 hover:border-orange-500/50 text-zinc-300'
                  : 'bg-white hover:bg-orange-50/20 border-gray-200 hover:border-orange-500/50 text-zinc-700 hover:text-orange-600'
            }`}
          >
            <Cloud className={`w-3.5 h-3.5 ${activeCloudFileName ? 'text-emerald-500 animate-pulse font-bold' : 'text-orange-500'}`} />
            <span className="whitespace-nowrap font-mono text-[11px]">
              {activeCloudFileName ? `${activeCloudFileName}` : 'Cloud DB'}
            </span>
            {supabaseUserEmail && !activeCloudFileName && (
              <span className="text-[10px] font-semibold opacity-70 ml-0.5 max-w-[60px] truncate text-orange-500">
                ({supabaseUserEmail.split('@')[0]})
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-gray-300 dark:bg-zinc-700 mx-1 shrink-0"></div>

          {/* Settings / Reset & Help */}
          <button
            id="toolbar-clear-btn"
            onClick={onClearCell}
            disabled={!activeCell}
            title="Clear raw value of active selection"
            className={`p-1.5 rounded-lg border transition-all shrink-0 ${
              !activeCell ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-red-500/50'
            } ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>

          <button
            id="toolbar-reset-btn"
            onClick={onResetGrid}
            title="Reset whole spreadsheet grid"
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all shrink-0 ${
              isDarkMode
                ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
                : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-600'
            }`}
          >
            <span className="whitespace-nowrap">Reset Grid</span>
          </button>

          {/* Theme & Help */}
          <button
            id="toolbar-dark-toggle-btn"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Switch to Light Modern Theme' : 'Switch to Sleek Dark Theme'}
            className={`p-1.5 rounded-lg border cursor-pointer transition-all shrink-0 ${
              isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-amber-400' : 'bg-white hover:bg-orange-50 border-gray-200 text-slate-500 hover:text-orange-500'
            }`}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            id="toolbar-help-btn"
            onClick={onOpenHelp}
            title="Formula Reference & Navigation Help"
            className={`p-1.5 rounded-lg border cursor-pointer transition-all shrink-0 ${
              isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-orange-400' : 'bg-white hover:bg-orange-50 border-gray-200 text-slate-500 hover:text-orange-500'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 2: Comprehensive Cell Formatting & Operations Toolbar - horizontal scrollable on mobile */}
      <div className="flex items-center gap-3 py-1.5 border-t border-gray-200/50 dark:border-zinc-800/50 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full shrink-0">
        
        {/* Font size control */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Type className="w-3.5 h-3.5 opacity-60 text-orange-500" />
          <select
            id="toolbar-font-size-select"
            value={activeStyle.fontSize || 12}
            onChange={(e) => onStyleChange({ fontSize: parseInt(e.target.value, 10) })}
            className={`text-xs px-2 py-1 rounded border outline-none ${
              isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-gray-200 text-zinc-800'
            }`}
          >
            {[10, 11, 12, 13, 14, 16, 18, 20, 24, 28].map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-zinc-700 shrink-0"></div>

        {/* Text styling button group */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            id="toolbar-bold-btn"
            onClick={() => onStyleChange({ bold: !activeStyle.bold })}
            className={`p-1.5 rounded cursor-pointer transition-all ${
              activeStyle.bold
                ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 font-bold'
                : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400'
            }`}
            title="Bold text"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            id="toolbar-italic-btn"
            onClick={() => onStyleChange({ italic: !activeStyle.italic })}
            className={`p-1.5 rounded cursor-pointer transition-all ${
              activeStyle.italic
                ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 italic'
                : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400'
            }`}
            title="Italic text"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            id="toolbar-underline-btn"
            onClick={() => onStyleChange({ underline: !activeStyle.underline })}
            className={`p-1.5 rounded cursor-pointer transition-all ${
              activeStyle.underline
                ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 underline underline-offset-2'
                : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400'
            }`}
            title="Underline text"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-zinc-700 shrink-0"></div>

        {/* Alignment controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            id="toolbar-align-left-btn"
            onClick={() => onStyleChange({ align: 'left' })}
            className={`p-1.5 rounded cursor-pointer transition-all ${
              activeStyle.align === 'left' || !activeStyle.align
                ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400'
                : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400'
            }`}
            title="Align left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>

          <button
            id="toolbar-align-center-btn"
            onClick={() => onStyleChange({ align: 'center' })}
            className={`p-1.5 rounded cursor-pointer transition-all ${
              activeStyle.align === 'center'
                ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400'
                : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400'
            }`}
            title="Align center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>

          <button
            id="toolbar-align-right-btn"
            onClick={() => onStyleChange({ align: 'right' })}
            className={`p-1.5 rounded cursor-pointer transition-all ${
              activeStyle.align === 'right'
                ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400'
                : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400'
            }`}
            title="Align right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-zinc-700 shrink-0"></div>

        {/* Color pickers */}
        <div className="flex items-center gap-1.5 relative shrink-0">
          {/* Text Color dropdown */}
          <button
            id="toolbar-text-color-trigger"
            onClick={() => {
              setShowTextColor(!showTextColor);
              setShowBgColor(false);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-105 dark:hover:bg-zinc-800 text-xs text-gray-600 dark:text-zinc-350`}
            title="Text Color"
          >
            <span
              className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block shrink-0"
              style={{ backgroundColor: activeStyle.color || '#1F2937' }}
            ></span>
            <span className="whitespace-nowrap select-none font-sans">Color</span>
          </button>

          {showTextColor && (
            <div className={`absolute left-0 top-7 z-50 p-2 rounded-xl shadow-lg border grid grid-cols-4 gap-1.5 w-36 ${
              isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
            }`}>
              {TEXT_COLORS.map((tc) => (
                <button
                  key={tc.name}
                  onClick={() => {
                    onStyleChange({ color: tc.hex });
                    setShowTextColor(false);
                  }}
                  className="w-6 h-6 rounded-md border border-gray-300/50 cursor-pointer flex items-center justify-center relative hover:scale-110 transition-transform shadow-sm"
                  style={{ backgroundColor: tc.hex || '#1F2937' }}
                  title={tc.name}
                >
                  {!tc.hex && <span className="text-[9px] text-gray-400">X</span>}
                </button>
              ))}
            </div>
          )}

          {/* Background fill dropdown */}
          <button
            id="toolbar-bg-color-trigger"
            onClick={() => {
              setShowBgColor(!showBgColor);
              setShowTextColor(false);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-105 dark:hover:bg-zinc-800 text-xs text-gray-650 dark:text-zinc-350`}
            title="Cell Background Color"
          >
            <Paintbrush className="w-3.5 h-3.5 text-orange-550 opacity-80" />
            <span
              className="w-3.5 h-3.5 rounded border border-gray-300 inline-block shrink-0"
              style={{ backgroundColor: activeStyle.bgColor || '#FFFFFF' }}
            ></span>
            <span className="whitespace-nowrap select-none font-sans">Fill</span>
          </button>

          {showBgColor && (
            <div className={`absolute left-10 top-7 z-50 p-2 rounded-xl shadow-lg border grid grid-cols-4 gap-1.5 w-36 ${
              isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
            }`}>
              {BG_COLORS.map((bg) => (
                <button
                  key={bg.name}
                  onClick={() => {
                    onStyleChange({ bgColor: bg.hex });
                    setShowBgColor(false);
                  }}
                  className="w-6 h-6 rounded-md border border-gray-300/50 cursor-pointer flex items-center justify-center relative hover:scale-110 transition-transform shadow-sm"
                  style={{ backgroundColor: bg.hex || '#FFFFFF' }}
                  title={bg.name}
                >
                  {!bg.hex && <span className="text-[9px] text-gray-400">X</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-zinc-700 shrink-0"></div>

        {/* Formulas Quick Insert options */}
        <div className="relative shrink-0">
          <button
            id="toolbar-formula-helper-trigger"
            onClick={() => {
              setShowFormulaHelper(!showFormulaHelper);
              setShowSortFilter(false);
            }}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-semibold text-orange-655 bg-orange-50 hover:bg-orange-100 dark:bg-orange-955/20 dark:text-orange-400 hover:dark:bg-orange-955/35 cursor-pointer transition-colors`}
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span className="whitespace-nowrap font-sans">Formula Insert</span>
          </button>

          {showFormulaHelper && (
            <div className={`absolute left-0 top-8 z-50 p-2.5 rounded-xl shadow-xl border w-56 flex flex-col gap-1.5 ${
              isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
            }`}>
              <span className="text-[10px] font-bold uppercase opacity-50 tracking-wider">Functions</span>
              {[
                { name: 'SUM', formula: '=SUM(A1:A5)', desc: 'Calculates the sum' },
                { name: 'AVERAGE', formula: '=AVERAGE(A1:A5)', desc: 'Calculates the mean' },
                { name: 'COUNT', formula: '=COUNT(A1:A5)', desc: 'Rows count in content' },
                { name: 'MIN', formula: '=MIN(A1:A5)', desc: 'Minimum value' },
                { name: 'MAX', formula: '=MAX(A1:A5)', desc: 'Maximum value' },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    onInsertFormula(item.formula);
                    setShowFormulaHelper(false);
                  }}
                  className={`text-left p-1.5 rounded text-xs cursor-pointer hover:bg-orange-500/10 hover:text-orange-500 transition-colors ${
                    isDarkMode ? 'hover:bg-zinc-700' : 'hover:bg-gray-150'
                  }`}
                >
                  <div className="font-mono font-bold text-xs text-orange-600 dark:text-orange-400">{item.name}</div>
                  <div className="text-[10px] opacity-75">{item.desc} e.g. <span className="font-mono text-orange-500/80">{item.formula}</span></div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-zinc-700 shrink-0"></div>

        {/* Sort & Filter Options bar */}
        <div className="relative shrink-0">
          <button
            id="toolbar-sort-filter-trigger"
            onClick={() => {
              setShowSortFilter(!showSortFilter);
              setShowFormulaHelper(false);
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/80 cursor-pointer`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-500 animate-pulse" />
            <span className="whitespace-nowrap font-sans">Sort & Filter</span>
          </button>

          {showSortFilter && (
            <div className={`absolute right-0 sm:left-0 top-8 z-50 p-3 rounded-xl shadow-xl border w-64 flex flex-col gap-3 ${
              isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-200 text-gray-800'
            }`}>
              {/* Sorting Section */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-orange-500" /> Column Sorting
                </span>
                <div className="grid grid-cols-2 gap-1 px-0.5">
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className="text-xs opacity-80">Col:</span>
                    <select
                      id="toolbar-sort-col-select"
                      value={selectedSortCol}
                      onChange={(e) => setSelectedSortCol(e.target.value)}
                      className={`text-xs p-1 rounded border outline-none w-16 ${
                        isDarkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-200'
                      }`}
                    >
                      {colLetters.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-1 justify-end">
                    <button
                      id="toolbar-sort-asc-btn"
                      onClick={() => onSort(selectedSortCol, 'asc')}
                      className="px-2 py-1 text-[10px] bg-orange-100/50 hover:bg-orange-500 border border-orange-250 hover:text-white rounded text-xs cursor-pointer transition-colors font-semibold"
                      title="Sort Column Ascending"
                    >
                      A → Z
                    </button>
                    <button
                      id="toolbar-sort-desc-btn"
                      onClick={() => onSort(selectedSortCol, 'desc')}
                      className="px-2 py-1 text-[10px] bg-orange-100/50 hover:bg-orange-500 border border-orange-250 hover:text-white rounded text-xs cursor-pointer transition-colors font-semibold"
                      title="Sort Column Descending"
                    >
                      Z → A
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-200 dark:bg-zinc-700"></div>

              {/* Filtering Section */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-orange-500" /> Row Filtering
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-80">On:</span>
                  <select
                     id="toolbar-filter-col-select"
                     value={selectedFilterCol}
                     onChange={(e) => setSelectedFilterCol(e.target.value)}
                     className={`text-xs p-1 rounded border outline-none w-16 ${
                       isDarkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-200'
                     }`}
                  >
                    {colLetters.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>

                  <input
                    id="toolbar-filter-query-input"
                    type="text"
                    placeholder="Search query..."
                    value={filterQuery}
                    onChange={(e) => {
                      setFilterQuery(e.target.value);
                      onApplyFilter(selectedFilterCol, e.target.value);
                    }}
                    className={`text-xs px-2 py-1 rounded border outline-none flex-1 truncate ${
                      isDarkMode ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                {filterQuery && (
                  <button
                    id="toolbar-clear-filter-btn"
                    onClick={() => {
                      setFilterQuery('');
                      onApplyFilter(selectedFilterCol, '');
                    }}
                    className="text-xs text-red-500 text-right hover:underline font-medium cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
