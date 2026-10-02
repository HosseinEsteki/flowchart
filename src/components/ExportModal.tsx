import React, { useState } from 'react';
import { ColorTheme } from '../constants/themes';
import { TranslationDictionary } from '../constants/translations';
import { FlowchartProject } from '../types/flowchart';
import {
  exportToPng,
  exportToSvg,
  exportToHtml,
  exportToPdf,
  exportToJson,
  exportToVisNetworkZip,
  exportToVisNetworkSingleHtml,
} from '../utils/exportUtils';
import {
  X,
  Image,
  FileCode,
  FileText,
  Code2,
  Database,
  Check,
  Loader2,
  Sparkles,
  Printer,
  Archive,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ColorTheme;
  t: TranslationDictionary;
  project: FlowchartProject;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onOpenPrint?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  theme,
  t,
  project,
  svgRef,
  onOpenPrint,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async (type: 'png' | 'svg' | 'html' | 'vis-single-html' | 'pdf' | 'json') => {
    setIsExporting(true);
    setSuccessMessage(null);

    try {
      if (type === 'png' && svgRef.current) {
        await exportToPng(svgRef.current, project.title || 'flowchart', 2, '#FFFFFF');
      } else if (type === 'svg' && svgRef.current) {
        await exportToSvg(svgRef.current, project.title || 'flowchart');
      } else if (type === 'html') {
        await exportToVisNetworkZip(project, project.title || 'flowchart');
      } else if (type === 'vis-single-html') {
        exportToVisNetworkSingleHtml(project, project.title || 'flowchart');
      } else if (type === 'pdf' && svgRef.current) {
        await exportToPdf(svgRef.current, project, project.title || 'flowchart');
      } else if (type === 'json') {
        exportToJson(project);
      }
      setSuccessMessage(t.exportSuccess);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3500);
    } catch (err) {
      console.warn('Export operation notice:', err);
    } finally {
      setIsExporting(false);
    }
  };

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
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-sm md:text-base">{t.exportTitle}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-70 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast */}
        {successMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Export Options Grid */}
        <div className="grid grid-cols-1 gap-2 max-h-[65vh] overflow-y-auto pr-1">
          {/* Vis-Network Local Offline ZIP */}
          <button
            onClick={() => handleExport('html')}
            disabled={isExporting}
            className="flex items-center gap-3 p-3 rounded-xl border text-right transition-all hover:scale-[1.01] hover:border-blue-400 group cursor-pointer w-full"
            style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden min-w-0">
              <div className="text-xs md:text-sm font-bold truncate">{t.exportVisZip}</div>
              <div className="text-[11px] opacity-60 leading-tight mt-0.5 truncate">
                {t.exportVisZipDesc}
              </div>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-slate-200/60 dark:bg-slate-700/60 shrink-0">
              .ZIP
            </span>
          </button>

          {/* Vis-Network Single HTML */}
          <button
            onClick={() => handleExport('vis-single-html')}
            disabled={isExporting}
            className="flex items-center gap-3 p-3 rounded-xl border text-right transition-all hover:scale-[1.01] hover:border-blue-400 group cursor-pointer w-full"
            style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden min-w-0">
              <div className="text-xs md:text-sm font-bold truncate">{t.exportVisSingleHtml}</div>
              <div className="text-[11px] opacity-60 leading-tight mt-0.5 truncate">
                {t.exportVisSingleHtmlDesc}
              </div>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-slate-200/60 dark:bg-slate-700/60 shrink-0">
              .HTML
            </span>
          </button>

          {/* PNG */}
          <button
            onClick={() => handleExport('png')}
            disabled={isExporting}
            className="flex items-center gap-3 p-3 rounded-xl border text-right transition-all hover:scale-[1.01] hover:border-blue-400 group cursor-pointer w-full"
            style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Image className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden min-w-0">
              <div className="text-xs md:text-sm font-bold truncate">{t.exportPng}</div>
              <div className="text-[11px] opacity-60 leading-tight mt-0.5 truncate">{t.exportPngDesc}</div>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-slate-200/60 dark:bg-slate-700/60 shrink-0">
              .PNG
            </span>
          </button>

          {/* SVG */}
          <button
            onClick={() => handleExport('svg')}
            disabled={isExporting}
            className="flex items-center gap-3 p-3 rounded-xl border text-right transition-all hover:scale-[1.01] hover:border-blue-400 group cursor-pointer w-full"
            style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden min-w-0">
              <div className="text-xs md:text-sm font-bold truncate">{t.exportSvg}</div>
              <div className="text-[11px] opacity-60 leading-tight mt-0.5 truncate">{t.exportSvgDesc}</div>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-slate-200/60 dark:bg-slate-700/60 shrink-0">
              .SVG
            </span>
          </button>

          {/* PDF */}
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="flex items-center gap-3 p-3 rounded-xl border text-right transition-all hover:scale-[1.01] hover:border-blue-400 group cursor-pointer w-full"
            style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden min-w-0">
              <div className="text-xs md:text-sm font-bold truncate">{t.exportPdf}</div>
              <div className="text-[11px] opacity-60 leading-tight mt-0.5 truncate">{t.exportPdfDesc}</div>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-slate-200/60 dark:bg-slate-700/60 shrink-0">
              .PDF
            </span>
          </button>

          {/* Print Project */}
          {onOpenPrint && (
            <button
              onClick={() => {
                onClose();
                onOpenPrint();
              }}
              disabled={isExporting}
              className="flex items-center gap-3 p-3 rounded-xl border text-right transition-all hover:scale-[1.01] hover:border-blue-400 group cursor-pointer w-full"
              style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div className="flex-1 overflow-hidden min-w-0">
                <div className="text-xs md:text-sm font-bold truncate">{t.printReadyTitle}</div>
                <div className="text-[11px] opacity-60 leading-tight mt-0.5 truncate">
                  آماده‌سازی برای پرینت فلوچارت، تنظیم صفحه، مقیاس و یادداشت‌ها
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-slate-200/60 dark:bg-slate-700/60 shrink-0">
                PRINT
              </span>
            </button>
          )}

          {/* JSON Backup */}
          <button
            onClick={() => handleExport('json')}
            disabled={isExporting}
            className="flex items-center gap-3 p-3 rounded-xl border text-right transition-all hover:scale-[1.01] hover:border-blue-400 group cursor-pointer w-full"
            style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden min-w-0">
              <div className="text-xs md:text-sm font-bold truncate">{t.exportJson}</div>
              <div className="text-[11px] opacity-60 leading-tight mt-0.5 truncate">{t.exportJsonDesc}</div>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-slate-200/60 dark:bg-slate-700/60 shrink-0">
              .JSON
            </span>
          </button>
        </div>

        {isExporting && (
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-blue-500 py-1">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>در حال ایجاد و بارگیری فایل...</span>
          </div>
        )}
      </div>
    </div>
  );
};
