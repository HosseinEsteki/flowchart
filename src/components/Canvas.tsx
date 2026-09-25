import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  FlowchartNode,
  FlowchartEdge,
  FlowchartPort,
  Collaborator,
  LineType,
} from '../types/flowchart';
import { ColorTheme } from '../constants/themes';
import { TranslationDictionary } from '../constants/translations';
import { getPortPosition, calculateEdgePath, Point, getNodeBoundingBox } from '../utils/canvasMath';
import { renderNodeShapePath } from '../utils/shapePaths';
import { Trash2, Copy, Bold, Type, CornerDownRight, Compass } from 'lucide-react';

interface CanvasProps {
  theme: ColorTheme;
  t: TranslationDictionary;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onSelectNode: (id: string | null) => void;
  onSelectEdge: (id: string | null) => void;
  onUpdateNode: (node: FlowchartNode) => void;
  onDeleteNode: (id: string) => void;
  onDuplicateNode: (id: string) => void;
  onCreateEdge: (edge: FlowchartEdge) => void;
  onUpdateEdge: (edge: FlowchartEdge) => void;
  onDeleteEdge: (id: string) => void;
  collaborators: Collaborator[];
  onCursorMove: (x: number, y: number) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  pan: Point;
  setPan: React.Dispatch<React.SetStateAction<Point>>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  gridMode: 'dots' | 'lines' | 'none';
  snapToGrid: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({
  theme,
  t,
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
  onCreateEdge,
  onUpdateEdge,
  onDeleteEdge,
  collaborators,
  onCursorMove,
  zoom,
  setZoom,
  pan,
  setPan,
  svgRef,
  gridMode,
  snapToGrid,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });

