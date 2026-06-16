/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CellData } from '../types';

// Convert spreadsheet column letter to 0-based index (e.g. "A" -> 0, "Z" -> 25, "AA" -> 26)
export function colLetterToIndex(letter: string): number {
  let index = 0;
  const upper = letter.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
}

// Convert 0-based column index to letter (e.g. 0 -> "A", 25 -> "Z", 26 -> "AA")
export function indexToColLetter(index: number): string {
  let temp = index;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

// Parse coordinates into col and row, e.g. "B12" -> { col: "B", row: 12 }
export function parseCoordinate(coord: string): { col: string; row: number } | null {
  const match = coord.toUpperCase().match(/^([A-Z]+)([0-9]+)$/);
  if (!match) return null;
  return {
    col: match[1],
    row: parseInt(match[2], 10),
  };
}

// Expand a range like "A1:B3" into a list of cell coordinates
export function expandRange(rangeStr: string): string[] {
  const parts = rangeStr.split(':');
  if (parts.length === 1) {
    return [parts[0].trim().toUpperCase()];
  }
  if (parts.length !== 2) return [];

  const start = parseCoordinate(parts[0].trim());
  const end = parseCoordinate(parts[1].trim());

  if (!start || !end) return [];

  const startColIdx = colLetterToIndex(start.col);
  const endColIdx = colLetterToIndex(end.col);
  const startRow = Math.min(start.row, end.row);
  const endRow = Math.max(start.row, end.row);
  const minColIdx = Math.min(startColIdx, endColIdx);
  const maxColIdx = Math.max(startColIdx, endColIdx);

  const coords: string[] = [];
  for (let r = startRow; r <= endRow; r++) {
    for (let c = minColIdx; c <= maxColIdx; c++) {
      coords.push(`${indexToColLetter(c)}${r}`);
    }
  }
  return coords;
}

// Helper to check if a value looks numeric
export function isNumeric(val: any): boolean {
  if (typeof val === 'number') return !isNaN(val);
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (trimmed === '') return false;
  return !isNaN(Number(trimmed));
}

// Helper to safely evaluate a basic math expression using cell values
// e.g. "10 + 5 * 2"
function evaluateArithmetic(expr: string): string {
  try {
    // Basic sanitization: only allow numbers, operators, decimals, spaces, and parentheses
    const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, '');
    // Evaluate safely using Function constructor rather than eval
    const fn = new Function(`return (${sanitized})`);
    const val = fn();
    if (typeof val === 'number' && !isNaN(val)) {
      // Limit decimals to 4 digits for neatness
      return Number(val.toFixed(4)).toString();
    }
    return String(val);
  } catch {
    return '#VALUE!';
  }
}

/**
 * Evaluates a cell's formula or pure content recursively.
 */
export function evaluateCell(
  cellKey: string,
  cells: Record<string, CellData>,
  visited: Set<string> = new Set()
): string {
  const cell = cells[cellKey];
  if (!cell || !cell.rawValue) return '';

  const raw = cell.rawValue.trim();
  if (!raw.startsWith('=')) {
    return raw; // Static content
  }

  // Check for circular dependency
  if (visited.has(cellKey)) {
    return '#REF!';
  }

  visited.add(cellKey);

  try {
    const formulaText = raw.substring(1).trim(); // Remove leading '='
    
    // Check for SUM, AVERAGE, COUNT, MIN, MAX
    const functionMatch = formulaText.match(/^(SUM|AVERAGE|COUNT|MIN|MAX)\(([^)]+)\)$/i);
    
    if (functionMatch) {
      const funcName = functionMatch[1].toUpperCase();
      const rangeStr = functionMatch[2].trim();
      const targetCoords = expandRange(rangeStr);

      if (targetCoords.length === 0) {
        visited.delete(cellKey);
        return '#VALUE!';
      }

      // Evaluate each coordinate in the range
      const values = targetCoords.map((coord) => {
        const valStr = evaluateCell(coord, cells, new Set(visited));
        return isNumeric(valStr) ? parseFloat(valStr) : valStr;
      });

      const numericValues = values.filter((v): v is number => typeof v === 'number');

      let result: number | string = 0;
      switch (funcName) {
        case 'SUM':
          result = numericValues.reduce((acc, curr) => acc + curr, 0);
          break;

        case 'AVERAGE':
          if (numericValues.length === 0) {
            result = 0;
          } else {
            const sum = numericValues.reduce((acc, curr) => acc + curr, 0);
            result = sum / numericValues.length;
          }
          break;

        case 'COUNT':
          // Count any cell that is not empty
          result = values.filter((v) => v !== '').length;
          break;

        case 'MIN':
          if (numericValues.length === 0) {
            result = 0;
          } else {
            result = Math.min(...numericValues);
          }
          break;

        case 'MAX':
          if (numericValues.length === 0) {
            result = 0;
          } else {
            result = Math.max(...numericValues);
          }
          break;

        default:
          result = '#NAME?';
      }

      visited.delete(cellKey);
      return typeof result === 'number' ? Number(result.toFixed(4)).toString() : result;
    }

    // Process basic arithmetic operations with single references (e.g., "=A1+B5", "=C2*10")
    // Replace all cell references with their recursively evaluated values
    let arithmeticExpr = formulaText;
    const cellRefRegex = /[A-Z]+[0-9]+/gi;
    let hasRefError = false;

    arithmeticExpr = arithmeticExpr.replace(cellRefRegex, (match) => {
      const uppercaseRef = match.toUpperCase();
      const resolved = evaluateCell(uppercaseRef, cells, new Set(visited));
      if (resolved === '#REF!') {
        hasRefError = true;
      }
      return isNumeric(resolved) ? resolved : '0';
    });

    if (hasRefError) {
      visited.delete(cellKey);
      return '#REF!';
    }

    const result = evaluateArithmetic(arithmeticExpr);
    visited.delete(cellKey);
    return result;

  } catch (error) {
    visited.delete(cellKey);
    return '#ERROR!';
  }
}

/**
 * Re-evaluate all cells in the spreadsheet that have formulas
 */
export function reevaluateAllCells(cells: Record<string, CellData>): Record<string, CellData> {
  const updatedCells = { ...cells };
  
  // Create an output object
  const keys = Object.keys(cells);
  
  // We can perform quick topological evaluation or simple clean re-resolves
  keys.forEach((key) => {
    if (cells[key] && cells[key].rawValue.startsWith('=')) {
      const computed = evaluateCell(key, cells, new Set());
      updatedCells[key] = {
        ...cells[key],
        computedValue: computed,
      };
    } else if (cells[key]) {
      updatedCells[key] = {
        ...cells[key],
        computedValue: cells[key].rawValue,
      };
    }
  });

  return updatedCells;
}
