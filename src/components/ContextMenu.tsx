import React, { useState, useEffect, useRef } from 'react';
import {
  FlowchartNode,
  FlowchartEdge,
  FlowchartNodeType,
  LineType,
} from '../types/flowchart';
import { ColorTheme } from '../constants/themes';
import { Point } from '../utils/canvasMath';
import {
  Copy,
  Scissors,
  ClipboardPaste,
  CopyPlus,
  Trash2,
  Lock,
  Unlock,
  Type,
  Maximize2,
  Sparkles,
  Layers,
  ChevronsUp,
  ChevronsDown,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Palette,
  Image as ImageIcon,
  ArrowRight,
  ArrowLeftRight,
  Minus,
  Spline,
  CornerDownRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid,
  Check,
  CheckSquare,
  Square,
  Circle,
  Database,
  FileText,
  StickyNote,
  Code2,
} from 'lucide-react';

export type ContextMenuTarget =
  | { type: 'node'; node: FlowchartNode }
  | { type: 'edge'; edge: FlowchartEdge }
  | { type: 'canvas'; canvasPos: Point };

export interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  screenPos: Point;
  target: ContextMenuTarget;
  theme: ColorTheme;
  isRtl: boolean;

  // Node actions
  onEditNodeText?: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  onCopyNode?: (node: FlowchartNode) => void;
  onCutNode?: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onChangeNodeType?: (nodeId: string, newType: FlowchartNodeType) => void;
  onChangeNodeColors?: (nodeId: string, fill: string, stroke: string, textColor: string) => void;
  onBringToFront?: (nodeId: string) => void;
  onSendToBack?: (nodeId: string) => void;
  onBringForward?: (nodeId: string) => void;
  onSendBackward?: (nodeId: string) => void;
  onToggleNodeLock?: (nodeId: string) => void;
  onAutoFitNodeText?: (nodeId: string) => void;
  onAttachImageToNode?: (nodeId: string) => void;

  // Edge actions
  onEditEdgeLabel?: (edgeId: string) => void;
  onChangeEdgeLineType?: (edgeId: string, lineType: LineType) => void;
  onChangeEdgeArrows?: (edgeId: string, arrowStart: boolean, arrowEnd: boolean) => void;
  onChangeEdgeStyle?: (edgeId: string, style: 'solid' | 'dashed') => void;
  onChangeEdgeStrokeWidth?: (edgeId: string, width: number) => void;
  onChangeEdgeColor?: (edgeId: string, color: string) => void;
  onReverseEdge?: (edgeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;

  // Canvas actions
  onAddNodeAt?: (type: FlowchartNodeType, pos: Point) => void;
  onPasteAt?: (pos: Point) => void;
  hasClipboardNode?: boolean;
  onInsertImageAt?: (pos: Point) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onFitToScreen?: () => void;
  gridMode?: 'dots' | 'lines' | 'none';
  onSetGridMode?: (mode: 'dots' | 'lines' | 'none') => void;
  snapToGrid?: boolean;
  onToggleSnapToGrid?: () => void;
  onAutoFitAllNodes?: () => void;
  onSelectAllNodes?: () => void;
  onClearCanvas?: () => void;
}

const SHAPE_DEFS: Array<{
  type: FlowchartNodeType;
  labelFa: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: 'terminal', labelFa: 'شروع / پایان', labelEn: 'Terminal', icon: Circle },
  { type: 'process', labelFa: 'پردازش و عملیات', labelEn: 'Process', icon: Square },
  { type: 'decision', labelFa: 'شرط و تصمیم‌گیری', labelEn: 'Decision', icon: Sparkles },
  { type: 'input-output', labelFa: 'ورودی / خروجی', labelEn: 'Input/Output', icon: CornerDownRight },
  { type: 'document', labelFa: 'سند و گزارش', labelEn: 'Document', icon: FileText },
  { type: 'subroutine', labelFa: 'زیربرنامه / تابع', labelEn: 'Subroutine', icon: Code2 },
  { type: 'database', labelFa: 'پایگاه داده', labelEn: 'Database', icon: Database },
  { type: 'connector', labelFa: 'رابط و ارجاع', labelEn: 'Connector', icon: Circle },
  { type: 'note', labelFa: 'یادداشت چسبان', labelEn: 'Note', icon: StickyNote },
  { type: 'image', labelFa: 'تصویر و گام تصویری', labelEn: 'Image Node', icon: ImageIcon },
];