  // Resizing state
  const [resizingNodeId, setResizingNodeId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Connecting state
  const [connectingSource, setConnectingSource] = useState<{
    nodeId: string;
    port: FlowchartPort;
  } | null>(null);
  const [tempEdgePos, setTempEdgePos] = useState<Point | null>(null);

  // Inline text editing
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Edge label editing
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [editingEdgeLabel, setEditingEdgeLabel] = useState('');

  // Show minimap
  const [showMinimap, setShowMinimap] = useState(true);

  // Convert client screen mouse coordinates to canvas virtual coordinates
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - pan.x) / zoom;
      const y = (clientY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom]
  );

  // Wheel zoom and pan
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom((prev) => Math.max(0.2, Math.min(3, prev * zoomFactor)));
    } else {
      // Pan with trackpad or mouse wheel
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Canvas Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    // If middle click or space key pressed or clicking empty canvas
    if (e.button === 1 || e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      onSelectNode(null);
      onSelectEdge(null);
      setEditingNodeId(null);
      setEditingEdgeId(null);
    }
  };

  // Mouse Move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvasPt = screenToCanvas(e.clientX, e.clientY);
    onCursorMove(Math.round(canvasPt.x), Math.round(canvasPt.y));

    // Handle Panning
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    // Handle Node Dragging
    if (draggedNodeId) {
      const node = nodes.find((n) => n.id === draggedNodeId);
      if (node && !node.locked) {
        let newX = canvasPt.x - dragOffset.x;
        let newY = canvasPt.y - dragOffset.y;

        if (snapToGrid) {
          const gridSize = 15;
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
        }

        onUpdateNode({
          ...node,
          x: newX,
          y: newY,
        });
      }
      return;
    }

    // Handle Resizing
    if (resizingNodeId && resizeStart) {
      const node = nodes.find((n) => n.id === resizingNodeId);
      if (node) {
        const dx = canvasPt.x - resizeStart.x;
        const dy = canvasPt.y - resizeStart.y;
        const newW = Math.max(80, resizeStart.w + dx);
        const newH = Math.max(40, resizeStart.h + dy);

        onUpdateNode({
          ...node,
          width: Math.round(newW),
          height: Math.round(newH),
        });
      }
      return;
    }

    // Handle Connecting line
    if (connectingSource) {
      setTempEdgePos(canvasPt);
    }
  };

  // Mouse Up handler
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
    setResizingNodeId(null);
    setResizeStart(null);
    setConnectingSource(null);
    setTempEdgePos(null);
  };

  // Start connecting from a port
  const handlePortMouseDown = (e: React.MouseEvent, nodeId: string, port: FlowchartPort) => {
    e.stopPropagation();
    setConnectingSource({ nodeId, port });
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setTempEdgePos(getPortPosition(node, port));
    }
  };

  // Complete connection on target port
  const handlePortMouseUp = (e: React.MouseEvent, targetNodeId: string, targetPort: FlowchartPort) => {
    e.stopPropagation();
    if (!connectingSource) return;

    if (connectingSource.nodeId !== targetNodeId) {
      // Create new edge!
      const newEdge: FlowchartEdge = {
        id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sourceNodeId: connectingSource.nodeId,
        sourcePort: connectingSource.port,
        targetNodeId,
        targetPort,
        lineType: 'orthogonal',
        color: theme.isDark ? '#94A3B8' : '#64748B',
        strokeWidth: 2,
        style: 'solid',
        arrowEnd: true,
      };
      onCreateEdge(newEdge);
      onSelectEdge(newEdge.id);
    }

    setConnectingSource(null);
    setTempEdgePos(null);
  };

  // Double click node to edit text
  const handleNodeDoubleClick = (e: React.MouseEvent, node: FlowchartNode) => {
    e.stopPropagation();
    setEditingNodeId(node.id);
    setEditingText(node.label);
  };

  const handleFinishEditingText = () => {
    if (editingNodeId) {
      const node = nodes.find((n) => n.id === editingNodeId);
      if (node && editingText.trim() !== '') {
        onUpdateNode({ ...node, label: editingText.trim() });
      }
      setEditingNodeId(null);
    }
  };

  const handleFinishEditingEdgeLabel = () => {
    if (editingEdgeId) {
      const edge = edges.find((e) => e.id === editingEdgeId);
      if (edge) {
        onUpdateEdge({ ...edge, label: editingEdgeLabel.trim() || undefined });
      }
      setEditingEdgeId(null);
    }
  };

  // Selected node object for floating context toolbar
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Bounding box for minimap
  const bbox = getNodeBoundingBox(nodes, 120);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="relative flex-1 h-[calc(100vh-3.5rem)] overflow-hidden cursor-crosshair select-none"
      style={{ backgroundColor: theme.ui.canvasBg }}
    >
      {/* SVG Canvas Root */}
      <svg
        ref={svgRef}
        id="flowchart-main-canvas"
        className="w-full h-full absolute inset-0"
      >
        <defs>
          {/* Dot Grid Pattern */}
          <pattern
            id="pattern-dots"
            x={pan.x % (24 * zoom)}
            y={pan.y % (24 * zoom)}
            width={24 * zoom}
            height={24 * zoom}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={2} cy={2} r={1.5} fill={theme.ui.canvasDot} />
          </pattern>

          {/* Line Grid Pattern */}
          <pattern
            id="pattern-lines"
            x={pan.x % (30 * zoom)}
            y={pan.y % (30 * zoom)}
            width={30 * zoom}
            height={30 * zoom}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${30 * zoom} 0 L 0 0 0 ${30 * zoom}`}
              fill="none"
              stroke={theme.ui.canvasGrid}
              strokeWidth="1"
            />
          </pattern>

          {/* Standard Arrow Marker */}
          <marker
            id="arrow-end"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill={theme.isDark ? '#94A3B8' : '#64748B'} />
          </marker>

          {/* Selected Arrow Marker */}
          <marker
            id="arrow-selected"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#3B82F6" />
          </marker>
        </defs>

        {/* Background Grid */}
        {gridMode === 'dots' && (
          <rect width="100%" height="100%" fill="url(#pattern-dots)" pointerEvents="none" />
        )}
        {gridMode === 'lines' && (
          <rect width="100%" height="100%" fill="url(#pattern-lines)" pointerEvents="none" />
        )}

        {/* Main Canvas Viewport Group */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. EDGES LAYER */}
          <g id="flowchart-edges-layer">
            {edges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);
              const targetNode = nodes.find((n) => n.id === edge.targetNodeId);
              if (!sourceNode || !targetNode) return null;

              const startPos = getPortPosition(sourceNode, edge.sourcePort);
              const endPos = getPortPosition(targetNode, edge.targetPort);
              const { path, labelPos } = calculateEdgePath(
                startPos,
                endPos,
                edge.sourcePort,
                edge.targetPort,
                edge.lineType
              );

              const isSelected = selectedEdgeId === edge.id;

              return (
                <g key={edge.id} className="cursor-pointer group">
                  {/* Invisible thicker stroke for easy clicking */}
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={18}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEdge(edge.id);
                      onSelectNode(null);
                    }}
                  />

                  {/* Visible Edge Stroke */}
                  <path
                    d={path}
                    fill="none"
                    stroke={isSelected ? '#3B82F6' : edge.color}
                    strokeWidth={isSelected ? edge.strokeWidth + 1 : edge.strokeWidth}
                    strokeDasharray={edge.style === 'dashed' ? '5,5' : undefined}
                    markerEnd={isSelected ? 'url(#arrow-selected)' : 'url(#arrow-end)'}
                    className="transition-colors"
                  />

                  {/* Edge Label (e.g. Yes / No) */}
                  {edge.label && (
                    <g
                      transform={`translate(${labelPos.x}, ${labelPos.y})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingEdgeId(edge.id);
                        setEditingEdgeLabel(edge.label || '');
                      }}
                    >
                      <rect
                        x={-35}
                        y={-12}
                        width={70}
                        height={24}
                        rx={6}
                        fill={theme.ui.cardBg}
                        stroke={isSelected ? '#3B82F6' : theme.ui.border}
                        strokeWidth={1}
                        className="shadow-xs"
                      />
                      <text
                        x={0}
                        y={4}
                        textAnchor="middle"
                        fill={theme.ui.textPrimary}
                        fontSize={11}
                        fontWeight="600"
                        fontFamily="Vazirmatn, sans-serif"
                      >
                        {edge.label}
                      </text>
                    </g>
                  )}

                  {/* Fast edge delete button when selected */}
                  {isSelected && (
                    <g
                      transform={`translate(${labelPos.x + 38}, ${labelPos.y - 12})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEdge(edge.id);
                      }}
                    >
                      <circle r={9} fill="#EF4444" className="hover:opacity-90" />
                      <text x={0} y={3} textAnchor="middle" fill="#FFFFFF" fontSize={11} fontWeight="bold">
                        ×
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Connecting in-progress line */}
            {connectingSource && tempEdgePos && (
              <line
                x1={getPortPosition(nodes.find((n) => n.id === connectingSource.nodeId)!, connectingSource.port).x}
                y1={getPortPosition(nodes.find((n) => n.id === connectingSource.nodeId)!, connectingSource.port).y}
                x2={tempEdgePos.x}
                y2={tempEdgePos.y}
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="4,4"
              />
            )}
          </g>

          {/* 2. NODES LAYER */}
          <g id="flowchart-nodes-layer">
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const shapeRender = renderNodeShapePath(node);
              const ports: FlowchartPort[] = ['top', 'right', 'bottom', 'left'];

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-move"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onSelectNode(node.id);
                    onSelectEdge(null);
                    setDraggedNodeId(node.id);
                    const canvasPt = screenToCanvas(e.clientX, e.clientY);
                    setDragOffset({
                      x: canvasPt.x - node.x,
                      y: canvasPt.y - node.y,
                    });
                  }}
                  onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
                >
                  {/* Selection Glow / Outline */}
                  {isSelected && (
                    <rect
                      x={-4}
                      y={-4}
                      width={node.width + 8}
                      height={node.height + 8}
                      rx={8}
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      strokeDasharray="4,4"
                      className="interactive-overlay pointer-events-none"
                    />
                  )}

                  {/* Primary SVG Shape */}
                  {shapeRender.element === 'rect' && <rect {...shapeRender.props} />}
                  {shapeRender.element === 'polygon' && <polygon {...shapeRender.props} />}
                  {shapeRender.element === 'circle' && <circle {...shapeRender.props} />}
                  {shapeRender.element === 'path' && <path {...shapeRender.props} />}

                  {/* Auxiliary inner shape elements (e.g. database ellipse, subroutine bars) */}
                  {shapeRender.auxiliaryElements?.map((aux, i) => {
                    if (aux.element === 'line') return <line key={i} {...aux.props} />;
                    if (aux.element === 'ellipse') return <ellipse key={i} {...aux.props} />;
                    if (aux.element === 'polygon') return <polygon key={i} {...aux.props} />;
                    return null;
                  })}

                  {/* Text Label */}
                  <text
                    x={node.width / 2}
                    y={node.height / 2 + 5}
                    textAnchor="middle"
                    fill={node.textColor}
                    fontSize={node.fontSize}
                    fontWeight={node.fontWeight}
                    fontFamily="Vazirmatn, sans-serif"
                    className="pointer-events-none select-none"
                  >
                    {node.label}
                  </text>

                  {/* 4 Connection Ports (Top, Right, Bottom, Left) */}
                  {ports.map((port) => {
                    let cx = 0;
                    let cy = 0;
                    if (port === 'top') {
                      cx = node.width / 2;
                      cy = 0;
                    } else if (port === 'bottom') {
                      cx = node.width / 2;
                      cy = node.height;
                    } else if (port === 'left') {
                      cx = 0;
                      cy = node.height / 2;
                    } else if (port === 'right') {
                      cx = node.width;
                      cy = node.height / 2;
                    }

                    return (
                      <g
                        key={port}
                        className="port-handle group/port cursor-pointer"
                        onMouseDown={(e) => handlePortMouseDown(e, node.id, port)}
                        onMouseUp={(e) => handlePortMouseUp(e, node.id, port)}
                      >
                        {/* Larger hit zone */}
                        <circle cx={cx} cy={cy} r={10} fill="transparent" />
                        {/* Port visual indicator */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={4.5}
                          fill="#3B82F6"
                          stroke="#FFFFFF"
                          strokeWidth={1.5}
                          className="transition-transform group-hover/port:scale-150"
                        />
                      </g>
                    );
                  })}

                  {/* Resize Handle (Bottom-Right) */}
                  {isSelected && (
                    <g
                      transform={`translate(${node.width - 7}, ${node.height - 7})`}
                      className="cursor-nwse-resize interactive-overlay"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizingNodeId(node.id);
                        const canvasPt = screenToCanvas(e.clientX, e.clientY);
                        setResizeStart({
                          x: canvasPt.x,
                          y: canvasPt.y,
                          w: node.width,
                          h: node.height,
                        });
                      }}
                    >
                      <rect width={12} height={12} rx={2} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={1.5} />
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* 3. REMOTE COLLABORATOR CURSORS */}
          <g id="flowchart-cursors-layer">
            {collaborators.map((user) => {
              if (!user.cursor) return null;
              return (
                <g
                  key={user.id}
                  transform={`translate(${user.cursor.x}, ${user.cursor.y})`}
                  className="cursor-indicator pointer-events-none transition-transform duration-75 ease-out"
                >
                  {/* Cursor Arrow */}
                  <path
                    d="M 0 0 L 0 16 L 4 12 L 8 20 L 11 18 L 7 10 L 13 10 Z"
                    fill={user.color}
                    stroke="#FFFFFF"
                    strokeWidth={1}
                  />
                  {/* User Name Tag */}
                  <g transform="translate(14, 14)">
                    <rect
                      x={-2}
                      y={-10}
                      width={user.name.length * 8 + 14}
                      height={20}
                      rx={5}
                      fill={user.color}
                    />
                    <text
                      x={4}
                      y={4}
                      fill="#FFFFFF"
                      fontSize={11}
                      fontWeight="bold"
                      fontFamily="Vazirmatn, sans-serif"
                    >
                      {user.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Floating Context Toolbar for Selected Node */}
      {selectedNode && (
        <div
          className="absolute z-20 flex items-center gap-1.5 p-1.5 rounded-xl shadow-lg border backdrop-blur-md transition-all animate-in fade-in"
          style={{
            left: Math.max(20, Math.min(window.innerWidth - 380, selectedNode.x * zoom + pan.x)),
            top: Math.max(16, selectedNode.y * zoom + pan.y - 52),
            backgroundColor: theme.ui.cardBg,
            borderColor: theme.ui.border,
            color: theme.ui.textPrimary,
          }}
        >
          {/* Quick Color Swatches */}
          <div className="flex items-center gap-1 pl-1 border-l" style={{ borderColor: theme.ui.border }}>
            {theme.nodeColorPresets.slice(0, 5).map((preset) => (
              <button
                key={preset.name}
                onClick={() =>
                  onUpdateNode({
                    ...selectedNode,
                    fill: preset.fill,
                    stroke: preset.stroke,
                    textColor: preset.text,
                  })
                }
                className="w-5 h-5 rounded-md border transition-transform hover:scale-110"
                style={{ backgroundColor: preset.fill, borderColor: preset.stroke }}
                title={preset.name}
              />
            ))}
          </div>

          {/* Bold toggle */}
          <button
            onClick={() =>
              onUpdateNode({
                ...selectedNode,
                fontWeight: selectedNode.fontWeight === 'bold' ? 'normal' : 'bold',
              })
            }
            className={`p-1.5 rounded-lg border transition-colors ${
              selectedNode.fontWeight === 'bold' ? 'bg-blue-100 text-blue-800' : 'hover:opacity-80'
            }`}
            style={{ borderColor: theme.ui.border }}
            title={t.bold}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Font Size */}
          <button
            onClick={() =>
              onUpdateNode({
                ...selectedNode,
                fontSize: Math.min(24, selectedNode.fontSize + 1),
              })
            }
            className="px-2 py-1 text-xs font-mono font-bold rounded-lg border hover:opacity-80"
            style={{ borderColor: theme.ui.border }}
            title="افزایش قلم"
          >
            A+
          </button>
          <button
            onClick={() =>
              onUpdateNode({
                ...selectedNode,
                fontSize: Math.max(10, selectedNode.fontSize - 1),
              })
            }
            className="px-2 py-1 text-xs font-mono font-bold rounded-lg border hover:opacity-80"
            style={{ borderColor: theme.ui.border }}
            title="کاهش قلم"
          >
            A-
          </button>

          {/* Duplicate */}
          <button
            onClick={() => onDuplicateNode(selectedNode.id)}
            className="p-1.5 rounded-lg border hover:opacity-80 transition-colors"
            style={{ borderColor: theme.ui.border }}
            title={t.duplicate}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDeleteNode(selectedNode.id)}
            className="p-1.5 rounded-lg border text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            style={{ borderColor: theme.ui.border }}
            title={t.deleteSelected}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Inline Text Editor Overlay when Double-Clicked */}
      {editingNodeId && (
        (() => {
          const node = nodes.find((n) => n.id === editingNodeId);
          if (!node) return null;
          return (
            <div
              className="absolute z-30"
              style={{
                left: node.x * zoom + pan.x,
                top: node.y * zoom + pan.y,
                width: node.width * zoom,
                height: node.height * zoom,
              }}
            >
              <textarea
                autoFocus
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={handleFinishEditingText}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleFinishEditingText();
                  }
                  if (e.key === 'Escape') {
                    setEditingNodeId(null);
                  }
                }}
                className="w-full h-full p-2 text-center resize-none outline-none border-2 border-blue-500 rounded-lg shadow-xl"
                style={{
                  backgroundColor: theme.ui.cardBg,
                  color: theme.ui.textPrimary,
                  fontSize: `${node.fontSize * zoom}px`,
                  fontWeight: node.fontWeight,
                  fontFamily: 'Vazirmatn, sans-serif',
                }}
              />
            </div>
          );
        })()
      )}

      {/* Edge Label Inline Editor */}
      {editingEdgeId && (
        <div
          className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: window.innerWidth / 2,
            top: window.innerHeight / 2,
          }}
        >
          <div
            className="p-3 rounded-xl border shadow-2xl space-y-2"
            style={{ backgroundColor: theme.ui.cardBg, borderColor: theme.ui.border }}
          >
            <div className="text-xs font-semibold">{t.edgeLabel}</div>
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="مثلاً: بله / خیر / تأیید"
                value={editingEdgeLabel}
                onChange={(e) => setEditingEdgeLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFinishEditingEdgeLabel()}
                className="px-2.5 py-1 text-xs rounded-lg border outline-none"
                style={{
                  backgroundColor: theme.ui.surface,
                  borderColor: theme.ui.border,
                  color: theme.ui.textPrimary,
                }}
              />
              <button
                onClick={handleFinishEditingEdgeLabel}
                className="px-3 py-1 text-xs font-medium text-white rounded-lg"
                style={{ backgroundColor: theme.ui.accent }}
              >
                ثبت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimap Radar in Bottom Corner */}
      <div
        className="absolute bottom-4 left-4 z-20 border rounded-xl shadow-lg p-2 overflow-hidden transition-all hidden sm:block"
        style={{
          backgroundColor: theme.ui.cardBg,
          borderColor: theme.ui.border,
          width: showMinimap ? 160 : 36,
          height: showMinimap ? 110 : 36,
        }}
      >
        <button
          onClick={() => setShowMinimap(!showMinimap)}
          className="absolute top-1.5 left-1.5 p-1 rounded hover:opacity-80 z-10"
          title={t.minimap}
        >
          <Compass className="w-3.5 h-3.5 opacity-60" />
        </button>

        {showMinimap && (
          <div className="w-full h-full pt-4 relative">
            <svg
              viewBox={`${bbox.minX} ${bbox.minY} ${bbox.width} ${bbox.height}`}
              className="w-full h-full rounded"
              style={{ backgroundColor: theme.ui.surface }}
            >
              {/* Nodes mini rectangles */}
              {nodes.map((n) => (
                <rect
                  key={n.id}
                  x={n.x}
                  y={n.y}
                  width={n.width}
                  height={n.height}
                  rx={3}
                  fill={n.fill}
                  stroke={n.stroke}
                  strokeWidth={2}
                />
              ))}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
