/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  CellData,
  SpreadsheetData,
  SelectionState,
  CellStyle
} from './types';
import {
  evaluateCell,
  reevaluateAllCells,
  indexToColLetter,
  colLetterToIndex,
  isNumeric
} from './utils/formula';
import Toolbar from './components/Toolbar';
import FormulaBar from './components/FormulaBar';
import Grid from './components/Grid';
import SheetTabs from './components/SheetTabs';
import AdSensePlaceholder from './components/AdSensePlaceholder';
import HelpModal from './components/HelpModal';
import DataVisualizer from './components/DataVisualizer';
import { supabase, isSupabaseConfigured } from './utils/supabaseClient';
import SupabaseAuthModal from './components/SupabaseAuthModal';
import {
  initializeAdMob,
  showBannerAd,
  triggerInterstitialAd,
  isNativePlatform
} from './utils/admob';


const DEFAULT_ROW_COUNT = 1000;
const DEFAULT_COL_COUNT = 26; // A to Z

// Generate standard empty sheet payload structure
function createEmptySheetData(): SpreadsheetData {
  const colWidths: Record<string, number> = {};
  for (let i = 0; i < DEFAULT_COL_COUNT; i++) {
    const letter = indexToColLetter(i);
    colWidths[letter] = 100;
  }

  const rowHeights: Record<number, number> = {};
  for (let i = 1; i <= DEFAULT_ROW_COUNT; i++) {
    rowHeights[i] = 28;
  }

  return {
    cells: {},
    colWidths,
    rowHeights,
    rowCount: DEFAULT_ROW_COUNT,
    colCount: DEFAULT_COL_COUNT,
  };
}

// Pre-populated sheet data is empty as requested
const INITIAL_SHEETS = [
  {
    id: 'sheet-1',
    name: 'Sheet 1',
    data: createEmptySheetData(),
  }
];

