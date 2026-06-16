/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string; // CSS color string or pre-defined hex
  bgColor?: string; // CSS background color string or pre-defined hex
  fontSize?: number; // font size in px (e.g., 12, 14, 16)
  align?: 'left' | 'center' | 'right';
}

export interface CellData {
  rawValue: string; // The literal value typed by the user, e.g. "10", "=SUM(A1:A5)"
  computedValue: string; // The evaluated result display, e.g. "50", "Apple"
  style?: CellStyle;
}

export interface SpreadsheetData {
  cells: Record<string, CellData>; // key: e.g. "A1", "B5"
  colWidths: Record<string, number>; // key: e.g. "A", "B" - width in pixels
  rowHeights: Record<number, number>; // key: row index (1-based) - height in pixels
  rowCount: number;
  colCount: number;
}

export interface SelectionState {
  startCell: string | null; // e.g., "A1"
  endCell: string | null; // e.g., "C3" for click-drag range selection
  activeCell: string | null; // Currently active single cell for editing or formula focus
}

export interface SortConfig {
  col: string; // e.g. "A"
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  col: string; // e.g. "A"
  query: string; // text search
}
