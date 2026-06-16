/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, ArrowUpAZ, ArrowDownZA, Check, Filter } from 'lucide-react';
import { CellData, SpreadsheetData, SelectionState } from '../types';
import { colLetterToIndex, indexToColLetter, isNumeric, parseCoordinate } from '../utils/formula';

interface GridProps {
  data: SpreadsheetData;
  selection: SelectionState;
  editingCell: string | null;
  editValue: string;
  isDarkMode: boolean;
  rowOrder: number[]; // Ordered indices of rows (allows sorting)
  filterQuery: { col: string; query: string } | null; // Filter settings
  onSelectCell: (coord: string, expand?: boolean) => void;
  onStartEditing: (coord: string, initialVal?: string) => void;
  onUpdateEditValue: (val: string) => void;
  onCommitEditing: () => void;
  onCancelEditing: () => void;
  onResizeColumn: (col: string, width: number) => void;
  onResizeRow: (row: number, height: number) => void;
  onSort: (col: string, direction: 'asc' | 'desc') => void;
  onApplyFilter: (col: string, query: string) => void;
}

function isCellInRange(coord: string, startCell: string | null, endCell: string | null): boolean {
  if (!startCell || !endCell) return false;
  if (startCell === endCell) return coord === startCell;
  const c = parseCoordinate(coord);
  const s = parseCoordinate(startCell);
  const e = parseCoordinate(endCell);
  if (!c || !s || !e) return false;

  const sCol = colLetterToIndex(s.col);
  const eCol = colLetterToIndex(e.col);
  const cCol = colLetterToIndex(c.col);

  const minCol = Math.min(sCol, eCol);
  const maxCol = Math.max(sCol, eCol);
  const minRow = Math.min(s.row, e.row);
  const maxRow = Math.max(s.row, e.row);

  return cCol >= minCol && cCol <= maxCol && c.row >= minRow && c.row <= maxRow;
}

