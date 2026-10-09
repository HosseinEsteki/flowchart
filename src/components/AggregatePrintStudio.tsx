import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ColorTheme } from '../constants/themes';
import { TranslationDictionary } from '../constants/translations';
import {
  FlowchartProject,
  FlowchartPage,
  PrintSettings,
  PrintPaperSize,
} from '../types/flowchart';
import { ProjectSummary } from './ProjectsModal';
import {
  generatePageSvgMarkup,
  triggerAggregatePrintDialog,
  exportAggregateMultiPagePdf,
  generateAggregatePrintReportHtml,
  AggregatePrintOptions,
  getFontFamilyCss,
  getMarginMm,
} from '../utils/printUtils';
import {
  Printer,
  FileDown,
  Layers,
  ArrowUp,
  ArrowDown,
  Check,
  CheckSquare,
  Square,
  FileText,
  Lightbulb,
  Save,
  RotateCcw,
  Eye,
  Sliders,
  Type,
  Layout,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Plus,
  Trash2,
  FolderKanban,
  Edit3,
  BookOpen,
  Book,
  FileCode,
  Sparkles,
  Calendar,
  User,
  Building,
  Bookmark,
  ZoomIn,
  ZoomOut,
  Grid,
  Columns,
  CheckCheck,
  Palette,
  Hash,
} from 'lucide-react';

interface AggregatePrintStudioProps {
  currentProject: FlowchartProject;
  projectsList: ProjectSummary[];
  theme: ColorTheme;
  t: TranslationDictionary;
  settings: PrintSettings;
  onUpdateSettings: (s: PrintSettings) => void;
  onClose: () => void;
  onSaveProject: (updated: FlowchartProject) => Promise<void> | void;
  onSwitchToSingleMode: () => void;
}

