import React from 'react';
import {
  FlowchartNode,
  FlowchartEdge,
  LineType,
} from '../types/flowchart';
import { ColorTheme } from '../constants/themes';
import { TranslationDictionary } from '../constants/translations';
import {
  Sliders,
  Type,
  Maximize2,
  Palette,
  Trash2,
  Copy,
  Grid,
  Hash,
  Layers,
} from 'lucide-react';

interface PropertiesPanelProps {
  theme: ColorTheme;
  t: TranslationDictionary;
  selectedNode: FlowchartNode | null;
  selectedEdge: FlowchartEdge | null;
  onUpdateNode: (node: FlowchartNode) => void;
  onDeleteNode: (id: string) => void;
  onDuplicateNode: (id: string) => void;
  onUpdateEdge: (edge: FlowchartEdge) => void;
  onDeleteEdge: (id: string) => void;
  gridMode: 'dots' | 'lines' | 'none';
  setGridMode: (mode: 'dots' | 'lines' | 'none') => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  nodeCount: number;
  edgeCount: number;
  onClearCanvas: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  theme,
  t,
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
  onUpdateEdge,
  onDeleteEdge,
  gridMode,
  setGridMode,
  snapToGrid,
  setSnapToGrid,
  nodeCount,
  edgeCount,
  onClearCanvas,
}) => {
  return (
    <aside
      className="hidden xl:flex w-72 h-[calc(100vh-3.5rem)] flex-col border-l select-none overflow-y-auto p-4 space-y-4"
      style={{
        backgroundColor: theme.ui.cardBg,
        borderColor: theme.ui.border,
        color: theme.ui.textPrimary,
      }}
    >
      <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: theme.ui.border }}>
        <Sliders className="w-4 h-4 text-blue-500" />
        <span className="text-xs font-bold uppercase tracking-wider">{t.properties}</span>
      </div>

      {/* CASE 1: NODE SELECTED */}
      {selectedNode && (
        <div className="space-y-4 text-right">
          {/* Label Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t.text}</label>
            <input
              type="text"
              value={selectedNode.label}
              onChange={(e) => onUpdateNode({ ...selectedNode, label: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none"
              style={{
                backgroundColor: theme.ui.surface,
                borderColor: theme.ui.border,
                color: theme.ui.textPrimary,
              }}
            />
          </div>

          {/* Dimensions */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t.dimensions}</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] opacity-60 block">عرض (W)</span>
                <input
                  type="number"
                  value={selectedNode.width}
                  onChange={(e) =>
                    onUpdateNode({ ...selectedNode, width: Math.max(60, Number(e.target.value)) })
                  }
                  className="w-full px-2 py-1 text-xs rounded-lg border outline-none font-mono"
                  style={{
                    backgroundColor: theme.ui.surface,
                    borderColor: theme.ui.border,
                    color: theme.ui.textPrimary,
                  }}
                />
              </div>
              <div>
                <span className="text-[10px] opacity-60 block">ارتفاع (H)</span>
                <input
                  type="number"
                  value={selectedNode.height}
                  onChange={(e) =>
                    onUpdateNode({ ...selectedNode, height: Math.max(30, Number(e.target.value)) })
                  }
                  className="w-full px-2 py-1 text-xs rounded-lg border outline-none font-mono"
                  style={{
                    backgroundColor: theme.ui.surface,
                    borderColor: theme.ui.border,
                    color: theme.ui.textPrimary,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Color Palettes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t.colors}</label>
            <div className="grid grid-cols-4 gap-1.5">
              {theme.nodeColorPresets.map((p) => (
                <button
                  key={p.name}
                  onClick={() =>
                    onUpdateNode({
                      ...selectedNode,
                      fill: p.fill,
                      stroke: p.stroke,
                      textColor: p.text,
                    })
                  }
                  className="h-7 rounded-md border flex items-center justify-center transition-transform hover:scale-105"
                  style={{ backgroundColor: p.fill, borderColor: p.stroke }}
                  title={p.name}
                >
                  <span className="text-[10px] font-bold" style={{ color: p.text }}>
                    Aa
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stroke Width & Style */}
          <div className="space-y-2">
            <label className="text-xs font-semibold">{t.strokeWidth}</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((w) => (
                <button
                  key={w}
                  onClick={() => onUpdateNode({ ...selectedNode, strokeWidth: w })}
                  className={`flex-1 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                    selectedNode.strokeWidth === w
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    borderColor: selectedNode.strokeWidth === w ? '#2563EB' : theme.ui.border,
                    color: selectedNode.strokeWidth === w ? '#FFFFFF' : theme.ui.textPrimary,
                    backgroundColor: selectedNode.strokeWidth === w ? '#2563EB' : undefined,
                  }}
                >
                  {w}px
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => onUpdateNode({ ...selectedNode, strokeStyle: style })}
                  className={`flex-1 py-1 rounded text-xs border capitalize transition-colors ${
                    selectedNode.strokeStyle === style
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    borderColor: selectedNode.strokeStyle === style ? '#2563EB' : theme.ui.border,
                    color: selectedNode.strokeStyle === style ? '#FFFFFF' : theme.ui.textPrimary,
                    backgroundColor: selectedNode.strokeStyle === style ? '#2563EB' : undefined,
                  }}
                >
                  {t[style]}
                </button>
              ))}
            </div>
          </div>

          {/* Font Controls */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t.fontSize}</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={10}
                max={22}
                value={selectedNode.fontSize}
                onChange={(e) =>
                  onUpdateNode({ ...selectedNode, fontSize: Number(e.target.value) })
                }
                className="flex-1"
              />
              <span className="font-mono text-xs w-8 text-center">{selectedNode.fontSize}px</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t flex flex-col gap-2" style={{ borderColor: theme.ui.border }}>
            <button
              onClick={() => onDuplicateNode(selectedNode.id)}
              className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border text-xs font-medium hover:opacity-90"
              style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{t.duplicate}</span>
            </button>
            <button
              onClick={() => onDeleteNode(selectedNode.id)}
              className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/40 hover:bg-red-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.deleteSelected}</span>
            </button>
          </div>
        </div>
      )}

      {/* CASE 2: EDGE SELECTED */}
      {selectedEdge && (
        <div className="space-y-4 text-right">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t.edgeLabel}</label>
            <input
              type="text"
              placeholder="مثلاً: بله / خیر / تأیید"
              value={selectedEdge.label || ''}
              onChange={(e) => onUpdateEdge({ ...selectedEdge, label: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none"
              style={{
                backgroundColor: theme.ui.surface,
                borderColor: theme.ui.border,
                color: theme.ui.textPrimary,
              }}
            />
          </div>

          {/* Line Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t.lineType}</label>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  { type: 'orthogonal', label: t.orthogonal },
                  { type: 'curved', label: t.curved },
                  { type: 'straight', label: t.straight },
                ] as const
              ).map((item) => (
                <button
                  key={item.type}
                  onClick={() => onUpdateEdge({ ...selectedEdge, lineType: item.type })}
                  className={`py-1.5 px-2.5 rounded-lg text-xs border text-right transition-colors ${
                    selectedEdge.lineType === item.type
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    borderColor: selectedEdge.lineType === item.type ? '#2563EB' : theme.ui.border,
                    color: selectedEdge.lineType === item.type ? '#FFFFFF' : theme.ui.textPrimary,
                    backgroundColor: selectedEdge.lineType === item.type ? '#2563EB' : undefined,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Edge Style */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t.strokeStyle}</label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateEdge({ ...selectedEdge, style: 'solid' })}
                className={`flex-1 py-1 rounded text-xs border transition-colors ${
                  selectedEdge.style === 'solid'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'hover:opacity-80'
                }`}
                style={{
                  borderColor: selectedEdge.style === 'solid' ? '#2563EB' : theme.ui.border,
                  color: selectedEdge.style === 'solid' ? '#FFFFFF' : theme.ui.textPrimary,
                  backgroundColor: selectedEdge.style === 'solid' ? '#2563EB' : undefined,
                }}
              >
                {t.solid}
              </button>
              <button
                onClick={() => onUpdateEdge({ ...selectedEdge, style: 'dashed' })}
                className={`flex-1 py-1 rounded text-xs border transition-colors ${
                  selectedEdge.style === 'dashed'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'hover:opacity-80'
                }`}
                style={{
                  borderColor: selectedEdge.style === 'dashed' ? '#2563EB' : theme.ui.border,
                  color: selectedEdge.style === 'dashed' ? '#FFFFFF' : theme.ui.textPrimary,
                  backgroundColor: selectedEdge.style === 'dashed' ? '#2563EB' : undefined,
                }}
              >
                {t.dashed}
              </button>
            </div>
          </div>

          <div className="pt-3 border-t" style={{ borderColor: theme.ui.border }}>
            <button
              onClick={() => onDeleteEdge(selectedEdge.id)}
              className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/40 hover:bg-red-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.deleteSelected}</span>
            </button>
          </div>
        </div>
      )}

      {/* CASE 3: NO SELECTION -> CANVAS GENERAL SETTINGS */}
      {!selectedNode && !selectedEdge && (
        <div className="space-y-4 text-right">
          <div className="p-3 rounded-xl border text-xs opacity-80" style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}>
            {t.selectPrompt}
          </div>

          {/* Canvas Grid Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 opacity-60" />
              <span>حالت شبکه صفحه</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { mode: 'dots', label: t.gridDots },
                  { mode: 'lines', label: t.gridLines },
                  { mode: 'none', label: t.gridNone },
                ] as const
              ).map((item) => (
                <button
                  key={item.mode}
                  onClick={() => setGridMode(item.mode)}
                  className={`py-1.5 rounded-lg text-xs border transition-colors ${
                    gridMode === item.mode
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    borderColor: gridMode === item.mode ? '#2563EB' : theme.ui.border,
                    color: gridMode === item.mode ? '#FFFFFF' : theme.ui.textPrimary,
                    backgroundColor: gridMode === item.mode ? '#2563EB' : undefined,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Snap to grid checkbox */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="rounded"
            />
            <span>{t.snapToGrid} (۱۵px)</span>
          </label>

          {/* Project Statistics */}
          <div className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}>
            <div className="text-xs font-bold opacity-70">آمار پروژه فعلی</div>
            <div className="flex justify-between text-xs">
              <span className="opacity-60">تعداد اشکال (گره‌ها):</span>
              <span className="font-mono font-bold">{nodeCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="opacity-60">تعداد اتصالات (خطوط):</span>
              <span className="font-mono font-bold">{edgeCount}</span>
            </div>
          </div>

          {/* Clear canvas */}
          <div className="pt-2">
            <button
              onClick={onClearCanvas}
              className="w-full py-1.5 rounded-lg border text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              style={{ borderColor: theme.ui.border }}
            >
              {t.clearCanvas}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