export default function Grid({
  data,
  selection,
  editingCell,
  editValue,
  isDarkMode,
  rowOrder,
  filterQuery,
  onSelectCell,
  onStartEditing,
  onUpdateEditValue,
  onCommitEditing,
  onCancelEditing,
  onResizeColumn,
  onResizeRow,
  onSort,
  onApplyFilter
}: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Resizing references
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [resizingRow, setResizingRow] = useState<number | null>(null);
  const startOffset = useRef<number>(0);
  const startWidthOrHeight = useRef<number>(0);

  // Lazy loading & Sort/Filter states
  const [renderedRowCount, setRenderedRowCount] = useState(100);
  const [openMenuCol, setOpenMenuCol] = useState<string | null>(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [uncheckedValues, setUncheckedValues] = useState<Record<string, Set<string>>>({});

  // Reset rendered row count when sorting, filters or columns are changed
  useEffect(() => {
    setRenderedRowCount(100);
  }, [rowOrder, filterQuery]);

  // Upgraded real-time visibleRows filtering with keyword searches and checkbox exclusions
  const visibleRows = rowOrder.filter((r) => {
    // 1. Text Search Input matches
    if (filterQuery && filterQuery.query) {
      const { col, query } = filterQuery;
      const cellValue = data.cells[`${col}${r}`]?.computedValue || '';
      if (!cellValue.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
    }
    
    // 2. Unchecked values from Multi-Column filters
    const keys = Object.keys(uncheckedValues);
    for (const col of keys) {
      const colUnchecked = uncheckedValues[col];
      if (colUnchecked && colUnchecked.size > 0) {
        const cellValue = data.cells[`${col}${r}`]?.computedValue || '';
        const displayValue = cellValue === '' ? '(Blanks)' : cellValue;
        if (colUnchecked.has(displayValue)) {
          return false;
        }
      }
    }
    return true;
  });

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If we are editing a cell, we let the cell's own input inline keydown handler handle it first (like arrow cursor control)
      if (editingCell) {
        return;
      }

      const active = selection.activeCell;
      if (!active) return;

      const match = active.match(/^([A-Z]+)([0-9]+)$/);
      if (!match) return;

      const colLetter = match[1];
      const rowNum = parseInt(match[2], 10);
      const colIdx = colLetterToIndex(colLetter);

      let nextColIdx = colIdx;
      let nextRowNum = rowNum;
      let navigated = false;

      switch (e.key) {
        case 'ArrowUp':
          if (rowNum > 1) {
            // Find preceding row in the visible row list (rowOrder) if possible, or just default coordinate navigation
            const currentOrderIdx = rowOrder.indexOf(rowNum);
            if (currentOrderIdx > 0) {
              nextRowNum = rowOrder[currentOrderIdx - 1];
            } else {
              nextRowNum = rowNum - 1;
            }
            navigated = true;
          }
          break;
        case 'ArrowDown':
          if (rowNum < data.rowCount) {
            const currentOrderIdx = rowOrder.indexOf(rowNum);
            if (currentOrderIdx !== -1 && currentOrderIdx < rowOrder.length - 1) {
              nextRowNum = rowOrder[currentOrderIdx + 1];
            } else {
              nextRowNum = rowNum + 1;
            }
            navigated = true;
          }
          break;
        case 'ArrowLeft':
          if (colIdx > 0) {
            nextColIdx = colIdx - 1;
            navigated = true;
          }
          break;
        case 'ArrowRight':
          if (colIdx < data.colCount - 1) {
            nextColIdx = colIdx + 1;
            navigated = true;
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            if (colIdx > 0) nextColIdx = colIdx - 1;
          } else {
            if (colIdx < data.colCount - 1) nextColIdx = colIdx + 1;
          }
          navigated = true;
          break;
        case 'Enter':
          e.preventDefault();
          // Enter is used to start editing the selected cell
          const activeCellData = data.cells[active];
          onStartEditing(active, activeCellData ? activeCellData.rawValue : '');
          break;
        case 'Backspace':
        case 'Delete':
          // Wipe selected cell quickly
          onStartEditing(active, '');
          // Instantly commit empty content
          setTimeout(() => {
            onCommitEditing();
          }, 0);
          break;
        default:
          // If user starts typing standard printable keys, begin editing!
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            onStartEditing(active, e.key);
          }
          break;
      }

      if (navigated) {
        e.preventDefault();
        const nextCoord = `${indexToColLetter(nextColIdx)}${nextRowNum}`;

        // Ensure next selected row is within rendered limits
        const idxInVisible = visibleRows.indexOf(nextRowNum);
        if (idxInVisible !== -1 && idxInVisible >= renderedRowCount) {
          setRenderedRowCount(Math.min(idxInVisible + 50, visibleRows.length));
        }

        onSelectCell(nextCoord);
        
        // Scroll into view if needed
        setTimeout(() => {
          const element = document.getElementById(`cell-${nextCoord}`);
          if (element) {
            element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          }
        }, 30);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection.activeCell, editingCell, rowOrder, data.rowCount, data.colCount, data.cells, visibleRows, renderedRowCount]);

  // Mouse resizing logic for columns
  const handleColResizeStart = (e: React.MouseEvent, col: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol(col);
    startOffset.current = e.clientX;
    startWidthOrHeight.current = data.colWidths[col] || 100;
  };

  // Mouse resizing logic for rows
  const handleRowResizeStart = (e: React.MouseEvent, row: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingRow(row);
    startOffset.current = e.clientY;
    startWidthOrHeight.current = data.rowHeights[row] || 28;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingCol) {
        const delta = e.clientX - startOffset.current;
        const newWidth = Math.max(50, startWidthOrHeight.current + delta);
        onResizeColumn(resizingCol, newWidth);
      } else if (resizingRow) {
        const delta = e.clientY - startOffset.current;
        const newHeight = Math.max(20, startWidthOrHeight.current + delta);
        onResizeRow(resizingRow, newHeight);
      }
    };

    const handleMouseUp = () => {
      setResizingCol(null);
      setResizingRow(null);
    };

    if (resizingCol || resizingRow) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol, resizingRow, onResizeColumn, onResizeRow]);

  // Headers rendering helpers
  const columns = Array.from({ length: data.colCount }, (_, i) => indexToColLetter(i));

  // Determine row and column elements of key active cell to display glowing highlights
  const activeCellDetails = selection.activeCell ? parseCoordinate(selection.activeCell) : null;

  // Close sorting/filtering popup on window click-outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (openMenuCol) {
        const target = e.target as HTMLElement;
        if (!target.closest('.sort-filter-dropdown') && !target.closest('.sort-filter-trigger')) {
          setOpenMenuCol(null);
        }
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [openMenuCol]);

  // Retrieve unique cell values present in a specific column for our item checkboxes
  const getUniqueValues = (colLetter: string) => {
    const values = new Set<string>();
    for (let r = 1; r <= data.rowCount; r++) {
      const cellVal = data.cells[`${colLetter}${r}`]?.computedValue || '';
      const displayVal = cellVal === '' ? '(Blanks)' : cellVal;
      values.add(displayVal);
    }
    return Array.from(values).sort((a, b) => {
      if (a === '(Blanks)') return 1;
      if (b === '(Blanks)') return -1;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  };



  return (
    <div 
      className={`flex-1 overflow-auto relative ${
        isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'
      }`}
      style={{ height: '100%', width: '100%' }}
      ref={containerRef}
      onScroll={(e) => {
        const target = e.currentTarget;
        const threshold = 200;
        const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
        if (isNearBottom && renderedRowCount < visibleRows.length) {
          setRenderedRowCount((prev) => Math.min(prev + 100, visibleRows.length));
        }
      }}
    >
      <table className="border-collapse table-fixed w-max text-left font-sans text-xs">
        {/* Table Column Letters Headers */}
        <thead>
          <tr className="h-7">
            {/* Top-left Corner cell */}
            <th className={`sticky top-0 left-0 z-30 border-r border-b text-center font-mono font-bold text-[10px] w-12 text-slate-400 select-none ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-100 border-gray-200'
            }`}>
              {visibleRows.length}/{data.rowCount}
            </th>

            {columns.map((col) => {
              const width = data.colWidths[col] || 100;
              const isActiveCol = activeCellDetails?.col === col;
              const hasActiveFilterOnCol = (filterQuery && filterQuery.col === col) || (uncheckedValues[col] && uncheckedValues[col].size > 0);

              return (
                <th
                  key={col}
                  className={`sticky top-0 z-20 border-r border-b text-center tracking-wider font-mono font-bold text-[11px] relative select-none group transition-all ${
                    isActiveCol
                      ? isDarkMode
                        ? 'bg-orange-950/40 text-orange-400 border-b-orange-500'
                        : 'bg-orange-100/60 text-orange-600 border-b-orange-500 font-extrabold'
                      : isDarkMode
                        ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border-zinc-800'
                        : 'bg-gray-100 text-slate-500 hover:bg-gray-200/80 border-gray-200'
                  }`}
                  style={{ width }}
                >
                  <div className="flex items-center justify-center relative w-full h-[28px] px-4">
                    <span className="cursor-pointer select-none" onClick={() => onSelectCell(`${col}1`)}>
                      {col}
                    </span>
                    
                    {/* Active filter dot indicator */}
                    {hasActiveFilterOnCol && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    )}

                    {/* Trigger Sort & Filter dropdown button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuCol(openMenuCol === col ? null : col);
                      }}
                      className={`sort-filter-trigger absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded cursor-pointer transition-all ${
                        openMenuCol === col
                          ? 'bg-orange-500 text-white opacity-100'
                          : 'opacity-0 group-hover:opacity-100 hover:bg-orange-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-orange-500'
                      }`}
                      title={`Sort & Filter column ${col}`}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Dropdown Menu Overlay inside relative column header */}
                  {openMenuCol === col && (
                    <div
                      className="sort-filter-dropdown absolute z-50 top-full left-0 mt-1 w-64 rounded-xl shadow-2xl border text-left flex flex-col overflow-hidden animate-fade-in font-sans"
                      style={{
                        backgroundColor: isDarkMode ? '#1c1c1f' : '#ffffff',
                        borderColor: isDarkMode ? '#2d2d30' : '#e4e4e7',
                        color: isDarkMode ? '#f4f4f5' : '#27272a'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Sorting box options side by side */}
                      <div className="p-3 border-b flex gap-2" style={{ borderColor: isDarkMode ? '#2d2d30' : '#f4f4f5' }}>
                        <button
                          onClick={() => {
                            onSort(col, 'asc');
                            setOpenMenuCol(null);
                          }}
                          className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-lg border text-center cursor-pointer transition-all ${
                            isDarkMode
                              ? 'bg-zinc-800/60 border-zinc-700/50 hover:bg-orange-950/25 hover:border-orange-500/30 text-zinc-200'
                              : 'bg-white border-zinc-200 hover:bg-orange-50 hover:border-orange-300 text-zinc-700'
                          }`}
                        >
                          <ArrowUpAZ className="w-5 h-5 text-orange-550 mr-0.5 mb-1 text-orange-500" />
                          <span className="text-[10px] font-bold">Sort Ascending</span>
                          <span className="text-[8px] opacity-60">A to Z</span>
                        </button>

                        <button
                          onClick={() => {
                            onSort(col, 'desc');
                            setOpenMenuCol(null);
                          }}
                          className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-lg border text-center cursor-pointer transition-all ${
                            isDarkMode
                              ? 'bg-zinc-800/60 border-zinc-700/50 hover:bg-orange-950/25 hover:border-orange-500/30 text-zinc-200'
                              : 'bg-white border-zinc-200 hover:bg-orange-50 hover:border-orange-300 text-zinc-700'
                          }`}
                        >
                          <ArrowDownZA className="w-5 h-5 text-orange-550 mr-0.5 mb-1 text-orange-500" />
                          <span className="text-[10px] font-bold">Sort Descending</span>
                          <span className="text-[8px] opacity-60">Z to A</span>
                        </button>
                      </div>

                      {/* Header and reset column filter */}
                      <div className="px-3 py-1.5 text-xs font-semibold border-b flex items-center justify-between" style={{ borderColor: isDarkMode ? '#2d2d30' : '#f4f4f5' }}>
                        <span className="opacity-75 font-sans">Sheet View Filter</span>
                        <button
                          onClick={() => {
                            onApplyFilter(col, '');
                            const nextUnchecked = { ...uncheckedValues };
                            delete nextUnchecked[col];
                            setUncheckedValues(nextUnchecked);
                            setMenuSearchQuery('');
                            setOpenMenuCol(null);
                          }}
                          className="text-[10px] font-bold text-orange-500 hover:text-orange-600 hover:underline cursor-pointer"
                        >
                          Reset Column
                        </button>
                      </div>

                      {/* Filter Search Input Area */}
                      <div className="p-3 pb-1 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 font-sans">Filter By</span>
                          <button
                            onClick={() => {
                              const uniques = getUniqueValues(col);
                              const nextUnchecked = { ...uncheckedValues };
                              nextUnchecked[col] = new Set(uniques);
                              setUncheckedValues(nextUnchecked);
                            }}
                            className="text-[9px] font-bold text-orange-500 hover:text-orange-600 cursor-pointer"
                          >
                            Clear All
                          </button>
                        </div>

                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                          <input
                            type="text"
                            placeholder="Search values..."
                            value={menuSearchQuery}
                            onChange={(e) => {
                              setMenuSearchQuery(e.target.value);
                              onApplyFilter(col, e.target.value);
                            }}
                            className={`w-full pl-8 pr-3 py-1.5 rounded-lg border outline-none text-xs font-medium transition-all ${
                              isDarkMode
                                ? 'bg-zinc-800 border-zinc-700 text-white focus:border-orange-500/50'
                                : 'bg-white border-zinc-150 text-gray-850 focus:border-orange-500'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Display checklist items list */}
                      <div className="px-3 pb-3 flex-1 flex flex-col gap-1.5">
                        <div className={`max-h-36 overflow-y-auto rounded-lg border p-1 text-[11px] font-medium space-y-0.5 ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800/80' : 'bg-gray-50 border-gray-150'
                        }`}>
                          {/* Select All selector */}
                          <button
                            onClick={() => {
                              const uniques = getUniqueValues(col);
                              const isAllUnchecked = uniques.every(val => uncheckedValues[col]?.has(val));
                              const nextUnchecked = { ...uncheckedValues };
                              
                              if (isAllUnchecked) {
                                delete nextUnchecked[col];
                              } else {
                                nextUnchecked[col] = new Set(uniques);
                              }
                              setUncheckedValues(nextUnchecked);
                            }}
                            className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-orange-50 dark:hover:bg-orange-950/20 text-left transition-colors cursor-pointer"
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                              (!uncheckedValues[col] || uncheckedValues[col].size === 0)
                                ? 'bg-orange-500 border-transparent text-white'
                                : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                            }`}>
                              {(!uncheckedValues[col] || uncheckedValues[col].size === 0) && (
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              )}
                            </div>
                            <span className="font-bold text-orange-600 dark:text-orange-400">Select All</span>
                          </button>

                          {/* Unique values item checkboxes */}
                          {getUniqueValues(col)
                            .filter(val => val.toLowerCase().includes(menuSearchQuery.toLowerCase()))
                            .map((val) => {
                              const isUnchecked = uncheckedValues[col]?.has(val);
                              const isChecked = !isUnchecked;
                              return (
                                <button
                                  key={val}
                                  onClick={() => {
                                    const nextUnchecked = { ...uncheckedValues };
                                    if (!nextUnchecked[col]) {
                                      nextUnchecked[col] = new Set();
                                    }
                                    
                                    if (isUnchecked) {
                                      nextUnchecked[col].delete(val);
                                    } else {
                                      nextUnchecked[col].add(val);
                                    }
                                    setUncheckedValues(nextUnchecked);
                                  }}
                                  className={`w-full flex items-center gap-2 p-1.5 rounded hover:bg-orange-50 dark:hover:bg-orange-950/25 text-left transition-colors cursor-pointer ${
                                    isChecked ? 'text-zinc-900 dark:text-zinc-100' : 'opacity-50 text-zinc-500'
                                  }`}
                                >
                                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                    isChecked
                                      ? 'bg-orange-500 border-transparent text-white'
                                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-805'
                                  }`}>
                                    {isChecked && (
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    )}
                                  </div>
                                  <span className="truncate">{val}</span>
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      {/* Footer actions OK */}
                      <div className="px-3 py-1.5 border-t flex justify-end gap-1.5 bg-gray-50/50 dark:bg-zinc-900/60" style={{ borderColor: isDarkMode ? '#2d2d30' : '#f4f4f5' }}>
                        <button
                          onClick={() => {
                            setOpenMenuCol(null);
                          }}
                          className="px-4 py-1 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] uppercase tracking-wider cursor-pointer shadow-sm transition-colors"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Resizing handle */}
                  <div
                    onMouseDown={(e) => handleColResizeStart(e, col)}
                    className="absolute right-0 top-0 bottom-0 w-[4px] cursor-col-resize hover:bg-orange-550 active:bg-orange-500 group-hover:bg-gray-300 dark:group-hover:bg-zinc-700 transition"
                  />
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Table Body rows */}
        <tbody>
          {visibleRows.slice(0, renderedRowCount).map((rowNum) => {
            const rowHeight = data.rowHeights[rowNum] || 28;
            const isActiveRow = activeCellDetails?.row === rowNum;

            return (
              <tr key={rowNum} style={{ height: rowHeight }}>
                {/* Row Number header */}
                <td
                  className={`sticky left-0 z-10 border-r border-b font-mono font-bold text-[10px] text-center relative group select-none ${
                    isActiveRow
                      ? isDarkMode
                        ? 'bg-orange-950/40 text-orange-400 border-r-orange-500'
                        : 'bg-orange-100/60 text-orange-600 border-r-orange-500 font-extrabold'
                      : isDarkMode
                        ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border-zinc-800'
                        : 'bg-gray-100 text-slate-500 hover:bg-gray-200/80 border-gray-200'
                  }`}
                >
                  <span className="cursor-pointer" onClick={() => onSelectCell(`A${rowNum}`)}>
                    {rowNum}
                  </span>
                  {/* Resizing handle */}
                  <div
                    onMouseDown={(e) => handleRowResizeStart(e, rowNum)}
                    className="absolute left-0 right-0 bottom-0 h-[4px] cursor-row-resize hover:bg-orange-550 active:bg-orange-500 group-hover:bg-gray-300 dark:group-hover:bg-zinc-700 transition"
                  />
                </td>

                {/* Cells array */}
                {columns.map((col) => {
                  const coord = `${col}${rowNum}`;
                  const cell = data.cells[coord];
                  const isInRange = isCellInRange(coord, selection.startCell, selection.endCell);
                  const isSelected = selection.activeCell === coord;
                  const isEditing = editingCell === coord;

                  // Parse cell styling values
                  const style = cell?.style || {};
                  const computedDisplay = cell?.computedValue !== undefined ? cell.computedValue : '';

                  // Assemble cell inline style
                  const cellInlineStyle: React.CSSProperties = {
                    fontStyle: style.italic ? 'italic' : 'normal',
                    fontWeight: style.bold ? 'bold' : 'normal',
                    textDecoration: style.underline ? 'underline' : 'none',
                    textAlign: style.align || 'left',
                    fontSize: style.fontSize ? `${style.fontSize}px` : '12px',
                    color: style.color || undefined,
                    backgroundColor: style.bgColor || undefined,
                  };

                  let selectionClass = '';
                  if (isSelected) {
                    selectionClass = isDarkMode
                      ? 'bg-zinc-800/90 ring-2 ring-orange-500 border-transparent z-10 text-zinc-100 select-none'
                      : 'bg-orange-100/60 ring-2 ring-orange-400/95 border-transparent z-10 text-gray-900 select-none';
                  } else if (isInRange) {
                    selectionClass = isDarkMode
                      ? 'bg-orange-500/15 border-orange-500/35 text-zinc-150 font-medium select-none'
                      : 'bg-orange-100/40 border-orange-200 text-gray-900 font-medium select-none';
                  } else {
                    selectionClass = isDarkMode
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-350 hover:bg-zinc-800 select-none'
                      : 'bg-white border-gray-200 text-gray-800 hover:bg-orange-50/10 select-none';
                  }

                  return (
                    <td
                      id={`cell-${coord}`}
                      key={coord}
                      className={`border-r border-b relative outline-none cursor-cell font-sans truncate px-2 transition-colors duration-100 ${selectionClass}`}
                      style={cellInlineStyle}
                      onClick={(e) => onSelectCell(coord, e.shiftKey)}
                      onDoubleClick={() => onStartEditing(coord, cell ? cell.rawValue : '')}
                    >
                      {isEditing ? (
                        <input
                          id={`input-editing-${coord}`}
                          type="text"
                          ref={(input) => {
                            if (input) {
                              const activeEl = document.activeElement;
                              const isFormulaBarActive = activeEl && activeEl.id === 'formula-bar-input';
                              if (!isFormulaBarActive && activeEl !== input) {
                                input.focus();
                                const len = input.value.length;
                                input.setSelectionRange(len, len);
                              }
                            }
                          }}
                          value={editValue}
                          onChange={(e) => onUpdateEditValue(e.target.value)}
                          onBlur={onCommitEditing}
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onMouseUp={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onCommitEditing();
                            } else if (e.key === 'Escape') {
                              onCancelEditing();
                            } else if (e.key === 'Tab') {
                              e.preventDefault();
                              onCommitEditing();
                              // Shift active cell selection right/left on tab
                              const currentColIdx = colLetterToIndex(col);
                              const targetColIdx = e.shiftKey 
                                ? Math.max(0, currentColIdx - 1) 
                                : Math.min(data.colCount - 1, currentColIdx + 1);
                              
                              const nextCoord = `${indexToColLetter(targetColIdx)}${rowNum}`;
                              setTimeout(() => onSelectCell(nextCoord), 50);
                            } else {
                              // Prevent global arrow navigation from moving our selection while writing inside active cell input
                              e.stopPropagation();
                            }
                          }}
                          className="w-full h-full border-none outline-none p-0 m-0 text-xs font-mono !select-text pointer-events-auto text-black dark:text-white bg-transparent"
                        />
                      ) : (
                        <span className="whitespace-pre select-none">{computedDisplay}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
