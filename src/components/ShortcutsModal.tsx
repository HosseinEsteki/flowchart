import React from 'react';
import { ColorTheme } from '../constants/themes';
import { TranslationDictionary } from '../constants/translations';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ColorTheme;
  t: TranslationDictionary;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  theme,
  t,
}) => {
  if (!isOpen) return null;

  const shortcutsList = [
    { key: 'Ctrl + Z', desc: t.shortcutUndo },
    { key: 'Ctrl + Y / Ctrl+Shift+Z', desc: t.shortcutRedo },
    { key: 'Delete / Backspace', desc: t.shortcutDelete },
    { key: 'Ctrl + D', desc: t.shortcutDuplicate },
    { key: 'Ctrl + A', desc: t.shortcutSelectAll },
    { key: 'Arrow Keys (↑, ↓, ←, →)', desc: t.shortcutNudge },
    { key: 'Shift + Arrow Keys', desc: 'جابجایی سریع ۱۰ پیکسلی گره' },
    { key: 'Double Click on Node', desc: 'ویرایش مستقیم متن برچسب' },
    { key: 'Mouse Wheel / Space+Drag', desc: t.shortcutPan },
    { key: 'Ctrl + Wheel / +/-', desc: t.shortcutZoom },
    { key: 'Escape', desc: t.shortcutDeselect },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in">
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl border p-5 space-y-4"
        style={{
          backgroundColor: theme.ui.cardBg,
          borderColor: theme.ui.border,
          color: theme.ui.textPrimary,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.ui.border }}>
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-sm md:text-base">{t.shortcutsTitle}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-70 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {shortcutsList.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl border text-xs text-right"
              style={{
                backgroundColor: theme.ui.surface,
                borderColor: theme.ui.border,
              }}
            >
              <span className="font-medium">{item.desc}</span>
              <kbd
                className="font-mono text-[11px] px-2 py-1 rounded-md border font-semibold tracking-wide shrink-0"
                style={{
                  backgroundColor: theme.ui.cardBg,
                  borderColor: theme.ui.border,
                }}
              >
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center text-[11px] opacity-60">
          برای بستن این پنجره کلید <kbd className="font-mono px-1 border rounded">Esc</kbd> را فشار دهید.
        </div>
      </div>
    </div>
  );
};
