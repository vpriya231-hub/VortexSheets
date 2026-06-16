/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TableProperties, Plus, X, Edit2, Check } from 'lucide-react';

interface Sheet {
  id: string;
  name: string;
}

interface SheetTabsProps {
  sheets: Sheet[];
  activeSheetId: string;
  onSelectSheet: (id: string) => void;
  onCreateSheet: () => void;
  onRenameSheet: (id: string, newName: string) => void;
  onDeleteSheet: (id: string) => void;
  isDarkMode: boolean;
}

export default function SheetTabs({
  sheets,
  activeSheetId,
  onSelectSheet,
  onCreateSheet,
  onRenameSheet,
  onDeleteSheet,
  isDarkMode
}: SheetTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startRename = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(currentName);
  };

  const saveRename = (id: string) => {
    if (editName.trim()) {
      onRenameSheet(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      saveRename(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <div className={`flex items-center justify-between border-t px-2.5 py-2 font-sans select-none overflow-x-auto ${
      isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-100 border-gray-200'
    }`} id="sheet-tabs-container">
      {/* Scrollable Tabs Wrapper */}
      <div className="flex items-center gap-2 flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-2">
        {/* Grid/Table properties layout icon prefix as seen in mobile Excel screenshot */}
        <div className={`p-1.5 rounded-lg border shrink-0 ${
          isDarkMode ? 'bg-zinc-800/80 border-zinc-700 text-orange-400' : 'bg-white border-gray-300 text-orange-600 shadow-sm'
        }`} id="mobile-layout-button">
          <TableProperties className="w-4 h-4 stroke-[2]" />
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {sheets.map((sheet) => {
            const isActive = sheet.id === activeSheetId;
            const isEditing = editingId === sheet.id;

            return (
              <div
                key={sheet.id}
                onClick={() => !isEditing && onSelectSheet(sheet.id)}
                className={`group relative flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border shrink-0 ${
                  isActive
                    ? isDarkMode
                      ? 'bg-zinc-950 border-orange-500 text-orange-400 shadow-inner'
                      : 'bg-white border-orange-300 text-orange-600 shadow-sm'
                    : isDarkMode
                      ? 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      : 'bg-gray-50/70 border-gray-250 text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
                style={isActive ? { borderBottomWidth: '2px', borderBottomColor: '#f97316' } : {}}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => saveRename(sheet.id)}
                      onKeyDown={(e) => handleKeyDown(e, sheet.id)}
                      autoFocus
                      className={`px-1.5 py-0.5 rounded border text-[11px] font-medium outline-none text-xs w-20 ${
                        isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-200 text-gray-800'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveRename(sheet.id);
                      }}
                      className="p-0.5 text-emerald-500 hover:text-emerald-600"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>
                ) : (
                  <span
                    onDoubleClick={(e) => startRename(sheet.id, sheet.name, e)}
                    className="truncate max-w-[100px] select-none"
                    title="Double click to rename sheet"
                  >
                    {sheet.name}
                  </span>
                )}

                {/* Rename/Delete actions on hover/focus */}
                {!isEditing && (
                  <div className="flex items-center gap-0.5 opacity-0 lg:group-hover:opacity-100 transition-opacity ml-1 -mr-1">
                    <button
                      onClick={(e) => startRename(sheet.id, sheet.name, e)}
                      title="Rename Sheet"
                      className={`p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 ${
                        isActive ? 'text-orange-500' : 'text-zinc-400'
                      }`}
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                    {sheets.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete sheet "${sheet.name}"?`)) {
                            onDeleteSheet(sheet.id);
                          }
                        }}
                        title="Delete Sheet"
                        className="p-0.5 rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Create Sheet Plus Tab - styled in highly sophisticated vibrant Orange & Amber gradient */}
        <button
          id="create-sheet-btn"
          onClick={onCreateSheet}
          title="Add a new sheet tab"
          className="p-1 px-3 py-1.5 rounded-lg border cursor-pointer shrink-0 transition-all text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm border-transparent outline-none flex items-center justify-center font-bold"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
        </button>
      </div>

      {/* Touch-scrolling Pro tip on desktops */}
      <div className={`hidden md:flex text-[10px] items-center gap-1.5 opacity-50 shrink-0 font-mono pr-2 ${
        isDarkMode ? 'text-zinc-400' : 'text-gray-500'
      }`}>
        <span>Double-click tab to rename</span>
      </div>
    </div>
  );
}
