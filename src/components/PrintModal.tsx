import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ColorTheme } from '../constants/themes';
import { TranslationDictionary } from '../constants/translations';
import {
  FlowchartProject,
  FlowchartPage,
  PrintSettings,
  PrintColorMode,
  PrintPaperSize,
  PrintOrientation,
  PrintDescPosition,
  PrintTextAlign,
  PrintSplitPosition,
} from '../types/flowchart';
import {
  DEFAULT_PRINT_SETTINGS,
  generatePageSvgMarkup,
  triggerPrintDialog,
  exportMultiPagePdf,
  generatePrintReportHtml,
  getFontFamilyCss,
  exportHighResPng,
} from '../utils/printUtils';
import { ProjectSummary } from './ProjectsModal';
import { AggregatePrintStudio } from './AggregatePrintStudio';
import {
  X,
  Printer,
  FileDown,
  Type,
  Layout,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Check,
  Eye,
  FileCode,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileText,
  Lightbulb,
  Save,
  Download,
  BookOpen,
  CheckCheck,
  Copy,
  Upload,
  Plus,
  Columns,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: FlowchartProject;
  theme: ColorTheme;
  t: TranslationDictionary;
  onUpdateProject?: (updated: FlowchartProject) => void;
  projectsList?: ProjectSummary[];
  initialMode?: 'single' | 'aggregate';
  onUpdateAnyProject?: (updated: FlowchartProject) => Promise<void> | void;
}

