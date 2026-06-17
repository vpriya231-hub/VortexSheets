/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
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
  Cloud,
  Plus,
  X,
  User,
  LogOut,
  FileSpreadsheet
} from 'lucide-react';
import { CellStyle } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
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
  onSort: (col: string, direction: 'asc' | 'desc') => void;
  onApplyFilter: (col: string, query: string) => void;
  colCount: number;
  onToggleVisualizer: () => void;
  isVisualizerOpen: boolean;
  onOpenSupabaseModal: () => void;
  activeCloudFileName: string | null;
  supabaseUserEmail: string | null;
  onCreateNewSpreadsheet: () => void;
  onSignOut: () => Promise<void>;
}

// Color palettes identical to the Toolbar
const TEXT_COLORS = [
  { name: 'Default', hex: '' },
  { name: 'Charcoal', hex: '#1F2937' },
  { name: 'Elegant Orange', hex: '#EA580C' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Forest Green', hex: '#16A34A' },
  { name: 'Cobalt Blue', hex: '#2563EB' },
  { name: 'Royal Purple', hex: '#9333EA' },
];

const BG_COLORS = [
  { name: 'No Fill', hex: '' },
  { name: 'Subtle Orange', hex: '#FFF7ED' },
  { name: 'Subtle Gray', hex: '#F3F4F6' },
  { name: 'Subtle Red', hex: '#FEF2F2' },
  { name: 'Subtle Green', hex: '#F0FDF4' },
  { name: 'Subtle Blue', hex: '#EFF6FF' },
  { name: 'Subtle Purple', hex: '#FAF5FF' },
];

export default function Sidebar({
  isOpen,
  onClose,
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
  supabaseUserEmail,
  onCreateNewSpreadsheet,
  onSignOut
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);
  
  // Sort and Filter States inside Sidebar
  const [selectedSortCol, setSelectedSortCol] = useState('A');
  const [selectedFilterCol, setSelectedFilterCol] = useState('A');
  const [filterQuery, setFilterQuery] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportCSV(e.target.files[0]);
    }
  };

  const colLetters = Array.from({ length: Math.min(26, colCount) }, (_, i) => String.fromCharCode(65 + i));

  // Determine user initials for avatar
  const userInitials = supabaseUserEmail
    ? supabaseUserEmail.split('@')[0].slice(0, 2).toUpperCase()
    : 'VS';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            key="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-100 bg-black backdrop-blur-xs"
          />

          {/* Sliding Menu Custom Drawer */}
          <motion.div
            key="sidebar-content"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className={`fixed top-0 left-0 h-full w-full max-w-sm z-110 flex flex-col shadow-2xl overflow-hidden border-r ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-gray-200 text-zinc-800'
            }`}
          >
            {/* Header: User Profile Info */}
            <div className={`p-5 flex flex-col gap-4 border-b shrink-0 ${
              isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-orange-50/20 border-gray-100'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 drop-shadow-sm" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="14" y="14" width="72" height="72" rx="14" fill="#F97316" />
                      <line x1="30" y1="20" x2="30" y2="80" stroke="#FFF" strokeWidth="4" />
                      <line x1="50" y1="20" x2="50" y2="80" stroke="#FFF" strokeWidth="4" />
                      <line x1="20" y1="36" x2="80" y2="36" stroke="#FFF" strokeWidth="4" />
                      <line x1="20" y1="56" x2="80" y2="56" stroke="#FFF" strokeWidth="4" />
                    </svg>
                  </div>
                  <span className="font-bold text-sm tracking-tight">VortexSheets Menu</span>
                </div>
                <button
                  id="sidebar-close-btn"
                  onClick={onClose}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400' : 'border-gray-205 hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Details (Supa Email & LogOut) */}
              <div className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 border ${
                isDarkMode ? 'bg-zinc-850/50 border-zinc-800' : 'bg-gray-50 border-gray-100'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                    {userInitials}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Active Account</span>
                    <span className="text-xs font-semibold truncate max-w-[160px] text-gray-900 dark:text-zinc-100">
                      {supabaseUserEmail || 'Guest / Local Mode'}
                    </span>
                  </div>
                </div>
                {supabaseUserEmail ? (
                  <button
                    id="sidebar-logout-btn"
                    onClick={() => {
                      onSignOut();
                      onClose();
                    }}
                    title="Sign Out of Supabase Account"
                    className="flex w-9 h-9 items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 hover:border-transparent transition-all cursor-pointer shadow-sm shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="sidebar-login-btn"
                    onClick={() => {
                      onOpenSupabaseModal();
                      onClose();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-orange-550 text-white cursor-pointer hover:bg-orange-600 shadow-xs"
                  >
                    Log In
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable actions lists */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Spreadsheet Cloud File Sync & Status */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase opacity-55 font-mono tracking-wider">Storage & Cloud Sync</span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => {
                      onOpenSupabaseModal();
                      onClose();
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      activeCloudFileName
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : isDarkMode
                          ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700'
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Cloud className={`w-4 h-4 ${activeCloudFileName ? 'text-emerald-500 animate-pulse' : 'text-orange-500'}`} />
                      <span>{activeCloudFileName ? activeCloudFileName : 'Cloud Storage Integration'}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-60">Status</span>
                  </button>
                </div>
              </div>

              {/* Core Actions Block */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase opacity-55 font-mono tracking-wider">File & Sheet Actions</span>
                <div className="grid grid-cols-2 gap-2">
                  {/* Create blank doc */}
                  <button
                    onClick={() => {
                      onCreateNewSpreadsheet();
                      onClose();
                    }}
                    className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 shadow-md shadow-orange-500/10 cursor-pointer active:translate-y-px transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ New Spreadsheet</span>
                  </button>

                  {/* Reset whole grid */}
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to completely reset the spreadsheet grid? All unsaved work will be lost.")) {
                        onResetGrid();
                        onClose();
                      }
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      isDarkMode
                        ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-750 text-zinc-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span>Reset Grid</span>
                  </button>

                  {/* Data visualizer */}
                  <button
                    onClick={() => {
                      onToggleVisualizer();
                      onClose();
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      isVisualizerOpen
                        ? 'bg-orange-500 text-white border-transparent'
                        : isDarkMode
                          ? 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-orange-400'
                          : 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-600'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    <span>Visualize</span>
                  </button>

                  {/* Import File input */}
                  <input
                    id="sidebar-csv-file-import-input"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      isDarkMode
                        ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-750 text-zinc-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-orange-500" />
                    <span>Import CSV</span>
                  </button>

                  {/* Export CSV */}
                  <button
                    onClick={() => {
                      onExportCSV();
                      onClose();
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      isDarkMode
                        ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-750 text-zinc-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5 text-gray-500" />
                    <span>Export CSV</span>
                  </button>

                  {/* Export .XLSX */}
                  <button
                    onClick={() => {
                      onExportXLSX();
                      onClose();
                    }}
                    className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 cursor-pointer shadow-sm active:translate-y-px transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export .XLSX</span>
                  </button>
                </div>
              </div>

              {/* Grid Appearance / Help */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase opacity-55 font-mono tracking-wider">Interface & Assistance</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onToggleDarkMode}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      isDarkMode ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700 text-amber-400' : 'bg-white hover:bg-orange-50 border-gray-200 text-slate-600 hover:text-orange-500'
                    }`}
                  >
                    {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenHelp();
                      onClose();
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      isDarkMode ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700 text-orange-400' : 'bg-white hover:bg-orange-50 border-gray-200 text-slate-600 hover:text-orange-500'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Excel Help</span>
                  </button>
                </div>
              </div>

              {/* Cell Formatting Block */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase opacity-55 font-mono tracking-wider">Active Cell Formatting</span>
                
                <div className={`p-4 rounded-2xl border flex flex-col gap-3.5 ${
                  isDarkMode ? 'bg-zinc-850/30 border-zinc-800' : 'bg-gray-50/50 border-gray-100'
                }`}>
                  {/* Font Size Select */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-orange-500 opacity-80" />
                      FontSize:
                    </span>
                    <select
                      value={activeStyle.fontSize || 12}
                      onChange={(e) => onStyleChange({ fontSize: parseInt(e.target.value, 10) })}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer ${
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

                  {/* Bold/Italic/Underline styling row */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Text Style:</span>
                    <div className="flex items-center gap-1 bg-white/40 dark:bg-zinc-900/40 p-1 rounded-xl">
                      <button
                        onClick={() => onStyleChange({ bold: !activeStyle.bold })}
                        className={`p-2 rounded-lg cursor-pointer transition-all ${
                          activeStyle.bold
                            ? 'bg-orange-500 text-white font-bold'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                        }`}
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onStyleChange({ italic: !activeStyle.italic })}
                        className={`p-2 rounded-lg cursor-pointer transition-all ${
                          activeStyle.italic
                            ? 'bg-orange-500 text-white italic'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                        }`}
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onStyleChange({ underline: !activeStyle.underline })}
                        className={`p-2 rounded-lg cursor-pointer transition-all ${
                          activeStyle.underline
                            ? 'bg-orange-500 text-white underline underline-offset-2'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                        }`}
                        title="Underline"
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Alignment row */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Alignment:</span>
                    <div className="flex items-center gap-1 bg-white/40 dark:bg-zinc-900/40 p-1 rounded-xl">
                      <button
                        onClick={() => onStyleChange({ align: 'left' })}
                        className={`p-2 rounded-lg cursor-pointer transition-all ${
                          activeStyle.align === 'left' || !activeStyle.align
                            ? 'bg-orange-500 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                        }`}
                        title="Align Left"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onStyleChange({ align: 'center' })}
                        className={`p-2 rounded-lg cursor-pointer transition-all ${
                          activeStyle.align === 'center'
                            ? 'bg-orange-500 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                        }`}
                        title="Align Center"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onStyleChange({ align: 'right' })}
                        className={`p-2 rounded-lg cursor-pointer transition-all ${
                          activeStyle.align === 'right'
                            ? 'bg-orange-500 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                        }`}
                        title="Align Right"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Text Color Selection Grid */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Text Color:</span>
                      <button
                        onClick={() => setShowTextColor(!showTextColor)}
                        className={`text-[10px] text-orange-550 border border-orange-500/10 px-2 py-0.5 rounded-md hover:bg-orange-500/5 ${
                          showTextColor ? 'bg-orange-500/10' : ''
                        }`}
                      >
                        {showTextColor ? 'Collapse' : 'Expand Options'}
                      </button>
                    </div>
                    {showTextColor && (
                      <div className="grid grid-cols-7 gap-1.5 p-2 bg-white/40 dark:bg-zinc-90 w-full rounded-xl border border-gray-100 dark:border-zinc-800/60">
                        {TEXT_COLORS.map((tc) => (
                          <button
                            key={tc.name}
                            onClick={() => onStyleChange({ color: tc.hex })}
                            className="w-7 h-7 rounded-md border border-gray-300/30 cursor-pointer flex items-center justify-center hover:scale-110 transition-transform active:scale-95 shadow-sm shrink-0"
                            style={{ backgroundColor: tc.hex || (isDarkMode ? '#F3F4F6' : '#1F2937') }}
                            title={tc.name}
                          >
                            {!tc.hex && <span className="text-[9px] text-red-500 font-bold">X</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cell Background Fill Selection Grid */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium flex items-center gap-1">
                        <Paintbrush className="w-3 h-3 text-orange-500" />
                        Cell Background:
                      </span>
                      <button
                        onClick={() => setShowBgColor(!showBgColor)}
                        className={`text-[10px] text-orange-550 border border-orange-500/10 px-2 py-0.5 rounded-md hover:bg-orange-500/5 ${
                          showBgColor ? 'bg-orange-500/10' : ''
                        }`}
                      >
                        {showBgColor ? 'Collapse' : 'Expand Options'}
                      </button>
                    </div>
                    {showBgColor && (
                      <div className="grid grid-cols-7 gap-1.5 p-2 bg-white/40 dark:bg-zinc-90 w-full rounded-xl border border-gray-100 dark:border-zinc-800/60">
                        {BG_COLORS.map((bg) => (
                          <button
                            key={bg.name}
                            onClick={() => onStyleChange({ bgColor: bg.hex })}
                            className="w-7 h-7 rounded-md border border-gray-300/30 cursor-pointer flex items-center justify-center hover:scale-110 transition-transform active:scale-95 shadow-sm shrink-0"
                            style={{ backgroundColor: bg.hex || (isDarkMode ? '#1F2937' : '#FFFFFF') }}
                            title={bg.name}
                          >
                            {!bg.hex && <span className="text-[9px] text-red-500 font-bold">X</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Active Cell Cleanup button */}
                  {activeCell && (
                    <button
                      id="sidebar-clear-cell-btn"
                      onClick={() => {
                        onClearCell();
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/15 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Active Cell ({activeCell})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sort & Filter Controls inline in Sidebar */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase opacity-55 font-mono tracking-wider">Grid Sorting & Row Filtering</span>
                <div className={`p-4 rounded-2xl border flex flex-col gap-4 ${
                  isDarkMode ? 'bg-zinc-850/30 border-zinc-800' : 'bg-gray-50/50 border-gray-100'
                }`}>
                  
                  {/* Sorting inputs */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5 text-orange-500" />
                      Sort Spreadsheet Rows:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] opacity-75">Target Column:</span>
                      <select
                        value={selectedSortCol}
                        onChange={(e) => setSelectedSortCol(e.target.value)}
                        className={`text-xs p-1.5 rounded-lg border outline-none flex-1 font-mono ${
                          isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-200 text-gray-800'
                        }`}
                      >
                        {colLetters.map((col) => (
                          <option key={col} value={col}>Column {col}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      <button
                        onClick={() => {
                          onSort(selectedSortCol, 'asc');
                          onClose();
                        }}
                        className="p-2 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold rounded-xl shadow-xs cursor-pointer active:translate-y-px text-center"
                      >
                        Ascending
                      </button>
                      <button
                        onClick={() => {
                          onSort(selectedSortCol, 'desc');
                          onClose();
                        }}
                        className="p-2 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold rounded-xl shadow-xs cursor-pointer active:translate-y-px text-center"
                      >
                        Descending
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 dark:bg-zinc-800/80 my-0.5"></div>

                  {/* Filtering inputs */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-orange-500" />
                      Filter Rows:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] opacity-75">Filter Column:</span>
                      <select
                        value={selectedFilterCol}
                        onChange={(e) => setSelectedFilterCol(e.target.value)}
                        className={`text-xs p-1.5 rounded-lg border outline-none flex-1 font-mono ${
                          isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-200 text-gray-800'
                        }`}
                      >
                        {colLetters.map((col) => (
                          <option key={col} value={col}>Column {col}</option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      placeholder="Search value..."
                      value={filterQuery}
                      onChange={(e) => {
                        setFilterQuery(e.target.value);
                        onApplyFilter(selectedFilterCol, e.target.value);
                      }}
                      className={`text-xs px-3 py-2 rounded-xl border outline-none w-full ${
                        isDarkMode ? 'bg-zinc-800 border-zinc-750 text-white' : 'bg-white border-gray-305 text-zinc-800'
                      }`}
                    />

                    {filterQuery && (
                      <button
                        onClick={() => {
                          setFilterQuery('');
                          onApplyFilter(selectedFilterCol, '');
                        }}
                        className="text-[11px] text-red-500 text-center hover:underline font-bold cursor-pointer"
                      >
                        Clear Filter Query
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Formula Tap-grid */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase opacity-55 font-mono tracking-wider">Formula Helpers</span>
                <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${
                  isDarkMode ? 'bg-zinc-850/30 border-zinc-800' : 'bg-gray-50/50 border-gray-100'
                }`}>
                  <span className="text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    Tap Cell Formula:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto">
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
                          onClose();
                        }}
                        className={`text-left p-2.5 rounded-xl border transition-colors flex flex-col gap-0.5 w-full cursor-pointer ${
                          isDarkMode 
                            ? 'bg-zinc-800 hover:bg-zinc-750 border-zinc-750 text-white' 
                            : 'bg-white hover:bg-orange-50/40 border-gray-200 hover:border-orange-500/20 text-gray-800'
                        }`}
                      >
                        <div className="font-mono font-bold text-[11px] text-orange-605 dark:text-orange-400">{item.name}</div>
                        <div className="text-[10px] opacity-75">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Sidebar Footer branding */}
            <div className={`p-4 border-t text-center shrink-0 ${
              isDarkMode ? 'bg-zinc-950/60 border-zinc-800' : 'bg-gray-50/60 border-gray-100'
            }`}>
              <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 tracking-wide">
                VORTEXSHEETS ENGINE v4.0
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
