import React, { useState, useMemo } from 'react';
import { ColorTheme } from '../constants/themes';
import { TranslationDictionary } from '../constants/translations';
import {
  FlowchartProject,
  PrintSettings,
  PrintColorMode,
  PrintFontFamily,
  PrintPaperSize,
  PrintOrientation,
  PrintDescPosition,
  PrintTextAlign,
} from '../types/flowchart';
import {
  DEFAULT_PRINT_SETTINGS,
  generatePageSvgMarkup,
  triggerPrintDialog,
  exportMultiPagePdf,
  generatePrintReportHtml,
  getFontFamilyCss,
} from '../utils/printUtils';
import {
  X,
  Printer,
  FileDown,
  Palette,
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
} from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: FlowchartProject;
  theme: ColorTheme;
  t: TranslationDictionary;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  project,
  theme,
  t,
}) => {
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'color' | 'font' | 'spacing' | 'page'>('color');
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isDownloadingHtml, setIsDownloadingHtml] = useState(false);

  // Available pages based on setting
  const availablePages = useMemo(() => {
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
            description: project.description,
            nodes: project.nodes,
            edges: project.edges,
          },
        ];
  }, [project, settings.targetPages]);

  // Ensure preview page index is valid
  const currentPageIndex = Math.min(previewPageIndex, Math.max(0, availablePages.length - 1));
  const activePreviewPage = availablePages[currentPageIndex] || availablePages[0];

  // Generate SVG markup for current preview page
  const pageSvgResult = useMemo(() => {
    if (!activePreviewPage) return { svg: '', width: 600, height: 400 };
    return generatePageSvgMarkup(activePreviewPage, settings.colorMode);
  }, [activePreviewPage, settings.colorMode]);

  if (!isOpen) return null;

  const handlePrint = () => {
    triggerPrintDialog(project, settings);
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportMultiPagePdf(project, settings);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadHtml = () => {
    setIsDownloadingHtml(true);
    try {
      const html = generatePrintReportHtml(project, settings);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title || 'flowchart'}-print-ready.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setIsDownloadingHtml(false), 800);
    }
  };

  const fontFamilyCss = getFontFamilyCss(settings.fontFamily);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in">
      <div
        className="w-full max-w-6xl h-[92vh] max-h-[850px] rounded-2xl shadow-2xl border flex flex-col overflow-hidden"
        style={{
          backgroundColor: theme.ui.cardBg,
          borderColor: theme.ui.border,
          color: theme.ui.textPrimary,
        }}
      >
        {/* Modal Top Bar */}
        <div
          className="h-14 border-b px-5 flex items-center justify-between shrink-0"
          style={{ borderColor: theme.ui.border }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-500 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">{t.printReadyTitle}</h3>
              <p className="text-[11px] opacity-60">
                پروژه: <strong>{project.title || 'فلوچارت'}</strong> • {availablePages.length} صفحه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>{t.printNow}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Controls + Right Live Paper Preview */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT: Settings Panel (Scrollable) */}
          <div
            className="w-full md:w-[380px] lg:w-[420px] border-b md:border-b-0 md:border-l flex flex-col shrink-0 overflow-y-auto"
            style={{
              borderColor: theme.ui.border,
              backgroundColor: theme.ui.surface,
            }}
          >
            {/* Setting Navigation Tabs */}
            <div
              className="grid grid-cols-4 p-2 gap-1 border-b text-[11px] font-semibold text-center shrink-0"
              style={{ borderColor: theme.ui.border }}
            >
              <button
                onClick={() => setActiveTab('color')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  activeTab === 'color'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>رنگ و چاپ</span>
              </button>

              <button
                onClick={() => setActiveTab('font')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  activeTab === 'font'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>فونت متن</span>
              </button>

              <button
                onClick={() => setActiveTab('spacing')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  activeTab === 'spacing'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>فاصله و جایابی</span>
              </button>

              <button
                onClick={() => setActiveTab('page')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  activeTab === 'page'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                }`}
              >
                <Layout className="w-4 h-4" />
                <span>صفحه و کاغذ</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-4 space-y-5 text-xs">
              {/* TAB 1: COLOR MODE */}
              {activeTab === 'color' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold block mb-2">{t.colorMode}</label>
                    <div className="grid grid-cols-1 gap-2.5">
                      {/* Full Color */}
                      <div
                        onClick={() => setSettings((s) => ({ ...s, colorMode: 'color' }))}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          settings.colorMode === 'color'
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-600'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor:
                            settings.colorMode === 'color' ? undefined : theme.ui.cardBg,
                          borderColor:
                            settings.colorMode === 'color' ? '#2563EB' : theme.ui.border,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-linear-to-tr from-blue-500 via-indigo-500 to-amber-400 shrink-0" />
                          <div>
                            <div className="font-bold">{t.fullColor}</div>
                            <div className="text-[11px] opacity-60">
                              رنگ‌های اصلی تم، مناسب برای پرینترهای رنگی و کاتالوگ
                            </div>
                          </div>
                        </div>
                        {settings.colorMode === 'color' && (
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>

                      {/* Grayscale */}
                      <div
                        onClick={() => setSettings((s) => ({ ...s, colorMode: 'grayscale' }))}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          settings.colorMode === 'grayscale'
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-600'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor:
                            settings.colorMode === 'grayscale' ? undefined : theme.ui.cardBg,
                          borderColor:
                            settings.colorMode === 'grayscale' ? '#2563EB' : theme.ui.border,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-linear-to-tr from-gray-700 via-gray-400 to-gray-200 shrink-0" />
                          <div>
                            <div className="font-bold">{t.grayscale}</div>
                            <div className="text-[11px] opacity-60">
                              طیف خاکستری مات با کنتراست بالا جهت چاپ اداری و فتوکپی
                            </div>
                          </div>
                        </div>
                        {settings.colorMode === 'grayscale' && (
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>

                      {/* Monochrome / Ink Saver */}
                      <div
                        onClick={() => setSettings((s) => ({ ...s, colorMode: 'monochrome' }))}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          settings.colorMode === 'monochrome'
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-600'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor:
                            settings.colorMode === 'monochrome' ? undefined : theme.ui.cardBg,
                          borderColor:
                            settings.colorMode === 'monochrome' ? '#2563EB' : theme.ui.border,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full border-2 border-black bg-white shrink-0" />
                          <div>
                            <div className="font-bold">{t.monochrome}</div>
                            <div className="text-[11px] opacity-60">
                              پس‌زمینه سفید خالص و خطوط مشکی شفاف جهت صرفه‌جویی در کارتریج
                            </div>
                          </div>
                        </div>
                        {settings.colorMode === 'monochrome' && (
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Target Pages */}
                  <div className="pt-2 border-t" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block mb-2">محدوده صفحات چاپی</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSettings((s) => ({ ...s, targetPages: 'all' }))}
                        className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                          settings.targetPages === 'all'
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor:
                            settings.targetPages === 'all' ? undefined : theme.ui.cardBg,
                          borderColor:
                            settings.targetPages === 'all' ? '#2563EB' : theme.ui.border,
                        }}
                      >
                        {t.allPages} ({project.pages?.length || 1})
                      </button>

                      <button
                        onClick={() => setSettings((s) => ({ ...s, targetPages: 'current' }))}
                        className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                          settings.targetPages === 'current'
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor:
                            settings.targetPages === 'current' ? undefined : theme.ui.cardBg,
                          borderColor:
                            settings.targetPages === 'current' ? '#2563EB' : theme.ui.border,
                        }}
                      >
                        {t.currentPageOnly}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FONT SETTINGS */}
              {activeTab === 'font' && (
                <div className="space-y-4">
                  {/* Font Family */}
                  <div>
                    <label className="font-bold block mb-1.5">{t.fontFamily}</label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        { id: 'vazirmatn', name: 'وزیرمتن (پیش‌فرض)', preview: 'فلوچارت روان و مدرن' },
                        { id: 'system', name: 'قلم سیستمی (IRANSans / Yekan)', preview: 'نمودار جریان فرآیند' },
                        { id: 'shabnam', name: 'شبنم (Shabnam)', preview: 'قلم رسمی اسناد' },
                        { id: 'sans', name: 'سنس استاندارد (Sans-serif)', preview: 'Modern Flow Diagram' },
                        { id: 'serif', name: 'سریف کلاسیک (Serif)', preview: 'مستندات اداری و چاپی' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() =>
                            setSettings((s) => ({
                              ...s,
                              fontFamily: f.id as PrintFontFamily,
                            }))
                          }
                          className={`w-full text-right p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                            settings.fontFamily === f.id
                              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 font-bold'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor:
                              settings.fontFamily === f.id ? undefined : theme.ui.cardBg,
                            borderColor:
                              settings.fontFamily === f.id ? '#2563EB' : theme.ui.border,
                          }}
                        >
                          <div>
                            <span className="block font-semibold">{f.name}</span>
                            <span className="text-[11px] opacity-55">{f.preview}</span>
                          </div>
                          {settings.fontFamily === f.id && (
                            <Check className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Sizes */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor: theme.ui.border }}>
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
                          setSettings((s) => ({
                            ...s,
                            descFontSize: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold">سایز عنوان:</label>
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
                          setSettings((s) => ({
                            ...s,
                            titleFontSize: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Font Weight & Alignment */}
                  <div className="pt-2 border-t space-y-3" style={{ borderColor: theme.ui.border }}>
                    <div>
                      <label className="font-bold block mb-1.5">وزن قلم توضیحات:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSettings((s) => ({ ...s, fontWeight: 'normal' }))}
                          className={`py-1.5 rounded-lg border text-center transition-all ${
                            settings.fontWeight === 'normal'
                              ? 'bg-blue-600 text-white font-bold'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor:
                              settings.fontWeight === 'normal' ? undefined : theme.ui.cardBg,
                            borderColor:
                              settings.fontWeight === 'normal' ? '#2563EB' : theme.ui.border,
                          }}
                        >
                          عادی (Regular)
                        </button>
                        <button
                          onClick={() => setSettings((s) => ({ ...s, fontWeight: 'bold' }))}
                          className={`py-1.5 rounded-lg border text-center transition-all ${
                            settings.fontWeight === 'bold'
                              ? 'bg-blue-600 text-white font-bold'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor:
                              settings.fontWeight === 'bold' ? undefined : theme.ui.cardBg,
                            borderColor:
                              settings.fontWeight === 'bold' ? '#2563EB' : theme.ui.border,
                          }}
                        >
                          پررنگ (Bold)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold block mb-1.5">تراز متن توضیحات:</label>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { id: 'right', label: 'راست' },
                          { id: 'center', label: 'وسط' },
                          { id: 'left', label: 'چپ' },
                          { id: 'justify', label: 'تراز (Justify)' },
                        ].map((al) => (
                          <button
                            key={al.id}
                            onClick={() =>
                              setSettings((s) => ({
                                ...s,
                                textAlign: al.id as PrintTextAlign,
                              }))
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
                </div>
              )}

              {/* TAB 3: SPACING & PLACEMENT */}
              {activeTab === 'spacing' && (
                <div className="space-y-4">
                  {/* Spacing Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold">{t.textSpacing}:</label>
                      <span className="font-mono text-blue-600 font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950">
                        {settings.spacing} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={64}
                      step={4}
                      value={settings.spacing}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          spacing: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] opacity-60 mt-1">
                      <span>۸ پیکسل (فشرده)</span>
                      <span>۲۴ پیکسل (استاندارد)</span>
                      <span>۶۴ پیکسل (باز و فاصله‌دار)</span>
                    </div>
                  </div>

                  {/* Description Placement */}
                  <div className="pt-2 border-t" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block mb-2">{t.descPosition}</label>
                    <div className="grid grid-cols-1 gap-2">
                      <div
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            descPosition: 'below',
                          }))
                        }
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          settings.descPosition === 'below'
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-600'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor:
                            settings.descPosition === 'below' ? undefined : theme.ui.cardBg,
                          borderColor:
                            settings.descPosition === 'below' ? '#2563EB' : theme.ui.border,
                        }}
                      >
                        <div>
                          <div className="font-bold">{t.positionBelow}</div>
                          <div className="text-[11px] opacity-60">
                            نمودار در بالا و کادر یادداشت‌ها در زیر آن قرار می‌گیرد
                          </div>
                        </div>
                        {settings.descPosition === 'below' && (
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>

                      <div
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            descPosition: 'above',
                          }))
                        }
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          settings.descPosition === 'above'
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-600'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor:
                            settings.descPosition === 'above' ? undefined : theme.ui.cardBg,
                          borderColor:
                            settings.descPosition === 'above' ? '#2563EB' : theme.ui.border,
                        }}
                      >
                        <div>
                          <div className="font-bold">{t.positionAbove}</div>
                          <div className="text-[11px] opacity-60">
                            توضیحات و مستندات قبل از رسم فلوچارت چاپ می‌شوند
                          </div>
                        </div>
                        {settings.descPosition === 'above' && (
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>

                      <div
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            descPosition: 'appendix',
                          }))
                        }
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          settings.descPosition === 'appendix'
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-600'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor:
                            settings.descPosition === 'appendix' ? undefined : theme.ui.cardBg,
                          borderColor:
                            settings.descPosition === 'appendix' ? '#2563EB' : theme.ui.border,
                        }}
                      >
                        <div>
                          <div className="font-bold">{t.positionAppendix}</div>
                          <div className="text-[11px] opacity-60">
                            فلوچارت در یک برگه و مستندات کامل در صفحه بعدی پیوست می‌شود
                          </div>
                        </div>
                        {settings.descPosition === 'appendix' && (
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PAGE & PAPER SETTINGS */}
              {activeTab === 'page' && (
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
                  <div className="pt-2 border-t" style={{ borderColor: theme.ui.border }}>
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
                        <span>{t.landscape}</span>
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
                        <span>{t.portrait}</span>
                      </button>
                    </div>
                  </div>

                  {/* Margins */}
                  <div className="pt-2 border-t" style={{ borderColor: theme.ui.border }}>
                    <label className="font-bold block mb-1.5">حاشیه کاغذ (Margins)</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'compact', label: 'کم (10mm)' },
                        { id: 'normal', label: 'عادی (18mm)' },
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
                          className={`py-1.5 rounded-xl border text-center text-[11px] font-medium transition-all ${
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

                  {/* Toggles */}
                  <div className="pt-2 border-t space-y-2.5" style={{ borderColor: theme.ui.border }}>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showHeaderFooter}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, showHeaderFooter: e.target.checked }))
                        }
                        className="rounded accent-blue-600 w-4 h-4"
                      />
                      <span>نمایش سربرگ و پانویس صفحه</span>
                    </label>

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
                        checked={settings.showBorders}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, showBorders: e.target.checked }))
                        }
                        className="rounded accent-blue-600 w-4 h-4"
                      />
                      <span>کادر و قاب خطی دور دیاگرام</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions inside Panel */}
            <div
              className="mt-auto p-3 border-t flex flex-col gap-2 shrink-0"
              style={{ borderColor: theme.ui.border }}
            >
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  style={{ borderColor: theme.ui.border }}
                >
                  <FileDown className="w-3.5 h-3.5 text-red-500" />
                  <span>{isExportingPdf ? 'در حال بیلد...' : 'دانلود PDF'}</span>
                </button>

                <button
                  onClick={handleDownloadHtml}
                  disabled={isDownloadingHtml}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  style={{ borderColor: theme.ui.border }}
                >
                  <FileCode className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isDownloadingHtml ? 'آماده‌سازی...' : 'فایل HTML'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Live Interactive Paper Preview */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-slate-900/80 p-3 sm:p-5 overflow-hidden">
            {/* Preview Navigation Bar */}
            <div className="flex items-center justify-between pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold">{t.printPreview}:</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  {activePreviewPage?.name || 'صفحه'}
                </span>
                <span className="text-[11px] opacity-60">
                  ({activePreviewPage?.nodes.length || 0} گره)
                </span>
              </div>

              {availablePages.length > 1 && (
                <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border rounded-xl px-2 py-1 shadow-xs text-xs">
                  <button
                    onClick={() =>
                      setPreviewPageIndex((i) =>
                        i > 0 ? i - 1 : availablePages.length - 1
                      )
                    }
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                    title="صفحه قبلی"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-[11px] px-1">
                    صفحه {currentPageIndex + 1} از {availablePages.length}
                  </span>
                  <button
                    onClick={() =>
                      setPreviewPageIndex((i) =>
                        i < availablePages.length - 1 ? i + 1 : 0
                      )
                    }
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                    title="صفحه بعدی"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Sheet Canvas Simulator */}
            <div className="flex-1 flex items-center justify-center overflow-auto p-2">
              <div
                className={`bg-white text-slate-900 shadow-2xl rounded-sm transition-all duration-300 flex flex-col justify-between p-6 sm:p-8 select-none relative ${
                  settings.orientation === 'landscape'
                    ? 'w-[680px] max-w-full aspect-[297/210]'
                    : 'w-[480px] max-w-full aspect-[210/297]'
                }`}
                style={{
                  fontFamily: fontFamilyCss,
                }}
              >
                {/* Simulated Sheet Header */}
                {settings.showHeaderFooter && (
                  <div className="border-b-2 border-slate-200 pb-2 mb-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs">
                        FlowCraft
                      </span>
                      <span
                        className="font-bold text-slate-900 truncate max-w-[200px]"
                        style={{ fontSize: Math.max(12, settings.titleFontSize * 0.6) }}
                      >
                        {project.title || 'فلوچارت'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {activePreviewPage?.name}
                      </span>
                      {settings.showDate && <span>{new Date().toLocaleDateString('fa-IR')}</span>}
                    </div>
                  </div>
                )}

                {/* Simulated Sheet Body */}
                <div className="flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
                  {/* Description Above */}
                  {settings.descPosition === 'above' && activePreviewPage?.description && (
                    <div
                      className="bg-slate-50 border border-slate-200 border-r-4 border-r-blue-600 rounded p-2.5 text-slate-800 shrink-0"
                      style={{
                        marginBottom: Math.max(6, settings.spacing * 0.4),
                        fontSize: Math.max(9, settings.descFontSize * 0.75),
                        fontWeight: settings.fontWeight,
                        textAlign: settings.textAlign,
                      }}
                    >
                      <div className="text-[9px] font-bold text-blue-600 mb-1">
                        توضیحات و مستندات این فلوچارت:
                      </div>
                      <div className="line-clamp-3 leading-relaxed">
                        {activePreviewPage.description}
                      </div>
                    </div>
                  )}

                  {/* SVG Diagram Box */}
                  <div
                    className={`flex-1 flex items-center justify-center overflow-hidden min-h-0 ${
                      settings.showBorders ? 'border border-slate-300 rounded p-2' : ''
                    }`}
                  >
                    <div
                      className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full [&>svg]:object-contain"
                      dangerouslySetInnerHTML={{ __html: pageSvgResult.svg }}
                    />
                  </div>

                  {/* Description Below */}
                  {settings.descPosition === 'below' && activePreviewPage?.description && (
                    <div
                      className="bg-slate-50 border border-slate-200 border-r-4 border-r-blue-600 rounded p-2.5 text-slate-800 shrink-0"
                      style={{
                        marginTop: Math.max(6, settings.spacing * 0.4),
                        fontSize: Math.max(9, settings.descFontSize * 0.75),
                        fontWeight: settings.fontWeight,
                        textAlign: settings.textAlign,
                      }}
                    >
                      <div className="text-[9px] font-bold text-blue-600 mb-1">
                        توضیحات و مستندات این فلوچارت:
                      </div>
                      <div className="line-clamp-3 leading-relaxed">
                        {activePreviewPage.description}
                      </div>
                    </div>
                  )}

                  {/* Appendix notice if appendix mode */}
                  {settings.descPosition === 'appendix' && activePreviewPage?.description && (
                    <div className="text-center text-[10px] text-blue-600 font-semibold mt-1">
                      (توضیحات و یادداشت‌ها در صفحه ضمیمه مجزا چاپ می‌شوند)
                    </div>
                  )}
                </div>

                {/* Simulated Sheet Footer */}
                {settings.showHeaderFooter && (
                  <div className="border-t border-slate-200 pt-2 mt-2 flex items-center justify-between text-[9px] text-slate-500 shrink-0">
                    <div>
                      نمادها: {activePreviewPage?.nodes.length || 0} • حالت:{' '}
                      {settings.colorMode === 'color'
                        ? 'رنگی'
                        : settings.colorMode === 'grayscale'
                        ? 'خاکستری'
                        : 'سیاه و سفید'}
                    </div>
                    {settings.showPageNumbers && (
                      <div className="font-mono font-bold">
                        صفحه {currentPageIndex + 1} از {availablePages.length}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