const QUICK_PALETTES = [
  { name: 'آبی کلاسیک', fill: '#EFF6FF', stroke: '#3B82F6', textColor: '#1E3A8A' },
  { name: 'سبز زمردی', fill: '#ECFDF5', stroke: '#10B981', textColor: '#064E3B' },
  { name: 'بنفش رویال', fill: '#F5F3FF', stroke: '#8B5CF6', textColor: '#4C1D95' },
  { name: 'کهربایی گرم', fill: '#FFFBEB', stroke: '#F59E0B', textColor: '#78350F' },
  { name: 'رز و قرمز', fill: '#FFF1F2', stroke: '#F43F5E', textColor: '#881337' },
  { name: 'خاکستری شیک', fill: '#F8FAFC', stroke: '#64748B', textColor: '#0F172A' },
  { name: 'فیروزه‌ای زنده', fill: '#ECFEFF', stroke: '#06B6D4', textColor: '#164E63' },
  { name: 'تیره متالیک', fill: '#1E293B', stroke: '#475569', textColor: '#F8FAFC' },
];

const EDGE_COLORS = [
  { name: 'خاکستری', color: '#64748B' },
  { name: 'آبی', color: '#3B82F6' },
  { name: 'سبز', color: '#10B981' },
  { name: 'قرمز', color: '#EF4444' },
  { name: 'بنفش', color: '#8B5CF6' },
  { name: 'کهربایی', color: '#F59E0B' },
];

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  onClose,
  screenPos,
  target,
  theme,
  isRtl,
  onEditNodeText,
  onDuplicateNode,
  onCopyNode,
  onCutNode,
  onDeleteNode,
  onChangeNodeType,
  onChangeNodeColors,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onToggleNodeLock,
  onAutoFitNodeText,
  onAttachImageToNode,
  onEditEdgeLabel,
  onChangeEdgeLineType,
  onChangeEdgeArrows,
  onChangeEdgeStyle,
  onChangeEdgeStrokeWidth,
  onChangeEdgeColor,
  onReverseEdge,
  onDeleteEdge,
  onAddNodeAt,
  onPasteAt,
  hasClipboardNode,
  onInsertImageAt,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToScreen,
  gridMode,
  onSetGridMode,
  snapToGrid,
  onToggleSnapToGrid,
  onAutoFitAllNodes,
  onSelectAllNodes,
  onClearCanvas,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [adjustedPos, setAdjustedPos] = useState<Point>(screenPos);

  // Reposition inside viewport safely
  useEffect(() => {
    if (!isOpen) {
      setActiveSubmenu(null);
      return;
    }

    const pad = 12;
    const estWidth = 240;
    const estHeight = 360;

    let x = screenPos.x;
    let y = screenPos.y;

    if (x + estWidth > window.innerWidth - pad) {
      x = Math.max(pad, window.innerWidth - estWidth - pad);
    }
    if (y + estHeight > window.innerHeight - pad) {
      y = Math.max(pad, window.innerHeight - estHeight - pad);
    }

    setAdjustedPos({ x, y });
  }, [isOpen, screenPos]);

  // Click outside and escape handling
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    // Use capture phase for clicking outside
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmenuEnter = (key: string) => {
    if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current);
    setActiveSubmenu(key);
  };

  const handleSubmenuLeave = () => {
    if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current);
    submenuTimeoutRef.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 280);
  };

  const handleAction = (action?: () => void) => {
    if (action) {
      action();
    }
    onClose();
  };

  const SubmenuArrow = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div
      ref={menuRef}
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed z-50 min-w-[220px] max-w-[280px] rounded-xl shadow-2xl border py-1.5 backdrop-blur-md select-none text-xs animate-in fade-in zoom-in-95 duration-100 cursor-default"
      style={{
        left: adjustedPos.x,
        top: adjustedPos.y,
        backgroundColor: theme.ui.cardBg,
        borderColor: theme.ui.border,
        color: theme.ui.textPrimary,
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* ============================================================ */}
      {/* 1. NODE CONTEXT MENU */}
      {/* ============================================================ */}
      {target.type === 'node' && (
        <div>
          {/* Header Badge */}
          <div
            className="px-3 py-1.5 border-b mb-1 flex items-center justify-between opacity-80 font-sans"
            style={{ borderColor: theme.ui.border }}
          >
            <div className="flex items-center gap-1.5 truncate max-w-[170px]">
              <span className="font-semibold truncate">
                {target.node.label.trim() || 'گره بدون عنوان'}
              </span>
            </div>
            {target.node.locked && (
              <span className="text-[10px] text-amber-500 font-mono flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> قفل
              </span>
            )}
          </div>

          {/* Edit Text */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => onEditNodeText?.(target.node.id));
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-blue-500" />
              <span>{isRtl ? 'ویرایش متن' : 'Edit Text'}</span>
            </span>
            <kbd className="text-[10px] opacity-50 font-mono">Enter</kbd>
          </button>

          {/* Duplicate */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => onDuplicateNode?.(target.node.id));
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <CopyPlus className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isRtl ? 'تکثیر شکل' : 'Duplicate'}</span>
            </span>
            <kbd className="text-[10px] opacity-50 font-mono">Ctrl+D</kbd>
          </button>

          {/* Copy */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => onCopyNode?.(target.node));
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>{isRtl ? 'کپی' : 'Copy'}</span>
            </span>
            <kbd className="text-[10px] opacity-50 font-mono">Ctrl+C</kbd>
          </button>

          {/* Cut */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => onCutNode?.(target.node.id));
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-amber-500" />
              <span>{isRtl ? 'برش' : 'Cut'}</span>
            </span>
            <kbd className="text-[10px] opacity-50 font-mono">Ctrl+X</kbd>
          </button>

          <div className="h-[1px] my-1" style={{ backgroundColor: theme.ui.border }} />

          {/* Change Shape Type Submenu */}
          <div
            className="relative"
            onMouseEnter={() => handleSubmenuEnter('shape-type')}
            onMouseLeave={handleSubmenuLeave}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>{isRtl ? 'تغییر نوع شکل' : 'Change Shape Type'}</span>
              </span>
              <SubmenuArrow className="w-3.5 h-3.5 opacity-50" />
            </button>

            {activeSubmenu === 'shape-type' && (
              <div
                className={`absolute top-0 min-w-[200px] rounded-xl shadow-2xl border py-1.5 backdrop-blur-md z-50 ${
                  isRtl ? 'right-full mr-1' : 'left-full ml-1'
                }`}
                style={{
                  backgroundColor: theme.ui.cardBg,
                  borderColor: theme.ui.border,
                  color: theme.ui.textPrimary,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {SHAPE_DEFS.map((s) => {
                  const Icon = s.icon;
                  const isCurrent = target.node.type === s.type;
                  return (
                    <button
                      type="button"
                      key={s.type}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(() => onChangeNodeType?.(target.node.id, s.type));
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-blue-500" />
                        <span>{isRtl ? s.labelFa : s.labelEn}</span>
                      </span>
                      {isCurrent && <Check className="w-3 h-3 text-blue-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Color Palette Submenu */}
          <div
            className="relative"
            onMouseEnter={() => handleSubmenuEnter('colors')}
            onMouseLeave={handleSubmenuLeave}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-pink-500" />
                <span>{isRtl ? 'پالت استایل سریع' : 'Quick Colors'}</span>
              </span>
              <SubmenuArrow className="w-3.5 h-3.5 opacity-50" />
            </button>

            {activeSubmenu === 'colors' && (
              <div
                className={`absolute top-0 min-w-[190px] rounded-xl shadow-2xl border py-1.5 backdrop-blur-md z-50 ${
                  isRtl ? 'right-full mr-1' : 'left-full ml-1'
                }`}
                style={{
                  backgroundColor: theme.ui.cardBg,
                  borderColor: theme.ui.border,
                  color: theme.ui.textPrimary,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {QUICK_PALETTES.map((p) => (
                  <button
                    type="button"
                    key={p.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(() => onChangeNodeColors?.(target.node.id, p.fill, p.stroke, p.textColor));
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border shadow-xs shrink-0"
                        style={{ backgroundColor: p.fill, borderColor: p.stroke }}
                      />
                      <span>{p.name}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Arrange / Z-Index Submenu */}
          <div
            className="relative"
            onMouseEnter={() => handleSubmenuEnter('layers')}
            onMouseLeave={handleSubmenuLeave}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-sky-500" />
                <span>{isRtl ? 'ترتیب لایه‌ها' : 'Layer Order'}</span>
              </span>
              <SubmenuArrow className="w-3.5 h-3.5 opacity-50" />
            </button>

            {activeSubmenu === 'layers' && (
              <div
                className={`absolute top-0 min-w-[180px] rounded-xl shadow-2xl border py-1.5 backdrop-blur-md z-50 ${
                  isRtl ? 'right-full mr-1' : 'left-full ml-1'
                }`}
                style={{
                  backgroundColor: theme.ui.cardBg,
                  borderColor: theme.ui.border,
                  color: theme.ui.textPrimary,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onBringToFront?.(target.node.id));
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <ChevronsUp className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isRtl ? 'آوردن به روترین لایه' : 'Bring to Front'}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onBringForward?.(target.node.id));
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isRtl ? 'یک لایه به جلو' : 'Bring Forward'}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onSendBackward?.(target.node.id));
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isRtl ? 'یک لایه به عقب' : 'Send Backward'}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onSendToBack?.(target.node.id));
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <ChevronsDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isRtl ? 'فرستادن به زیرترین لایه' : 'Send to Back'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="h-[1px] my-1" style={{ backgroundColor: theme.ui.border }} />

          {/* Auto fit size to text */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => onAutoFitNodeText?.(target.node.id));
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-teal-500" />
            <span>{isRtl ? 'تنظیم خودکار ابعاد با متن' : 'Auto-fit Size'}</span>
          </button>

          {/* Attach / Change Image */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => onAttachImageToNode?.(target.node.id));
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-violet-500" />
            <span>
              {target.node.imageUrl
                ? isRtl
                  ? 'تغییر تصویر شکل'
                  : 'Change Image'
                : isRtl
                ? 'افزودن تصویر به شکل'
                : 'Attach Image'}
            </span>
          </button>

          {/* Toggle Lock */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => onToggleNodeLock?.(target.node.id));
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {target.node.locked ? (
                <Unlock className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>
                {target.node.locked
                  ? isRtl
                    ? 'باز کردن قفل شکل'
                    : 'Unlock Shape'
                  : isRtl
                  ? 'قفل کردن شکل'
                  : 'Lock Shape'}
              </span>
            </span>
          </button>

          <div className="h-[1px] my-1" style={{ backgroundColor: theme.ui.border }} />

          {/* Delete Node */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => onDeleteNode?.(target.node.id));
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-right font-medium cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'حذف شکل' : 'Delete'}</span>
            </span>
            <kbd className="text-[10px] opacity-70 font-mono">Del</kbd>
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. EDGE CONTEXT MENU */}
      {/* ============================================================ */}
      {target.type === 'edge' && (
        <div>
          {/* Header */}
          <div
            className="px-3 py-1.5 border-b mb-1 flex items-center justify-between opacity-80 font-sans"
            style={{ borderColor: theme.ui.border }}
          >
            <span className="font-semibold">{isRtl ? 'خط ارتباطی' : 'Connection Edge'}</span>
            <span className="text-[10px] font-mono opacity-60">
              {target.edge.lineType === 'orthogonal'
                ? 'پله‌ای'
                : target.edge.lineType === 'curved'
                ? 'منحنی'
                : 'مستقیم'}
            </span>
          </div>

          {/* Edit Label */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => onEditEdgeLabel?.(target.edge.id));
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-blue-500" />
              <span>{isRtl ? 'ویرایش متن برچسب' : 'Edit Edge Label'}</span>
            </span>
          </button>

          {/* Line Type Submenu */}
          <div
            className="relative"
            onMouseEnter={() => handleSubmenuEnter('edge-type')}
            onMouseLeave={handleSubmenuLeave}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <CornerDownRight className="w-3.5 h-3.5 text-indigo-500" />
                <span>{isRtl ? 'نوع مسیر خط' : 'Line Routing'}</span>
              </span>
              <SubmenuArrow className="w-3.5 h-3.5 opacity-50" />
            </button>

            {activeSubmenu === 'edge-type' && (
              <div
                className={`absolute top-0 min-w-[170px] rounded-xl shadow-2xl border py-1.5 backdrop-blur-md z-50 ${
                  isRtl ? 'right-full mr-1' : 'left-full ml-1'
                }`}
                style={{
                  backgroundColor: theme.ui.cardBg,
                  borderColor: theme.ui.border,
                  color: theme.ui.textPrimary,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onChangeEdgeLineType?.(target.edge.id, 'orthogonal'));
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <CornerDownRight className="w-3.5 h-3.5 text-blue-500" />
                    <span>{isRtl ? 'خط پله‌ای (شکسته)' : 'Orthogonal'}</span>
                  </span>
                  {target.edge.lineType === 'orthogonal' && <Check className="w-3 h-3 text-blue-500" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onChangeEdgeLineType?.(target.edge.id, 'curved'));
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Spline className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isRtl ? 'منحنی نرم' : 'Curved'}</span>
                  </span>
                  {target.edge.lineType === 'curved' && <Check className="w-3 h-3 text-blue-500" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onChangeEdgeLineType?.(target.edge.id, 'straight'));
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Minus className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isRtl ? 'مستقیم ساده' : 'Straight'}</span>
                  </span>
                  {target.edge.lineType === 'straight' && <Check className="w-3 h-3 text-blue-500" />}
                </button>
              </div>
            )}
          </div>

          {/* Arrow Heads Submenu */}
          <div
            className="relative"
            onMouseEnter={() => handleSubmenuEnter('edge-arrows')}
            onMouseLeave={handleSubmenuLeave}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-cyan-500" />
                <span>{isRtl ? 'جهت پیکان‌ها' : 'Arrow Heads'}</span>
              </span>
              <SubmenuArrow className="w-3.5 h-3.5 opacity-50" />
            </button>

            {activeSubmenu === 'edge-arrows' && (
              <div
                className={`absolute top-0 min-w-[170px] rounded-xl shadow-2xl border py-1.5 backdrop-blur-md z-50 ${
                  isRtl ? 'right-full mr-1' : 'left-full ml-1'
                }`}
                style={{
                  backgroundColor: theme.ui.cardBg,
                  borderColor: theme.ui.border,
                  color: theme.ui.textPrimary,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onChangeEdgeArrows?.(target.edge.id, false, true));
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <span>{isRtl ? '➔ فلش در انتها' : 'Forward ➔'}</span>
                  {!target.edge.arrowStart && target.edge.arrowEnd !== false && (
                    <Check className="w-3 h-3 text-blue-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onChangeEdgeArrows?.(target.edge.id, true, true));
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <span>{isRtl ? '↔️ دوطرفه' : 'Bidirectional ↔️'}</span>
                  {target.edge.arrowStart && target.edge.arrowEnd && (
                    <Check className="w-3 h-3 text-blue-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onChangeEdgeArrows?.(target.edge.id, true, false));
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <span>{isRtl ? '⬅️ فلش در ابتدا' : 'Backward ⬅️'}</span>
                  {target.edge.arrowStart && !target.edge.arrowEnd && (
                    <Check className="w-3 h-3 text-blue-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onChangeEdgeArrows?.(target.edge.id, false, false));
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <span>{isRtl ? '─ بدون فلش' : 'None ─'}</span>
                  {!target.edge.arrowStart && target.edge.arrowEnd === false && (
                    <Check className="w-3 h-3 text-blue-500" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Line Style (Solid / Dashed) */}
          <div
            className="relative"
            onMouseEnter={() => handleSubmenuEnter('edge-style')}
            onMouseLeave={handleSubmenuLeave}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Minus className="w-3.5 h-3.5 text-amber-500" />
                <span>{isRtl ? 'نوع خط (پیوسته / خط‌چین)' : 'Line Style'}</span>
              </span>
              <SubmenuArrow className="w-3.5 h-3.5 opacity-50" />
            </button>

            {activeSubmenu === 'edge-style' && (
              <div
                className={`absolute top-0 min-w-[160px] rounded-xl shadow-2xl border py-1.5 backdrop-blur-md z-50 ${
                  isRtl ? 'right-full mr-1' : 'left-full ml-1'
                }`}
                style={{
                  backgroundColor: theme.ui.cardBg,
                  borderColor: theme.ui.border,
                  color: theme.ui.textPrimary,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onChangeEdgeStyle?.(target.edge.id, 'solid'));
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <span>{isRtl ? 'خط پیوسته (Solid)' : 'Solid'}</span>
                  {target.edge.style !== 'dashed' && <Check className="w-3 h-3 text-blue-500" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onChangeEdgeStyle?.(target.edge.id, 'dashed'));
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <span>{isRtl ? 'خط‌چین (Dashed)' : 'Dashed'}</span>
                  {target.edge.style === 'dashed' && <Check className="w-3 h-3 text-blue-500" />}
                </button>
              </div>
            )}
          </div>

          {/* Stroke Width Submenu */}
          <div
            className="relative"
            onMouseEnter={() => handleSubmenuEnter('edge-width')}
            onMouseLeave={handleSubmenuLeave}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Maximize2 className="w-3.5 h-3.5 text-teal-500" />
                <span>{isRtl ? 'ضخامت خط' : 'Stroke Width'}</span>
              </span>
              <SubmenuArrow className="w-3.5 h-3.5 opacity-50" />
            </button>

            {activeSubmenu === 'edge-width' && (
              <div
                className={`absolute top-0 min-w-[150px] rounded-xl shadow-2xl border py-1.5 backdrop-blur-md z-50 ${
                  isRtl ? 'right-full mr-1' : 'left-full ml-1'
                }`}
                style={{
                  backgroundColor: theme.ui.cardBg,
                  borderColor: theme.ui.border,
                  color: theme.ui.textPrimary,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {[1, 2, 3, 4].map((w) => (
                  <button
                    type="button"
                    key={w}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(() => onChangeEdgeStrokeWidth?.(target.edge.id, w));
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right font-mono cursor-pointer"
                  >
                    <span>{w} px</span>
                    {target.edge.strokeWidth === w && <Check className="w-3 h-3 text-blue-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color Submenu */}
          <div
            className="relative"
            onMouseEnter={() => handleSubmenuEnter('edge-color')}
            onMouseLeave={handleSubmenuLeave}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-pink-500" />
                <span>{isRtl ? 'رنگ خط' : 'Line Color'}</span>
              </span>
              <SubmenuArrow className="w-3.5 h-3.5 opacity-50" />
            </button>

            {activeSubmenu === 'edge-color' && (
              <div
                className={`absolute top-0 min-w-[160px] rounded-xl shadow-2xl border py-1.5 backdrop-blur-md z-50 ${
                  isRtl ? 'right-full mr-1' : 'left-full ml-1'
                }`}
                style={{
                  backgroundColor: theme.ui.cardBg,
                  borderColor: theme.ui.border,
                  color: theme.ui.textPrimary,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {EDGE_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(() => onChangeEdgeColor?.(target.edge.id, c.color));
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span>{c.name}</span>
                    </span>
                    {target.edge.color === c.color && <Check className="w-3 h-3 text-blue-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reverse Direction */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => onReverseEdge?.(target.edge.id));
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ArrowLeftRight className="w-3.5 h-3.5 text-violet-500" />
              <span>{isRtl ? 'معکوس کردن مسیر' : 'Reverse Direction'}</span>
            </span>
          </button>

          <div className="h-[1px] my-1" style={{ backgroundColor: theme.ui.border }} />

          {/* Delete Edge */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => onDeleteEdge?.(target.edge.id));
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-right font-medium cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'حذف خط ارتباطی' : 'Delete Connection'}</span>
            </span>
            <kbd className="text-[10px] opacity-70 font-mono">Del</kbd>
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. CANVAS EMPTY AREA CONTEXT MENU */}
      {/* ============================================================ */}
      {target.type === 'canvas' && (
        <div>
          {/* Header */}
          <div
            className="px-3 py-1.5 border-b mb-1 flex items-center justify-between opacity-80 font-sans"
            style={{ borderColor: theme.ui.border }}
          >
            <span className="font-semibold">{isRtl ? 'صفحه فلوچارت' : 'Flowchart Canvas'}</span>
            <span className="text-[10px] font-mono opacity-60">
              {Math.round(target.canvasPos.x)}, {Math.round(target.canvasPos.y)}
            </span>
          </div>

          {/* Add Shape Submenu */}
          <div
            className="relative"
            onMouseEnter={() => handleSubmenuEnter('add-shape')}
            onMouseLeave={handleSubmenuLeave}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right font-medium cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>{isRtl ? 'افزودن شکل جدید در اینجا' : 'Add Shape Here'}</span>
              </span>
              <SubmenuArrow className="w-3.5 h-3.5 opacity-50" />
            </button>

            {activeSubmenu === 'add-shape' && (
              <div
                className={`absolute top-0 min-w-[200px] rounded-xl shadow-2xl border py-1.5 backdrop-blur-md z-50 ${
                  isRtl ? 'right-full mr-1' : 'left-full ml-1'
                }`}
                style={{
                  backgroundColor: theme.ui.cardBg,
                  borderColor: theme.ui.border,
                  color: theme.ui.textPrimary,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {SHAPE_DEFS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      type="button"
                      key={s.type}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(() => onAddNodeAt?.(s.type, target.canvasPos));
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                    >
                      <Icon className="w-3.5 h-3.5 text-blue-500" />
                      <span>{isRtl ? s.labelFa : s.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paste Node (disabled if no clipboard) */}
          <button
            type="button"
            disabled={!hasClipboardNode}
            onClick={(e) => {
              e.stopPropagation();
              if (hasClipboardNode) {
                handleAction(() => onPasteAt?.(target.canvasPos));
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-1.5 transition-colors text-right ${
              hasClipboardNode
                ? 'hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2">
              <ClipboardPaste className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isRtl ? 'جای‌گذاری شکل کپی‌شده' : 'Paste Shape'}</span>
            </span>
            <kbd className="text-[10px] opacity-50 font-mono">Ctrl+V</kbd>
          </button>

          {/* Insert Image */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => onInsertImageAt?.(target.canvasPos));
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-violet-500" />
            <span>{isRtl ? 'درج تصویر از رایانه...' : 'Insert Image...'}</span>
          </button>

          <div className="h-[1px] my-1" style={{ backgroundColor: theme.ui.border }} />

          {/* Zoom and View Submenu */}
          <div
            className="relative"
            onMouseEnter={() => handleSubmenuEnter('view')}
            onMouseLeave={handleSubmenuLeave}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ZoomIn className="w-3.5 h-3.5 text-sky-500" />
                <span>{isRtl ? 'نمایش و بزرگ‌نمایی' : 'View & Zoom'}</span>
              </span>
              <SubmenuArrow className="w-3.5 h-3.5 opacity-50" />
            </button>

            {activeSubmenu === 'view' && (
              <div
                className={`absolute top-0 min-w-[180px] rounded-xl shadow-2xl border py-1.5 backdrop-blur-md z-50 ${
                  isRtl ? 'right-full mr-1' : 'left-full ml-1'
                }`}
                style={{
                  backgroundColor: theme.ui.cardBg,
                  borderColor: theme.ui.border,
                  color: theme.ui.textPrimary,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(onZoomIn);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'بزرگ‌نمایی (+۱۵٪)' : 'Zoom In'}</span>
                  </span>
                  <kbd className="text-[10px] opacity-50 font-mono">+</kbd>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(onZoomOut);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ZoomOut className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'کوچک‌نمایی (-۱۵٪)' : 'Zoom Out'}</span>
                  </span>
                  <kbd className="text-[10px] opacity-50 font-mono">-</kbd>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(onResetZoom);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'اندازه اصلی (۱۰۰٪)' : 'Reset 100%'}</span>
                  </span>
                  <kbd className="text-[10px] opacity-50 font-mono">0</kbd>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(onFitToScreen);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right font-medium text-blue-500 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'نمایش کامل کل دیاگرام' : 'Fit to Screen'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Grid Settings Submenu */}
          <div
            className="relative"
            onMouseEnter={() => handleSubmenuEnter('grid')}
            onMouseLeave={handleSubmenuLeave}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Grid className="w-3.5 h-3.5 text-slate-500" />
                <span>{isRtl ? 'تنظیمات شبکه پس‌زمینه' : 'Grid Settings'}</span>
              </span>
              <SubmenuArrow className="w-3.5 h-3.5 opacity-50" />
            </button>

            {activeSubmenu === 'grid' && (
              <div
                className={`absolute top-0 min-w-[190px] rounded-xl shadow-2xl border py-1.5 backdrop-blur-md z-50 ${
                  isRtl ? 'right-full mr-1' : 'left-full ml-1'
                }`}
                style={{
                  backgroundColor: theme.ui.cardBg,
                  borderColor: theme.ui.border,
                  color: theme.ui.textPrimary,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onSetGridMode?.('dots'));
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <span>{isRtl ? 'شبکه نقطه‌ای' : 'Dot Grid'}</span>
                  {gridMode === 'dots' && <Check className="w-3 h-3 text-blue-500" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onSetGridMode?.('lines'));
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <span>{isRtl ? 'شبکه خطی' : 'Line Grid'}</span>
                  {gridMode === 'lines' && <Check className="w-3 h-3 text-blue-500" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onSetGridMode?.('none'));
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <span>{isRtl ? 'بدون شبکه (خام)' : 'No Grid'}</span>
                  {gridMode === 'none' && <Check className="w-3 h-3 text-blue-500" />}
                </button>

                <div className="h-[1px] my-1" style={{ backgroundColor: theme.ui.border }} />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(onToggleSnapToGrid);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
                >
                  <span>{isRtl ? 'چسبیدن به شبکه (Snap)' : 'Snap to Grid'}</span>
                  {snapToGrid && <Check className="w-3 h-3 text-blue-500" />}
                </button>
              </div>
            )}
          </div>

          <div className="h-[1px] my-1" style={{ backgroundColor: theme.ui.border }} />

          {/* Auto-fit all text */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onAutoFitAllNodes);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isRtl ? 'تنظیم خودکار ابعاد تمام شکل‌ها' : 'Auto-fit All Shapes'}</span>
          </button>

          {/* Select All */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onSelectAllNodes);
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>{isRtl ? 'انتخاب همه' : 'Select All'}</span>
            </span>
            <kbd className="text-[10px] opacity-50 font-mono">Ctrl+A</kbd>
          </button>

          <div className="h-[1px] my-1" style={{ backgroundColor: theme.ui.border }} />

          {/* Clear Canvas */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onClearCanvas);
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-right font-medium cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'پاکسازی صفحه...' : 'Clear Canvas...'}</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
