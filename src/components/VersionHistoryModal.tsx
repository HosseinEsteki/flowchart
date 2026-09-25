import React, { useState } from 'react';
import { ColorTheme } from '../constants/themes';
import { TranslationDictionary } from '../constants/translations';
import { FlowchartVersion } from '../types/flowchart';
import { X, History, RotateCcw, Clock, Plus, Check } from 'lucide-react';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ColorTheme;
  t: TranslationDictionary;
  versions: FlowchartVersion[];
  onSaveVersion: (name: string) => void;
  onRestoreVersion: (versionId: string) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  theme,
  t,
  versions,
  onSaveVersion,
  onRestoreVersion,
}) => {
  const [snapshotName, setSnapshotName] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in">
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl border p-5 space-y-4"
        style={{
          backgroundColor: theme.ui.cardBg,
          borderColor: theme.ui.border,
          color: theme.ui.textPrimary,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.ui.border }}>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-sm md:text-base">{t.versionsTitle}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-70 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Snapshot */}
        <div
          className="p-3.5 rounded-xl border space-y-2 text-right"
          style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}
        >
          <div className="text-xs font-semibold">{t.saveNewVersion}</div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t.versionNamePlaceholder}
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && snapshotName.trim()) {
                  onSaveVersion(snapshotName.trim());
                  setSnapshotName('');
                }
              }}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none"
              style={{
                backgroundColor: theme.ui.cardBg,
                borderColor: theme.ui.border,
                color: theme.ui.textPrimary,
              }}
            />
            <button
              onClick={() => {
                if (snapshotName.trim()) {
                  onSaveVersion(snapshotName.trim());
                  setSnapshotName('');
                }
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white shadow-xs hover:opacity-90"
              style={{ backgroundColor: theme.ui.accent }}
            >
              ثبت نسخه
            </button>
          </div>
        </div>

        {/* Timeline List */}
        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {versions.length === 0 ? (
            <div className="text-center opacity-50 text-xs py-8">{t.noVersionsYet}</div>
          ) : (
            versions.map((ver, idx) => (
              <div
                key={ver.id}
                className="p-3 rounded-xl border text-right transition-colors"
                style={{
                  backgroundColor: idx === 0 ? theme.ui.surface : theme.ui.cardBg,
                  borderColor: idx === 0 ? theme.ui.accent : theme.ui.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm font-bold">{ver.name}</span>
                    {idx === 0 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-medium">
                        نسخه فعال
                      </span>
                    )}
                  </div>
                  {idx !== 0 && (
                    <button
                      onClick={() => {
                        onRestoreVersion(ver.id);
                        onClose();
                      }}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                      style={{ borderColor: theme.ui.border }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t.restoreVersion}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] opacity-60 mt-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(ver.timestamp).toLocaleString('fa-IR')}</span>
                  <span>·</span>
                  <span>ثبت شده توسط: {ver.author}</span>
                  <span>·</span>
                  <span>{ver.nodeCount} گره</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
