import React, { useState } from 'react';
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
} from 'lucide-react';
import { FlowchartNodeType, FlowchartVersion, Collaborator, ChatMessage } from '../types/flowchart';
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
  collaborators: Collaborator[];
  currentUserId: string;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
  roomCode: string;
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
}) => {
  const [activeTab, setActiveTab] = useState<'shapes' | 'templates' | 'history' | 'team'>('shapes');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

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
    onSendMessage(chatInput.trim());
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
            onClick={() => {
              setActiveTab('shapes');
              if (isCollapsed) setIsCollapsed(false);
            }}
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
            onClick={() => {
              setActiveTab('templates');
              if (isCollapsed) setIsCollapsed(false);
            }}
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
            onClick={() => {
              setActiveTab('history');
              if (isCollapsed) setIsCollapsed(false);
            }}
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
            onClick={() => {
              setActiveTab('team');
              if (isCollapsed) setIsCollapsed(false);
            }}
            title={t.team}
            className={`p-2.5 rounded-xl transition-all relative ${
              activeTab === 'team' && !isCollapsed
                ? 'shadow-xs font-semibold'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'team' && !isCollapsed ? theme.ui.accent : 'transparent',
              color: activeTab === 'team' && !isCollapsed ? theme.ui.accentText : theme.ui.textPrimary,
            }}
          >
            <Users className="w-5 h-5" />
            {collaborators.length > 1 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </button>
        </div>

        {/* Toggle Collapse */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
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

          {/* TAB 3: VERSION HISTORY & RESTORE */}
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

          {/* TAB 4: TEAM COLLABORATION & ACTIVITY */}
          {activeTab === 'team' && (
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="pb-2 border-b mb-3" style={{ borderColor: theme.ui.border }}>
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                  {t.collaborationTitle}
                </span>
              </div>

              {/* Share link box */}
              <div
                className="p-3 rounded-xl border mb-3 space-y-2"
                style={{
                  backgroundColor: theme.ui.surface,
                  borderColor: theme.ui.border,
                }}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{t.roomCode}</span>
                  <span className="font-mono text-[11px] opacity-60">{roomCode}</span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium hover:opacity-90 transition-colors"
                  style={{
                    backgroundColor: theme.ui.cardBg,
                    borderColor: theme.ui.border,
                  }}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? t.linkCopied : t.copyLink}</span>
                </button>
              </div>

              {/* Online Users */}
              <div className="mb-3">
                <div className="text-[11px] font-bold opacity-60 mb-1.5">{t.activeCollaborators}</div>
                <div className="space-y-1.5">
                  {collaborators.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs"
                      style={{
                        backgroundColor: theme.ui.surface,
                        borderColor: theme.ui.border,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: user.color }}
                        />
                        <span className="font-medium truncate max-w-[130px]">
                          {user.name} {user.id === currentUserId ? `(${t.you})` : ''}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-medium">آنلاین</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat & Activity */}
              <div className="flex-1 flex flex-col overflow-hidden border rounded-xl" style={{ borderColor: theme.ui.border }}>
                <div className="p-2 border-b text-[11px] font-semibold opacity-70" style={{ borderColor: theme.ui.border, backgroundColor: theme.ui.surface }}>
                  گفتگوی زنده تیم
                </div>
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2 text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="text-center opacity-40 text-[11px] py-6">
                      پیامی در اتاق تبادل نشده است.
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2 rounded-lg leading-tight space-y-0.5 ${
                          msg.userId === currentUserId
                            ? 'bg-blue-50 dark:bg-blue-950/40 mr-4'
                            : 'bg-slate-100 dark:bg-slate-800 ml-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] opacity-70">
                          <span style={{ color: msg.userColor }} className="font-bold">
                            {msg.userName}
                          </span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs break-words">{msg.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChat} className="p-2 border-t flex gap-1.5" style={{ borderColor: theme.ui.border, backgroundColor: theme.ui.surface }}>
                  <input
                    type="text"
                    placeholder={t.chatPlaceholder}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs rounded-lg border outline-none"
                    style={{
                      backgroundColor: theme.ui.cardBg,
                      borderColor: theme.ui.border,
                      color: theme.ui.textPrimary,
                    }}
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: theme.ui.accent }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
