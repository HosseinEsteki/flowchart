import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  FlowchartNode,
  FlowchartEdge,
  FlowchartPort,
  FlowchartNodeType,
  Collaborator,
  LineType,
} from '../types/flowchart';
import { ColorTheme } from '../constants/themes';
import { TranslationDictionary } from '../constants/translations';
import { getPortPosition, calculateEdgePath, Point, getNodeBoundingBox } from '../utils/canvasMath';
import { renderNodeShapePath, trimShapeText, trimNodeTextAndAdjustHeight } from '../utils/shapePaths';
import { ContextMenu, ContextMenuTarget } from './ContextMenu';
import {
  Trash2,
  Copy,
  Bold,
  Type,
  CornerDownRight,
  Compass,
  Sparkles,
  Zap,
  Plus,
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';

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
  defaultConnectorSettings?: {
    lineType: LineType;
    color: string;
    strokeWidth: number;
    style: 'solid' | 'dashed';
  };
  onPasteImage?: (dataUrl: string) => void;
  isRtl?: boolean;
  onCopyNode?: (node: FlowchartNode) => void;
  onCutNode?: (nodeId: string) => void;
  onPasteNodeAt?: (canvasPos: Point) => void;
  hasClipboardNode?: boolean;
  onAddNodeAt?: (type: FlowchartNodeType, pos: Point) => void;
  onBringToFront?: (nodeId: string) => void;
  onSendToBack?: (nodeId: string) => void;
  onBringForward?: (nodeId: string) => void;
  onSendBackward?: (nodeId: string) => void;
  onTrimAllNodes?: () => void;
  onClearCanvas?: () => void;
  onToggleSnapToGrid?: () => void;
  onSetGridMode?: (mode: 'dots' | 'lines' | 'none') => void;
  onSelectAllNodes?: () => void;
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
  defaultConnectorSettings,
  onPasteImage,
  isRtl = true,
  onCopyNode,
  onCutNode,
  onPasteNodeAt,
  hasClipboardNode,
  onAddNodeAt,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onTrimAllNodes,
  onClearCanvas,
  onToggleSnapToGrid,
  onSetGridMode,
  onSelectAllNodes,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });

  // Resizing state
  type ResizeHandleType = 'se' | 'sw' | 'ne' | 'nw' | 'e' | 's';
  const [resizingNodeId, setResizingNodeId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
    nodeX: number;
    nodeY: number;
    handle: ResizeHandleType;
  } | null>(null);

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

  // Waypoint dragging state for manual edge path adjustment
  const [draggingWaypoint, setDraggingWaypoint] = useState<{
    edgeId: string;
    index: number;
  } | null>(null);

  const handleAddWaypointAt = (edge: FlowchartEdge, pt: Point, segmentIndex: number) => {
    const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);
    const targetNode = nodes.find((n) => n.id === edge.targetNodeId);
    if (!sourceNode || !targetNode) return;

    let currentWaypoints = edge.waypoints ? [...edge.waypoints] : [];
    if (currentWaypoints.length === 0) {
      const sPos = getPortPosition(sourceNode, edge.sourcePort, targetNode, 'source');
      const tPos = getPortPosition(targetNode, edge.targetPort, sourceNode, 'target');
      const calc = calculateEdgePath(sPos, tPos, edge.sourcePort, edge.targetPort, edge.lineType, {
        sourceNode,
        targetNode,
        allNodes: nodes,
        manualOffset: edge.manualOffset,
      });
      currentWaypoints = calc.points.slice(1, -1).map((p) => ({ ...p }));
    }

    currentWaypoints.splice(segmentIndex, 0, { x: Math.round(pt.x), y: Math.round(pt.y) });
    onUpdateEdge({
      ...edge,
      waypoints: currentWaypoints,
      routingMode: 'manual',
    });
  };

  const handleRemoveWaypoint = (edge: FlowchartEdge, index: number) => {
    if (!edge.waypoints || edge.waypoints.length === 0) return;
    const updated = edge.waypoints.filter((_, i) => i !== index);
    onUpdateEdge({
      ...edge,
      waypoints: updated.length > 0 ? updated : undefined,
      routingMode: updated.length > 0 ? 'manual' : 'smart',
    });
  };

  // Show minimap & interactive navigation
  const [showMinimap, setShowMinimap] = useState(true);
  const minimapSvgRef = useRef<SVGSVGElement | null>(null);
  const [isMinimapDragging, setIsMinimapDragging] = useState(false);

  const handleMinimapNavigate = useCallback(
    (clientX: number, clientY: number) => {
      const svg = minimapSvgRef.current;
      const container = containerRef.current;
      if (!svg || !container) return;

      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const svgPoint = pt.matrixTransform(ctm.inverse());

      const containerRect = container.getBoundingClientRect();
      const targetCanvasX = svgPoint.x;
      const targetCanvasY = svgPoint.y;

      // Center the viewport on targetCanvasX, targetCanvasY
      const newPanX = containerRect.width / 2 - targetCanvasX * zoom;
      const newPanY = containerRect.height / 2 - targetCanvasY * zoom;

      setPan({ x: newPanX, y: newPanY });
    },
    [zoom, setPan]
  );

  useEffect(() => {
    if (!isMinimapDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleMinimapNavigate(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setIsMinimapDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMinimapDragging, handleMinimapNavigate]);

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

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    screenPos: Point;
    target: ContextMenuTarget;
  } | null>(null);

  const handleAutoFitNode = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      const fitted = trimNodeTextAndAdjustHeight(node);
      onUpdateNode(fitted);
    }
  };

  const handleToggleLock = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      onUpdateNode({ ...node, locked: !node.locked });
    }
  };

  const handleChangeNodeType = (nodeId: string, newType: FlowchartNodeType) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    onUpdateNode({
      ...node,
      type: newType,
      borderRadius: newType === 'terminal' || newType === 'connector' ? 9999 : node.borderRadius,
    });
  };

  const handleChangeNodeColors = (nodeId: string, fill: string, stroke: string, textColor: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    onUpdateNode({
      ...node,
      fill,
      stroke,
      textColor,
    });
  };

  const handleAttachImage = (nodeId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          if (dataUrl) {
            const node = nodes.find((n) => n.id === nodeId);
            if (node) {
              onUpdateNode({
                ...node,
                imageUrl: dataUrl,
                width: Math.max(node.width, 180),
                height: Math.max(node.height, 130),
                imagePosition: node.imagePosition || 'top',
                imageFit: node.imageFit || 'contain',
              });
            }
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleReverseEdge = (edgeId: string) => {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;
    onUpdateEdge({
      ...edge,
      sourceNodeId: edge.targetNodeId,
      sourcePort: edge.targetPort,
      targetNodeId: edge.sourceNodeId,
      targetPort: edge.sourcePort,
    });
  };

  const handleFitToScreen = () => {
    if (nodes.length === 0) return;
    const bbox = getNodeBoundingBox(nodes, 80);
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const scaleX = rect.width / bbox.width;
    const scaleY = rect.height / bbox.height;
    const targetZoom = Math.max(0.2, Math.min(2, Math.min(scaleX, scaleY) * 0.9));
    const targetPanX = (rect.width - bbox.width * targetZoom) / 2 - bbox.minX * targetZoom;
    const targetPanY = (rect.height - bbox.height * targetZoom) / 2 - bbox.minY * targetZoom;
    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
  };

  // Wheel zoom and pan
  const handleWheel = (e: React.WheelEvent) => {
    setContextMenu(null);
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
    // Only dismiss context menu and start panning if clicking on background canvas/svg
    const targetEl = e.target as HTMLElement;
    const isBackground =
      e.button === 1 ||
      targetEl === containerRef.current ||
      targetEl.tagName === 'svg' ||
      (targetEl.tagName === 'rect' && targetEl.getAttribute('pointer-events') === 'none');

    if (isBackground) {
      setContextMenu(null);
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
      if (node && !node.locked) {
        const dx = canvasPt.x - resizeStart.x;
        const dy = canvasPt.y - resizeStart.y;
        let newW = resizeStart.w;
        let newH = resizeStart.h;
        let newX = resizeStart.nodeX;
        let newY = resizeStart.nodeY;

        switch (resizeStart.handle) {
          case 'se':
            newW = Math.max(60, resizeStart.w + dx);
            newH = Math.max(30, resizeStart.h + dy);
            break;
          case 'sw':
            newW = Math.max(60, resizeStart.w - dx);
            newH = Math.max(30, resizeStart.h + dy);
            newX = resizeStart.nodeX + (resizeStart.w - newW);
            break;
          case 'ne':
            newW = Math.max(60, resizeStart.w + dx);
            newH = Math.max(30, resizeStart.h - dy);
            newY = resizeStart.nodeY + (resizeStart.h - newH);
            break;
          case 'nw':
            newW = Math.max(60, resizeStart.w - dx);
            newH = Math.max(30, resizeStart.h - dy);
            newX = resizeStart.nodeX + (resizeStart.w - newW);
            newY = resizeStart.nodeY + (resizeStart.h - newH);
            break;
          case 'e':
            newW = Math.max(60, resizeStart.w + dx);
            break;
          case 's':
            newH = Math.max(30, resizeStart.h + dy);
            break;
        }

        if (snapToGrid) {
          const gridSize = 15;
          newW = Math.round(newW / gridSize) * gridSize;
          newH = Math.round(newH / gridSize) * gridSize;
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
        }

        onUpdateNode({
          ...node,
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        });
      }
      return;
    }

    // Handle Waypoint Dragging
    if (draggingWaypoint) {
      const edge = edges.find((e) => e.id === draggingWaypoint.edgeId);
      if (edge) {
        let newX = canvasPt.x;
        let newY = canvasPt.y;
        if (snapToGrid) {
          const gridSize = 15;
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
        }

        const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);
        const targetNode = nodes.find((n) => n.id === edge.targetNodeId);
        let currentWaypoints = edge.waypoints ? [...edge.waypoints] : [];

        if (currentWaypoints.length === 0 && sourceNode && targetNode) {
          const sPos = getPortPosition(sourceNode, edge.sourcePort, targetNode, 'source');
          const tPos = getPortPosition(targetNode, edge.targetPort, sourceNode, 'target');
          const calc = calculateEdgePath(sPos, tPos, edge.sourcePort, edge.targetPort, edge.lineType, {
            sourceNode,
            targetNode,
            allNodes: nodes,
            manualOffset: edge.manualOffset,
          });
          currentWaypoints = calc.points.slice(1, -1).map((p) => ({ ...p }));
        }

        while (currentWaypoints.length <= draggingWaypoint.index) {
          currentWaypoints.push({ x: Math.round(newX), y: Math.round(newY) });
        }
        currentWaypoints[draggingWaypoint.index] = { x: Math.round(newX), y: Math.round(newY) };

        onUpdateEdge({
          ...edge,
          waypoints: currentWaypoints,
          routingMode: 'manual',
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
    setDraggingWaypoint(null);
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
        lineType: defaultConnectorSettings?.lineType || 'orthogonal',
        color:
          defaultConnectorSettings?.color || (theme.isDark ? '#94A3B8' : '#64748B'),
        strokeWidth: defaultConnectorSettings?.strokeWidth || 2,
        style: defaultConnectorSettings?.style || 'solid',
        arrowEnd: true,
      };
      onCreateEdge(newEdge);
      onSelectEdge(newEdge.id);
    }

    setConnectingSource(null);
    setTempEdgePos(null);
  };

  // Double click node to edit text (preserves existing text for editing)
  const handleNodeDoubleClick = (e: React.MouseEvent, node: FlowchartNode) => {
    e.stopPropagation();
    setEditingNodeId(node.id);
    setEditingText(node.label);
  };

  // Keyboard typing on selected node: typing any character immediately enters edit mode and REPLACES text!
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        editingNodeId ||
        editingEdgeId ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (selectedNodeId) {
        // Check if printable character key was pressed (length 1, no Ctrl/Cmd/Alt)
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          setEditingNodeId(selectedNodeId);
          setEditingText(e.key);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedNodeId, editingNodeId, editingEdgeId]);

  const handleFinishEditingText = () => {
    if (editingNodeId) {
      const node = nodes.find((n) => n.id === editingNodeId);
      if (node) {
        // Automatic trimming of extra enters and spaces
        const cleaned = trimShapeText(editingText);
        const lines = (cleaned || ' ').split('\n');
        const minReqHeight = Math.round(lines.length * (node.fontSize * 1.35) + 26);
        const updatedHeight = Math.max(node.height, minReqHeight);
        onUpdateNode({
          ...node,
          label: cleaned,
          height: updatedHeight,
        });
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

  // Bounding box for minimap framing all nodes with comfortable padding
  const bbox = getNodeBoundingBox(nodes, 100);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => {
        const targetEl = e.target as HTMLElement;
        const isCanvasBackground =
          targetEl === containerRef.current ||
          targetEl.tagName === 'svg' ||
          (targetEl.tagName === 'rect' && targetEl.getAttribute('pointer-events') === 'none');

        if (isCanvasBackground) {
          e.preventDefault();
          e.stopPropagation();
          const canvasPos = screenToCanvas(e.clientX, e.clientY);
          setContextMenu({
            isOpen: true,
            screenPos: { x: e.clientX, y: e.clientY },
            target: { type: 'canvas', canvasPos },
          });
        }
      }}
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

          {/* Standard Arrow End Marker */}
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

          {/* Selected Arrow End Marker */}
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

          {/* Standard Arrow Start Marker */}
          <marker
            id="arrow-start"
            viewBox="0 0 10 10"
            refX="1"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 9 1 L 0 5 L 9 9 z" fill={theme.isDark ? '#94A3B8' : '#64748B'} />
          </marker>

          {/* Selected Arrow Start Marker */}
          <marker
            id="arrow-start-selected"
            viewBox="0 0 10 10"
            refX="1"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M 9 1 L 0 5 L 9 9 z" fill="#3B82F6" />
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

              const startPos = getPortPosition(sourceNode, edge.sourcePort, targetNode, 'source');
              const endPos = getPortPosition(targetNode, edge.targetPort, sourceNode, 'target');
              const { path, labelPos } = calculateEdgePath(
                startPos,
                endPos,
                edge.sourcePort,
                edge.targetPort,
                edge.lineType,
                {
                  sourceNode,
                  targetNode,
                  allNodes: nodes,
                  waypoints: edge.waypoints,
                  manualOffset: edge.manualOffset,
                  routingMode: edge.routingMode,
                }
              );

              const isSelected = selectedEdgeId === edge.id;

              return (
                <g
                  key={edge.id}
                  className="cursor-pointer group"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectEdge(edge.id);
                    onSelectNode(null);
                    setContextMenu({
                      isOpen: true,
                      screenPos: { x: e.clientX, y: e.clientY },
                      target: { type: 'edge', edge },
                    });
                  }}
                >
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

                  {/* Clean underlay halo when selected */}
                  {isSelected && (
                    <path
                      d={path}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth={edge.strokeWidth + 5}
                      opacity={0.85}
                    />
                  )}

                  {/* Visible Edge Stroke */}
                  <path
                    d={path}
                    fill="none"
                    stroke={isSelected ? '#3B82F6' : edge.color}
                    strokeWidth={isSelected ? edge.strokeWidth + 1 : edge.strokeWidth}
                    strokeDasharray={edge.style === 'dashed' ? '5,5' : undefined}
                    markerStart={edge.arrowStart ? (isSelected ? 'url(#arrow-start-selected)' : 'url(#arrow-start)') : undefined}
                    markerEnd={edge.arrowEnd !== false ? (isSelected ? 'url(#arrow-selected)' : 'url(#arrow-end)') : undefined}
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
                    if (e.button === 0) {
                      setContextMenu(null);
                      onSelectNode(node.id);
                      onSelectEdge(null);
                      setDraggedNodeId(node.id);
                      const canvasPt = screenToCanvas(e.clientX, e.clientY);
                      setDragOffset({
                        x: canvasPt.x - node.x,
                        y: canvasPt.y - node.y,
                      });
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectNode(node.id);
                    onSelectEdge(null);
                    setContextMenu({
                      isOpen: true,
                      screenPos: { x: e.clientX, y: e.clientY },
                      target: { type: 'node', node },
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

                  {/* Shape Image & Label Layout Rendering */}
                  {(() => {
                    const rawText = node.label || '';
                    const lines = rawText.split('\n');
                    const lineHeight = node.fontSize * 1.35;
                    const hasImg = Boolean(node.imageUrl);
                    const hasText = Boolean(rawText.trim());
                    const pos = node.imagePosition || 'top';
                    const isInline = pos === 'inline';
                    const isCover = pos === 'cover';

                    let imgX = 6;
                    let imgY = 6;
                    let imgW = Math.max(10, node.width - 12);
                    let imgH = Math.max(10, node.height - 12);

                    const align = node.textAlign || 'center';
                    let textAnchor: 'start' | 'middle' | 'end' = 'middle';
                    let textX = node.width / 2;
                    let startY =
                      node.height / 2 -
                      ((lines.length - 1) * lineHeight) / 2 +
                      node.fontSize * 0.35;

                    if (hasImg && hasText) {
                      if (isInline) {
                        // Icon on right side (RTL context)
                        const iconSize = Math.min(node.height - 12, Math.min(50, Math.max(26, node.width * 0.28)));
                        imgX = node.width - iconSize - 8;
                        imgY = (node.height - iconSize) / 2;
                        imgW = iconSize;
                        imgH = iconSize;

                        textX = (node.width - iconSize - 10) / 2;
                        textAnchor = 'middle';
                      } else if (!isCover) {
                        // Default top image layout
                        const textBlockH = lines.length * lineHeight;
                        imgH = Math.max(16, node.height - textBlockH - 14);
                        imgW = Math.max(10, node.width - 12);
                        startY = node.height - 8 - ((lines.length - 1) * lineHeight);
                      }
                    } else if (!hasImg) {
                      if (align === 'right') {
                        textAnchor = 'end';
                        textX = node.width - 12;
                      } else if (align === 'left') {
                        textAnchor = 'start';
                        textX = 12;
                      }
                    }

                    const fontFamily = node.fontFamily || 'Vazirmatn, sans-serif';
                    const fontStyle = node.fontStyle || 'normal';

                    return (
                      <>
                        {hasImg && (
                          <image
                            href={node.imageUrl}
                            x={imgX}
                            y={imgY}
                            width={imgW}
                            height={imgH}
                            preserveAspectRatio={node.imageFit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'}
                          />
                        )}
                        {hasText && (
                          <text
                            fill={node.textColor}
                            fontSize={node.fontSize}
                            fontWeight={node.fontWeight || 'normal'}
                            fontStyle={fontStyle}
                            fontFamily={fontFamily}
                            textAnchor={textAnchor}
                            className="pointer-events-none select-none"
                          >
                            {lines.map((line, idx) => (
                              <tspan
                                key={idx}
                                x={textX}
                                y={startY + idx * lineHeight}
                              >
                                {line || '\u00A0'}
                              </tspan>
                            ))}
                          </text>
                        )}
                      </>
                    );
                  })()}

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

                  {/* Multi-Directional Resize Handles (4 Corners + Edges) */}
                  {isSelected && !node.locked && (
                    <g className="resize-handles-group interactive-overlay">
                      {/* Top-Left (NW) */}
                      <g
                        transform="translate(-6, -6)"
                        className="cursor-nwse-resize"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingNodeId(node.id);
                          const canvasPt = screenToCanvas(e.clientX, e.clientY);
                          setResizeStart({
                            x: canvasPt.x,
                            y: canvasPt.y,
                            w: node.width,
                            h: node.height,
                            nodeX: node.x,
                            nodeY: node.y,
                            handle: 'nw',
                          });
                        }}
                      >
                        <rect width={11} height={11} rx={2} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={1.5} />
                      </g>

                      {/* Top-Right (NE) */}
                      <g
                        transform={`translate(${node.width - 5}, -6)`}
                        className="cursor-nesw-resize"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingNodeId(node.id);
                          const canvasPt = screenToCanvas(e.clientX, e.clientY);
                          setResizeStart({
                            x: canvasPt.x,
                            y: canvasPt.y,
                            w: node.width,
                            h: node.height,
                            nodeX: node.x,
                            nodeY: node.y,
                            handle: 'ne',
                          });
                        }}
                      >
                        <rect width={11} height={11} rx={2} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={1.5} />
                      </g>

                      {/* Bottom-Left (SW) */}
                      <g
                        transform={`translate(-6, ${node.height - 5})`}
                        className="cursor-nesw-resize"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingNodeId(node.id);
                          const canvasPt = screenToCanvas(e.clientX, e.clientY);
                          setResizeStart({
                            x: canvasPt.x,
                            y: canvasPt.y,
                            w: node.width,
                            h: node.height,
                            nodeX: node.x,
                            nodeY: node.y,
                            handle: 'sw',
                          });
                        }}
                      >
                        <rect width={11} height={11} rx={2} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={1.5} />
                      </g>

                      {/* Bottom-Right (SE) */}
                      <g
                        transform={`translate(${node.width - 6}, ${node.height - 6})`}
                        className="cursor-nwse-resize"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingNodeId(node.id);
                          const canvasPt = screenToCanvas(e.clientX, e.clientY);
                          setResizeStart({
                            x: canvasPt.x,
                            y: canvasPt.y,
                            w: node.width,
                            h: node.height,
                            nodeX: node.x,
                            nodeY: node.y,
                            handle: 'se',
                          });
                        }}
                      >
                        <rect width={12} height={12} rx={2} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={1.5} />
                      </g>

                      {/* Right Edge (E) */}
                      <g
                        transform={`translate(${node.width - 5}, ${node.height / 2 - 5})`}
                        className="cursor-ew-resize"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingNodeId(node.id);
                          const canvasPt = screenToCanvas(e.clientX, e.clientY);
                          setResizeStart({
                            x: canvasPt.x,
                            y: canvasPt.y,
                            w: node.width,
                            h: node.height,
                            nodeX: node.x,
                            nodeY: node.y,
                            handle: 'e',
                          });
                        }}
                      >
                        <rect width={10} height={11} rx={2} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={1.5} />
                      </g>

                      {/* Bottom Edge (S) */}
                      <g
                        transform={`translate(${node.width / 2 - 5}, ${node.height - 5})`}
                        className="cursor-ns-resize"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingNodeId(node.id);
                          const canvasPt = screenToCanvas(e.clientX, e.clientY);
                          setResizeStart({
                            x: canvasPt.x,
                            y: canvasPt.y,
                            w: node.width,
                            h: node.height,
                            nodeX: node.x,
                            nodeY: node.y,
                            handle: 's',
                          });
                        }}
                      >
                        <rect width={11} height={10} rx={2} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={1.5} />
                      </g>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* 2.5. SELECTED EDGE OVERLAY & INTERACTIVE WAYPOINTS (Always on top of nodes) */}
          {selectedEdgeId && (() => {
            const edge = edges.find((e) => e.id === selectedEdgeId);
            if (!edge) return null;
            const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);
            const targetNode = nodes.find((n) => n.id === edge.targetNodeId);
            if (!sourceNode || !targetNode) return null;

            const startPos = getPortPosition(sourceNode, edge.sourcePort, targetNode, 'source');
            const endPos = getPortPosition(targetNode, edge.targetPort, sourceNode, 'target');
            const { path, points } = calculateEdgePath(
              startPos,
              endPos,
              edge.sourcePort,
              edge.targetPort,
              edge.lineType,
              {
                sourceNode,
                targetNode,
                allNodes: nodes,
                waypoints: edge.waypoints,
                manualOffset: edge.manualOffset,
                routingMode: edge.routingMode,
              }
            );

            return (
              <g id="flowchart-selected-edge-overlay" className="pointer-events-auto">
                {/* Thick highlight path with halo so it's always visible above nodes */}
                <path
                  d={path}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={edge.strokeWidth + 5}
                  opacity={0.8}
                />
                <path
                  d={path}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth={edge.strokeWidth + 1.5}
                  strokeDasharray={edge.style === 'dashed' ? '5,5' : undefined}
                  markerStart={edge.arrowStart ? 'url(#arrow-start-selected)' : undefined}
                  markerEnd={edge.arrowEnd !== false ? 'url(#arrow-selected)' : undefined}
                />

                {/* Draggable intermediate waypoint knobs */}
                {points.slice(1, -1).map((pt, idx) => (
                  <g
                    key={`wp-${idx}`}
                    transform={`translate(${pt.x}, ${pt.y})`}
                    className="cursor-move group/wp"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingWaypoint({ edgeId: edge.id, index: idx });
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleRemoveWaypoint(edge, idx);
                    }}
                  >
                    <circle r={10} fill="#3B82F6" opacity={0.2} className="group-hover/wp:opacity-40 transition-opacity" />
                    <circle r={5.5} fill="#FFFFFF" stroke="#3B82F6" strokeWidth={2.2} />
                  </g>
                ))}

                {/* Midpoint '+' knobs to insert custom bend points */}
                {points.slice(0, -1).map((p1, idx) => {
                  const p2 = points[idx + 1];
                  const midX = (p1.x + p2.x) / 2;
                  const midY = (p1.y + p2.y) / 2;
                  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                  if (dist < 32) return null;

                  return (
                    <g
                      key={`mid-${idx}`}
                      transform={`translate(${midX}, ${midY})`}
                      className="cursor-pointer group/mid"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddWaypointAt(edge, { x: midX, y: midY }, idx);
                      }}
                    >
                      <circle
                        r={7}
                        fill="#3B82F6"
                        className="opacity-70 group-hover/mid:opacity-100 group-hover/mid:scale-125 transition-transform"
                      />
                      <text
                        x={0}
                        y={3.5}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize={10}
                        fontWeight="bold"
                        className="pointer-events-none select-none"
                      >
                        +
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })()}

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

          {/* Quick Image Attachment Button */}
          <label
            className="p-1.5 rounded-lg border hover:opacity-80 transition-colors cursor-pointer flex items-center justify-center text-purple-600 dark:text-purple-400"
            style={{ borderColor: theme.ui.border }}
            title="جای‌گذاری عکس در این شکل (Ctrl+V یا انتخاب فایل)"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const dataUrl = ev.target?.result as string;
                    if (dataUrl) {
                      onUpdateNode({
                        ...selectedNode,
                        imageUrl: dataUrl,
                        width: Math.max(selectedNode.width, 180),
                        height: Math.max(selectedNode.height, 130),
                        imagePosition: selectedNode.imagePosition || 'top',
                        imageFit: selectedNode.imageFit || 'contain',
                      });
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>

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

      {/* Floating Quick Action Toolbar for Selected Edge */}
      {selectedEdgeId && (() => {
        const edge = edges.find((e) => e.id === selectedEdgeId);
        if (!edge) return null;
        const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);
        const targetNode = nodes.find((n) => n.id === edge.targetNodeId);
        if (!sourceNode || !targetNode) return null;

        const startPos = getPortPosition(sourceNode, edge.sourcePort, targetNode, 'source');
        const endPos = getPortPosition(targetNode, edge.targetPort, sourceNode, 'target');
        const { labelPos } = calculateEdgePath(
          startPos,
          endPos,
          edge.sourcePort,
          edge.targetPort,
          edge.lineType,
          {
            sourceNode,
            targetNode,
            allNodes: nodes,
            waypoints: edge.waypoints,
            manualOffset: edge.manualOffset,
            routingMode: edge.routingMode,
          }
        );

        const screenX = labelPos.x * zoom + pan.x;
        const screenY = labelPos.y * zoom + pan.y - 48;

        return (
          <div
            className="absolute z-20 flex items-center gap-1.5 p-1.5 rounded-xl shadow-2xl border backdrop-blur-md transition-all animate-in fade-in select-none text-xs"
            style={{
              left: Math.max(16, Math.min(window.innerWidth - 380, screenX - 150)),
              top: Math.max(16, screenY),
              backgroundColor: theme.ui.cardBg,
              borderColor: theme.ui.border,
              color: theme.ui.textPrimary,
            }}
          >
            {/* Route Left / Right */}
            <button
              type="button"
              title="هدایت و دور زدن از سمت چپ"
              onClick={() => onUpdateEdge({ ...edge, manualOffset: (edge.manualOffset || 0) - 35, routingMode: 'smart' })}
              className="px-2 py-1 rounded-lg border hover:opacity-85 flex items-center gap-1 font-semibold text-[11px]"
              style={{ borderColor: theme.ui.border }}
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-500" />
              <span>از چپ</span>
            </button>

            {/* Smart Auto Route Reset */}
            <button
              type="button"
              title="مسیریابی خودکار هوشمند بدون برخورد با موانع"
              onClick={() => onUpdateEdge({ ...edge, waypoints: undefined, manualOffset: 0, routingMode: 'smart' })}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 font-bold text-[11px] shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>هوشمند</span>
            </button>

            {/* Route Right */}
            <button
              type="button"
              title="هدایت و دور زدن از سمت راست"
              onClick={() => onUpdateEdge({ ...edge, manualOffset: (edge.manualOffset || 0) + 35, routingMode: 'smart' })}
              className="px-2 py-1 rounded-lg border hover:opacity-85 flex items-center gap-1 font-semibold text-[11px]"
              style={{ borderColor: theme.ui.border }}
            >
              <span>از راست</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
            </button>

            <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

            {/* Line Type Cycle */}
            <button
              type="button"
              title={`نوع خط: ${edge.lineType}`}
              onClick={() => {
                const nextType: LineType = edge.lineType === 'orthogonal' ? 'curved' : edge.lineType === 'curved' ? 'straight' : 'orthogonal';
                onUpdateEdge({ ...edge, lineType: nextType });
              }}
              className="px-2 py-1 rounded-lg border hover:opacity-85 text-[11px] font-medium"
              style={{ borderColor: theme.ui.border }}
            >
              {edge.lineType === 'orthogonal' ? '🔀 پله‌ای' : edge.lineType === 'curved' ? '〰️ منحنی' : '📏 مستقیم'}
            </button>

            {/* Arrow Heads Cycle */}
            <button
              type="button"
              title="تغییر جهت پیکان‌ها"
              onClick={() => {
                if (!edge.arrowStart && edge.arrowEnd !== false) {
                  onUpdateEdge({ ...edge, arrowStart: true, arrowEnd: true });
                } else if (edge.arrowStart && edge.arrowEnd) {
                  onUpdateEdge({ ...edge, arrowStart: true, arrowEnd: false });
                } else if (edge.arrowStart && !edge.arrowEnd) {
                  onUpdateEdge({ ...edge, arrowStart: false, arrowEnd: false });
                } else {
                  onUpdateEdge({ ...edge, arrowStart: false, arrowEnd: true });
                }
              }}
              className="px-2 py-1 rounded-lg border hover:opacity-85 text-[11px] font-mono font-bold"
              style={{ borderColor: theme.ui.border }}
            >
              {edge.arrowStart && edge.arrowEnd ? '↔️ دوطرفه' : edge.arrowStart ? '⬅️ ابتدا' : edge.arrowEnd !== false ? '➔ انتها' : '─ ساده'}
            </button>

            {/* Delete Edge */}
            <button
              type="button"
              title="حذف خط ارتباطی"
              onClick={() => onDeleteEdge(edge.id)}
              className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })()}

      {/* Inline Text Editor Overlay when Double-Clicked */}
      {editingNodeId && (
        (() => {
          const node = nodes.find((n) => n.id === editingNodeId);
          if (!node) return null;
          const lineCount = (editingText || '').split('\n').length;
          const calcHeight = Math.max(
            node.height * zoom,
            (lineCount * node.fontSize * 1.45 + 36) * zoom
          );

          return (
            <div
              className="absolute z-30 flex flex-col items-center"
              style={{
                left: node.x * zoom + pan.x,
                top: node.y * zoom + pan.y - (calcHeight - node.height * zoom) / 2,
                width: Math.max(node.width * zoom, 160),
                minHeight: calcHeight,
              }}
            >
              <textarea
                autoFocus
                ref={(el) => {
                  if (el) {
                    el.focus();
                    el.setSelectionRange(el.value.length, el.value.length);
                  }
                }}
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={handleFinishEditingText}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (e.shiftKey) {
                      // Shift + Enter: creates a new line
                      return;
                    } else {
                      // Enter: commits and saves!
                      e.preventDefault();
                      handleFinishEditingText();
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setEditingNodeId(null);
                  }
                }}
                placeholder="متن شکل را بنویسید (Shift+Enter برای خط جدید، Enter برای ثبت)..."
                className="w-full flex-1 p-2.5 resize-none outline-none border-2 border-blue-500 rounded-t-lg shadow-2xl leading-relaxed"
                style={{
                  backgroundColor: theme.ui.cardBg,
                  color: theme.ui.textPrimary,
                  fontSize: `${Math.max(12, node.fontSize * zoom)}px`,
                  fontWeight: node.fontWeight,
                  fontFamily: node.fontFamily || 'Vazirmatn, sans-serif',
                  fontStyle: node.fontStyle || 'normal',
                  textAlign: node.textAlign || 'center',
                  minHeight: `${Math.max(60, node.height * zoom)}px`,
                }}
              />
              <div
                className="w-full text-[10px] text-center bg-blue-600 text-white rounded-b-lg px-2.5 py-1 shadow-md flex items-center justify-between font-sans select-none"
              >
                <span>Shift+Enter = خط جدید</span>
                <span className="opacity-80">پاکسازی خودکار فاصله‌ها</span>
                <span>Enter = ثبت</span>
              </div>
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

      {/* Minimap Radar in Bottom Corner with Interactive Click & Drag Navigation */}
      <div
        className="absolute bottom-4 left-4 z-20 border rounded-xl shadow-xl p-2 overflow-hidden transition-all hidden sm:block"
        style={{
          backgroundColor: theme.ui.cardBg,
          borderColor: theme.ui.border,
          width: showMinimap ? 180 : 36,
          height: showMinimap ? 125 : 36,
        }}
      >
        <button
          onClick={() => setShowMinimap(!showMinimap)}
          className="absolute top-1.5 left-1.5 p-1 rounded hover:opacity-80 z-10 transition-opacity"
          title={showMinimap ? 'بستن رادار مینی‌مپ' : t.minimap}
        >
          <Compass className="w-3.5 h-3.5 opacity-60" />
        </button>

        {showMinimap && (
          <div
            className="w-full h-full pt-4 relative select-none"
            title="کلیک یا کشیدن برای پیمایش فوری به این موقعیت"
          >
            <svg
              ref={minimapSvgRef}
              viewBox={`${bbox.minX} ${bbox.minY} ${bbox.width} ${bbox.height}`}
              className="w-full h-full rounded cursor-pointer active:cursor-grabbing select-none"
              style={{ backgroundColor: theme.ui.surface }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsMinimapDragging(true);
                handleMinimapNavigate(e.clientX, e.clientY);
              }}
            >
              <title>کلیک یا کشیدن برای پیمایش فوری به این موقعیت</title>
              {/* Edges mini lines */}
              {edges.map((e) => {
                const s = nodes.find((n) => n.id === e.sourceNodeId);
                const t = nodes.find((n) => n.id === e.targetNodeId);
                if (!s || !t) return null;
                return (
                  <line
                    key={e.id}
                    x1={s.x + s.width / 2}
                    y1={s.y + s.height / 2}
                    x2={t.x + t.width / 2}
                    y2={t.y + t.height / 2}
                    stroke={theme.isDark ? '#64748B' : '#94A3B8'}
                    strokeWidth={Math.max(1, bbox.width / 220)}
                    strokeOpacity={0.65}
                    className="pointer-events-none"
                  />
                );
              })}

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
                  strokeWidth={Math.max(1, bbox.width / 160)}
                  className="pointer-events-none"
                />
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* Professional Floating Context Menu */}
      {contextMenu && (
        <ContextMenu
          isOpen={contextMenu.isOpen}
          onClose={() => setContextMenu(null)}
          screenPos={contextMenu.screenPos}
          target={contextMenu.target}
          theme={theme}
          isRtl={isRtl}
          onEditNodeText={(nodeId) => {
            const node = nodes.find((n) => n.id === nodeId);
            if (node) {
              setEditingNodeId(node.id);
              setEditingText(node.label);
            }
          }}
          onDuplicateNode={onDuplicateNode}
          onCopyNode={onCopyNode}
          onCutNode={onCutNode}
          onDeleteNode={onDeleteNode}
          onChangeNodeType={handleChangeNodeType}
          onChangeNodeColors={handleChangeNodeColors}
          onBringToFront={onBringToFront}
          onSendToBack={onSendToBack}
          onBringForward={onBringForward}
          onSendBackward={onSendBackward}
          onToggleNodeLock={handleToggleLock}
          onAutoFitNodeText={handleAutoFitNode}
          onAttachImageToNode={handleAttachImage}
          onEditEdgeLabel={(edgeId) => {
            const edge = edges.find((e) => e.id === edgeId);
            if (edge) {
              setEditingEdgeId(edge.id);
              setEditingEdgeLabel(edge.label || '');
            }
          }}
          onChangeEdgeLineType={(edgeId, lineType) => {
            const edge = edges.find((e) => e.id === edgeId);
            if (edge) onUpdateEdge({ ...edge, lineType });
          }}
          onChangeEdgeArrows={(edgeId, arrowStart, arrowEnd) => {
            const edge = edges.find((e) => e.id === edgeId);
            if (edge) onUpdateEdge({ ...edge, arrowStart, arrowEnd });
          }}
          onChangeEdgeStyle={(edgeId, style) => {
            const edge = edges.find((e) => e.id === edgeId);
            if (edge) onUpdateEdge({ ...edge, style });
          }}
          onChangeEdgeStrokeWidth={(edgeId, strokeWidth) => {
            const edge = edges.find((e) => e.id === edgeId);
            if (edge) onUpdateEdge({ ...edge, strokeWidth });
          }}
          onChangeEdgeColor={(edgeId, color) => {
            const edge = edges.find((e) => e.id === edgeId);
            if (edge) onUpdateEdge({ ...edge, color });
          }}
          onReverseEdge={handleReverseEdge}
          onDeleteEdge={onDeleteEdge}
          onAddNodeAt={onAddNodeAt}
          onPasteAt={onPasteNodeAt}
          hasClipboardNode={hasClipboardNode}
          onInsertImageAt={(_pos) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e: any) => {
              const file = e.target?.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const dataUrl = ev.target?.result as string;
                  if (dataUrl) {
                    onPasteImage?.(dataUrl);
                  }
                };
                reader.readAsDataURL(file);
              }
            };
            input.click();
          }}
          onZoomIn={() => setZoom((prev) => Math.min(3, prev + 0.15))}
          onZoomOut={() => setZoom((prev) => Math.max(0.3, prev - 0.15))}
          onResetZoom={() => {
            setZoom(1);
            setPan({ x: 40, y: 30 });
          }}
          onFitToScreen={handleFitToScreen}
          gridMode={gridMode}
          onSetGridMode={onSetGridMode}
          snapToGrid={snapToGrid}
          onToggleSnapToGrid={onToggleSnapToGrid}
          onAutoFitAllNodes={onTrimAllNodes}
          onSelectAllNodes={onSelectAllNodes}
          onClearCanvas={onClearCanvas}
        />
      )}
    </div>
  );
};
