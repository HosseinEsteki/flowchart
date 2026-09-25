import React, { useState } from 'react';
import { ColorTheme } from '../constants/themes';
import { TranslationDictionary } from '../constants/translations';
import { Collaborator } from '../types/flowchart';
import { X, Users, Copy, Check, UserCheck, Shield } from 'lucide-react';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ColorTheme;
  t: TranslationDictionary;
  collaborators: Collaborator[];
  currentUserId: string;
  currentUserName: string;
  currentUserColor: string;
  onUpdateUserProfile: (name: string, color: string) => void;
  roomCode: string;
}

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  onClose,
  theme,
  t,
  collaborators,
  currentUserId,
  currentUserName,
  currentUserColor,
  onUpdateUserProfile,
  roomCode,
}) => {
  const [nameInput, setNameInput] = useState(currentUserName);
  const [selectedColor, setSelectedColor] = useState(currentUserColor);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const colorOptions = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#EF4444', // Red
    '#14B8A6', // Teal
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onUpdateUserProfile(nameInput.trim(), selectedColor);
    }
  };

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
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-sm md:text-base">{t.collaborationTitle}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-70 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Code & Invite Link */}
        <div
          className="p-3 rounded-xl border space-y-2 text-right"
          style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>{t.roomCode}</span>
            <span className="font-mono text-blue-500 font-bold">{roomCode}</span>
          </div>
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-white shadow-xs transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.ui.accent }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t.linkCopied : t.copyLink}</span>
          </button>
        </div>

        {/* User Identity Setup */}
        <form onSubmit={handleSaveProfile} className="space-y-3 text-right">
          <label className="text-xs font-semibold block">{t.yourName}</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none"
              style={{
                backgroundColor: theme.ui.surface,
                borderColor: theme.ui.border,
                color: theme.ui.textPrimary,
              }}
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:opacity-80 transition-opacity"
              style={{ borderColor: theme.ui.border }}
            >
              ذخیره نام
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5">رنگ مکان‌نما و نشان شما</label>
            <div className="flex gap-2">
              {colorOptions.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => {
                    setSelectedColor(c);
                    onUpdateUserProfile(nameInput, c);
                  }}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                    selectedColor === c ? 'scale-110 ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c, borderColor: '#FFFFFF' }}
                >
                  {selectedColor === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Online Collaborators */}
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: theme.ui.border }}>
          <div className="text-xs font-bold opacity-70 text-right">{t.activeCollaborators}</div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
            {collaborators.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl border text-xs text-right"
                style={{
                  backgroundColor: theme.ui.surface,
                  borderColor: theme.ui.border,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }} />
                  <span className="font-semibold">
                    {user.name} {user.id === currentUserId ? `(${t.you})` : ''}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">زنده / Live</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