type EditorTab = 'presets' | 'typography' | 'blocks' | 'diagram' | 'paper';
type ViewMode = 'sheet' | 'html';

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  project,
  theme,
  t,
  onUpdateProject,
  projectsList = [],
  initialMode = 'single',
  onUpdateAnyProject,
}) => {
  // Mode: single project or aggregate multi-project
  const [printMode, setPrintMode] = useState<'single' | 'aggregate'>(initialMode);

  useEffect(() => {
    if (isOpen && initialMode) {
      setPrintMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Main settings state with project defaults
  const [settings, setSettings] = useState<PrintSettings>(() => ({
    ...DEFAULT_PRINT_SETTINGS,
    documentTitle: project.title || 'فلوچارت فرآیند',
    organizationName: 'سازمان / دپارتمان فرآیندها',
  }));

  const [activeTab, setActiveTab] = useState<EditorTab>('presets');
  const [viewMode, setViewMode] = useState<ViewMode>('sheet');
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showMarginGuides, setShowMarginGuides] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Custom Font uploading state
  const [uploadedFontFileName, setUploadedFontFileName] = useState<string>('');
  const [manualFontInput, setManualFontInput] = useState<string>('');
  const [manualFontUrlInput, setManualFontUrlInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Export states
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isDownloadingHtml, setIsDownloadingHtml] = useState(false);
  const [isHtmlCopied, setIsHtmlCopied] = useState(false);
  const [isSavedToProject, setIsSavedToProject] = useState(false);

  // Active editable description, notes and image state (synced with current page)
  const [localPageDesc, setLocalPageDesc] = useState<string>('');
  const [localPageNotes, setLocalPageNotes] = useState<string>('');
  const [localPageImage, setLocalPageImage] = useState<string>('');

  // Available flowchart pages
  const availablePages = useMemo<FlowchartPage[]>(() => {
    if (settings.targetPages === 'current') {
      const active = (project.pages || []).find((p) => p.id === project.activePageId);
      return active ? [active] : project.pages || [];
    }
    return project.pages && project.pages.length > 0
      ? project.pages
      : [
          {
            id: 'p1',
            name: 'صفحه اصلی',
            description: '',
            notes: '',
            imageUrl: '',
            nodes: project.nodes || [],
            edges: project.edges || [],
          },
        ];
  }, [project, settings.targetPages]);

  // Current page validation
  const safePageIndex = Math.min(previewPageIndex, Math.max(0, availablePages.length - 1));
  const activePreviewPage = availablePages[safePageIndex] || availablePages[0];

  // Sync local description, notes and image when switching pages
  useEffect(() => {
    if (activePreviewPage) {
      setLocalPageDesc(activePreviewPage.description || '');
      setLocalPageNotes(activePreviewPage.notes || '');
      setLocalPageImage(activePreviewPage.imageUrl || '');
    }
  }, [activePreviewPage?.id, activePreviewPage?.description, activePreviewPage?.notes, activePreviewPage?.imageUrl]);

  const handlePageDescChange = (val: string) => {
    setLocalPageDesc(val);
    if (onUpdateProject && activePreviewPage) {
      const updatedPages = (project.pages || []).map((p) =>
        p.id === activePreviewPage.id ? { ...p, description: val, notes: localPageNotes, imageUrl: localPageImage } : p
      );
      onUpdateProject({
        ...project,
        pages: updatedPages,
      });
    }
  };

  const handlePageNotesChange = (val: string) => {
    setLocalPageNotes(val);
    if (onUpdateProject && activePreviewPage) {
      const updatedPages = (project.pages || []).map((p) =>
        p.id === activePreviewPage.id ? { ...p, description: localPageDesc, notes: val, imageUrl: localPageImage } : p
      );
      onUpdateProject({
        ...project,
        pages: updatedPages,
      });
    }
  };

  const handlePageImageChange = (val: string) => {
    setLocalPageImage(val);
    if (onUpdateProject && activePreviewPage) {
      const updatedPages = (project.pages || []).map((p) =>
        p.id === activePreviewPage.id ? { ...p, description: localPageDesc, notes: localPageNotes, imageUrl: val } : p
      );
      onUpdateProject({
        ...project,
        pages: updatedPages,
      });
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handlePageImageChange(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle custom font file upload (.woff2, .woff, .ttf, .otf)
  const handleFontFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
    const reader = new FileReader();

    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      try {
        const fontFace = new FontFace(baseName, `url(${dataUrl})`);
        await fontFace.load();
        document.fonts.add(fontFace);

        setUploadedFontFileName(file.name);
        setSettings((prev) => ({
          ...prev,
          fontFamily: 'custom',
          customFontName: baseName,
          customFontUrl: dataUrl,
        }));
      } catch (err) {
        console.error('Failed to load font file:', err);
      }
    };

    reader.readAsDataURL(file);
  };

  // Handle manual font name submit
  const handleApplyManualFontName = () => {
    if (!manualFontInput.trim()) return;
    const fontName = manualFontInput.trim();
    setSettings((prev) => ({
      ...prev,
      fontFamily: 'custom',
      customFontName: fontName,
      customFontUrl: manualFontUrlInput.trim() || prev.customFontUrl,
    }));
  };

  // Generate SVG markup for current preview page
  const pageSvgResult = useMemo(() => {
    if (!isOpen || !activePreviewPage) return { svg: '', width: 600, height: 400 };
    return generatePageSvgMarkup(activePreviewPage, settings.colorMode);
  }, [isOpen, activePreviewPage, settings.colorMode]);

  // Real-time project snapshot with live description and notes edits
  const projectWithLiveEdits = useMemo<FlowchartProject>(() => {
    if (!isOpen) return project;
    const updatedPages = (project.pages || []).map((p) =>
      p.id === activePreviewPage?.id
        ? { ...p, description: localPageDesc, notes: localPageNotes }
        : p
    );
    return {
      ...project,
      title: settings.documentTitle || project.title,
      description: project.description,
      notes: project.notes,
      pages:
        updatedPages.length > 0
          ? updatedPages
          : [
              {
                id: activePreviewPage?.id || 'p1',
                name: activePreviewPage?.name || 'صفحه اصلی',
                description: localPageDesc || '',
                notes: localPageNotes || '',
                nodes: activePreviewPage?.nodes || project.nodes || [],
                edges: activePreviewPage?.edges || project.edges || [],
              },
            ],
    };
  }, [isOpen, project, activePreviewPage, localPageDesc, localPageNotes, settings.documentTitle]);

  if (!isOpen) return null;

  if (printMode === 'aggregate') {
    return (
      <AggregatePrintStudio
        currentProject={project}
        projectsList={projectsList}
        theme={theme}
        t={t}
        settings={settings}
        onUpdateSettings={setSettings}
        onClose={onClose}
        onSaveProject={onUpdateAnyProject || (async (p) => { onUpdateProject?.(p); })}
        onSwitchToSingleMode={() => setPrintMode('single')}
      />
    );
  }

  // Apply predefined layout presets
  const applyPreset = (preset: NonNullable<PrintSettings['preset']>) => {
    switch (preset) {
      case 'formal':
        setSettings((s) => ({
          ...s,
          preset: 'formal',
          showHeaderFooter: true,
          showDate: true,
          showBorders: true,
          diagramBorder: 'thin',
          diagramBg: 'white',
          colorMode: 'color',
          accentColor: '#1E40AF',
          descPosition: 'below',
        }));
        break;
      case 'iso':
        setSettings((s) => ({
          ...s,
          preset: 'iso',
          showHeaderFooter: true,
          showDate: true,
          showBorders: true,
          diagramBorder: 'double',
          diagramBg: 'white',
          colorMode: 'color',
          accentColor: '#0F766E',
          descPosition: 'above',
        }));
        break;
      case 'modern':
        setSettings((s) => ({
          ...s,
          preset: 'modern',
          showHeaderFooter: true,
          showDate: true,
          showBorders: true,
          diagramBorder: 'shadow',
          diagramBg: 'subtle',
          colorMode: 'color',
          accentColor: '#6366F1',
          descPosition: 'below',
        }));
        break;
      case 'minimal':
        setSettings((s) => ({
          ...s,
          preset: 'minimal',
          showHeaderFooter: true,
          showDate: true,
          showBorders: true,
          diagramBorder: 'thin',
          diagramBg: 'white',
          colorMode: 'monochrome',
          accentColor: '#000000',
          descPosition: 'below',
        }));
        break;
      case 'diagramOnly':
        setSettings((s) => ({
          ...s,
          preset: 'diagramOnly',
          showHeaderFooter: false,
          showDate: false,
          showBorders: false,
          diagramBorder: 'none',
          diagramBg: 'white',
          diagramScale: 110,
          colorMode: 'color',
        }));
        break;
    }
  };

  // Actions
  const handlePrint = () => {
    triggerPrintDialog(projectWithLiveEdits, settings);
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportMultiPagePdf(projectWithLiveEdits, settings);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!activePreviewPage) return;
    setIsExportingPng(true);
    try {
      const pageToExport = {
        ...activePreviewPage,
        description: localPageDesc,
        notes: localPageNotes,
      };
      await exportHighResPng(pageToExport, settings, settings.documentTitle || project.title);
    } catch (err) {
      console.error('PNG export error:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleDownloadHtml = () => {
    setIsDownloadingHtml(true);
    try {
      const html = generatePrintReportHtml(projectWithLiveEdits, settings);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${settings.documentTitle || project.title || 'flowchart'}-print-ready.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setIsDownloadingHtml(false), 800);
    }
  };

  const handleCopyHtml = () => {
    const html = generatePrintReportHtml(projectWithLiveEdits, settings);
    navigator.clipboard.writeText(html);
    setIsHtmlCopied(true);
    setTimeout(() => setIsHtmlCopied(false), 2000);
  };

  // Sync edits back into flowchart project
  const handleSaveToProject = () => {
    if (!onUpdateProject) return;

    const updatedPages = (project.pages || []).map((p) =>
      p.id === activePreviewPage.id
        ? { ...p, description: localPageDesc, notes: localPageNotes }
        : p
    );

    const updatedProject: FlowchartProject = {
      ...project,
      title: settings.documentTitle || project.title,
      pages: updatedPages.length > 0 ? updatedPages : project.pages,
    };

    onUpdateProject(updatedProject);
    setIsSavedToProject(true);
    setTimeout(() => setIsSavedToProject(false), 2500);
  };

  const fontFamilyCss = getFontFamilyCss(settings.fontFamily, settings.customFontName);
  const accentColor = settings.accentColor || '#2563EB';
  const effectiveTitle = settings.documentTitle || project.title || 'فلوچارت فرآیند';
  const effectiveOrg = settings.organizationName || 'سازمان / دپارتمان فرآیندها';

  // Diagram border CSS for live preview
  const getDiagramBorderClass = () => {
    if (!settings.showBorders) return '';
    switch (settings.diagramBorder) {
      case 'double':
        return 'border-4 border-double border-slate-400';
      case 'dashed':
        return 'border border-dashed border-slate-400';
      case 'shadow':
        return 'border border-slate-200 shadow-md';
      case 'none':
        return '';
      case 'thin':
      default:
        return 'border border-slate-300';
    }
  };

  // Diagram background CSS for live preview
  const getDiagramBgClass = () => {
    switch (settings.diagramBg) {
      case 'subtle':
        return 'bg-slate-50';
      case 'grid':
        return 'bg-white bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]';
      case 'white':
      default:
        return 'bg-white';
    }
  };

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
        {/* TOP BAR: Studio Navigation & Primary Actions */}
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
              <Printer className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base truncate" style={{ color: '#aec5ff' }}>
                  استودیوی ویرایش و چاپ
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 hidden sm:inline-block">
                  Print Studio
                </span>
              </div>
              <p className="text-[11px] opacity-60 truncate" style={{ color: '#c3e0ef' }}>
                {effectiveTitle} • {availablePages.length} صفحه • قطع {settings.paperSize.toUpperCase()}{' '}
                {settings.orientation === 'landscape' ? 'افقی' : 'عمودی'}
              </p>
            </div>
          </div>

          {/* Center Mode Switchers */}
          <div className="flex items-center gap-2">
            {/* 1. Single vs Aggregate Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setPrintMode('single')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.singleProjectPrint || 'پرینت پروژه جاری'}</span>
              </button>
              <button
                onClick={() => setPrintMode('aggregate')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg opacity-70 hover:opacity-100 transition-all cursor-pointer"
                title="پرینت تجمیعی چند پروژه با امکان مرتب‌سازی و ویرایش"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t.aggregatePrint || 'پرینت تجمیعی'}</span>
                {projectsList.length > 1 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                    {projectsList.length}
                  </span>
                )}
              </button>
            </div>

            {/* 2. Sheet vs HTML Preview Switcher */}
            <div className="hidden md:flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setViewMode('sheet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'sheet'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>پیش‌نمایش زنده صفحه</span>
              </button>
              <button
                onClick={() => setViewMode('html')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'html'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>کد HTML چاپ</span>
              </button>
            </div>
          </div>

          {/* Right Top Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {onUpdateProject && (
              <button
                onClick={handleSaveToProject}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                style={{ borderColor: theme.ui.border }}
                title="ذخیره عنوان و یادداشت‌های ویرایش شده در فلوچارت"
              >
                {isSavedToProject ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 font-bold">ذخیره شد!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-blue-500" />
                    <span>ذخیره در پروژه</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              style={{ borderColor: theme.ui.border }}
              title="دانلود فایل PDF با کیفیت برداری"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-500" />
              <span>{isExportingPdf ? 'در حال بیلد...' : 'دانلود PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>{t.printNow}</span>
            </button>

            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-1.5 rounded-lg hover:opacity-70 transition-opacity hidden sm:block"
              title={isFullscreen ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه استودیو'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
              title="بستن پنجره"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WORKSPACE BODY: Left Inspector Tabs + Center Desk Simulator */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* ===================== LEFT: Comprehensive Editor & Inspector ===================== */}
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
                onClick={() => setActiveTab('presets')}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                  activeTab === 'presets'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                }`}
                title="قالب‌های آماده سند"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="truncate w-full text-[10px]">قالب‌ها</span>
              </button>

              <button
                onClick={() => setActiveTab('typography')}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                  activeTab === 'typography'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                }`}
                title="انتخاب و افزودن دستی فونت"
              >
                <Type className="w-3.5 h-3.5" />
                <span className="truncate w-full text-[10px]">قلم و فونت</span>
              </button>

              <button
                onClick={() => setActiveTab('blocks')}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                  activeTab === 'blocks'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                }`}
                title="بلوک‌های سربرگ و توضیحات"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="truncate w-full text-[10px]">بلوک‌ها</span>
              </button>

              <button
                onClick={() => setActiveTab('diagram')}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                  activeTab === 'diagram'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                }`}
                title="تنظیمات مقیاس و قاب دیاگرام"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="truncate w-full text-[10px]">دیاگرام</span>
              </button>

              <button
                onClick={() => setActiveTab('paper')}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                  activeTab === 'paper'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                }`}
                title="تنظیمات کاغذ و جهت چاپ"
              >
                <Layout className="w-3.5 h-3.5" />
                <span className="truncate w-full text-[10px]">کاغذ</span>
              </button>
            </div>

            {/* TAB CONTENTS (Scrollable Inspector) */}
            <div className="p-4 space-y-5 text-xs overflow-y-auto flex-1">
              {/* ================= TAB 1: PRESETS & TEMPLATES ================= */}
              {activeTab === 'presets' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold block mb-1.5 text-sm">
                      قالب‌های استاندارد سند چاپی
                    </label>
                    <p className="text-[11px] opacity-60 mb-3">
                      با انتخاب یک قالب، چیدمان سربرگ، کادرها و رنگ‌ها به شکل استاندارد تنظیم می‌شوند:
                    </p>

                    <div className="space-y-2">
                      {[
                        {
                          id: 'formal',
                          title: 'گزارش رسمی و سازمانی (Corporate)',
                          desc: 'دارای سربرگ کامل سازمان، عنوان سند، و توضیحات ساخت‌یافته فرآیند',
                          color: '#1E40AF',
                        },
                        {
                          id: 'iso',
                          title: 'سند مهندسی فرآیند ISO (SOP Standard)',
                          desc: 'سربرگ مهندسی فرآیند و درج توضیحات ساخت‌یافته در بالای دیاگرام',
                          color: '#0F766E',
                        },
                        {
                          id: 'modern',
                          title: 'کاتالوگ و پرزنتیشن رنگی (Modern)',
                          desc: 'طراحی مدرن با کادر سایه‌دار، رنگ‌های تم و جلوه چشم‌نواز',
                          color: '#6366F1',
                        },
                        {
                          id: 'minimal',
                          title: 'چاپ اقتصادی و اداری (Eco Ink-Saver)',
                          desc: 'سیاه و سفید خالص جهت صرفه‌جویی حداکثری در مصرف جوهر و تونر',
                          color: '#000000',
                        },
                        {
                          id: 'diagramOnly',
                          title: 'پوستر دیاگرام خالص (Pure Canvas)',
                          desc: 'حداکثر ابعاد ممکن دیاگرام در تمام صفحه کاغذ بدون هدر اضافی',
                          color: '#3B82F6',
                        },
                      ].map((item) => (
                        <div
                          key={item.id}
                          onClick={() => applyPreset(item.id as any)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                            settings.preset === item.id
                              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-600'
                              : 'hover:opacity-85'
                          }`}
                          style={{
                            backgroundColor:
                              settings.preset === item.id ? undefined : theme.ui.cardBg,
                            borderColor:
                              settings.preset === item.id ? '#2563EB' : theme.ui.border,
                          }}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <div>
                              <div className="font-bold flex items-center gap-2">
                                <span>{item.title}</span>
                              </div>
                              <div className="text-[11px] opacity-65 leading-relaxed mt-0.5">
                                {item.desc}
                              </div>
                            </div>
                          </div>
                          {settings.preset === item.id && (
                            <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Color Accent Picker */}
                  <div className="pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block mb-2">رنگ تم سربرگ سند (Brand Accent)</label>
                    <div className="flex items-center gap-2">
                      {[
                        { hex: '#2563EB', name: 'آبی شرکتی' },
                        { hex: '#1E40AF', name: 'سرمه‌ای کلاسیک' },
                        { hex: '#0F766E', name: 'سبز مهندسی' },
                        { hex: '#047857', name: 'زمردی' },
                        { hex: '#6366F1', name: 'نیلی مدرن' },
                        { hex: '#991B1B', name: 'زرشکی رسمی' },
                        { hex: '#0F172A', name: 'زغالی' },
                      ].map((col) => (
                        <button
                          key={col.hex}
                          onClick={() => setSettings((s) => ({ ...s, accentColor: col.hex }))}
                          className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                            settings.accentColor === col.hex
                              ? 'scale-115 ring-2 ring-offset-2 ring-blue-500'
                              : 'hover:scale-105 opacity-80'
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.name}
                        >
                          {settings.accentColor === col.hex && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 2: TYPOGRAPHY & CUSTOM FONTS ================= */}
              {activeTab === 'typography' && (
                <div className="space-y-4">
                  {/* Font Selection & Custom Font Section */}
                  <div>
                    <label className="font-bold block mb-1 text-sm">انتخاب یا افزودن دستی فونت</label>
                    <p className="text-[11px] opacity-65 mb-3 leading-relaxed">
                      می‌توانید از فونت‌های استاندارد زیر انتخاب کنید، نام هر فونتی را دستی بنویسید، یا فایل فونت خود را آپلود نمایید:
                    </p>

                    {/* Standard Persian & Latin Fonts */}
                    <div className="space-y-1.5 mb-4">
                      {[
                        { id: 'vazirmatn', name: 'وزیرمتن (Vazirmatn)', preview: 'نمودار جریان فرآیند مدرن' },
                        { id: 'shabnam', name: 'شبنم (Shabnam)', preview: 'اسناد اداری و رسمی' },
                        { id: 'system', name: 'قلم سیستمی (IRANSans / Yekan / Tahoma)', preview: 'فلوچارت دقیق و خوانا' },
                        { id: 'serif', name: 'سریف سنتی (B Nazanin / Times New Roman)', preview: 'مستندات رسمی و گزارش‌ها' },
                        { id: 'sans', name: 'سنس مدرن (Plus Jakarta Sans)', preview: 'Modern Flow Process' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() =>
                            setSettings((s) => ({
                              ...s,
                              fontFamily: f.id,
                              customFontName: '',
                            }))
                          }
                          className={`w-full text-right p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                            settings.fontFamily === f.id && !settings.customFontName
                              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 font-bold'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor:
                              settings.fontFamily === f.id && !settings.customFontName
                                ? undefined
                                : theme.ui.cardBg,
                            borderColor:
                              settings.fontFamily === f.id && !settings.customFontName
                                ? '#2563EB'
                                : theme.ui.border,
                          }}
                        >
                          <div>
                            <span className="block font-semibold">{f.name}</span>
                            <span className="text-[11px] opacity-55">{f.preview}</span>
                          </div>
                          {settings.fontFamily === f.id && !settings.customFontName && (
                            <Check className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* MANUAL FONT BOX */}
                    <div
                      className="p-3.5 rounded-xl border space-y-3 bg-black/5 dark:bg-white/5"
                      style={{ borderColor: theme.ui.border }}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <Plus className="w-4 h-4 text-blue-500" />
                        <span>افزودن دستی فونت (نام یا فایل)</span>
                      </div>

                      {/* Manual Font Name Input */}
                      <div>
                        <label className="text-[11px] opacity-75 block mb-1">
                          ۱. نام فونت مورد نظر (نصب‌شده در سیستم شما):
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={manualFontInput}
                            onChange={(e) => setManualFontInput(e.target.value)}
                            placeholder="مثال: IRANSans, Dana, B Mitra, Yekan, Tahoma, Inter..."
                            className="flex-1 px-2.5 py-1.5 rounded-lg border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                            style={{ borderColor: theme.ui.border }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleApplyManualFontName();
                            }}
                          />
                          <button
                            onClick={handleApplyManualFontName}
                            disabled={!manualFontInput.trim()}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs transition-all shrink-0"
                          >
                            اعمال
                          </button>
                        </div>
                        <p className="text-[10px] opacity-60 mt-1">
                          هر فونتی که روی ویندوز یا مک شما نصب باشد را می‌توانید تایپ و اعمال کنید.
                        </p>
                      </div>

                      {/* Upload Font File Button */}
                      <div className="pt-2 border-t" style={{ borderColor: theme.ui.border }}>
                        <label className="text-[11px] opacity-75 block mb-1.5">
                          ۲. یا آپلود فایل فونت (.woff2 / .woff / .ttf / .otf):
                        </label>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFontFileUpload}
                          accept=".woff2,.woff,.ttf,.otf"
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2 px-3 rounded-lg border border-dashed flex items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-all font-semibold text-xs text-blue-600 dark:text-blue-400"
                          style={{ borderColor: theme.ui.accent }}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>
                            {uploadedFontFileName
                              ? `فونت آپلود شده: ${uploadedFontFileName}`
                              : 'انتخاب و آپلود فایل فونت از کامپیوتر'}
                          </span>
                        </button>
                      </div>

                      {/* Active Font Indicator */}
                      {settings.customFontName && (
                        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                          <div className="min-w-0">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                              فونت سفارشی فعال:
                            </span>
                            <span className="font-bold text-xs truncate block font-mono">
                              {settings.customFontName}
                            </span>
                          </div>
                          <span
                            className="text-xs px-2 py-0.5 rounded bg-emerald-600 text-white font-bold"
                            style={{ fontFamily: `'${settings.customFontName}', sans-serif` }}
                          >
                            پیش‌نمایش متن فلوچارت
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Color Mode */}
                  <div className="pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block mb-2">{t.colorMode}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'color', label: 'رنگی کامل', desc: 'پرینتر رنگی' },
                        { id: 'grayscale', label: 'خاکستری', desc: 'چاپ اداری' },
                        { id: 'monochrome', label: 'سیاه و سفید', desc: 'صرفه‌جویی' },
                      ].map((cm) => (
                        <button
                          key={cm.id}
                          onClick={() =>
                            setSettings((s) => ({ ...s, colorMode: cm.id as PrintColorMode }))
                          }
                          className={`py-2 px-2 rounded-xl border text-center transition-all ${
                            settings.colorMode === cm.id
                              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-600 font-bold'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor:
                              settings.colorMode === cm.id ? undefined : theme.ui.cardBg,
                            borderColor:
                              settings.colorMode === cm.id ? '#2563EB' : theme.ui.border,
                          }}
                        >
                          <div className="text-xs">{cm.label}</div>
                          <div className="text-[10px] opacity-60 mt-0.5">{cm.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Sizes */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold">سایز متن توضیحات:</label>
                        <span className="font-mono text-blue-600 font-bold">
                          {settings.descFontSize}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={18}
                        value={settings.descFontSize}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, descFontSize: Number(e.target.value) }))
                        }
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold">سایز عنوان سند:</label>
                        <span className="font-mono text-blue-600 font-bold">
                          {settings.titleFontSize}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={16}
                        max={28}
                        value={settings.titleFontSize}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, titleFontSize: Number(e.target.value) }))
                        }
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Text Alignment */}
                  <div className="pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block mb-1.5">ترازبندی متن توضیحات:</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'right', label: 'راست‌چین' },
                        { id: 'center', label: 'وسط‌چین' },
                        { id: 'left', label: 'چپ‌چین' },
                        { id: 'justify', label: 'تراز دوطرفه' },
                      ].map((al) => (
                        <button
                          key={al.id}
                          onClick={() =>
                            setSettings((s) => ({ ...s, textAlign: al.id as PrintTextAlign }))
                          }
                          className={`py-1.5 rounded-lg border text-center text-[11px] transition-all ${
                            settings.textAlign === al.id
                              ? 'bg-blue-600 text-white font-bold'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor:
                              settings.textAlign === al.id ? undefined : theme.ui.cardBg,
                            borderColor:
                              settings.textAlign === al.id ? '#2563EB' : theme.ui.border,
                          }}
                        >
                          {al.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 3: DOCUMENT BLOCKS ================= */}
              {activeTab === 'blocks' && (
                <div className="space-y-4">
                  {/* Header & Meta Block */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span>سربرگ و مشخصات سند</span>
                      </label>
                      <input
                        type="checkbox"
                        checked={settings.showHeaderFooter}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, showHeaderFooter: e.target.checked }))
                        }
                        className="rounded accent-blue-600 w-4 h-4"
                      />
                    </div>

                    {settings.showHeaderFooter && (
                      <div className="space-y-2 pl-2 pr-1 pt-1 border-r-2 border-blue-500/30">
                        <div>
                          <label className="text-[11px] opacity-70 block mb-1">نام سازمان / شرکت:</label>
                          <input
                            type="text"
                            value={settings.organizationName || ''}
                            onChange={(e) =>
                              setSettings((s) => ({ ...s, organizationName: e.target.value }))
                            }
                            placeholder="نام شرکت یا سازمان..."
                            className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none"
                            style={{ borderColor: theme.ui.border }}
                          />
                        </div>

                        <div>
                          <label className="text-[11px] opacity-70 block mb-1">عنوان سند چاپی:</label>
                          <input
                            type="text"
                            value={settings.documentTitle || ''}
                            onChange={(e) =>
                              setSettings((s) => ({ ...s, documentTitle: e.target.value }))
                            }
                            placeholder={project.title || 'عنوان فلوچارت...'}
                            className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none"
                            style={{ borderColor: theme.ui.border }}
                          />
                        </div>

                        <div>
                          <label className="text-[11px] opacity-70 block mb-1">زیرعنوان یا دپارتمان سند:</label>
                          <input
                            type="text"
                            value={settings.documentSubtitle || ''}
                            onChange={(e) =>
                              setSettings((s) => ({ ...s, documentSubtitle: e.target.value }))
                            }
                            placeholder="مثلاً دپارتمان سیستم‌ها و مهندسی فرآیند..."
                            className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none"
                            style={{ borderColor: theme.ui.border }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 50/50 Split Position Selector (اصلاحیه مرکز صفحه ۵۰٪ اشکال و ۵۰٪ نکات) */}
                  <div className="pt-3 border-t space-y-2.5" style={{ borderColor: theme.ui.border }}>
                    <div className="flex items-center justify-between">
                      <label className="font-bold flex items-center gap-2 text-xs">
                        <Columns className="w-4 h-4 text-blue-500" />
                        <span>تقسیم ۵۰٪ مرکز صفحه (اشکال و نکات)</span>
                      </label>
                      <span className="text-[10px] text-blue-500 font-mono font-bold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        ۵۰٪ اشکال • ۵۰٪ نکات
                      </span>
                    </div>
                    <p className="text-[11px] opacity-70 leading-relaxed">
                      مرکز صفحه بین اشکال و نکات به دو بخش مساوی (۵۰٪) تقسیم می‌شود. موقعیت دلخواه را انتخاب کنید:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'shapes-top', name: 'اشکال بالا • نکات پایین', icon: '⬆️' },
                        { id: 'shapes-bottom', name: 'اشکال پایین • نکات بالا', icon: '⬇️' },
                        { id: 'shapes-right', name: 'اشکال راست • نکات چپ', icon: '➡️' },
                        { id: 'shapes-left', name: 'اشکال چپ • نکات راست', icon: '⬅️' },
                      ].map((pos) => {
                        const isSelected = (settings.splitPosition || 'shapes-top') === pos.id;
                        return (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() =>
                              setSettings((s) => ({
                                ...s,
                                splitPosition: pos.id as PrintSplitPosition,
                              }))
                            }
                            className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2.5 ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold ring-2 ring-blue-500/20'
                                : 'opacity-75 hover:opacity-100 hover:border-slate-400'
                            }`}
                            style={{ borderColor: isSelected ? undefined : theme.ui.border }}
                          >
                            <span className="text-lg">{pos.icon}</span>
                            <span className="text-[11px] leading-tight">{pos.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description & Notes Block */}
                  <div className="pt-3 border-t space-y-2" style={{ borderColor: theme.ui.border }}>
                    <div className="flex items-center justify-between">
                      <label className="font-bold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span>شرح و یادداشت‌های فرآیند این صفحه</span>
                      </label>
                    </div>

                    <textarea
                      value={localPageDesc}
                      onChange={(e) => handlePageDescChange(e.target.value)}
                      placeholder="توضیحات و مستندات این صفحه را اینجا بنویسید (در صفحه چاپ منعکس می‌شود)..."
                      rows={3}
                      className="w-full p-2.5 rounded-xl border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none leading-relaxed resize-y"
                      style={{ borderColor: theme.ui.border }}
                    />
                  </div>

                  {/* Key Tips & Considerations Block (قسمت نکات) */}
                  <div className="pt-3 border-t space-y-2" style={{ borderColor: theme.ui.border }}>
                    <div className="flex items-center justify-between">
                      <label className="font-bold flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <span>نکات و ملاحظات این صفحه</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={settings.showNotes !== false}
                          onChange={(e) =>
                            setSettings((s) => ({ ...s, showNotes: e.target.checked }))
                          }
                          className="rounded accent-amber-600 w-3.5 h-3.5"
                        />
                        <span className="opacity-75">نمایش در چاپ</span>
                      </label>
                    </div>
                    <p className="text-[11px] opacity-65 leading-relaxed">
                      الزامات اجرایی، هشدارها یا نکات کلیدی این صفحه را بنویسید (در هر خط یا با نشان •):
                    </p>
                    <textarea
                      value={localPageNotes}
                      onChange={(e) => handlePageNotesChange(e.target.value)}
                      placeholder="• نکته ۱: رعایت زمان‌بندی حداکثر ۲۴ ساعته در این مرحله الزامی است...&#10;• نکته ۲: تاییدیه نهایی مدیر سیستم‌ها دریافت گردد..."
                      rows={3}
                      className="w-full p-2.5 rounded-xl border text-xs bg-transparent focus:ring-1 focus:ring-amber-500 outline-none leading-relaxed resize-y"
                      style={{ borderColor: theme.ui.border }}
                    />
                  </div>

                  {/* Attached Page Image / جایگذاری عکس صفحه */}
                  <div className="pt-3 border-t space-y-2.5" style={{ borderColor: theme.ui.border }}>
                    <div className="flex items-center justify-between">
                      <label className="font-bold flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-purple-500" />
                        <span>تصویر پیوست صفحه (جایگذاری عکس در بخش ۵۰٪)</span>
                      </label>
                      {localPageImage && (
                        <button
                          type="button"
                          onClick={() => handlePageImageChange('')}
                          className="text-[10px] text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>حذف تصویر</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] opacity-65 leading-relaxed">
                      تصویر، نمودار مرجع یا فرمولی را در این صفحه قرار دهید تا همراه با نکات چاپ شود:
                    </p>

                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed hover:border-purple-500 hover:bg-purple-50/20 cursor-pointer transition-all text-xs font-medium text-purple-600 dark:text-purple-400">
                        <Upload className="w-4 h-4" />
                        <span>{localPageImage ? 'تغییر تصویر (آپلود عکس جدید)' : 'آپلود عکس از سیستم...'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {localPageImage && (
                      <div className="relative group rounded-lg overflow-hidden border p-1 bg-slate-50 dark:bg-slate-900/40" style={{ borderColor: theme.ui.border }}>
                        <img
                          src={localPageImage}
                          alt="پیش‌نمایش تصویر صفحه"
                          className="h-20 w-full object-contain rounded"
                        />
                      </div>
                    )}
                  </div>

                  {/* Cover Page Switch */}
                  <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: theme.ui.border }}>
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span>صفحه جلد اختصاصی (Cover Page)</span>
                      </div>
                      <div className="text-[11px] opacity-60">
                        افزودن یک صفحه جلد رسمی و شکیل قبل از صفحات دیاگرام
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.includeCoverPage || false}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, includeCoverPage: e.target.checked }))
                      }
                      className="rounded accent-blue-600 w-4 h-4"
                    />
                  </div>
                </div>
              )}

              {/* ================= TAB 4: DIAGRAM LAYOUT & SCALE ================= */}
              {activeTab === 'diagram' && (
                <div className="space-y-4">
                  {/* Diagram Scale */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold">مقیاس بزرگ‌نمایی دیاگرام در صفحه:</label>
                      <span className="font-mono text-blue-600 font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950">
                        {settings.diagramScale || 100}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={150}
                      step={5}
                      value={settings.diagramScale || 100}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, diagramScale: Number(e.target.value) }))
                      }
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] opacity-60 mt-1">
                      <button
                        onClick={() => setSettings((s) => ({ ...s, diagramScale: 80 }))}
                        className="hover:underline"
                      >
                        ۸۰٪ (جمع‌وجور)
                      </button>
                      <button
                        onClick={() => setSettings((s) => ({ ...s, diagramScale: 100 }))}
                        className="hover:underline font-bold text-blue-600"
                      >
                        ۱۰۰٪ (استاندارد)
                      </button>
                      <button
                        onClick={() => setSettings((s) => ({ ...s, diagramScale: 130 }))}
                        className="hover:underline"
                      >
                        ۱۳۰٪ (بزرگ و برجسته)
                      </button>
                    </div>
                  </div>

                  {/* Diagram Border Style */}
                  <div className="pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block mb-2">کادر و قاب دور دیاگرام:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'thin', name: 'خط باریک کلاسیک' },
                        { id: 'double', name: 'کادر دوبل رسمی' },
                        { id: 'dashed', name: 'خط‌چین مهندسی' },
                        { id: 'shadow', name: 'قاب مدرن سایه‌دار' },
                        { id: 'none', name: 'بدون کادر (شفاف)' },
                      ].map((b) => (
                        <button
                          key={b.id}
                          onClick={() =>
                            setSettings((s) => ({
                              ...s,
                              diagramBorder: b.id as any,
                              showBorders: b.id !== 'none',
                            }))
                          }
                          className={`py-2 px-2.5 rounded-xl border text-center font-semibold text-[11px] transition-all ${
                            settings.diagramBorder === b.id
                              ? 'bg-blue-600 text-white border-blue-600 font-bold'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor:
                              settings.diagramBorder === b.id ? undefined : theme.ui.cardBg,
                            borderColor:
                              settings.diagramBorder === b.id ? '#2563EB' : theme.ui.border,
                          }}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Diagram Background Texture */}
                  <div className="pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block mb-2">پس‌زمینه دیاگرام:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'white', name: 'سفید خالص' },
                        { id: 'subtle', name: 'خاکستری ملایم' },
                        { id: 'grid', name: 'شطرنجی مهندسی' },
                      ].map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => setSettings((s) => ({ ...s, diagramBg: bg.id as any }))}
                          className={`py-2 px-2 rounded-xl border text-center font-semibold text-[11px] transition-all ${
                            settings.diagramBg === bg.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor:
                              settings.diagramBg === bg.id ? undefined : theme.ui.cardBg,
                            borderColor:
                              settings.diagramBg === bg.id ? '#2563EB' : theme.ui.border,
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
                      <span className="font-mono text-blue-600 font-bold">
                        {settings.spacing} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={48}
                      step={4}
                      value={settings.spacing}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, spacing: Number(e.target.value) }))
                      }
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* ================= TAB 5: PAPER & MARGINS ================= */}
              {activeTab === 'paper' && (
                <div className="space-y-4">
                  {/* Paper Size */}
                  <div>
                    <label className="font-bold block mb-1.5">{t.paperSize}</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['a4', 'a3', 'letter', 'legal'] as PrintPaperSize[]).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setSettings((s) => ({ ...s, paperSize: sz }))}
                          className={`py-2 rounded-xl border text-center font-bold uppercase transition-all ${
                            settings.paperSize === sz
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor:
                              settings.paperSize === sz ? undefined : theme.ui.cardBg,
                            borderColor:
                              settings.paperSize === sz ? '#2563EB' : theme.ui.border,
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
                        onClick={() => setSettings((s) => ({ ...s, orientation: 'landscape' }))}
                        className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                          settings.orientation === 'landscape'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor:
                            settings.orientation === 'landscape' ? undefined : theme.ui.cardBg,
                          borderColor:
                            settings.orientation === 'landscape' ? '#2563EB' : theme.ui.border,
                        }}
                      >
                        <span className="w-5 h-3.5 border-2 rounded-xs border-current inline-block" />
                        <span>{t.landscape} (افقی)</span>
                      </button>

                      <button
                        onClick={() => setSettings((s) => ({ ...s, orientation: 'portrait' }))}
                        className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                          settings.orientation === 'portrait'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor:
                            settings.orientation === 'portrait' ? undefined : theme.ui.cardBg,
                          borderColor:
                            settings.orientation === 'portrait' ? '#2563EB' : theme.ui.border,
                        }}
                      >
                        <span className="w-3.5 h-5 border-2 rounded-xs border-current inline-block" />
                        <span>{t.portrait} (عمودی)</span>
                      </button>
                    </div>
                  </div>

                  {/* Margins */}
                  <div className="pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block mb-1.5">حاشیه کاغذ (Margins)</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'compact', label: 'کم (10mm)' },
                        { id: 'normal', label: 'استاندارد (18mm)' },
                        { id: 'spacious', label: 'زیاد (26mm)' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() =>
                            setSettings((s) => ({
                              ...s,
                              marginSize: m.id as PrintSettings['marginSize'],
                            }))
                          }
                          className={`py-1.5 rounded-xl border text-center text-[11px] font-semibold transition-all ${
                            settings.marginSize === m.id
                              ? 'bg-blue-600 text-white font-bold'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor:
                              settings.marginSize === m.id ? undefined : theme.ui.cardBg,
                            borderColor:
                              settings.marginSize === m.id ? '#2563EB' : theme.ui.border,
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Footer note input */}
                  <div className="pt-3 border-t space-y-1.5" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block">متن پانویس سند (Footer Note):</label>
                    <input
                      type="text"
                      value={settings.footerNote || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, footerNote: e.target.value }))}
                      placeholder="کلیه حقوق محفوظ است..."
                      className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-transparent focus:ring-1 focus:ring-blue-500 outline-none"
                      style={{ borderColor: theme.ui.border }}
                    />
                  </div>

                  {/* Page options checkboxes */}
                  <div className="pt-3 border-t space-y-2.5" style={{ borderColor: theme.ui.border }}>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showPageNumbers}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, showPageNumbers: e.target.checked }))
                        }
                        className="rounded accent-blue-600 w-4 h-4"
                      />
                      <span>شماره‌گذاری صفحات (صفحه ۱ از ۲)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showDate}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, showDate: e.target.checked }))
                        }
                        className="rounded accent-blue-600 w-4 h-4"
                      />
                      <span>درج تاریخ پرینت در سربرگ</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showMarginGuides}
                        onChange={(e) => setShowMarginGuides(e.target.checked)}
                        className="rounded accent-blue-600 w-4 h-4"
                      />
                      <span>نمایش خطوط راهنمای حاشیه چاپ در پیش‌نمایش</span>
                    </label>
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
                  onClick={handleDownloadPng}
                  disabled={isExportingPng}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  style={{ borderColor: theme.ui.border }}
                  title="دانلود تصویر صفحه با وضوح بالا ۳۰۰ DPI"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isExportingPng ? 'ایجاد تصویر...' : 'تصویر 300DPI'}</span>
                </button>

                <button
                  onClick={handleDownloadHtml}
                  disabled={isDownloadingHtml}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  style={{ borderColor: theme.ui.border }}
                  title="دانلود گزارش مستقل HTML"
                >
                  <FileCode className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isDownloadingHtml ? 'آماده‌سازی...' : 'فایل مستقل HTML'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ===================== RIGHT / CENTER: Live Interactive Studio Desk ===================== */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-900/90 text-slate-100 overflow-hidden relative">
            {/* Studio Desk Toolbar (Floating over preview) */}
            <div className="h-11 px-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0 text-xs">
              {/* Left Desk: Page indicator & Page switcher */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-bold text-[11px]">
                    صفحه: {activePreviewPage?.name}
                  </span>
                  <span className="text-[10px] opacity-60 font-mono">
                    ({activePreviewPage?.nodes.length || 0} گره)
                  </span>
                </div>

                {availablePages.length > 1 && (
                  <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-1.5 py-0.5 border border-slate-700">
                    <button
                      onClick={() =>
                        setPreviewPageIndex((i) =>
                          i > 0 ? i - 1 : availablePages.length - 1
                        )
                      }
                      className="p-1 rounded hover:bg-slate-700"
                      title="صفحه قبل"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <span className="font-mono text-[10px] px-1 font-bold">
                      {safePageIndex + 1} / {availablePages.length}
                    </span>
                    <button
                      onClick={() =>
                        setPreviewPageIndex((i) =>
                          i < availablePages.length - 1 ? i + 1 : 0
                        )
                      }
                      className="p-1 rounded hover:bg-slate-700"
                      title="صفحه بعد"
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
                  className="p-1 rounded hover:bg-slate-700"
                  title="کوچک‌نمایی"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] px-1.5 font-bold min-w-[42px] text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(180, z + 15))}
                  className="p-1 rounded hover:bg-slate-700"
                  title="بزرگ‌نمایی"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="text-[10px] px-1.5 py-0.5 rounded hover:bg-slate-700 text-slate-300 font-semibold"
                  title="اندازه واقعی ۱۰۰٪"
                >
                  100%
                </button>
              </div>

              {/* Right Desk: Quick Paper Flip */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setSettings((s) => ({
                      ...s,
                      orientation: s.orientation === 'landscape' ? 'portrait' : 'landscape',
                    }))
                  }
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold transition-all"
                  title="تغییر جهت کاغذ (افقی / عمودی)"
                >
                  <Layout className="w-3 h-3 text-blue-400" />
                  <span>{settings.orientation === 'landscape' ? 'افقی' : 'عمودی'}</span>
                </button>

                {/* Quick 50/50 Split Position Selector */}
                <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700 text-[10.5px]">
                  <span className="text-[10px] text-slate-400 px-1 font-medium">مرکز ۵۰٪:</span>
                  {[
                    { id: 'shapes-top', icon: '⬆️', title: 'اشکال بالا (۵۰٪) • نکات پایین (۵۰٪)' },
                    { id: 'shapes-bottom', icon: '⬇️', title: 'اشکال پایین (۵۰٪) • نکات بالا (۵۰٪)' },
                    { id: 'shapes-right', icon: '➡️', title: 'اشکال راست (۵۰٪) • نکات چپ (۵۰٪)' },
                    { id: 'shapes-left', icon: '⬅️', title: 'اشکال چپ (۵۰٪) • نکات راست (۵۰٪)' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() =>
                        setSettings((s) => ({
                          ...s,
                          splitPosition: btn.id as PrintSplitPosition,
                        }))
                      }
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                        (settings.splitPosition || 'shapes-top') === btn.id
                          ? 'bg-blue-600 text-white font-bold ring-1 ring-blue-400'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={btn.title}
                    >
                      {btn.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Studio Canvas Viewport */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center relative">
              {/* VIEW MODE 1: SHEET PREVIEW (Real Paper Simulation) */}
              {viewMode === 'sheet' && (
                <div
                  className="transition-transform duration-200 origin-center flex justify-center"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  {/* The Physical Sheet Simulator */}
                  <div
                    className={`bg-white text-slate-900 shadow-2xl rounded-xs transition-all flex flex-col justify-between select-none relative overflow-hidden ${
                      settings.orientation === 'landscape'
                        ? 'w-[780px] max-w-full aspect-[297/210] p-7 sm:p-9'
                        : 'w-[560px] max-w-full aspect-[210/297] p-8 sm:p-10'
                    }`}
                    style={{
                      fontFamily: fontFamilyCss,
                    }}
                  >
                    {/* Dotted Print Margin Guide overlay */}
                    {showMarginGuides && (
                      <div
                        className="absolute inset-3 sm:inset-4 border border-dashed border-blue-400/30 pointer-events-none rounded-xs"
                        title="حاشیه استاندارد چاپ"
                      />
                    )}

                    {/* ================= SHEET HEADER ================= */}
                    {settings.showHeaderFooter && (
                      <div className="border-b-2 border-slate-200 pb-2.5 mb-3 flex items-center justify-between shrink-0 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="text-white text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide"
                            style={{ backgroundColor: accentColor }}
                          >
                            {effectiveOrg}
                          </span>
                          <div>
                            <div
                              className="font-bold text-slate-900 truncate max-w-[240px] leading-tight"
                              style={{
                                fontSize: Math.max(12, settings.titleFontSize * 0.65),
                              }}
                            >
                              {effectiveTitle}
                            </div>
                            {settings.documentSubtitle && (
                              <div className="text-[9px] text-slate-500">
                                {settings.documentSubtitle}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                            {activePreviewPage?.name}
                          </span>
                          {settings.showDate && (
                            <span className="text-[9px]">
                              {new Date().toLocaleDateString('fa-IR')}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ================= SHEET BODY (50% SHAPES / 50% NOTES SPLIT) ================= */}
                    {(() => {
                      const splitPos = settings.splitPosition || 'shapes-top';
                      const isHorizontal = splitPos === 'shapes-right' || splitPos === 'shapes-left';

                      const containerFlexClass =
                        splitPos === 'shapes-top'
                          ? 'flex-col'
                          : splitPos === 'shapes-bottom'
                          ? 'flex-col-reverse'
                          : splitPos === 'shapes-right'
                          ? 'flex-row-reverse'
                          : 'flex-row';

                      const halfStyle = isHorizontal
                        ? { width: 'calc(50% - 6px)', height: '100%', maxHeight: '100%' }
                        : { height: 'calc(50% - 6px)', maxHeight: 'calc(50% - 6px)', width: '100%' };

                      return (
                        <div
                          className={`flex-1 flex ${containerFlexClass} gap-3 min-h-0 overflow-hidden relative z-10 w-full`}
                        >
                          {/* 50% DIAGRAM SVG CONTAINER */}
                          <div
                            style={halfStyle}
                            className={`flex items-center justify-center overflow-hidden rounded-lg p-2 relative shrink-0 ${getDiagramBorderClass()} ${getDiagramBgClass()}`}
                          >
                            <div
                              className="w-full h-full flex items-center justify-center transition-transform [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto [&>svg]:object-contain"
                              style={{
                                transform: `scale(${(settings.diagramScale || 100) / 100})`,
                              }}
                              dangerouslySetInnerHTML={{ __html: pageSvgResult.svg }}
                            />
                          </div>

                          {/* 50% NOTES & CONSIDERATIONS CARD */}
                          <div
                            style={halfStyle}
                            className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 overflow-hidden relative shadow-xs shrink-0"
                          >
                            <div
                              className="absolute top-0 right-0 bottom-0 w-1 rounded-r-lg"
                              style={{ backgroundColor: accentColor }}
                            />

                            {/* Card Header Badge */}
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 shrink-0">
                              <div
                                className="flex items-center gap-1.5 text-[10.5px] font-bold"
                                style={{ color: accentColor }}
                              >
                                <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                                <span>💡 نکات و ملاحظات صفحه</span>
                                <span className="text-[9px] text-slate-400 font-mono font-normal">
                                  ({activePreviewPage?.name})
                                </span>
                              </div>
                              <span className="text-[9px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                [بخش ۵۰٪]
                              </span>
                            </div>

                            {/* Card Body with description & notes */}
                            <div className="flex-1 min-h-0 overflow-y-auto py-1.5 space-y-1.5 text-[9.5px]">
                              {/* Attached Page Image */}
                              {localPageImage && (
                                <div className="relative group rounded border border-slate-200 bg-white p-1 text-center shrink-0">
                                  <img
                                    src={localPageImage}
                                    alt="عکس پیوست صفحه"
                                    className="max-h-24 max-w-full mx-auto object-contain rounded"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handlePageImageChange('')}
                                    title="حذف تصویر"
                                    className="absolute top-1 left-1 bg-red-500 text-white p-1 rounded-full opacity-80 hover:opacity-100 shadow transition-opacity cursor-pointer"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}

                              {localPageDesc && (
                                <div
                                  className="text-slate-700 leading-relaxed bg-white/80 p-2 rounded border border-slate-200/80"
                                  style={{
                                    fontWeight: settings.fontWeight,
                                    textAlign: settings.textAlign,
                                  }}
                                >
                                  <strong className="block text-[9px] text-slate-800 mb-0.5">
                                    مستندات و شرح فرآیند:
                                  </strong>
                                  <p className="line-clamp-3">{localPageDesc}</p>
                                </div>
                              )}

                              {settings.showNotes !== false && localPageNotes && (
                                <div
                                  className="text-amber-900 leading-relaxed bg-amber-50/80 p-2 rounded border border-amber-200/80"
                                  style={{
                                    fontWeight: settings.fontWeight,
                                    textAlign: settings.textAlign,
                                  }}
                                >
                                  <strong className="block text-[9px] text-amber-800 mb-0.5">
                                    نکات کلیدی این صفحه:
                                  </strong>
                                  <p className="line-clamp-3">{localPageNotes}</p>
                                </div>
                              )}

                              {/* Ruled lines for manual handwriting notes */}
                              <div className="mt-1 pt-1 border-t border-dashed border-slate-200 flex-1 flex flex-col justify-evenly min-h-[50px]">
                                <div className="text-[8.5px] text-slate-500 font-medium flex items-center justify-between mb-1">
                                  <span>📝 محل درج نکات و یادداشت‌های دستی (Manual Notes):</span>
                                  <span className="text-[8px] opacity-70">خطوط راهنما برای نوشتن با قلم</span>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="border-b border-dashed border-slate-300 h-0 w-full" />
                                  <div className="border-b border-dashed border-slate-300 h-0 w-full" />
                                  <div className="border-b border-dashed border-slate-300 h-0 w-full" />
                                  {!(localPageDesc || localPageNotes) && (
                                    <>
                                      <div className="border-b border-dashed border-slate-300 h-0 w-full" />
                                      <div className="border-b border-dashed border-slate-300 h-0 w-full" />
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ================= SHEET FOOTER ================= */}
                    {settings.showHeaderFooter && (
                      <div className="border-t border-slate-200 pt-1.5 mt-2 flex items-center justify-between text-[8.5px] text-slate-500 shrink-0 relative z-10">
                        <div>
                          {settings.footerNote || 'سند استاندارد مدیریت فرآیند'} • گره‌ها:{' '}
                          {activePreviewPage?.nodes.length || 0}
                        </div>
                        {settings.showPageNumbers && (
                          <div className="font-mono font-bold">
                            صفحه {safePageIndex + 1} از {availablePages.length}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW MODE 2: STANDALONE HTML REPORT PREVIEW */}
              {viewMode === 'html' && (
                <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col max-h-[90%] shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">
                        کد سند مستقل و بهینه‌سازی‌شده برای چاپ (HTML Standalone)
                      </h4>
                      <p className="text-xs text-slate-400">
                        این سند شامل تمام استایل‌های اختصاصی @media print و فونت‌های تعریف‌شده است.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyHtml}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-all"
                      >
                        {isHtmlCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">کپی شد!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>کپی در کلیپ‌بورد</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleDownloadHtml}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>دانلود فایل HTML</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto bg-slate-900 rounded-xl p-3 border border-slate-800">
                    <pre className="font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
                      {generatePrintReportHtml(project, settings)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