export const AggregatePrintStudio: React.FC<AggregatePrintStudioProps> = ({
  currentProject,
  projectsList,
  theme,
  t,
  settings,
  onUpdateSettings,
  onClose,
  onSaveProject,
  onSwitchToSingleMode,
}) => {
  // 1. Projects pool & loading
  const [loadedProjects, setLoadedProjects] = useState<Record<string, FlowchartProject>>({
    [currentProject.id]: currentProject,
  });
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Ordered list of project IDs to print as book lessons
  const [orderedProjectIds, setOrderedProjectIds] = useState<string[]>(() => {
    const list = [currentProject.id];
    projectsList.forEach((p) => {
      if (p.id !== currentProject.id) list.push(p.id);
    });
    return list;
  });

  // Selected project IDs included in the book
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(() => {
    const list = [currentProject.id];
    projectsList.forEach((p) => {
      if (p.id !== currentProject.id) list.push(p.id);
    });
    return list;
  });

  // Active lesson selected for custom editing
  const [activeEditingProjectId, setActiveEditingProjectId] = useState<string>(currentProject.id);

  // Per-project page selection (which pages of each lesson to include)
  const [projectPagesMap, setProjectPagesMap] = useState<Record<string, string[]>>({});

  // Active page inside the currently edited project
  const [activeEditingPageId, setActiveEditingPageId] = useState<string>('');

  // Per-lesson custom titles and descriptions for the book
  const [projectCustomTitles, setProjectCustomTitles] = useState<Record<string, string>>({});
  const [projectCustomDescriptions, setProjectCustomDescriptions] = useState<Record<string, string>>({});

  // Draft edits for the active editing project
  const [projectTitleDraft, setProjectTitleDraft] = useState<string>('');
  const [projectDescDraft, setProjectDescDraft] = useState<string>('');
  const [pageDescDraft, setPageDescDraft] = useState<string>('');
  const [pageNotesDraft, setPageNotesDraft] = useState<string>('');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // ================= BOOK COVER & METADATA STATE =================
  const [masterDocTitle, setMasterDocTitle] = useState<string>(
    settings.documentTitle || 'کتاب جامع اطلس فرآیندهای سازمانی'
  );
  const [masterDocSubtitle, setMasterDocSubtitle] = useState<string>(
    settings.documentSubtitle || 'سند تجمیعی و یکپارچه فرآیندهای کسب‌وکار و نقشه‌های جریان کار'
  );
  const [coverAuthor, setCoverAuthor] = useState<string>('تیم معماری فرآیندها و سیستم‌ها');
  const [coverOrganization, setCoverOrganization] = useState<string>(
    settings.organizationName || 'سازمان / دپارتمان سیستم‌ها و روش‌ها'
  );
  const [coverEdition, setCoverEdition] = useState<string>('ویرایش اول • سال ۱۴۰۵');
  const [coverDate, setCoverDate] = useState<string>(() => {
    return new Date().toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });
  const [coverDescription, setCoverDescription] = useState<string>(
    'این کتابچه شامل مستندات فرآیندی جامع سازمان، نقشه‌های گردش کار، نمودارهای تصمیم‌گیری و شرح وظایف در قالب درس‌های مستقل است.'
  );
  const [coverNotes, setCoverNotes] = useState<string>(
    settings.footerNote || 'کلیه حقوق این سند تجمیعی فرآیندی محفوظ است.'
  );
  const [coverStyle, setCoverStyle] = useState<'modern' | 'academic' | 'blueprint' | 'minimal'>('modern');

  // Master Portfolio options
  const [includeMasterCover, setIncludeMasterCover] = useState<boolean>(true);
  const [includeTableOfContents, setIncludeTableOfContents] = useState<boolean>(true);
  const [pageNumberingFormat, setPageNumberingFormat] = useState<'standard' | 'lesson_page' | 'simple'>('standard');

  // Tabs in Inspector: 'lessons' | 'cover' | 'paper' | 'headerFooter' | 'tocStyle'
  const [activeTab, setActiveTab] = useState<'lessons' | 'cover' | 'paper' | 'headerFooter' | 'tocStyle'>('lessons');

  // Preview view mode: 'sheet' | 'spread' | 'grid' | 'html'
  const [viewMode, setViewMode] = useState<'sheet' | 'spread' | 'grid' | 'html'>('sheet');
  const [previewGlobalPageIndex, setPreviewGlobalPageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Export states
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isDownloadingHtml, setIsDownloadingHtml] = useState(false);
  const [isCopiedHtml, setIsCopiedHtml] = useState(false);

  // Load all projects from API / localStorage on mount
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingProjects(true);

    const loadAll = async () => {
      const newLoaded: Record<string, FlowchartProject> = {
        [currentProject.id]: currentProject,
      };

      for (const summary of projectsList) {
        if (summary.id === currentProject.id) continue;
        try {
          const res = await fetch(`/api/projects/${summary.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.id) {
              newLoaded[data.id] = data;
            }
          } else {
            const cached = localStorage.getItem(`flowcraft_project_${summary.id}`);
            if (cached) {
              newLoaded[summary.id] = JSON.parse(cached);
            }
          }
        } catch (_) {
          const cached = localStorage.getItem(`flowcraft_project_${summary.id}`);
          if (cached) {
            try {
              newLoaded[summary.id] = JSON.parse(cached);
            } catch (__) {}
          }
        }
      }

      if (!isCancelled) {
        setLoadedProjects(newLoaded);
        setIsLoadingProjects(false);
      }
    };

    loadAll();
    return () => {
      isCancelled = true;
    };
  }, [projectsList, currentProject]);

  // Keep current project updated
  useEffect(() => {
    setLoadedProjects((prev) => ({
      ...prev,
      [currentProject.id]: currentProject,
    }));
  }, [currentProject]);

  // Sync draft states when activeEditingProjectId changes
  const activeEditingProject = loadedProjects[activeEditingProjectId] || currentProject;

  useEffect(() => {
    if (activeEditingProject) {
      setProjectTitleDraft(
        projectCustomTitles[activeEditingProject.id] || activeEditingProject.title || ''
      );
      setProjectDescDraft(
        projectCustomDescriptions[activeEditingProject.id] || activeEditingProject.description || ''
      );

      const pages = activeEditingProject.pages || [];
      const defaultPage = pages[0];
      if (defaultPage) {
        setActiveEditingPageId(defaultPage.id);
        setPageDescDraft(defaultPage.description || '');
        setPageNotesDraft(defaultPage.notes || '');
      } else {
        setActiveEditingPageId('');
        setPageDescDraft('');
        setPageNotesDraft('');
      }
    }
  }, [activeEditingProjectId, activeEditingProject?.id]);

  // Page selection inside active project editor
  const handleSelectEditingPage = (pageId: string) => {
    setActiveEditingPageId(pageId);
    const page = (activeEditingProject.pages || []).find((p) => p.id === pageId);
    if (page) {
      setPageDescDraft(page.description || '');
      setPageNotesDraft(page.notes || '');
    }
  };

  // Move Lesson Up & Down in Book
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setOrderedProjectIds((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= orderedProjectIds.length - 1) return;
    setOrderedProjectIds((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Toggle selection of lesson
  const handleToggleSelectProject = (projectId: string) => {
    setSelectedProjectIds((prev) => {
      if (prev.includes(projectId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  // Select all / Deselect all
  const handleSelectAll = () => {
    setSelectedProjectIds([...orderedProjectIds]);
  };

  // Apply edits to current active project
  const handleApplyChangesToCurrentProject = async () => {
    if (!activeEditingProject) return;

    // Save custom titles
    setProjectCustomTitles((prev) => ({
      ...prev,
      [activeEditingProject.id]: projectTitleDraft.trim(),
    }));
    setProjectCustomDescriptions((prev) => ({
      ...prev,
      [activeEditingProject.id]: projectDescDraft.trim(),
    }));

    const currentPages = activeEditingProject.pages || [];
    const updatedPages = currentPages.map((pg) => {
      if (pg.id === activeEditingPageId) {
        return {
          ...pg,
          description: pageDescDraft,
          notes: pageNotesDraft,
        };
      }
      return pg;
    });

    const updatedProject: FlowchartProject = {
      ...activeEditingProject,
      title: projectTitleDraft.trim() || activeEditingProject.title,
      description: projectDescDraft,
      pages: updatedPages.length > 0 ? updatedPages : activeEditingProject.pages,
      updatedAt: Date.now(),
    };

    setLoadedProjects((prev) => ({
      ...prev,
      [updatedProject.id]: updatedProject,
    }));

    try {
      await onSaveProject(updatedProject);
      setSaveFeedback(`تغییرات درس "${updatedProject.title}" با موفقیت ذخیره شد.`);
      setTimeout(() => setSaveFeedback(null), 3000);
    } catch (e) {
      setSaveFeedback('تغییرات در حافظه اعمال شد.');
      setTimeout(() => setSaveFeedback(null), 2500);
    }
  };

  // Toggle page inclusion inside a project
  const handleTogglePageInclusion = (projectId: string, pageId: string) => {
    setProjectPagesMap((prev) => {
      const proj = loadedProjects[projectId];
      const allPageIds = (proj?.pages || []).map((p) => p.id);
      const currentList = prev[projectId] || allPageIds;
      let nextList: string[];
      if (currentList.includes(pageId)) {
        if (currentList.length === 1) return prev; // keep at least 1 page
        nextList = currentList.filter((id) => id !== pageId);
      } else {
        nextList = [...currentList, pageId];
      }
      return { ...prev, [projectId]: nextList };
    });
  };

  // Effective ordered projects for printing
  const effectiveOrderedProjects = useMemo<FlowchartProject[]>(() => {
    return orderedProjectIds
      .filter((id) => selectedProjectIds.includes(id))
      .map((id) => loadedProjects[id])
      .filter(Boolean);
  }, [orderedProjectIds, selectedProjectIds, loadedProjects]);

  // Aggregate options structure passed to print / pdf / html functions
  const aggregateOptions: AggregatePrintOptions = useMemo(
    () => ({
      masterTitle: masterDocTitle,
      masterSubtitle: masterDocSubtitle,
      includeMasterCover,
      includeTableOfContents,
      projectPagesMap,
      coverAuthor,
      coverOrganization,
      coverEdition,
      coverDate,
      coverDescription,
      coverNotes,
      coverStyle,
      projectCustomTitles,
      projectCustomDescriptions,
      pageNumberingFormat,
    }),
    [
      masterDocTitle,
      masterDocSubtitle,
      includeMasterCover,
      includeTableOfContents,
      projectPagesMap,
      coverAuthor,
      coverOrganization,
      coverEdition,
      coverDate,
      coverDescription,
      coverNotes,
      coverStyle,
      projectCustomTitles,
      projectCustomDescriptions,
      pageNumberingFormat,
    ]
  );

  // Flattened pages for live interactive book preview
  const flattenedPreviewPages = useMemo(() => {
    const list: Array<{
      type: 'cover' | 'diagram';
      project?: FlowchartProject;
      page?: FlowchartPage;
      lessonIndex?: number;
      lessonTitle?: string;
      pageIndexInLesson?: number;
      globalPageNumber: number;
    }> = [];

    let currentNum = 1;
    if (includeMasterCover) {
      list.push({
        type: 'cover',
        globalPageNumber: currentNum++,
      });
    }

    effectiveOrderedProjects.forEach((proj, pIdx) => {
      const includedPageIds = projectPagesMap[proj.id];
      const rawPages =
        proj.pages && proj.pages.length > 0
          ? proj.pages
          : [
              {
                id: 'p1',
                name: 'صفحه اصلی',
                description: '',
                notes: '',
                nodes: proj.nodes || [],
                edges: proj.edges || [],
              },
            ];

      const effectivePages = includedPageIds
        ? rawPages.filter((p) => includedPageIds.includes(p.id))
        : rawPages;

      const lessonTitle = projectCustomTitles[proj.id] || proj.title || `درس ${pIdx + 1}`;

      effectivePages.forEach((page, pgIdx) => {
        list.push({
          type: 'diagram',
          project: proj,
          page,
          lessonIndex: pIdx + 1,
          lessonTitle,
          pageIndexInLesson: pgIdx + 1,
          globalPageNumber: currentNum++,
        });
      });
    });

    return list;
  }, [
    effectiveOrderedProjects,
    includeMasterCover,
    projectPagesMap,
    projectCustomTitles,
  ]);

  const totalSheetsCount = flattenedPreviewPages.length;
  const safeGlobalIndex = Math.min(
    Math.max(0, previewGlobalPageIndex),
    Math.max(0, totalSheetsCount - 1)
  );
  const activePreviewItem = flattenedPreviewPages[safeGlobalIndex];

  // Browser Print trigger
  const handleExecutePrint = () => {
    if (effectiveOrderedProjects.length === 0) return;
    triggerAggregatePrintDialog(effectiveOrderedProjects, settings, aggregateOptions);
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    if (effectiveOrderedProjects.length === 0) return;
    setIsExportingPdf(true);
    try {
      await exportAggregateMultiPagePdf(effectiveOrderedProjects, settings, aggregateOptions);
    } catch (err) {
      console.error('Aggregate PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Download HTML
  const handleDownloadHtml = () => {
    if (effectiveOrderedProjects.length === 0) return;
    setIsDownloadingHtml(true);
    try {
      const html = generateAggregatePrintReportHtml(effectiveOrderedProjects, settings, aggregateOptions);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${masterDocTitle || 'process-book'}-batch-print.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setIsDownloadingHtml(false), 800);
    }
  };

  // Copy HTML
  const handleCopyHtml = () => {
    const html = generateAggregatePrintReportHtml(effectiveOrderedProjects, settings, aggregateOptions);
    navigator.clipboard.writeText(html);
    setIsCopiedHtml(true);
    setTimeout(() => setIsCopiedHtml(false), 2000);
  };

  // Active diagram SVG markup
  const previewSvgMarkup = useMemo(() => {
    if (!activePreviewItem || activePreviewItem.type !== 'diagram' || !activePreviewItem.page) {
      return null;
    }
    return generatePageSvgMarkup(activePreviewItem.page, settings.colorMode);
  }, [activePreviewItem, settings.colorMode]);

  // Color & Theme
  const accentColor = settings.accentColor || '#2563EB';
  const fontFamilyCss = getFontFamilyCss(settings.fontFamily, settings.customFontName);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs select-none transition-all ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
    >
      <div
        className={`w-full rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-all ${
          isFullscreen ? 'h-full rounded-none border-none' : 'h-[95vh] max-h-[920px] max-w-[1440px]'
        }`}
        style={{
          backgroundColor: theme.ui.cardBg,
          borderColor: theme.ui.border,
          color: theme.ui.textPrimary,
        }}
      >
        {/* ===================== TOP BAR: Studio Navigation & Primary Actions ===================== */}
        <div
          className="h-14 border-b px-4 sm:px-6 flex items-center justify-between shrink-0 gap-3"
          style={{ borderColor: theme.ui.border }}
        >
          {/* Brand & Document Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: accentColor, color: '#ffffff' }}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base truncate" style={{ color: '#aec5ff' }}>
                  استودیوی کتاب فرآیندها (پرینت تجمیعی)
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hidden sm:inline-block">
                  Book Portfolio Studio
                </span>
              </div>
              <p className="text-[11px] opacity-60 truncate" style={{ color: '#c3e0ef' }}>
                {masterDocTitle} • {effectiveOrderedProjects.length} درس/پروژه • {totalSheetsCount} صفحه کتاب • قطع {settings.paperSize.toUpperCase()}{' '}
                {settings.orientation === 'landscape' ? 'افقی' : 'عمودی'}
              </p>
            </div>
          </div>

          {/* Center Mode Switchers */}
          <div className="flex items-center gap-2">
            {/* 1. Single vs Aggregate Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-semibold">
              <button
                onClick={onSwitchToSingleMode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg opacity-70 hover:opacity-100 transition-all cursor-pointer"
                title="تغییر به حالت چاپ فقط پروژه جاری"
                style={{ color: '#b3bbff' }}
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">پرینت تک‌پروژه</span>
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold shadow-xs transition-all cursor-pointer"
                title="پرینت تجمیعی کلیه پروژه‌ها در قالب یک کتاب منسجم"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>کتاب تجمیعی</span>
                {effectiveOrderedProjects.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-800 text-indigo-100 font-mono font-bold">
                    {effectiveOrderedProjects.length}
                  </span>
                )}
              </button>
            </div>

            {/* 2. View Mode Switcher */}
            <div className="hidden lg:flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setViewMode('sheet')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'sheet'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title="نمایش تک‌صفحه با جزئیات کامل"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>تک‌صفحه</span>
              </button>

              <button
                onClick={() => setViewMode('spread')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'spread'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title="نمایش دو صفحه کنار هم (کتاب باز)"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>دوصفحه‌ای</span>
              </button>

              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title="مشاهده گالری تمام صفحات کتاب"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>گالری</span>
              </button>

              <button
                onClick={() => setViewMode('html')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'html'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title="مشاهده و کپی کد HTML مستقل چاپ"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>HTML</span>
              </button>
            </div>
          </div>

          {/* Right Top Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf || effectiveOrderedProjects.length === 0}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer disabled:opacity-40"
              style={{ borderColor: theme.ui.border }}
              title="دانلود فایل PDF تجمیعی از تمام صفحات و جلد کتاب"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-500" />
              <span style={{ color: '#ea2f00' }}>{isExportingPdf ? 'در حال ایجاد PDF...' : 'دانلود PDF کتاب'}</span>
            </button>

            {/* Execute Print (Print Now) */}
            <button
              onClick={handleExecutePrint}
              disabled={effectiveOrderedProjects.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-40"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ کتاب (Print)</span>
            </button>

            {/* Fullscreen */}
            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-1.5 rounded-lg hover:opacity-70 transition-opacity hidden sm:block cursor-pointer"
              title={isFullscreen ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه استودیو'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" style={{ color: '#ffaa89' }} />
              ) : (
                <Maximize2 className="w-4 h-4" style={{ color: '#ffaa89' }} />
              )}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:opacity-70 transition-opacity cursor-pointer"
              title="بستن پنجره"
            >
              <X className="w-5 h-5" style={{ color: '#ffc2aa' }} />
            </button>
          </div>
        </div>

        {/* ===================== WORKSPACE BODY: Left Inspector + Center Desk ===================== */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* ================= LEFT: 5-Tab Comprehensive Inspector ================= */}
          <div
            className="w-full md:w-[410px] lg:w-[450px] border-b md:border-b-0 md:border-l flex flex-col shrink-0 overflow-y-auto"
            style={{
              borderColor: theme.ui.border,
              backgroundColor: theme.ui.surface,
            }}
          >
            {/* 5-Tab Navigation Bar */}
            <div
              className="grid grid-cols-5 p-1.5 gap-1 border-b text-[11px] font-semibold text-center shrink-0"
              style={{ borderColor: theme.ui.border }}
            >
              <button
                onClick={() => setActiveTab('lessons')}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'lessons'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                }`}
                title="مدیریت و ترتیب دروس کتاب (پروژه‌ها)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="truncate w-full text-[10px]">دروس کتاب</span>
              </button>

              <button
                onClick={() => setActiveTab('cover')}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'cover'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                }`}
                title="ویرایش کامل متون و شناسنامه جلد کتاب"
              >
                <Book className="w-3.5 h-3.5" />
                <span className="truncate w-full text-[10px]">جلد و متون</span>
              </button>

              <button
                onClick={() => setActiveTab('paper')}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'paper'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                }`}
                title="قطع کاغذ، جهت و حاشیه‌های چاپ"
              >
                <Layout className="w-3.5 h-3.5" />
                <span className="truncate w-full text-[10px]">کاغذ و چاپ</span>
              </button>

              <button
                onClick={() => setActiveTab('headerFooter')}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'headerFooter'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                }`}
                title="تنظیمات سربرگ و شماره‌گذاری صفحات"
              >
                <Hash className="w-3.5 h-3.5" />
                <span className="truncate w-full text-[10px]">هدر و شماره</span>
              </button>

              <button
                onClick={() => setActiveTab('tocStyle')}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'tocStyle'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                }`}
                title="فهرست مطالب و رنگ عطف کتاب"
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="truncate w-full text-[10px]">فهرست و تم</span>
              </button>
            </div>

            {/* TAB CONTENTS (Scrollable Inspector) */}
            <div className="p-4 space-y-5 text-xs overflow-y-auto flex-1">
              {/* ================= TAB 1: LESSONS & ORDERING ================= */}
              {activeTab === 'lessons' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-bold block text-sm">دروس کتاب (فصول / پروژه‌ها)</label>
                      <p className="text-[11px] opacity-60">
                        هر پروژه به منزله یک درس از این کتاب است:
                      </p>
                    </div>
                    <button
                      onClick={handleSelectAll}
                      className="text-[11px] text-blue-500 hover:underline cursor-pointer font-semibold"
                    >
                      انتخاب همه ({orderedProjectIds.length})
                    </button>
                  </div>

                  {/* Reorderable Lessons List */}
                  <div className="space-y-2">
                    {orderedProjectIds.map((projectId, index) => {
                      const proj = loadedProjects[projectId] || {
                        id: projectId,
                        title: 'در حال بارگذاری...',
                        pages: [],
                      };
                      const isSelected = selectedProjectIds.includes(projectId);
                      const isEditing = activeEditingProjectId === projectId;
                      const customTitle = projectCustomTitles[projectId] || proj.title || `درس ${index + 1}`;
                      const pageCount = (proj.pages || []).length || 1;

                      return (
                        <div
                          key={projectId}
                          className={`p-2.5 rounded-xl border transition-all ${
                            isEditing
                              ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                              : 'hover:border-slate-400'
                          }`}
                          style={{
                            backgroundColor: isEditing ? undefined : theme.ui.cardBg,
                            borderColor: isEditing ? undefined : theme.ui.border,
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            {/* Checkbox & Order Index */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleToggleSelectProject(projectId)}
                                className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
                                title={isSelected ? 'خروج از کتاب' : 'افزودن به کتاب'}
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>

                              <span className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-[11px] font-bold font-mono shrink-0">
                                {index + 1}
                              </span>

                              <div
                                onClick={() => setActiveEditingProjectId(projectId)}
                                className="min-w-0 flex-1 cursor-pointer"
                              >
                                <div className="font-bold truncate text-xs flex items-center gap-1.5">
                                  <span>{customTitle}</span>
                                  {isEditing && (
                                    <span className="text-[10px] text-blue-500 font-normal">(انتخاب شده)</span>
                                  )}
                                </div>
                                <div className="text-[10px] opacity-60 flex items-center gap-2 mt-0.5">
                                  <span>{pageCount} صفحه</span>
                                  {proj.description && (
                                    <span className="truncate max-w-[140px]">• {proj.description}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Up / Down Reorder Arrows */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0}
                                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                                title="انتقال درس به بالا"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveDown(index)}
                                disabled={index === orderedProjectIds.length - 1}
                                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                                title="انتقال درس به پایین"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ACTIVE LESSON IN-DEPTH EDITOR */}
                  {activeEditingProject && (
                    <div
                      className="p-3.5 rounded-xl border space-y-3 bg-black/5 dark:bg-white/5 mt-4"
                      style={{ borderColor: theme.ui.border }}
                    >
                      <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: theme.ui.border }}>
                        <div className="flex items-center gap-1.5 font-bold text-xs text-blue-500">
                          <Edit3 className="w-4 h-4" />
                          <span>ویرایش مشخصات این درس در کتاب</span>
                        </div>
                        <span className="text-[10px] opacity-60">شناسه: {activeEditingProject.id.slice(0, 8)}</span>
                      </div>

                      {/* Custom Lesson Title in Book */}
                      <div>
                        <label className="text-[11px] opacity-75 block mb-1">
                          عنوان درس در کتاب (نام فصل):
                        </label>
                        <input
                          type="text"
                          value={projectTitleDraft}
                          onChange={(e) => setProjectTitleDraft(e.target.value)}
                          placeholder="عنوان درس..."
                          className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none"
                          style={{ borderColor: theme.ui.border }}
                        />
                      </div>

                      {/* Lesson Description */}
                      <div>
                        <label className="text-[11px] opacity-75 block mb-1">
                          شرح و مقدمه این درس:
                        </label>
                        <textarea
                          rows={2}
                          value={projectDescDraft}
                          onChange={(e) => setProjectDescDraft(e.target.value)}
                          placeholder="توضیحاتی درباره این درس یا اهداف فرآیند..."
                          className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                          style={{ borderColor: theme.ui.border }}
                        />
                      </div>

                      {/* Pages inside this lesson */}
                      {(activeEditingProject.pages || []).length > 1 && (
                        <div className="pt-2 border-t space-y-1.5" style={{ borderColor: theme.ui.border }}>
                          <label className="text-[11px] opacity-75 block">صفحات این درس جهت چاپ:</label>
                          <div className="space-y-1">
                            {(activeEditingProject.pages || []).map((page) => {
                              const includedIds = projectPagesMap[activeEditingProject.id] || (activeEditingProject.pages || []).map(p => p.id);
                              const isPageIncluded = includedIds.includes(page.id);
                              return (
                                <label
                                  key={page.id}
                                  className="flex items-center justify-between p-1.5 rounded-lg bg-black/5 dark:bg-white/5 cursor-pointer text-[11px]"
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isPageIncluded}
                                      onChange={() => handleTogglePageInclusion(activeEditingProject.id, page.id)}
                                      className="rounded accent-blue-600"
                                    />
                                    <span>{page.name}</span>
                                  </div>
                                  <span className="opacity-50 text-[10px] font-mono">{page.nodes.length} گره</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Save Draft Button */}
                      <button
                        onClick={handleApplyChangesToCurrentProject}
                        className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>ذخیره تغییرات این درس</span>
                      </button>

                      {saveFeedback && (
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-center text-[11px] font-semibold animate-in fade-in">
                          {saveFeedback}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ================= TAB 2: BOOK COVER & METADATA EDITOR ================= */}
              {activeTab === 'cover' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold block text-sm mb-1">تنظیمات و شناسنامه جلد کتاب</label>
                    <p className="text-[11px] opacity-60">
                      کلیه متون و مشخصات صفحه اول (جلد کتاب) را می‌توانید مستقیماً ویرایش نمایید:
                    </p>
                  </div>

                  {/* Toggle Include Cover */}
                  <label className="flex items-center justify-between p-3 rounded-xl border bg-black/5 dark:bg-white/5 cursor-pointer" style={{ borderColor: theme.ui.border }}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <div>
                        <span className="font-bold block">صفحه جلد در ابتدای کتاب</span>
                        <span className="text-[10px] opacity-60">جلد رسمی و شناسنامه کامل در صفحه اول سند</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeMasterCover}
                      onChange={(e) => setIncludeMasterCover(e.target.checked)}
                      className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* Cover Style Selector */}
                  <div className="pt-2">
                    <label className="font-bold block mb-1.5 text-xs">طرح گرافیکی جلد:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'modern', name: 'مدرن سازمانی', desc: 'خط شاخص و کادر شیک' },
                        { id: 'academic', name: 'آکادمیک رسمی', desc: 'حاشیه دولایه و نشان' },
                        { id: 'blueprint', name: 'مهندسی فرآیند', desc: 'طرح دیاگرام و شبکه' },
                        { id: 'minimal', name: 'مینیمال خالص', desc: 'فونت بولد و فضای سفید' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          onClick={() => setCoverStyle(st.id as any)}
                          className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                            coverStyle === st.id
                              ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50/40 dark:bg-blue-950/30 font-bold'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ borderColor: coverStyle === st.id ? undefined : theme.ui.border }}
                        >
                          <div className="text-xs">{st.name}</div>
                          <div className="text-[10px] opacity-60 font-normal">{st.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Master Book Title */}
                  <div className="pt-2 border-t space-y-1.5" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block flex items-center justify-between">
                      <span>۱. عنوان اصلی کتاب (Master Title):</span>
                      <span className="text-[10px] text-blue-500 font-normal">روی جلد</span>
                    </label>
                    <input
                      type="text"
                      value={masterDocTitle}
                      onChange={(e) => setMasterDocTitle(e.target.value)}
                      placeholder="عنوان کتاب فرآیندها..."
                      className="w-full px-2.5 py-2 rounded-lg border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                      style={{ borderColor: theme.ui.border }}
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-1.5">
                    <label className="font-bold block flex items-center justify-between">
                      <span>۲. زیرعنوان کتاب (Subtitle):</span>
                    </label>
                    <input
                      type="text"
                      value={masterDocSubtitle}
                      onChange={(e) => setMasterDocSubtitle(e.target.value)}
                      placeholder="شرح کوتاه یا هدف کتاب..."
                      className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none"
                      style={{ borderColor: theme.ui.border }}
                    />
                  </div>

                  {/* Grid: Author & Organization */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] opacity-75 block flex items-center gap-1">
                        <User className="w-3 h-3 text-blue-400" />
                        <span>مؤلف / گردآورنده:</span>
                      </label>
                      <input
                        type="text"
                        value={coverAuthor}
                        onChange={(e) => setCoverAuthor(e.target.value)}
                        placeholder="نام گردآورنده..."
                        className="w-full px-2 py-1.5 rounded-lg border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none"
                        style={{ borderColor: theme.ui.border }}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] opacity-75 block flex items-center gap-1">
                        <Building className="w-3 h-3 text-blue-400" />
                        <span>سازمان / ناشر:</span>
                      </label>
                      <input
                        type="text"
                        value={coverOrganization}
                        onChange={(e) => setCoverOrganization(e.target.value)}
                        placeholder="نام سازمان یا شرکت..."
                        className="w-full px-2 py-1.5 rounded-lg border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none"
                        style={{ borderColor: theme.ui.border }}
                      />
                    </div>
                  </div>

                  {/* Grid: Edition & Date */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] opacity-75 block flex items-center gap-1">
                        <Bookmark className="w-3 h-3 text-blue-400" />
                        <span>نوبت چاپ و نسخه:</span>
                      </label>
                      <input
                        type="text"
                        value={coverEdition}
                        onChange={(e) => setCoverEdition(e.target.value)}
                        placeholder="ویرایش اول • ۱۴۰۵..."
                        className="w-full px-2 py-1.5 rounded-lg border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none"
                        style={{ borderColor: theme.ui.border }}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] opacity-75 block flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-blue-400" />
                          <span>تاریخ چاپ:</span>
                        </label>
                        <button
                          onClick={() => {
                            setCoverDate(
                              new Date().toLocaleDateString('fa-IR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            );
                          }}
                          className="text-[9px] text-blue-500 hover:underline cursor-pointer"
                        >
                          امروز
                        </button>
                      </div>
                      <input
                        type="text"
                        value={coverDate}
                        onChange={(e) => setCoverDate(e.target.value)}
                        placeholder="تاریخ خورشیدی..."
                        className="w-full px-2 py-1.5 rounded-lg border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none"
                        style={{ borderColor: theme.ui.border }}
                      />
                    </div>
                  </div>

                  {/* Preface / Description on Cover */}
                  <div className="space-y-1.5">
                    <label className="font-bold block flex items-center justify-between">
                      <span>پیشگفتار و معرفی کتاب روی جلد:</span>
                    </label>
                    <textarea
                      rows={3}
                      value={coverDescription}
                      onChange={(e) => setCoverDescription(e.target.value)}
                      placeholder="متن مقدمه یا چکیده کتاب..."
                      className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none resize-none leading-relaxed"
                      style={{ borderColor: theme.ui.border }}
                    />
                  </div>

                  {/* Copyright & Disclaimer note */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] opacity-75 block">یادداشت حقوقی و کپی‌رایت جلد:</label>
                    <input
                      type="text"
                      value={coverNotes}
                      onChange={(e) => setCoverNotes(e.target.value)}
                      placeholder="کلیه حقوق مادی و معنوی محفوظ است..."
                      className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none"
                      style={{ borderColor: theme.ui.border }}
                    />
                  </div>
                </div>
              )}

              {/* ================= TAB 3: PAPER & GEOMETRY ================= */}
              {activeTab === 'paper' && (
                <div className="space-y-4">
                  {/* Paper Size */}
                  <div>
                    <label className="font-bold block mb-1.5">{t.paperSize}</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['a4', 'a3', 'letter', 'legal'] as PrintPaperSize[]).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => onUpdateSettings({ ...settings, paperSize: sz })}
                          className={`py-2 rounded-xl border text-center font-bold uppercase transition-all cursor-pointer ${
                            settings.paperSize === sz
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor: settings.paperSize === sz ? undefined : theme.ui.cardBg,
                            borderColor: settings.paperSize === sz ? '#2563EB' : theme.ui.border,
                          }}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orientation */}
                  <div className="pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block mb-1.5">{t.orientation}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onUpdateSettings({ ...settings, orientation: 'landscape' })}
                        className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                          settings.orientation === 'landscape'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor: settings.orientation === 'landscape' ? undefined : theme.ui.cardBg,
                          borderColor: settings.orientation === 'landscape' ? '#2563EB' : theme.ui.border,
                        }}
                      >
                        <span className="w-5 h-3.5 border-2 rounded-xs border-current inline-block" />
                        <span>افقی (Landscape)</span>
                      </button>

                      <button
                        onClick={() => onUpdateSettings({ ...settings, orientation: 'portrait' })}
                        className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                          settings.orientation === 'portrait'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor: settings.orientation === 'portrait' ? undefined : theme.ui.cardBg,
                          borderColor: settings.orientation === 'portrait' ? '#2563EB' : theme.ui.border,
                        }}
                      >
                        <span className="w-3.5 h-5 border-2 rounded-xs border-current inline-block" />
                        <span>عمودی (Portrait)</span>
                      </button>
                    </div>
                  </div>

                  {/* Margins */}
                  <div className="pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block mb-1.5">حاشیه‌های چاپ (Margins):</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'compact', label: 'باریک (8mm)' },
                        { id: 'normal', label: 'عادی (15mm)' },
                        { id: 'generous', label: 'عریض (22mm)' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() =>
                            onUpdateSettings({
                              ...settings,
                              marginSize: m.id as PrintSettings['marginSize'],
                            })
                          }
                          className={`py-1.5 rounded-xl border text-center text-[11px] font-semibold transition-all cursor-pointer ${
                            settings.marginSize === m.id
                              ? 'bg-blue-600 text-white font-bold'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor: settings.marginSize === m.id ? undefined : theme.ui.cardBg,
                            borderColor: settings.marginSize === m.id ? '#2563EB' : theme.ui.border,
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Diagram Border */}
                  <div className="pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block mb-1.5">کادر و حاشیه دیاگرام‌ها:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'none', name: 'بدون کادر' },
                        { id: 'thin', name: 'خط باریک' },
                        { id: 'double', name: 'دوخطی' },
                      ].map((b) => (
                        <button
                          key={b.id}
                          onClick={() =>
                            onUpdateSettings({ ...settings, diagramBorder: b.id as any })
                          }
                          className={`py-1.5 px-2 rounded-xl border text-center text-[11px] font-semibold transition-all cursor-pointer ${
                            settings.diagramBorder === b.id
                              ? 'bg-blue-600 text-white font-bold'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor: settings.diagramBorder === b.id ? undefined : theme.ui.cardBg,
                            borderColor: settings.diagramBorder === b.id ? '#2563EB' : theme.ui.border,
                          }}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Diagram Background Texture */}
                  <div className="pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block mb-1.5">پس‌زمینه دیاگرام‌ها در چاپ:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'white', name: 'سفید خالص' },
                        { id: 'subtle', name: 'خاکستری ملایم' },
                        { id: 'grid', name: 'شطرنجی مهندسی' },
                      ].map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => onUpdateSettings({ ...settings, diagramBg: bg.id as any })}
                          className={`py-1.5 px-2 rounded-xl border text-center font-semibold text-[11px] transition-all cursor-pointer ${
                            settings.diagramBg === bg.id
                              ? 'bg-blue-600 text-white border-blue-600 font-bold'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor: settings.diagramBg === bg.id ? undefined : theme.ui.cardBg,
                            borderColor: settings.diagramBg === bg.id ? '#2563EB' : theme.ui.border,
                          }}
                        >
                          {bg.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spacing Between Sections */}
                  <div className="pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold">فاصله میان اجزای صفحه (Spacing):</label>
                      <span className="font-mono text-blue-600 font-bold">{settings.spacing} px</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={48}
                      step={4}
                      value={settings.spacing}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, spacing: Number(e.target.value) })
                      }
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* ================= TAB 4: HEADER, FOOTER & PAGE NUMBERING ================= */}
              {activeTab === 'headerFooter' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold block text-sm mb-1">سربرگ، پاورقی و شماره‌گذاری کتاب</label>
                    <p className="text-[11px] opacity-60">
                      تنظیم نحوه نمایش هدر درس‌ها و فرمت شماره صفحات کتاب:
                    </p>
                  </div>

                  {/* Show Header & Footer Checkbox */}
                  <label className="flex items-center justify-between p-3 rounded-xl border bg-black/5 dark:bg-white/5 cursor-pointer" style={{ borderColor: theme.ui.border }}>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-blue-500" />
                      <div>
                        <span className="font-bold block">نمایش سربرگ و پاورقی در صفحات</span>
                        <span className="text-[10px] opacity-60">درج هدر استاندارد سازمانی و خط جداکننده</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showHeaderFooter}
                      onChange={(e) => onUpdateSettings({ ...settings, showHeaderFooter: e.target.checked })}
                      className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* Page numbering format */}
                  <div className="pt-2">
                    <label className="font-bold block mb-1.5">فرمت شماره‌گذاری صفحات کتاب:</label>
                    <div className="space-y-1.5">
                      {[
                        { id: 'standard', title: 'استاندارد کتابی', sample: 'صفحه ۱ از ۲۴' },
                        { id: 'lesson_page', title: 'به تفکیک درس', sample: 'درس ۲ • صفحه ۳' },
                        { id: 'simple', title: 'ساده عددی', sample: 'ص ۱' },
                      ].map((fmt) => (
                        <label
                          key={fmt.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                            pageNumberingFormat === fmt.id
                              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30'
                              : 'hover:border-slate-400'
                          }`}
                          style={{ borderColor: pageNumberingFormat === fmt.id ? undefined : theme.ui.border }}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="pageNumbering"
                              checked={pageNumberingFormat === fmt.id}
                              onChange={() => setPageNumberingFormat(fmt.id as any)}
                              className="accent-blue-600"
                            />
                            <span className="font-semibold">{fmt.title}</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 opacity-75">
                            {fmt.sample}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date in header */}
                  <div className="pt-3 border-t space-y-2.5" style={{ borderColor: theme.ui.border }}>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showDate}
                        onChange={(e) => onUpdateSettings({ ...settings, showDate: e.target.checked })}
                        className="rounded accent-blue-600 w-4 h-4"
                      />
                      <span>درج تاریخ پرینت در سربرگ صفحات</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showNotes !== false}
                        onChange={(e) => onUpdateSettings({ ...settings, showNotes: e.target.checked })}
                        className="rounded accent-blue-600 w-4 h-4"
                      />
                      <span>نمایش کادر نکات و ملاحظات (Notes) زیر نمودارها</span>
                    </label>
                  </div>

                  {/* Custom Global Footer Note */}
                  <div className="pt-3 border-t space-y-1.5" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block">متن پانویس صفحات کتاب (Footer Note):</label>
                    <input
                      type="text"
                      value={settings.footerNote || ''}
                      onChange={(e) => onUpdateSettings({ ...settings, footerNote: e.target.value })}
                      placeholder="متن دلخواه برای پاورقی تمام صفحات..."
                      className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none"
                      style={{ borderColor: theme.ui.border }}
                    />
                  </div>
                </div>
              )}

              {/* ================= TAB 5: TABLE OF CONTENTS & STYLE ================= */}
              {activeTab === 'tocStyle' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold block text-sm mb-1">فهرست مطالب و تم رنگی کتاب</label>
                    <p className="text-[11px] opacity-60">
                      انتخاب رنگ سازمانی، خطوط شاخص و مدیریت فهرست عناوین:
                    </p>
                  </div>

                  {/* Toggle Table of Contents */}
                  <label className="flex items-center justify-between p-3 rounded-xl border bg-black/5 dark:bg-white/5 cursor-pointer" style={{ borderColor: theme.ui.border }}>
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-blue-500" />
                      <div>
                        <span className="font-bold block">فهرست عناوین دروس کتاب</span>
                        <span className="text-[10px] opacity-60">نمایش فهرست جامع با تفکیک شماره دروس و صفحات</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeTableOfContents}
                      onChange={(e) => setIncludeTableOfContents(e.target.checked)}
                      className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* Accent Color Picker */}
                  <div className="pt-2">
                    <label className="font-bold block mb-1.5">رنگ عطف و المان‌های شاخص کتاب:</label>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        { color: '#2563EB', name: 'آبی کبالت' },
                        { id: 'navy', color: '#1E3A8A', name: 'سرمه‌ای رسمی' },
                        { id: 'emerald', color: '#059669', name: 'سبز زمردی' },
                        { id: 'amber', color: '#D97706', name: 'کهربایی' },
                        { id: 'rose', color: '#E11D48', name: 'یاقوتی' },
                        { id: 'violet', color: '#7C3AED', name: 'بنفش رویال' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          onClick={() => onUpdateSettings({ ...settings, accentColor: c.color })}
                          className={`w-full h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                            settings.accentColor === c.color ? 'ring-2 ring-white scale-110 shadow-md' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.color, borderColor: '#ffffff30' }}
                          title={c.name}
                        >
                          {settings.accentColor === c.color && <Check className="w-4 h-4 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Selection */}
                  <div className="pt-3 border-t space-y-2" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block">فونت متون کتاب:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'system', name: 'فونت سامانه' },
                        { id: 'iranyekan', name: 'ایران‌یکان (IRANYekan)' },
                        { id: 'vazir', name: 'وزیرمتن (Vazirmatn)' },
                        { id: 'tahoma', name: 'تاهوماه (Tahoma)' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => onUpdateSettings({ ...settings, fontFamily: f.id as any })}
                          className={`py-2 px-2.5 rounded-xl border text-center font-semibold text-[11px] transition-all cursor-pointer ${
                            settings.fontFamily === f.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor: settings.fontFamily === f.id ? undefined : theme.ui.cardBg,
                            borderColor: settings.fontFamily === f.id ? '#2563EB' : theme.ui.border,
                          }}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description font size */}
                  <div className="pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold">سایز قلم شرح فرآیندها:</label>
                      <span className="font-mono text-blue-600 font-bold">{settings.descFontSize} px</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={20}
                      step={1}
                      value={settings.descFontSize}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, descFontSize: Number(e.target.value) })
                      }
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Export Bar at bottom of Inspector */}
            <div
              className="mt-auto p-3 border-t flex flex-col gap-2 shrink-0 bg-black/5 dark:bg-white/5"
              style={{ borderColor: theme.ui.border }}
            >
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadHtml}
                  disabled={isDownloadingHtml}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer disabled:opacity-40"
                  style={{ borderColor: theme.ui.border }}
                  title="دانلود گزارش مستقل و قابل ذخیره HTML"
                >
                  <Download className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isDownloadingHtml ? 'دانلود...' : 'دانلود HTML کتاب'}</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf || effectiveOrderedProjects.length === 0}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer disabled:opacity-40"
                  style={{ borderColor: theme.ui.border }}
                  title="دانلود PDF چندصفحه‌ای کتاب با کیفیت برداری"
                >
                  <FileDown className="w-3.5 h-3.5 text-rose-500" />
                  <span>{isExportingPdf ? 'بیلد PDF...' : 'PDF چندصفحه‌ای'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= CENTER: Studio Desk Simulator & Book Preview ================= */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-hidden relative">
            {/* Desk Top Toolbar */}
            <div className="h-11 px-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0 text-xs">
              {/* Left Desk: Page indicator & Page switcher */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-bold text-[11px] text-slate-200">
                    {activePreviewItem?.type === 'cover'
                      ? 'جلد کتاب (Book Cover)'
                      : `درس ${activePreviewItem?.lessonIndex}: ${activePreviewItem?.lessonTitle} • ص ${activePreviewItem?.pageIndexInLesson}`}
                  </span>
                </div>

                {totalSheetsCount > 1 && (
                  <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-1.5 py-0.5 border border-slate-700">
                    <button
                      onClick={() =>
                        setPreviewGlobalPageIndex((i) =>
                          i > 0 ? i - 1 : totalSheetsCount - 1
                        )
                      }
                      className="p-1 rounded hover:bg-slate-700 text-slate-300 cursor-pointer"
                      title="صفحه قبلی کتاب"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <span className="font-mono text-[10px] px-1 font-bold text-slate-200">
                      {safeGlobalIndex + 1} / {totalSheetsCount}
                    </span>
                    <button
                      onClick={() =>
                        setPreviewGlobalPageIndex((i) =>
                          i < totalSheetsCount - 1 ? i + 1 : 0
                        )
                      }
                      className="p-1 rounded hover:bg-slate-700 text-slate-300 cursor-pointer"
                      title="صفحه بعدی کتاب"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Center Zoom Controls */}
              <div className="flex items-center gap-1.5 bg-slate-800 rounded-xl px-2 py-1 border border-slate-700">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                  className="p-1 rounded hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="کوچک‌نمایی"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] px-1.5 font-bold min-w-[42px] text-center text-slate-200">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(180, z + 15))}
                  className="p-1 rounded hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="بزرگ‌نمایی"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="text-[10px] px-1.5 py-0.5 rounded hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                  title="اندازه واقعی ۱۰۰٪"
                >
                  100%
                </button>
              </div>

              {/* Right Desk: Quick Paper Flip & Spread view */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      orientation: settings.orientation === 'landscape' ? 'portrait' : 'landscape',
                    })
                  }
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 transition-all cursor-pointer"
                  title="تغییر جهت کاغذ (افقی / عمودی)"
                >
                  <Layout className="w-3 h-3 text-blue-400" />
                  <span>{settings.orientation === 'landscape' ? 'افقی' : 'عمودی'}</span>
                </button>
              </div>
            </div>

            {/* Studio Canvas Viewport */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center relative">
              {/* VIEW MODE 1: SINGLE SHEET PREVIEW */}
              {viewMode === 'sheet' && (
                <div
                  className="transition-transform duration-200 origin-center flex justify-center"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  {/* Real Paper Simulator */}
                  <div
                    className="bg-white text-slate-900 shadow-2xl relative transition-all duration-300 flex flex-col"
                    style={{
                      width: settings.orientation === 'landscape' ? '860px' : '620px',
                      minHeight: settings.orientation === 'landscape' ? '608px' : '877px',
                      padding: `${getMarginMm(settings.marginSize) * 2.8}px`,
                      fontFamily: fontFamilyCss,
                      borderRadius: '4px',
                    }}
                  >
                    {/* IF ACTIVE ITEM IS COVER PAGE */}
                    {activePreviewItem?.type === 'cover' ? (
                      <div className="flex-1 flex flex-col justify-between h-full border border-slate-200 rounded-lg p-6 sm:p-8 relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
                        {/* Top decorative accent bar */}
                        <div
                          className="absolute top-0 left-0 right-0 h-2.5"
                          style={{ backgroundColor: accentColor }}
                        />

                        {/* Cover Header */}
                        <div>
                          <div className="flex items-center justify-between mb-6">
                            <span
                              className="font-bold text-xs px-3 py-1 rounded-full border"
                              style={{
                                color: accentColor,
                                borderColor: `${accentColor}40`,
                                backgroundColor: `${accentColor}10`,
                              }}
                            >
                              {coverOrganization}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono font-medium">
                              {coverEdition}
                            </span>
                          </div>

                          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug mb-2">
                            {masterDocTitle}
                          </h1>
                          <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium">
                            {masterDocSubtitle}
                          </p>

                          {/* Metadata Summary Card */}
                          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs mb-5">
                            <div>
                              <span className="block text-[10px] text-slate-500 mb-0.5">مؤلف / گردآورنده:</span>
                              <strong className="text-slate-800">{coverAuthor}</strong>
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500 mb-0.5">تاریخ تدوین و چاپ:</span>
                              <strong className="text-slate-800">{coverDate}</strong>
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500 mb-0.5">تعداد دروس (پروژه‌ها):</span>
                              <strong className="font-mono text-blue-600 font-bold">
                                {effectiveOrderedProjects.length} درس
                              </strong>
                            </div>
                          </div>

                          {/* Foreword / Description Box */}
                          {coverDescription && (
                            <div
                              className="p-3.5 rounded-xl text-xs leading-relaxed border-r-4 mb-5"
                              style={{
                                backgroundColor: '#F8FAFC',
                                borderColor: accentColor,
                              }}
                            >
                              <strong className="block text-slate-800 mb-1 text-[11px]">
                                پیشگفتار و معرفی کتاب:
                              </strong>
                              <p className="text-slate-600">{coverDescription}</p>
                            </div>
                          )}

                          {/* Table of Contents Summary */}
                          {includeTableOfContents && (
                            <div className="border border-slate-200 rounded-xl p-3 bg-white">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                                <span>فهرست عناوین دروس کتاب:</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {effectiveOrderedProjects.length} درس • {totalSheetsCount - 1} صفحه دیاگرام
                                </span>
                              </div>
                              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {effectiveOrderedProjects.map((p, idx) => {
                                  const count = (p.pages || []).length || 1;
                                  const lessonTitle = projectCustomTitles[p.id] || p.title || `درس ${idx + 1}`;
                                  return (
                                    <div
                                      key={p.id}
                                      className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px]"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="font-bold font-mono text-[10px] px-1.5 py-0.5 rounded"
                                          style={{
                                            color: accentColor,
                                            backgroundColor: `${accentColor}15`,
                                          }}
                                        >
                                          درس {idx + 1}
                                        </span>
                                        <span className="font-semibold text-slate-800">{lessonTitle}</span>
                                      </div>
                                      <span className="text-slate-400 font-mono text-[10px]">{count} صفحه</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Cover Footer */}
                        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 mt-6">
                          <div>{coverNotes}</div>
                          <div className="font-mono font-bold" style={{ color: accentColor }}>
                            Process Master Book • Portfolio Edition
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* IF ACTIVE ITEM IS DIAGRAM PAGE */
                      <div className="flex-1 flex flex-col justify-between h-full">
                        {/* Page Header */}
                        {settings.showHeaderFooter && (
                          <div className="pb-3 border-b border-slate-200 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="font-bold px-2 py-0.5 rounded text-[10px]"
                                style={{
                                  backgroundColor: `${accentColor}15`,
                                  color: accentColor,
                                }}
                              >
                                درس {activePreviewItem?.lessonIndex}
                              </span>
                              <strong className="text-slate-800 truncate">
                                {activePreviewItem?.lessonTitle}
                              </strong>
                              <span className="text-slate-400">• {activePreviewItem?.page?.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono shrink-0">
                              {masterDocTitle}
                            </div>
                          </div>
                        )}

                        {/* Center Diagram SVG */}
                        <div
                          className="flex-1 flex items-center justify-center my-4 overflow-hidden rounded-lg p-2"
                          style={{
                            backgroundColor:
                              settings.diagramBg === 'white'
                                ? '#ffffff'
                                : settings.diagramBg === 'subtle'
                                ? '#f8fafc'
                                : '#ffffff',
                            border:
                              settings.diagramBorder === 'thin'
                                ? '1px solid #cbd5e1'
                                : settings.diagramBorder === 'double'
                                ? '3px double #cbd5e1'
                                : 'none',
                          }}
                        >
                          {previewSvgMarkup ? (
                            <div
                              className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-[500px] [&>svg]:w-auto [&>svg]:h-auto"
                              dangerouslySetInnerHTML={{ __html: previewSvgMarkup.svg }}
                            />
                          ) : (
                            <div className="text-center p-8 text-slate-400 text-xs">
                              نمودار برای نمایش در دسترس نیست
                            </div>
                          )}
                        </div>

                        {/* Description Box */}
                        {activePreviewItem?.page?.description && (
                          <div
                            className="p-3 rounded-lg border border-slate-200 text-xs leading-relaxed mb-2"
                            style={{ backgroundColor: '#F8FAFC' }}
                          >
                            <span className="font-bold text-slate-700 block mb-1">
                              شرح فرآیند ({activePreviewItem?.page?.name}):
                            </span>
                            <p className="text-slate-600">{activePreviewItem.page.description}</p>
                          </div>
                        )}

                        {/* Page Footer */}
                        {settings.showHeaderFooter && (
                          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                            <div>{settings.footerNote || coverNotes}</div>
                            <div className="font-mono">
                              {pageNumberingFormat === 'lesson_page'
                                ? `درس ${activePreviewItem?.lessonIndex} • ص ${activePreviewItem?.pageIndexInLesson}`
                                : pageNumberingFormat === 'simple'
                                ? `ص ${activePreviewItem?.globalPageNumber}`
                                : `صفحه ${activePreviewItem?.globalPageNumber} از ${totalSheetsCount}`}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW MODE 2: TWO-PAGE BOOK SPREAD (کتاب باز) */}
              {viewMode === 'spread' && (
                <div
                  className="transition-transform duration-200 origin-center flex items-center justify-center gap-2"
                  style={{ transform: `scale(${(zoomLevel / 100) * 0.72})` }}
                >
                  {/* Left Page (Safe index) */}
                  <div
                    className="bg-white text-slate-900 shadow-2xl relative rounded-l-md border-r-2 border-slate-300 p-8 flex flex-col justify-between"
                    style={{
                      width: '560px',
                      height: '760px',
                      fontFamily: fontFamilyCss,
                    }}
                  >
                    <div className="text-xs font-bold text-slate-400 flex justify-between border-b pb-2">
                      <span>{masterDocTitle}</span>
                      <span>صفحه {safeGlobalIndex + 1}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center text-center p-4">
                      {activePreviewItem?.type === 'cover' ? (
                        <div className="space-y-4">
                          <BookOpen className="w-12 h-12 text-blue-600 mx-auto" />
                          <h2 className="text-2xl font-bold">{masterDocTitle}</h2>
                          <p className="text-xs text-slate-600">{masterDocSubtitle}</p>
                          <span className="inline-block text-[10px] font-mono bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-200">
                            {coverEdition}
                          </span>
                        </div>
                      ) : (
                        <div className="w-full">
                          <h3 className="font-bold text-sm mb-2 text-slate-800">
                            {activePreviewItem?.lessonTitle}
                          </h3>
                          {previewSvgMarkup && (
                            <div
                              className="[&>svg]:max-w-full [&>svg]:max-h-[420px] mx-auto"
                              dangerouslySetInnerHTML={{ __html: previewSvgMarkup.svg }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 pt-2 border-t flex justify-between">
                      <span>{coverOrganization}</span>
                      <span>{coverAuthor}</span>
                    </div>
                  </div>

                  {/* Book Spine Crease */}
                  <div className="w-2 h-[760px] bg-gradient-to-r from-slate-400 via-slate-600 to-slate-400 shadow-inner rounded-xs shrink-0" />

                  {/* Right Page (Next Page) */}
                  {(() => {
                    const nextIndex = (safeGlobalIndex + 1) % totalSheetsCount;
                    const nextItem = flattenedPreviewPages[nextIndex];
                    const nextSvg =
                      nextItem?.type === 'diagram' && nextItem?.page
                        ? generatePageSvgMarkup(nextItem.page, settings.colorMode)
                        : null;

                    return (
                      <div
                        className="bg-white text-slate-900 shadow-2xl relative rounded-r-md border-l-2 border-slate-300 p-8 flex flex-col justify-between"
                        style={{
                          width: '560px',
                          height: '760px',
                          fontFamily: fontFamilyCss,
                        }}
                      >
                        <div className="text-xs font-bold text-slate-400 flex justify-between border-b pb-2">
                          <span>{nextItem?.lessonTitle || masterDocTitle}</span>
                          <span>صفحه {nextIndex + 1}</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center text-center p-4">
                          {nextItem?.type === 'cover' ? (
                            <div className="space-y-4">
                              <BookOpen className="w-12 h-12 text-blue-600 mx-auto" />
                              <h2 className="text-2xl font-bold">{masterDocTitle}</h2>
                            </div>
                          ) : (
                            <div className="w-full">
                              <h3 className="font-bold text-sm mb-2 text-slate-800">
                                {nextItem?.lessonTitle} • {nextItem?.page?.name}
                              </h3>
                              {nextSvg && (
                                <div
                                  className="[&>svg]:max-w-full [&>svg]:max-h-[420px] mx-auto"
                                  dangerouslySetInnerHTML={{ __html: nextSvg.svg }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 pt-2 border-t flex justify-between">
                          <span>{coverNotes}</span>
                          <span className="font-mono">ص {nextIndex + 1}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* VIEW MODE 3: GRID GALLERY OF ALL BOOK PAGES */}
              {viewMode === 'grid' && (
                <div className="w-full h-full overflow-y-auto p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {flattenedPreviewPages.map((item, idx) => {
                      const isSelected = safeGlobalIndex === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setPreviewGlobalPageIndex(idx);
                            setViewMode('sheet');
                          }}
                          className={`aspect-[3/4] bg-white rounded-xl shadow-md p-3 flex flex-col justify-between border-2 cursor-pointer transition-all hover:scale-105 ${
                            isSelected
                              ? 'border-blue-500 ring-4 ring-blue-500/30'
                              : 'border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <div className="text-[10px] font-bold text-slate-500 flex justify-between">
                            <span className="font-mono">صفحه {idx + 1}</span>
                            {item.type === 'cover' ? (
                              <span className="text-blue-600 font-bold">جلد</span>
                            ) : (
                              <span>درس {item.lessonIndex}</span>
                            )}
                          </div>

                          <div className="flex-1 flex items-center justify-center text-center p-2">
                            {item.type === 'cover' ? (
                              <div className="space-y-1">
                                <BookOpen className="w-8 h-8 text-blue-600 mx-auto" />
                                <strong className="text-[11px] text-slate-800 line-clamp-2">
                                  {masterDocTitle}
                                </strong>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Layout className="w-6 h-6 text-slate-400 mx-auto" />
                                <span className="text-[11px] text-slate-700 font-bold block truncate">
                                  {item.lessonTitle}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {item.page?.name}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="text-[9px] text-slate-400 text-center truncate border-t pt-1">
                            {item.type === 'cover' ? coverEdition : `${item.page?.nodes.length || 0} گره`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* VIEW MODE 4: RAW HTML PREVIEW */}
              {viewMode === 'html' && (
                <div className="w-full h-full p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300">
                      کد کامل و مستقل HTML پرینت تجمیعی (شامل استایل‌ها و وکتورها):
                    </span>
                    <button
                      onClick={handleCopyHtml}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      {isCopiedHtml ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>کپی تمام کد</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={generateAggregatePrintReportHtml(effectiveOrderedProjects, settings, aggregateOptions)}
                    className="flex-1 w-full bg-slate-950 text-slate-300 font-mono text-[11px] p-4 rounded-xl border border-slate-800 outline-none resize-none leading-relaxed"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
