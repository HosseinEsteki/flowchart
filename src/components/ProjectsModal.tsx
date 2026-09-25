import React, { useState, useRef } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Check,
  Trash2,
  Copy,
  ExternalLink,
  Download,
  Upload,
  Calendar,
  Layers,
  FileCode,
  X,
  Sparkles,
} from 'lucide-react';
import { FlowchartProject } from '../types/flowchart';
import { ColorTheme, THEMES } from '../constants/themes';
import { TranslationDictionary } from '../constants/translations';
import { TEMPLATES } from '../constants/templates';

export interface ProjectSummary {
  id: string;
  title: string;
  description?: string;
  theme: string;
  nodeCount: number;
  edgeCount: number;
  pageCount?: number;
  versionCount?: number;
  updatedAt: number;
  createdAt?: number;
}

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId: string;
  projects: ProjectSummary[];
  onSelectProject: (projectId: string) => void;
  onCreateProject: (title: string, templateId?: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onImportProjectJson: (projectData: FlowchartProject) => void;
  theme: ColorTheme;
  t: TranslationDictionary;
  lang: 'fa' | 'en';
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  currentProjectId,
  projects,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  onImportProjectJson,
  theme,
  t,
  lang,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('blank');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim() || 'پروژه فلوچارت جدید';
    onCreateProject(title, selectedTemplateId === 'blank' ? undefined : selectedTemplateId);
    setNewTitle('');
    setSelectedTemplateId('blank');
    setShowNewDialog(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && (parsed.nodes || parsed.pages)) {
          onImportProjectJson(parsed);
          onClose();
        } else {
          alert('فرمت فایل JSON نامعتبر است.');
        }
      } catch (err) {
        alert('خطا در خواندن فایل JSON پروژه.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatDate = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      if (lang === 'fa') {
        return d.toLocaleDateString('fa-IR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[88vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in zoom-in-95 transition-all"
        style={{
          backgroundColor: theme.ui.cardBg,
          borderColor: theme.ui.border,
          color: theme.ui.textPrimary,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-5 border-b flex items-center justify-between"
          style={{ borderColor: theme.ui.border }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{t.myProjects}</h2>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: theme.ui.surface, color: theme.ui.textMuted }}
                >
                  {projects.length}
                </span>
              </div>
              <p className="text-xs opacity-65 mt-0.5">
                مدیریت، ایجاد، ویرایش و ذخیره تمام فلوچارت‌ها در چند صفحه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border hover:opacity-85 transition-opacity"
              style={{ borderColor: theme.ui.border }}
              title="بارگذاری پروژه از فایل JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>وارد کردن پروژه</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={() => setShowNewDialog(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.newProject}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4 opacity-70" />
            </button>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div
          className="p-4 border-b flex items-center justify-between gap-4"
          style={{ borderColor: theme.ui.border, backgroundColor: theme.ui.surface }}
        >
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchProjects}
              className="w-full text-xs ps-9 pe-3 py-2 rounded-xl border outline-none transition-all focus:border-blue-500"
              style={{
                backgroundColor: theme.ui.cardBg,
                borderColor: theme.ui.border,
                color: theme.ui.textPrimary,
              }}
            />
          </div>

          <div className="text-xs opacity-60 font-medium">
            {filteredProjects.length} پروژه یافت شد
          </div>
        </div>

        {/* New Project Dialog Overlay */}
        {showNewDialog && (
          <div className="p-5 border-b bg-blue-50/50 dark:bg-blue-950/20">
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-4 h-4" />
                  <span>ایجاد پروژه فلوچارت جدید</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewDialog(false)}
                  className="text-xs opacity-60 hover:opacity-100"
                >
                  انصراف
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-80">
                    عنوان پروژه:
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثلاً جریان سفارش آنلاین، طراحی معماری..."
                    className="w-full text-xs px-3 py-2 rounded-xl border outline-none focus:border-blue-500"
                    style={{
                      backgroundColor: theme.ui.cardBg,
                      borderColor: theme.ui.border,
                      color: theme.ui.textPrimary,
                    }}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-80">
                    قالب اولیه یا صفحه خالی:
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border outline-none focus:border-blue-500"
                    style={{
                      backgroundColor: theme.ui.cardBg,
                      borderColor: theme.ui.border,
                      color: theme.ui.textPrimary,
                    }}
                  >
                    <option value="blank">📄 صفحه کاملاً خالی (Blank Canvas)</option>
                    {TEMPLATES.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        ⚡ {t[tmpl.titleKey]} ({tmpl.nodes.length} گره)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewDialog(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border hover:opacity-80 transition-opacity"
                  style={{ borderColor: theme.ui.border }}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
                >
                  ایجاد و باز کردن پروژه
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Project Cards Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredProjects.length === 0 ? (
            <div className="py-14 text-center">
              <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-25" />
              <p className="text-sm font-semibold opacity-70">هیچ پروژه‌ای یافت نشد</p>
              <p className="text-xs opacity-50 mt-1">
                می‌توانید با دکمه «پروژه جدید» یک فلوچارت جدید بسازید.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((p) => {
                const isActive = p.id === currentProjectId;
                const pTheme = THEMES[p.theme] || THEMES.slate;
                const themeName = lang === 'fa' ? pTheme.nameFa : pTheme.nameEn;

                return (
                  <div
                    key={p.id}
                    className={`relative group rounded-2xl border p-4.5 flex flex-col justify-between transition-all hover:shadow-lg ${
                      isActive
                        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                        : 'hover:border-gray-400 dark:hover:border-gray-600'
                    }`}
                    style={{
                      backgroundColor: theme.ui.surface,
                      borderColor: isActive ? '#3B82F6' : theme.ui.border,
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: pTheme.ui.accent }}
                            title={`تم: ${themeName}`}
                          />
                          <span className="text-[11px] opacity-60 font-medium">
                            {themeName}
                          </span>
                        </div>

                        {isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white flex items-center gap-1 shadow-xs">
                            <Check className="w-2.5 h-2.5" />
                            پروژه جاری
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onDuplicateProject(p.id)}
                              className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-xs transition-colors"
                              title={t.duplicateProject}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {projects.length > 1 && (
                              <button
                                onClick={() => setDeleteConfirmId(p.id)}
                                className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 text-xs transition-colors"
                                title={t.deleteProject}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h4
                        className="text-sm font-bold line-clamp-1 cursor-pointer hover:text-blue-500 transition-colors"
                        onClick={() => {
                          onSelectProject(p.id);
                          onClose();
                        }}
                      >
                        {p.title}
                      </h4>
                      {p.description && (
                        <p className="text-[11px] opacity-60 line-clamp-2 mt-1">
                          {p.description}
                        </p>
                      )}

                      {/* Metadata Stats */}
                      <div className="flex items-center gap-3 mt-3 text-[11px] opacity-75">
                        <div className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-blue-500" />
                          <span>{p.pageCount || 1} صفحه</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileCode className="w-3 h-3 text-emerald-500" />
                          <span>
                            {p.nodeCount} گره · {p.edgeCount} اتصال
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div
                      className="border-t pt-3 mt-4 flex items-center justify-between text-[11px]"
                      style={{ borderColor: theme.ui.border }}
                    >
                      <div className="flex items-center gap-1 opacity-60">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(p.updatedAt)}</span>
                      </div>

                      {isActive ? (
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          در حال ویرایش
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            onSelectProject(p.id);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        >
                          <span>{t.openProject}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Inline Delete Confirmation */}
                    {deleteConfirmId === p.id && (
                      <div
                        className="absolute inset-0 z-20 rounded-2xl p-4 flex flex-col justify-center items-center text-center animate-in fade-in backdrop-blur-md"
                        style={{
                          backgroundColor: theme.ui.cardBg,
                          borderColor: '#EF4444',
                        }}
                      >
                        <Trash2 className="w-7 h-7 text-red-500 mb-1.5" />
                        <p className="text-xs font-bold text-red-600 mb-1">
                          آیا مطمئنید این پروژه حذف شود؟
                        </p>
                        <p className="text-[11px] opacity-70 mb-3 max-w-[200px] truncate">
                          «{p.title}»
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-1 rounded-lg text-xs border font-medium hover:opacity-80"
                            style={{ borderColor: theme.ui.border }}
                          >
                            انصراف
                          </button>
                          <button
                            onClick={() => {
                              onDeleteProject(p.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-xs"
                          >
                            حذف نهایی
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
