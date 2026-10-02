import React, { useState, useEffect } from 'react';
import {
  Shapes,
  LayoutTemplate,
  History,
  Users,
  Send,
  Plus,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  Diamond,
  Square,
  Circle,
  StickyNote,
  Terminal,
  Share2,
  Copy,
  Clock,
  User,
  Printer,
  Settings,
  FolderKanban,
} from 'lucide-react';
import { FlowchartNodeType, FlowchartVersion, Collaborator, ChatMessage, FlowchartPage } from '../types/flowchart';
import { ColorTheme } from '../constants/themes';
import { TranslationDictionary } from '../constants/translations';
import { TEMPLATES } from '../constants/templates';

interface SidebarProps {
  theme: ColorTheme;
  t: TranslationDictionary;
  lang: 'fa' | 'en';
  onAddNode: (type: FlowchartNodeType) => void;
  onLoadTemplate: (templateId: string) => void;
  versions: FlowchartVersion[];
  onSaveVersion: (name: string) => void;
  onRestoreVersion: (versionId: string) => void;
  collaborators?: Collaborator[];
  currentUserId?: string;
  chatMessages?: ChatMessage[];
  onSendMessage?: (text: string) => void;
  roomCode?: string;
  activeTab?: 'shapes' | 'templates' | 'notes' | 'history' | 'settings';
  onTabChange?: (tab: 'shapes' | 'templates' | 'notes' | 'history' | 'settings') => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  activePage?: FlowchartPage;
  allPages?: FlowchartPage[];
  onSelectPage?: (pageId: string) => void;
  onUpdatePageDescription?: (pageId: string, description: string) => void;
  onOpenPrint?: () => void;
  projectTitle?: string;
  projectDescription?: string;
  onUpdateProjectDetails?: (title: string, description: string) => void;
  totalNodesCount?: number;
  totalEdgesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  theme,
  t,
  lang,
  onAddNode,
  onLoadTemplate,
  versions,
  onSaveVersion,
  onRestoreVersion,
  collaborators,
  currentUserId,
  chatMessages,
  onSendMessage,
  roomCode,
  activeTab: activeTabProp,
  onTabChange,
  isCollapsed: isCollapsedProp,
  onToggleCollapse,
  activePage,
  allPages,
  onSelectPage,
  onUpdatePageDescription,
  onOpenPrint,
  projectTitle,
  projectDescription,
  onUpdateProjectDetails,
  totalNodesCount,
  totalEdgesCount,
}) => {
  const [internalTab, setInternalTab] = useState<'shapes' | 'templates' | 'notes' | 'history' | 'settings'>('shapes');
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const [projectTitleDraft, setProjectTitleDraft] = useState(projectTitle || '');
  const [projectDescDraft, setProjectDescDraft] = useState(projectDescription || '');
  const [isSavedProjectSettings, setIsSavedProjectSettings] = useState(false);

  useEffect(() => {
    setProjectTitleDraft(projectTitle || '');
  }, [projectTitle]);

  useEffect(() => {
    setProjectDescDraft(projectDescription || '');
  }, [projectDescription]);

  const handleSaveProjectDetails = () => {
    if (onUpdateProjectDetails) {
      onUpdateProjectDetails(projectTitleDraft, projectDescDraft);
    }
    setIsSavedProjectSettings(true);
    setTimeout(() => setIsSavedProjectSettings(false), 3000);
  };

  const activeTab = activeTabProp !== undefined ? activeTabProp : internalTab;
  const isCollapsed = isCollapsedProp !== undefined ? isCollapsedProp : internalCollapsed;

  const [notesDraft, setNotesDraft] = useState(activePage?.description || '');

  useEffect(() => {
    setNotesDraft(activePage?.description || '');
  }, [activePage?.id, activePage?.description]);

  const handleNotesChange = (text: string) => {
    setNotesDraft(text);
    if (activePage && onUpdatePageDescription) {
      onUpdatePageDescription(activePage.id, text);
    }
  };

  const appendSnippet = (snippet: string) => {
    const updated = notesDraft ? `${notesDraft}\n\n${snippet}` : snippet;
    handleNotesChange(updated);
  };

  const handleSelectTab = (tab: 'shapes' | 'templates' | 'notes' | 'history' | 'settings') => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
    if (isCollapsed) {
      if (onToggleCollapse) onToggleCollapse(false);
      setInternalCollapsed(false);
    }
  };

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    if (onToggleCollapse) onToggleCollapse(next);
    setInternalCollapsed(next);
  };

  const shapeItems: Array<{
    type: FlowchartNodeType;
    label: string;
    desc: string;
    icon: React.ReactNode;
    colorKey: keyof ColorTheme['palette'];
  }> = [
    {
      type: 'terminal',
      label: t.shapeTerminal,
      desc: t.shapeTerminalDesc,
      icon: <Terminal className="w-4 h-4" />,
      colorKey: 'terminal',
    },
    {
      type: 'process',
      label: t.shapeProcess,
      desc: t.shapeProcessDesc,
      icon: <Square className="w-4 h-4" />,
      colorKey: 'process',
    },
    {
      type: 'decision',
      label: t.shapeDecision,
      desc: t.shapeDecisionDesc,
      icon: <Diamond className="w-4 h-4" />,
      colorKey: 'decision',
    },
    {
      type: 'input-output',
      label: t.shapeInputOutput,
      desc: t.shapeInputOutputDesc,
      icon: <span className="text-xs font-bold italic tracking-tighter">/ /</span>,
      colorKey: 'inputOutput',
    },
    {
      type: 'document',
      label: t.shapeDocument,
      desc: t.shapeDocumentDesc,
      icon: <FileText className="w-4 h-4" />,
      colorKey: 'document',
    },
    {
      type: 'subroutine',
      label: t.shapeSubroutine,
      desc: t.shapeSubroutineDesc,
      icon: <div className="border-x-2 border-current w-3.5 h-3.5 mx-auto" />,
      colorKey: 'subroutine',
    },
    {
      type: 'database',
      label: t.shapeDatabase,
      desc: t.shapeDatabaseDesc,
      icon: <Database className="w-4 h-4" />,
      colorKey: 'database',
    },
    {
      type: 'connector',
      label: t.shapeConnector,
      desc: t.shapeConnectorDesc,
      icon: <Circle className="w-4 h-4" />,
      colorKey: 'connector',
    },
    {
      type: 'note',
      label: t.shapeNote,
      desc: t.shapeNoteDesc,
      icon: <StickyNote className="w-4 h-4" />,
      colorKey: 'note',
    },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (onSendMessage) {
      onSendMessage(chatInput.trim());
    }
    setChatInput('');
  };

  return (
    <aside
      className={`h-[calc(100vh-3.5rem)] flex border-r transition-all duration-200 select-none z-20 ${
        isCollapsed ? 'w-14' : 'w-72 md:w-80'
      }`}
      style={{
        backgroundColor: theme.ui.cardBg,
        borderColor: theme.ui.border,
        color: theme.ui.textPrimary,
      }}
    >
      {/* Icon Rail */}
      <div
        className="w-14 flex flex-col items-center py-3 border-l shrink-0 justify-between"
        style={{
          backgroundColor: theme.ui.surface,
          borderColor: theme.ui.border,
        }}
      >
        <div className="flex flex-col gap-2 items-center w-full">
          <button
            onClick={() => handleSelectTab('shapes')}
            title={t.shapes}
            className={`p-2.5 rounded-xl transition-all relative ${
              activeTab === 'shapes' && !isCollapsed
                ? 'shadow-xs font-semibold'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'shapes' && !isCollapsed ? theme.ui.accent : 'transparent',
              color: activeTab === 'shapes' && !isCollapsed ? theme.ui.accentText : theme.ui.textPrimary,
            }}
          >
            <Shapes className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleSelectTab('templates')}
            title={t.templates}
            className={`p-2.5 rounded-xl transition-all relative ${
              activeTab === 'templates' && !isCollapsed
                ? 'shadow-xs font-semibold'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'templates' && !isCollapsed ? theme.ui.accent : 'transparent',
              color: activeTab === 'templates' && !isCollapsed ? theme.ui.accentText : theme.ui.textPrimary,
            }}
          >
            <LayoutTemplate className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleSelectTab('notes')}
            title={t.pageNotes}
            className={`p-2.5 rounded-xl transition-all relative ${
              activeTab === 'notes' && !isCollapsed
                ? 'shadow-xs font-semibold'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'notes' && !isCollapsed ? theme.ui.accent : 'transparent',
              color: activeTab === 'notes' && !isCollapsed ? theme.ui.accentText : theme.ui.textPrimary,
            }}
          >
            <FileText className="w-5 h-5" />
            {activePage?.description && activePage.description.trim() ? (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
            ) : null}
          </button>

          <button
            onClick={() => handleSelectTab('history')}
            title={t.history}
            className={`p-2.5 rounded-xl transition-all relative ${
              activeTab === 'history' && !isCollapsed
                ? 'shadow-xs font-semibold'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'history' && !isCollapsed ? theme.ui.accent : 'transparent',
              color: activeTab === 'history' && !isCollapsed ? theme.ui.accentText : theme.ui.textPrimary,
            }}
          >
            <History className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleSelectTab('settings')}
            title={t.projectSettings}
            className={`p-2.5 rounded-xl transition-all relative ${
              activeTab === 'settings' && !isCollapsed
                ? 'shadow-xs font-semibold'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'settings' && !isCollapsed ? theme.ui.accent : 'transparent',
              color: activeTab === 'settings' && !isCollapsed ? theme.ui.accentText : theme.ui.textPrimary,
            }}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle Collapse */}
        <button
          onClick={handleToggleCollapse}
          className="p-2 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
          title={isCollapsed ? 'باز کردن منو' : 'بستن منو'}
        >
          {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Drawer Panel Content */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TAB 1: SHAPES & NODES PALETTE */}
          {activeTab === 'shapes' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: theme.ui.border }}>
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                  {t.shapes}
                </span>
                <span className="text-[11px] opacity-50">کلیک برای افزودن</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {shapeItems.map((item) => {
                  const paletteColor = theme.palette[item.colorKey];
                  return (
                    <button
                      key={item.type}
                      onClick={() => onAddNode(item.type)}
                      className="group flex items-center gap-3 p-2.5 rounded-xl border text-right transition-all hover:scale-[1.01] hover:shadow-xs active:scale-95"
                      style={{
                        backgroundColor: theme.ui.surface,
                        borderColor: theme.ui.border,
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110"
                        style={{
                          backgroundColor: paletteColor.fill,
                          borderColor: paletteColor.stroke,
                          color: paletteColor.text,
                        }}
                      >
                        {item.icon}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-semibold leading-tight">{item.label}</div>
                        <div className="text-[11px] opacity-60 truncate leading-tight mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:text-blue-500" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: READY-MADE TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: theme.ui.border }}>
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                  {t.templates}
                </span>
              </div>

              <div className="space-y-2.5">
                {TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="p-3 rounded-xl border text-right space-y-2 transition-all hover:border-blue-400"
                    style={{
                      backgroundColor: theme.ui.surface,
                      borderColor: theme.ui.border,
                    }}
                  >
                    <div className="text-xs font-bold">{t[tmpl.titleKey]}</div>
                    <p className="text-[11px] opacity-70 leading-relaxed">{t[tmpl.descKey]}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-mono opacity-50">
                        {tmpl.nodes.length} {t.nodesCount} · {tmpl.edges.length} {t.edgesCount}
                      </span>
                      <button
                        onClick={() => onLoadTemplate(tmpl.id)}
                        className="text-xs font-medium px-2.5 py-1 rounded-md text-white transition-opacity hover:opacity-90 shadow-xs"
                        style={{ backgroundColor: theme.ui.accent }}
                      >
                        {t.applyTemplate}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PAGE NOTES & DOCUMENTATION */}
          {activeTab === 'notes' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div
                className="p-3.5 pb-2.5 border-b space-y-2 shrink-0"
                style={{ borderColor: theme.ui.border }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span>{t.pageNotes}</span>
                  </div>
                  {allPages && allPages.length > 1 && (
                    <select
                      value={activePage?.id}
                      onChange={(e) => onSelectPage && onSelectPage(e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg border bg-transparent font-medium max-w-[130px] truncate outline-none cursor-pointer"
                      style={{ borderColor: theme.ui.border, color: theme.ui.textPrimary }}
                    >
                      {allPages.map((p) => (
                        <option
                          key={p.id}
                          value={p.id}
                          className="bg-white dark:bg-slate-900"
                        >
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] opacity-75">
                  <span className="truncate">
                    صفحه: <strong>{activePage?.name || 'صفحه ۱'}</strong>
                  </span>
                  <span className="font-mono text-[10px]">
                    {notesDraft.length} حرف · {notesDraft.trim() ? notesDraft.trim().split(/\s+/).length : 0} کلمه
                  </span>
                </div>
              </div>

              {/* Scrollable Editor Area */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                {/* Fast Snippet Templates */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold opacity-60 block">درج سریع بخش‌های استاندارد:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => appendSnippet('🎯 هدف فرآیند:\n')}
                      className="text-[10px] px-2 py-0.5 rounded-md border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      style={{ borderColor: theme.ui.border }}
                    >
                      + هدف فرآیند
                    </button>
                    <button
                      type="button"
                      onClick={() => appendSnippet('📋 پیش‌نیازها:\n- ')}
                      className="text-[10px] px-2 py-0.5 rounded-md border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      style={{ borderColor: theme.ui.border }}
                    >
                      + پیش‌نیازها
                    </button>
                    <button
                      type="button"
                      onClick={() => appendSnippet('👥 مسئولین اجرا:\n- ')}
                      className="text-[10px] px-2 py-0.5 rounded-md border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      style={{ borderColor: theme.ui.border }}
                    >
                      + مسئولین
                    </button>
                    <button
                      type="button"
                      onClick={() => appendSnippet('📌 نکات کلیدی:\n- ')}
                      className="text-[10px] px-2 py-0.5 rounded-md border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      style={{ borderColor: theme.ui.border }}
                    >
                      + نکات
                    </button>
                  </div>
                </div>

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    value={notesDraft}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder={t.pageNotesPlaceholder}
                    rows={12}
                    className="w-full text-xs leading-relaxed p-3 rounded-xl border outline-none resize-none transition-all focus:ring-2 focus:ring-blue-500/40 font-normal"
                    style={{
                      backgroundColor: theme.ui.surface,
                      borderColor: theme.ui.border,
                      color: theme.ui.textPrimary,
                    }}
                  />
                </div>

                {/* Auto-save indicator & Clear */}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>ذخیره خودکار در پروژه فعال است</span>
                  </div>
                  {notesDraft && (
                    <button
                      type="button"
                      onClick={() => handleNotesChange('')}
                      className="text-[10px] opacity-50 hover:opacity-100 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      پاک کردن متن
                    </button>
                  )}
                </div>

                {/* Info Card */}
                <div
                  className="p-3 rounded-xl border text-[11px] leading-relaxed space-y-1"
                  style={{
                    backgroundColor: theme.ui.surface,
                    borderColor: theme.ui.border,
                  }}
                >
                  <div className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <span>💡 نمایش خودکار در خروجی‌ها</span>
                  </div>
                  <p className="opacity-75">
                    این مستندات همراه با نمودار این صفحه در خروجی‌های <strong>پرینت کاغذی</strong>، فایل <strong>PDF</strong> و خروجی وب مستقل <strong>HTML</strong> نمایش داده خواهد شد.
                  </p>
                </div>

                {onOpenPrint && (
                  <button
                    type="button"
                    onClick={onOpenPrint}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90 shadow-xs cursor-pointer"
                    style={{ backgroundColor: theme.ui.accent }}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{t.printPreview} همراه با مستندات</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: VERSION HISTORY & RESTORE */}
          {activeTab === 'history' && (
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="pb-2 border-b mb-3" style={{ borderColor: theme.ui.border }}>
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                  {t.versionsTitle}
                </span>
              </div>

              {/* Create Snapshot Form */}
              <div
                className="p-3 rounded-xl border mb-3 space-y-2"
                style={{
                  backgroundColor: theme.ui.surface,
                  borderColor: theme.ui.border,
                }}
              >
                <div className="text-xs font-semibold">{t.saveNewVersion}</div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder={t.versionNamePlaceholder}
                    value={newVersionName}
                    onChange={(e) => setNewVersionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newVersionName.trim()) {
                        onSaveVersion(newVersionName.trim());
                        setNewVersionName('');
                      }
                    }}
                    className="flex-1 px-2.5 py-1 text-xs rounded-lg border outline-none"
                    style={{
                      backgroundColor: theme.ui.cardBg,
                      borderColor: theme.ui.border,
                      color: theme.ui.textPrimary,
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newVersionName.trim()) {
                        onSaveVersion(newVersionName.trim());
                        setNewVersionName('');
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-white shrink-0 hover:opacity-90"
                    style={{ backgroundColor: theme.ui.accent }}
                  >
                    ثبت
                  </button>
                </div>
              </div>

              {/* Version List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                {versions.length === 0 ? (
                  <div className="text-xs opacity-50 text-center py-8">{t.noVersionsYet}</div>
                ) : (
                  versions.map((ver, idx) => (
                    <div
                      key={ver.id}
                      className="p-2.5 rounded-xl border text-right transition-colors relative group"
                      style={{
                        backgroundColor: idx === 0 ? theme.ui.surface : theme.ui.cardBg,
                        borderColor: idx === 0 ? theme.ui.accent : theme.ui.border,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate max-w-[170px]">{ver.name}</span>
                        {idx === 0 && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                            فعلی
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] opacity-60 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(ver.timestamp).toLocaleTimeString('fa-IR')}</span>
                        <span>·</span>
                        <span>
                          {ver.nodeCount} {t.nodesCount}
                        </span>
                      </div>
                      {idx !== 0 && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => onRestoreVersion(ver.id)}
                            className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded border hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                            style={{ borderColor: theme.ui.border }}
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{t.restoreVersion}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PROJECT SETTINGS & METADATA */}
          {activeTab === 'settings' && (
            <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: theme.ui.border }}>
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {t.projectSettings}
                  </span>
                </div>
                {isSavedProjectSettings && (
                  <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    {t.changesSaved}
                  </span>
                )}
              </div>

              {/* Project Title Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t.projectTitleLabel}</span>
                </label>
                <input
                  type="text"
                  value={projectTitleDraft}
                  onChange={(e) => setProjectTitleDraft(e.target.value)}
                  onBlur={() => {
                    if (onUpdateProjectDetails) {
                      onUpdateProjectDetails(projectTitleDraft, projectDescDraft);
                    }
                  }}
                  placeholder={t.untitledProject}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium transition-colors focus:border-blue-500"
                  style={{
                    backgroundColor: theme.ui.surface,
                    borderColor: theme.ui.border,
                    color: theme.ui.textPrimary,
                  }}
                />
              </div>

              {/* Project Description Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.projectDescLabel}</span>
                </label>
                <textarea
                  value={projectDescDraft}
                  onChange={(e) => setProjectDescDraft(e.target.value)}
                  onBlur={() => {
                    if (onUpdateProjectDetails) {
                      onUpdateProjectDetails(projectTitleDraft, projectDescDraft);
                    }
                  }}
                  rows={5}
                  placeholder={t.projectDescPlaceholder}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none leading-relaxed resize-none transition-colors focus:border-blue-500"
                  style={{
                    backgroundColor: theme.ui.surface,
                    borderColor: theme.ui.border,
                    color: theme.ui.textPrimary,
                  }}
                />
                <span className="text-[10px] opacity-60 block leading-tight">
                  توضیحات و مستندات ثبت‌شده در صفحه خروجی گراف هوشمند، پرینت و فایل‌های پروژه نمایش داده می‌شوند.
                </span>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveProjectDetails}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs transition-all hover:opacity-95 cursor-pointer"
                style={{ backgroundColor: theme.ui.accent }}
              >
                <Check className="w-4 h-4" />
                <span>{t.saveChanges}</span>
              </button>

              {/* Project Stats & Metadata Box */}
              <div
                className="p-3.5 rounded-xl border space-y-2.5 text-xs"
                style={{
                  backgroundColor: theme.ui.surface,
                  borderColor: theme.ui.border,
                }}
              >
                <div className="font-bold text-[11px] opacity-75 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>آمار و مشخصات دیاگرام</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 flex flex-col">
                    <span className="opacity-60 text-[10px]">تعداد صفحات</span>
                    <span className="font-bold text-sm mt-0.5">{allPages?.length || 1}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 flex flex-col">
                    <span className="opacity-60 text-[10px]">کل گره‌ها</span>
                    <span className="font-bold text-sm mt-0.5">{totalNodesCount || 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 flex flex-col">
                    <span className="opacity-60 text-[10px]">کل پیوندها</span>
                    <span className="font-bold text-sm mt-0.5">{totalEdgesCount || 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 flex flex-col">
                    <span className="opacity-60 text-[10px]">نسخه‌های ثبت‌شده</span>
                    <span className="font-bold text-sm mt-0.5">{versions.length}</span>
                  </div>
                </div>

                {roomCode && (
                  <div className="pt-1 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] opacity-60">شناسه پروژه:</span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="font-mono text-[10px] flex items-center gap-1 hover:text-blue-500 cursor-pointer"
                      title="کپی شناسه پروژه"
                    >
                      <span>{roomCode.slice(0, 8)}...</span>
                      <Copy className="w-3 h-3 opacity-60" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
