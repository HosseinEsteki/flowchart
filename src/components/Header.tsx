import React, { useState } from 'react';
import {
  Workflow,
  CloudCheck,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Users,
  Palette,
  Keyboard,
  History,
  Languages,
  Check,
  Loader2,
  FolderKanban,
} from 'lucide-react';
import { THEMES } from '../constants/themes';
import { TranslationDictionary } from '../constants/translations';
import { Collaborator } from '../types/flowchart';

interface HeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  lang: 'fa' | 'en';
  t: TranslationDictionary;
  onToggleLang: () => void;
  activeThemeId: string;
  onThemeSelect: (themeId: string) => void;
  collaborators: Collaborator[];
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onOpenExport: () => void;
  onOpenCollaboration: () => void;
  onOpenShortcuts: () => void;
  onOpenVersions: () => void;
  onOpenProjects: () => void;
  projectCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onTitleChange,
  lang,
  t,
  onToggleLang,
  activeThemeId,
  onThemeSelect,
  collaborators,
  isSaving,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onOpenExport,
  onOpenCollaboration,
  onOpenShortcuts,
  onOpenVersions,
  onOpenProjects,
  projectCount,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const currentTheme = THEMES[activeThemeId] || THEMES.slate;

  return (
    <header
      className="h-14 border-b px-4 flex items-center justify-between gap-3 shrink-0 select-none z-30 transition-colors"
      style={{
        backgroundColor: currentTheme.ui.cardBg,
        borderColor: currentTheme.ui.border,
        color: currentTheme.ui.textPrimary,
      }}
    >
      {/* Zone 1: Wordmark & Brand Title */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center font-bold shadow-xs transition-transform hover:scale-105"
          style={{
            backgroundColor: currentTheme.ui.accent,
            color: currentTheme.ui.accentText,
          }}
        >
          <Workflow className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-sm md:text-base leading-tight">
            {t.appName}
          </span>
          <span className="text-[11px] leading-tight opacity-60 hidden sm:inline">
            {t.tagline}
          </span>
        </div>

        {/* My Projects Button */}
        <button
          onClick={onOpenProjects}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold hover:opacity-90 transition-all shadow-xs ms-1"
          style={{
            borderColor: currentTheme.ui.border,
            backgroundColor: currentTheme.ui.surface,
          }}
          title={t.myProjects}
        >
          <FolderKanban className="w-4 h-4 text-blue-500" />
          <span className="hidden sm:inline font-bold">{t.myProjects}</span>
          {projectCount !== undefined && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 font-mono font-bold">
              {projectCount}
            </span>
          )}
        </button>
      </div>

      {/* Zone 2: Project Title & Canvas Controls */}
      <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
        {/* Project Title Editor */}
        <div className="flex items-center gap-2 max-w-[200px] md:max-w-xs truncate">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              autoFocus
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              onChange={(e) => onTitleChange(e.target.value)}
              className="text-xs md:text-sm font-medium px-2 py-1 rounded-md border outline-none max-w-full"
              style={{
                backgroundColor: currentTheme.ui.surface,
                borderColor: currentTheme.ui.accent,
                color: currentTheme.ui.textPrimary,
              }}
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-xs md:text-sm font-semibold truncate hover:opacity-80 px-2 py-1 rounded transition-colors text-right"
              title="برای تغییر نام کلیک کنید"
            >
              {title || t.untitledProject}
            </button>
          )}

          {/* Cloud sync status */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] opacity-70 whitespace-nowrap">
            {isSaving ? (
              <span className="flex items-center gap-1 text-amber-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {t.saving}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CloudCheck className="w-3.5 h-3.5" />
                {t.cloudSaved}
              </span>
            )}
          </div>
        </div>

        {/* Undo / Redo */}
        <div className="hidden sm:flex items-center border rounded-md p-0.5" style={{ borderColor: currentTheme.ui.border }}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title={t.undo}
            className={`p-1.5 rounded hover:opacity-80 transition-opacity ${!canUndo ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title={t.redo}
            className={`p-1.5 rounded hover:opacity-80 transition-opacity ${!canRedo ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="hidden md:flex items-center border rounded-md p-0.5 text-xs font-mono tabular-nums" style={{ borderColor: currentTheme.ui.border }}>
          <button
            onClick={onZoomOut}
            title={t.zoomOut}
            className="p-1.5 rounded hover:opacity-80 transition-opacity"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={onResetZoom}
            title={t.resetZoom}
            className="px-2 py-1 rounded hover:opacity-80 font-medium"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            title={t.zoomIn}
            className="p-1.5 rounded hover:opacity-80 transition-opacity"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Zone 3: Actions & Modals */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Collaborators online count button */}
        <button
          onClick={onOpenCollaboration}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:opacity-90"
          style={{
            borderColor: currentTheme.ui.border,
            backgroundColor: currentTheme.ui.surface,
          }}
          title={t.connectedTeammates}
        >
          <div className="relative">
            <Users className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="font-mono tabular-nums font-semibold">
            {collaborators.length || 1}
          </span>
          <span className="hidden xl:inline">{t.collaborate}</span>
        </button>

        {/* Version History Button */}
        <button
          onClick={onOpenVersions}
          className="p-2 rounded-lg border text-xs font-medium transition-colors hover:opacity-80"
          style={{
            borderColor: currentTheme.ui.border,
            backgroundColor: currentTheme.ui.surface,
          }}
          title={t.versionHistory}
        >
          <History className="w-4 h-4" />
        </button>

        {/* Color Theme Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-lg border text-xs font-medium transition-colors hover:opacity-80"
            style={{
              borderColor: currentTheme.ui.border,
              backgroundColor: currentTheme.ui.surface,
            }}
            title={t.theme}
          >
            <Palette className="w-4 h-4" />
          </button>

          {showThemeMenu && (
            <div
              className="absolute left-0 sm:right-0 mt-2 w-52 rounded-xl shadow-xl border p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              style={{
                backgroundColor: currentTheme.ui.cardBg,
                borderColor: currentTheme.ui.border,
                color: currentTheme.ui.textPrimary,
              }}
            >
              <div className="text-[11px] font-semibold px-2 py-1 text-slate-400">
                {t.theme}
              </div>
              {Object.values(THEMES).map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    onThemeSelect(theme.id);
                    setShowThemeMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-colors my-0.5 text-right"
                  style={{
                    backgroundColor: activeThemeId === theme.id ? theme.ui.surface : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border"
                      style={{ backgroundColor: theme.ui.accent, borderColor: theme.ui.border }}
                    />
                    <span>{lang === 'fa' ? theme.nameFa : theme.nameEn}</span>
                  </div>
                  {activeThemeId === theme.id && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Language switch */}
        <button
          onClick={onToggleLang}
          className="p-2 rounded-lg border text-xs font-medium transition-colors hover:opacity-80"
          style={{
            borderColor: currentTheme.ui.border,
            backgroundColor: currentTheme.ui.surface,
          }}
          title={t.language}
        >
          <span className="font-semibold text-xs">{lang === 'fa' ? 'EN' : 'فا'}</span>
        </button>

        {/* Keyboard shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className="hidden sm:flex p-2 rounded-lg border text-xs font-medium transition-colors hover:opacity-80"
          style={{
            borderColor: currentTheme.ui.border,
            backgroundColor: currentTheme.ui.surface,
          }}
          title={t.shortcuts}
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Primary Action: Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs shadow-xs hover:opacity-95 transition-all whitespace-nowrap"
          style={{
            backgroundColor: currentTheme.ui.accent,
            color: currentTheme.ui.accentText,
          }}
        >
          <Download className="w-4 h-4" />
          <span>{t.export}</span>
        </button>
      </div>
    </header>
  );
};