export default function App() {
  const [sheets, setSheets] = useState<Array<{ id: string; name: string; data: SpreadsheetData }>>(() => {
    return INITIAL_SHEETS;
  });

  const [activeSheetId, setActiveSheetId] = useState<string>('sheet-1');

  // Derive the active dataset and index
  const activeSheetIndex = sheets.findIndex((s) => s.id === activeSheetId);
  const currentSheetIndex = activeSheetIndex !== -1 ? activeSheetIndex : 0;
  const data = sheets[currentSheetIndex].data;

  // Custom setter that perfectly acts as a normal setData function for internal components
  const setData = (value: SpreadsheetData | ((prev: SpreadsheetData) => SpreadsheetData)) => {
    setSheets((prevSheets) => {
      const nextSheets = [...prevSheets];
      const prevData = nextSheets[currentSheetIndex].data;
      const nextData = typeof value === 'function' ? value(prevData) : value;
      nextSheets[currentSheetIndex] = {
        ...nextSheets[currentSheetIndex],
        data: nextData,
      };
      return nextSheets;
    });
  };

  const [selection, setSelection] = useState<SelectionState>({
    startCell: 'A1',
    endCell: 'A1',
    activeCell: 'A1',
  });

  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Dark mode setup
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('vortex_sheets_dark_mode');
    return saved === 'true';
  });

  // Help modal state
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Visualizer toggle and details states (fully synchronizable)
  const [isVisualizerOpen, setIsVisualizerOpen] = useState<boolean>(false);
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');
  const [paletteName, setPaletteName] = useState<string>('vortex');
  const [chartTitle, setChartTitle] = useState<string>('My Vortex Chart');
  const [chartRange, setChartRange] = useState<string>('');

  // Supabase states
  const [isSupabaseOpen, setIsSupabaseOpen] = useState<boolean>(false);
  const [activeCloudFileId, setActiveCloudFileId] = useState<string | null>(null);
  const [activeCloudFileName, setActiveCloudFileName] = useState<string | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  // AdMob integration state managers
  const [isAdMobBannerVisible, setIsAdMobBannerVisible] = useState<boolean>(true);
  const [isAdMobInterstitialOpen, setIsAdMobInterstitialOpen] = useState<boolean>(false);

  // Initialize AdMob on mount and trigger first banner display
  useEffect(() => {
    const startAdServices = async () => {
      await initializeAdMob();
      await showBannerAd((visible) => setIsAdMobBannerVisible(visible));
    };
    startAdServices();
  }, []);

  // Sorting and Filtering states
  const [rowOrder, setRowOrder] = useState<number[]>(() => {
    return Array.from({ length: DEFAULT_ROW_COUNT }, (_, i) => i + 1);
  });
  const [filterQuery, setFilterQuery] = useState<{ col: string; query: string } | null>(null);

  // Load spreadsheet state from Supabase to current app state - defined here for clean lexical scoping
  const handleLoadSheetsFromCloud = (payload: any, docId: string, docName: string) => {
    if (!payload) return;

    const targetSheets = Array.isArray(payload) ? payload : payload.sheets;
    const targetChartConfig = !Array.isArray(payload) ? payload.chartConfig : null;

    if (targetSheets && targetSheets.length > 0) {
      setSheets(targetSheets);
      setActiveSheetId(targetSheets[0].id);
      setActiveCloudFileId(docId);
      setActiveCloudFileName(docName);
      
      // Auto-set selection to original defaults
      setSelection({
        startCell: 'A1',
        endCell: 'A1',
        activeCell: 'A1',
      });
      setEditingCell(null);
      setEditValue('');
      setFilterQuery(null);
      setRowOrder(Array.from({ length: DEFAULT_ROW_COUNT }, (_, i) => i + 1));

      // Restore chart configurations if active
      if (targetChartConfig) {
        setIsVisualizerOpen(!!targetChartConfig.isVisualizerOpen);
        setChartType(targetChartConfig.chartType || 'bar');
        setPaletteName(targetChartConfig.paletteName || 'vortex');
        setChartTitle(targetChartConfig.chartTitle || 'My Vortex Chart');
        setChartRange(targetChartConfig.rangeInput || '');
      } else {
        setIsVisualizerOpen(false);
      }
    }
  };

  // Subscribe to Supabase authentication status at mount
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Fetch user's latest cloud worksheet automatically on sign-in
    const fetchLatestUserSheet = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('vortex_sheets')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching user sheet:', error);
          return;
        }

        if (data && data.length > 0) {
          const latestDoc = data[0];
          handleLoadSheetsFromCloud(latestDoc.sheets_data, latestDoc.id, latestDoc.name);
          console.log(`Auto-loaded latest cloud document "${latestDoc.name}" on sign-in.`);
        }
      } catch (e) {
        console.error('Failed to auto-fetch cloud sheet on login:', e);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user || null);
      if (session?.user) {
        fetchLatestUserSheet(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user || null);
      if (session) {
        fetchLatestUserSheet(session.user.id);
      } else {
        // Clear active cloud session tracking when logging out
        setActiveCloudFileId(null);
        setActiveCloudFileName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Reactive auto-saver effect: commits changes to Supabase in background
  useEffect(() => {
    if (!isSupabaseConfigured || !supabaseUser || !activeCloudFileId) return;

    // Bundle spreadsheet sheets with visualization setups
    const cloudPayload = {
      sheets,
      chartConfig: {
        isVisualizerOpen,
        rangeInput: chartRange,
        chartType,
        paletteName,
        chartTitle
      }
    };

    const timeoutId = setTimeout(async () => {
      try {
        await supabase
          .from('vortex_sheets')
          .update({
            sheets_data: cloudPayload,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeCloudFileId);
        console.log('Automated background cloud save accomplished successfully.');
      } catch (err) {
        console.error('Error auto-syncing spreadsheet data to cloud:', err);
      }
    }, 500); // Snappy 500ms editor response autosave trigger

    return () => clearTimeout(timeoutId);
  }, [sheets, activeCloudFileId, supabaseUser, isVisualizerOpen, chartRange, chartType, paletteName, chartTitle]);



  // Apply visual theme to page root HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('vortex_sheets_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  // Coordinate range selection trigger
  const handleSelectCell = (coord: string, expand: boolean = false) => {
    setSelection((prev) => {
      const start = expand && prev.startCell ? prev.startCell : coord;
      return {
        startCell: start,
        endCell: coord,
        activeCell: expand && prev.activeCell ? prev.activeCell : coord,
      };
    });
    
    // Close any previous item editing cycle gracefully
    if (editingCell && editingCell !== coord) {
      handleCommitEditing();
    }
  };

  // Start inline typing cycle
  const handleStartEditing = (coord: string, initialVal: string = '') => {
    setEditingCell(coord);
    setEditValue(initialVal);
  };

  const handleUpdateEditValue = (val: string) => {
    setEditValue(val);
  };

  // Commit editing and re-calculate all dynamic formulas
  const handleCommitEditing = () => {
    if (!editingCell) return;

    setData((prev) => {
      const updatedCells = { ...prev.cells };
      
      const previousRaw = updatedCells[editingCell]?.rawValue || '';
      if (editValue === '' && !updatedCells[editingCell]) {
        // Nothing to change, skip
        return prev;
      }

      updatedCells[editingCell] = {
        ...(updatedCells[editingCell] || {}),
        rawValue: editValue,
        computedValue: editValue, // initially display raw, then reevaluateAllCells compiles it
      };

      // Perform reactive graph updates
      const compiledCells = reevaluateAllCells(updatedCells);

      return {
        ...prev,
        cells: compiledCells,
      };
    });

    setEditingCell(null);
    setEditValue('');
  };

  const handleCancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Quick formatting applications
  const handleStyleChange = (stylePatch: Partial<CellStyle>) => {
    const active = selection.activeCell;
    if (!active) return;

    setData((prev) => {
      const updatedCells = { ...prev.cells };
      const currentCell = updatedCells[active] || { rawValue: '', computedValue: '' };
      
      updatedCells[active] = {
        ...currentCell,
        style: {
          ...(currentCell.style || {}),
          ...stylePatch,
        },
      };

      return {
        ...prev,
        cells: updatedCells,
      };
    });
  };

  // Auto-Sum/Avg formula helper insertion at selected cell
  const handleInsertFormula = (formulaTemplate: string) => {
    const active = selection.activeCell;
    if (!active) return;

    handleStartEditing(active, formulaTemplate);
  };

  const handleClearCell = () => {
    const active = selection.activeCell;
    if (!active) return;

    setData((prev) => {
      const updatedCells = { ...prev.cells };
      delete updatedCells[active];
      
      return {
        ...prev,
        cells: reevaluateAllCells(updatedCells),
      };
    });
  };

  const handleResetGrid = () => {
    if (window.confirm('Are you sure you want to reset the entire grid? Your changes will be cleared.')) {
      setData((prev) => {
        const resetCells: Record<string, CellData> = {};
        return {
          ...prev,
          cells: reevaluateAllCells(resetCells),
        };
      });
      setSelection({
        startCell: 'A1',
        endCell: 'A1',
        activeCell: 'A1',
      });
      setEditingCell(null);
      setEditValue('');
      setFilterQuery(null);
      setRowOrder(Array.from({ length: DEFAULT_ROW_COUNT }, (_, i) => i + 1));
    }
  };

  // Grid sizing controllers
  const handleResizeColumn = (col: string, width: number) => {
    setData((prev) => ({
      ...prev,
      colWidths: {
        ...prev.colWidths,
        [col]: width,
      },
    }));
  };

  const handleResizeRow = (row: number, height: number) => {
    setData((prev) => ({
      ...prev,
      rowHeights: {
        ...prev.rowHeights,
        [row]: height,
      },
    }));
  };

  // CSV Import logic
  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') return;

      const lines = text.split(/\r?\n/);
      const parsedCells: Record<string, CellData> = {};

      lines.forEach((line, rowIndex) => {
        const rowNum = rowIndex + 1;
        if (rowNum > DEFAULT_ROW_COUNT) return;

        // basic comma splitting (simplified)
        const columns = line.split(',');
        columns.forEach((val, colIndex) => {
          if (colIndex >= DEFAULT_COL_COUNT) return;
          const colLetter = indexToColLetter(colIndex);
          const coord = `${colLetter}${rowNum}`;
          
          parsedCells[coord] = {
            rawValue: val.trim(),
            computedValue: val.trim(),
          };
        });
      });

      setData((prev) => {
        // Keep existing styles or layouts but replace the cells with parsed cells
        const mergedCells = { ...prev.cells, ...parsedCells };
        return {
          ...prev,
          cells: reevaluateAllCells(mergedCells),
        };
      });

      alert(`Successfully imported ${lines.length} data rows!`);
    };
    reader.readAsText(file);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    let csvContent = '';
    
    // Find the bounding box of populated cells (where rawValue is not empty)
    let maxRefRow = 1;
    let maxRefCol = 0; // 0 means column A

    for (const coord in data.cells) {
      const cell = data.cells[coord];
      if (cell && cell.rawValue !== '') {
        const match = coord.match(/^([A-Z]+)([0-9]+)$/);
        if (match) {
          const colLetter = match[1];
          const rowNum = parseInt(match[2], 10);
          const colIdx = colLetterToIndex(colLetter);
          if (rowNum > maxRefRow) maxRefRow = rowNum;
          if (colIdx > maxRefCol) maxRefCol = colIdx;
        }
      }
    }

    for (let r = 1; r <= maxRefRow; r++) {
      const lineValues: string[] = [];
      for (let c = 0; c <= maxRefCol; c++) {
        const colLetter = indexToColLetter(c);
        const cell = data.cells[`${colLetter}${r}`];
        // Export computed display values
        let display = cell ? cell.computedValue : '';
        // Safe wrap commas
        if (display.includes(',') || display.includes('\n') || display.includes('"')) {
          display = `"${display.replace(/"/g, '""')}"`;
        }
        lineValues.push(display);
      }
      
      // Trim empty trailing cells from this line to prevent unnecessary separators
      while (lineValues.length > 0 && lineValues[lineValues.length - 1] === '') {
        lineValues.pop();
      }
      
      csvContent += lineValues.join(',') + '\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'VortexSheets_Export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // XLSX Exporter using SheetJS - exports all spreadsheet tabs beautifully!
  const handleExportXLSX = () => {
    const workbook = XLSX.utils.book_new();

    sheets.forEach((sheet) => {
      const wsData: any[][] = [];
      const sData = sheet.data;

      // Find bounding box for this sheet to avoid writing extra empty cells
      let sheetMaxRow = 1;
      let sheetMaxCol = 0;
      for (const coord in sData.cells) {
        const cell = sData.cells[coord];
        if (cell && cell.rawValue !== '') {
          const match = coord.match(/^([A-Z]+)([0-9]+)$/);
          if (match) {
            const colLetter = match[1];
            const rowNum = parseInt(match[2], 10);
            const colIdx = colLetterToIndex(colLetter);
            if (rowNum > sheetMaxRow) sheetMaxRow = rowNum;
            if (colIdx > sheetMaxCol) sheetMaxCol = colIdx;
          }
        }
      }

      for (let r = 1; r <= sheetMaxRow; r++) {
        const rowVals: any[] = [];
        for (let c = 0; c <= sheetMaxCol; c++) {
          const colLetter = indexToColLetter(c);
          const cell = sData.cells[`${colLetter}${r}`];
          rowVals.push(cell ? cell.computedValue : '');
        }
        // Trim trailing empty cells from this row
        while (rowVals.length > 0 && rowVals[rowVals.length - 1] === '') {
          rowVals.pop();
        }
        wsData.push(rowVals);
      }

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      const colsWidthConfig = Array.from({ length: sheetMaxCol + 1 }, (_, i) => {
        const letter = indexToColLetter(i);
        const width = sData.colWidths[letter] || 100;
        return { wpx: width };
      });
      ws['!cols'] = colsWidthConfig;

      XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
    });

    XLSX.writeFile(workbook, 'VortexSheets_All_Tabs_Export.xlsx');

    // Seamlessly trigger AdMob Interstitial Ad right after workbook download completes
    triggerInterstitialAd(() => {
      setIsAdMobInterstitialOpen(true);
    });
  };


  const handleSwitchSheet = (sheetId: string) => {
    setActiveSheetId(sheetId);
    setSelection({
      startCell: 'A1',
      endCell: 'A1',
      activeCell: 'A1',
    });
    setEditingCell(null);
    setEditValue('');
    setFilterQuery(null);
    setRowOrder(Array.from({ length: DEFAULT_ROW_COUNT }, (_, i) => i + 1));
  };

  const handleCreateSheet = () => {
    let index = sheets.length + 1;
    let newName = `Sheet ${index}`;
    while (sheets.some((s) => s.name.toLowerCase() === newName.toLowerCase())) {
      index++;
      newName = `Sheet ${index}`;
    }

    const newId = `sheet-${Date.now()}`;
    const newSheet = {
      id: newId,
      name: newName,
      data: createEmptySheetData(),
    };

    setSheets((prev) => [...prev, newSheet]);
    handleSwitchSheet(newId);
  };

  const handleRenameSheet = (id: string, newName: string) => {
    setSheets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
    );
  };

  const handleDeleteSheet = (id: string) => {
    if (sheets.length <= 1) return;

    let nextActiveId = activeSheetId;
    if (activeSheetId === id) {
      const idx = sheets.findIndex((s) => s.id === id);
      const fallbackIdx = idx === 0 ? 1 : idx - 1;
      nextActiveId = sheets[fallbackIdx].id;
    }

    setSheets((prev) => prev.filter((s) => s.id !== id));
    handleSwitchSheet(nextActiveId);
  };



  // Column Sorter
  const handleSort = (col: string, direction: 'asc' | 'desc') => {
    setRowOrder((prevOrder) => {
      const sorted = [...prevOrder];
      sorted.sort((rowA, rowB) => {
        // Values at the columns
        const valAStr = data.cells[`${col}${rowA}`]?.computedValue || '';
        const valBStr = data.cells[`${col}${rowB}`]?.computedValue || '';

        const numericA = isNumeric(valAStr) ? parseFloat(valAStr) : null;
        const numericB = isNumeric(valBStr) ? parseFloat(valBStr) : null;

        if (numericA !== null && numericB !== null) {
          return direction === 'asc' ? numericA - numericB : numericB - numericA;
        }

        // Alphabetical sort as backup
        return direction === 'asc' 
          ? valAStr.localeCompare(valBStr) 
          : valBStr.localeCompare(valAStr);
      });
      return sorted;
    });
  };

  // Row Filter query update trigger
  const handleApplyFilter = (col: string, query: string) => {
    if (!query) {
      setFilterQuery(null);
    } else {
      setFilterQuery({ col, query });
    }
  };

  // Fetch actively selected cell raw data (formula or raw string)
  const activeCellRef = selection.activeCell;
  const activeCellData = activeCellRef ? data.cells[activeCellRef] : null;
  const activeCellValue = activeCellData ? activeCellData.rawValue : '';
  const activeCellStyle = activeCellData?.style || {};

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col transition-colors duration-150 ${
      isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-800'
    }`}>
      {/* Header & Controls toolbar */}
      <div className="shrink-0">
        <Toolbar
          activeStyle={activeCellStyle}
          onStyleChange={handleStyleChange}
          onImportCSV={handleImportCSV}
          onExportCSV={handleExportCSV}
          onExportXLSX={handleExportXLSX}
          activeCell={activeCellRef}
          selectedRange={null}
          onInsertFormula={handleInsertFormula}
          onClearCell={handleClearCell}
          onResetGrid={handleResetGrid}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onSort={handleSort}
          onApplyFilter={handleApplyFilter}
          colCount={data.colCount}
          onToggleVisualizer={() => setIsVisualizerOpen(!isVisualizerOpen)}
          isVisualizerOpen={isVisualizerOpen}
          onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
          activeCloudFileName={activeCloudFileName}
          supabaseUserEmail={supabaseUser?.email || null}
        />
      </div>

      {/* Formula Recalculator Bar display - positioned right beneath toolbar */}
      <div className="shrink-0 border-b border-gray-200 dark:border-zinc-800">
        <FormulaBar
          activeCellCoord={activeCellRef}
          value={editingCell === activeCellRef ? editValue : activeCellValue}
          onChange={(newVal) => {
            if (activeCellRef) {
              handleStartEditing(activeCellRef, newVal);
            }
          }}
          isDarkMode={isDarkMode}
        />
      </div>

      {isVisualizerOpen && (
        <div className="shrink-0 p-3 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/20 dark:bg-zinc-950/20">
          <DataVisualizer
            data={data}
            startCell={selection.startCell}
            endCell={selection.endCell}
            isDarkMode={isDarkMode}
            onClose={() => setIsVisualizerOpen(false)}
            chartType={chartType}
            setChartType={setChartType}
            paletteName={paletteName}
            setPaletteName={setPaletteName}
            chartTitle={chartTitle}
            setChartTitle={setChartTitle}
            chartRange={chartRange}
            setChartRange={setChartRange}
          />
        </div>
      )}

      {/* Interactive Core Spreadsheet Grid area */}
      <div className="flex-1 min-h-0 flex flex-col">
        <Grid
          data={data}
          selection={selection}
          editingCell={editingCell}
          editValue={editValue}
          isDarkMode={isDarkMode}
          rowOrder={rowOrder}
          filterQuery={filterQuery}
          onSelectCell={handleSelectCell}
          onStartEditing={handleStartEditing}
          onUpdateEditValue={handleUpdateEditValue}
          onCommitEditing={handleCommitEditing}
          onCancelEditing={handleCancelEditing}
          onResizeColumn={handleResizeColumn}
          onResizeRow={handleResizeRow}
          onSort={handleSort}
          onApplyFilter={handleApplyFilter}
        />
      </div>

      {/* Interactive sheet tabs bar styled in signature vibrant Orange & Amber */}
      <div className="shrink-0">
        <SheetTabs
          sheets={sheets.map(s => ({ id: s.id, name: s.name }))}
          activeSheetId={activeSheetId}
          onSelectSheet={handleSwitchSheet}
          onCreateSheet={handleCreateSheet}
          onRenameSheet={handleRenameSheet}
          onDeleteSheet={handleDeleteSheet}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Grid Quick Summary bar */}
      <div className="shrink-0 px-4 py-2 border-t text-[10px] font-mono flex flex-wrap justify-between items-center bg-gray-50/50 dark:bg-zinc-950/20 text-slate-400 border-gray-200/55 dark:border-zinc-800/55">
        <div className="flex gap-4">
          <span>ACTIVE CELL: <strong className="text-orange-500">{activeCellRef || 'None'}</strong></span>
          {activeCellData && (
            <>
              <span className="hidden sm:inline">| RAW: <span className="opacity-80">{activeCellData.rawValue}</span></span>
              <span>| COMPUTED: <strong className="text-gray-700 dark:text-zinc-200">{activeCellData.computedValue}</strong></span>
            </>
          )}
        </div>
        <div className="flex gap-2.5 items-center flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>GRID ALIGNED</span>
        </div>
      </div>

      {/* Help Overlay reference guide */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        isDarkMode={isDarkMode}
      />

      {/* Supabase auth control and sheet file sync modal */}
      <SupabaseAuthModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
        isDarkMode={isDarkMode}
        currentSheetsData={{
          sheets,
          chartConfig: {
            isVisualizerOpen,
            rangeInput: chartRange,
            chartType,
            paletteName,
            chartTitle
          }
        }}
        onLoadSheetsFromCloud={handleLoadSheetsFromCloud}
        onSaveTrigger={async () => {
          if (isSupabaseConfigured && supabaseUser && activeCloudFileId) {
            try {
              await supabase
                .from('vortex_sheets')
                .update({
                  sheets_data: {
                    sheets,
                    chartConfig: {
                      isVisualizerOpen,
                      rangeInput: chartRange,
                      chartType,
                      paletteName,
                      chartTitle
                    }
                  },
                  updated_at: new Date().toISOString()
                })
                .eq('id', activeCloudFileId);
            } catch (err) {
              console.error(err);
            }
          }
        }}
      />

      {/* Simulated Google AdMob Banner Ad (Used for seamless browser previews) */}
      {isAdMobBannerVisible && !isNativePlatform() && (
        <div className="shrink-0 h-[50px] bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between px-4 text-xs select-none">
          <div className="flex items-center gap-2">
            <span className="bg-orange-500/10 text-orange-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">AdMob Ad</span>
            <span className="font-mono text-zinc-500 dark:text-zinc-400 font-medium">Google AdMob Test Partner Banner Ad</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[10px] text-zinc-400 font-mono">Unit ID: ca-app-pub-3940256099942544/6300978111</span>
            <button 
              onClick={() => setIsAdMobBannerVisible(false)}
              className="w-5 h-5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors focus:outline-none"
              title="Close Ad"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Simulated Google AdMob Interstitial Full-Screen Ad */}
      {isAdMobInterstitialOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 text-white rounded-2xl w-full max-w-sm p-6 relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
            
            {/* Top Status Indicators */}
            <div className="w-full flex justify-between items-center mb-6">
              <span className="bg-orange-500/20 text-orange-400 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                AdMob Sponsored Interstitial
              </span>
              <button 
                onClick={() => setIsAdMobInterstitialOpen(false)}
                className="w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all focus:outline-none text-xs"
                title="Dismiss and Resume"
              >
                ✕
              </button>
            </div>

            {/* App Branding Creative representation */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-4">
              <span className="font-sans font-black text-3xl text-white">V</span>
            </div>

            <div className="mb-6">
              <h4 className="text-base font-bold tracking-tight text-white mb-1">VortexCloud® Database Cluster 4.0</h4>
              <p className="text-zinc-400 text-xs leading-relaxed max-w-[240px]">
                Scale your sheets real-time calculations directly to high-throughput Cloud Spanner instances instantly.
              </p>
            </div>

            {/* Simulated Call to Action button */}
            <a 
              href="https://ai.studio/build" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-xs rounded-xl shadow-lg shadow-orange-500/15 hover:shadow-orange-500/30 active:translate-y-px transition-all flex items-center justify-center gap-1.5 focus:outline-none"
            >
              Deploy Grid Cluster 🚀
            </a>

            {/* Simulated technical details */}
            <div className="w-full mt-6 pt-4 border-t border-zinc-900/80 flex justify-between items-center text-[9px] text-zinc-500 font-mono">
              <span>Class: INTERSTITIAL</span>
              <span>ID: ...1033173712</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
