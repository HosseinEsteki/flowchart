import React, { useState, useRef, useEffect } from 'react';
import { Plus, MoreVertical, Copy, Trash2, Edit3, Layers, Check } from 'lucide-react';
import { FlowchartPage } from '../types/flowchart';
import { ColorTheme } from '../constants/themes';
import { TranslationDictionary } from '../constants/translations';

interface PagesBarProps {
  pages: FlowchartPage[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onRenamePage: (pageId: string, newName: string) => void;
  onDuplicatePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  theme: ColorTheme;
  t: TranslationDictionary;
}

export const PagesBar: React.FC<PagesBarProps> = ({
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onRenamePage,
  onDuplicatePage,
  onDeletePage,
  theme,
  t,
}) => {
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [menuPageId, setMenuPageId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editingPageId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingPageId]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPageId(null);
      }
    };
    if (menuPageId) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [menuPageId]);

  const handleStartRename = (page: FlowchartPage) => {
    setEditingPageId(page.id);
    setEditingName(page.name);
    setMenuPageId(null);
  };

  const handleSaveRename = (pageId: string) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      onRenamePage(pageId, trimmed);
    }
    setEditingPageId(null);
  };

  return (
    <div
      className="h-10 border-t flex items-center justify-between px-3 select-none z-20 backdrop-blur-md transition-colors"
      style={{
        backgroundColor: theme.ui.surface,
        borderColor: theme.ui.border,
      }}
    >
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <div
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold opacity-70 whitespace-nowrap"
          style={{ color: theme.ui.textMuted }}
          title={t.pages}
        >
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden sm:inline">{t.pages}:</span>
        </div>

        {pages.map((page, index) => {
          const isActive = page.id === activePageId;
          const isEditing = editingPageId === page.id;

          return (
            <div key={page.id} className="relative flex items-center group">
              {isEditing ? (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-blue-500 bg-white dark:bg-gray-800 shadow-xs">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(page.id);
                      if (e.key === 'Escape') setEditingPageId(null);
                    }}
                    onBlur={() => handleSaveRename(page.id)}
                    className="text-xs px-1 py-0.5 w-28 bg-transparent outline-none font-medium"
                    style={{ color: theme.ui.textPrimary }}
                    maxLength={35}
                  />
                  <button
                    onClick={() => handleSaveRename(page.id)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                    title="تأیید"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => onSelectPage(page.id)}
                  onDoubleClick={() => handleStartRename(page)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-xs border-blue-600'
                      : 'hover:opacity-85 border-transparent'
                  }`}
                  style={{
                    backgroundColor: isActive ? '#2563EB' : theme.ui.cardBg,
                    color: isActive ? '#FFFFFF' : theme.ui.textPrimary,
                    borderColor: isActive ? '#2563EB' : theme.ui.border,
                  }}
                  title={`صفحه ${index + 1}: ${page.name} (${page.nodes.length} گره) - دوبار کلیک برای ویرایش نام`}
                >
                  <span className="max-w-[130px] truncate">{page.name}</span>
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                      isActive ? 'bg-blue-700 text-blue-100' : 'opacity-60 bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    {page.nodes.length}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuPageId(menuPageId === page.id ? null : page.id);
                    }}
                    className={`p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity ${
                      isActive ? 'opacity-90 hover:opacity-100' : 'opacity-40 group-hover:opacity-100'
                    }`}
                    title="گزینه‌های صفحه"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Context Dropdown Menu */}
              {menuPageId === page.id && (
                <div
                  ref={menuRef}
                  className="absolute bottom-full mb-1.5 start-0 z-50 w-40 rounded-xl shadow-xl border py-1 animate-in fade-in zoom-in-95 text-xs font-normal"
                  style={{
                    backgroundColor: theme.ui.cardBg,
                    borderColor: theme.ui.border,
                    color: theme.ui.textPrimary,
                  }}
                >
                  <button
                    onClick={() => handleStartRename(page)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-right transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                    <span>{t.renamePage}</span>
                  </button>

                  <button
                    onClick={() => {
                      onDuplicatePage(page.id);
                      setMenuPageId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-right transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t.duplicatePage}</span>
                  </button>

                  {pages.length > 1 && (
                    <div className="border-t my-1" style={{ borderColor: theme.ui.border }} />
                  )}

                  {pages.length > 1 && (
                    <button
                      onClick={() => {
                        onDeletePage(page.id);
                        setMenuPageId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 text-right transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.deletePage}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Page Button */}
        <button
          onClick={onAddPage}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 shrink-0"
          style={{
            borderColor: theme.ui.border,
          }}
          title={t.addPage}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.addPage}</span>
        </button>
      </div>

      <div className="hidden md:flex items-center gap-2 text-[11px] opacity-65 shrink-0">
        <span>{pages.length} {t.page}</span>
      </div>
    </div>
  );
};
