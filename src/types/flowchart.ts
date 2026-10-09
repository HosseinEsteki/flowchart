export type FlowchartNodeType =
  | 'terminal'
  | 'process'
  | 'decision'
  | 'input-output'
  | 'document'
  | 'subroutine'
  | 'database'
  | 'connector'
  | 'note';

export type FlowchartPort = 'top' | 'right' | 'bottom' | 'left';

export type LineType = 'orthogonal' | 'curved' | 'straight';

export interface FlowchartNode {
  id: string;
  type: FlowchartNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  textColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic';
  borderRadius?: number;
  opacity?: number;
  notes?: string;
  locked?: boolean;
}

export interface SiteDefaultSettings {
  // Shape defaults
  shapeFontFamily: string;
  shapeFontSize: number;
  shapeFontWeight: 'normal' | 'bold';
  shapeFontStyle: 'normal' | 'italic';
  shapeTextAlign: 'left' | 'center' | 'right';
  shapeFill: string;
  shapeStroke: string;
  shapeStrokeWidth: number;
  shapeStrokeStyle: 'solid' | 'dashed' | 'dotted';
  shapeTextColor: string;
  shapeWidth: number;
  shapeHeight: number;
  shapeBorderRadius: number;
  shapeOpacity: number;

  // Connector defaults
  connectorLineType: LineType;
  connectorColor: string;
  connectorStrokeWidth: number;
  connectorStyle: 'solid' | 'dashed';

  // Canvas & App defaults
  gridMode: 'dots' | 'lines' | 'none';
  snapToGrid: boolean;
  defaultTheme: string;
  language: 'fa' | 'en';
}

export interface FlowchartEdge {
  id: string;
  sourceNodeId: string;
  sourcePort: FlowchartPort;
  targetNodeId: string;
  targetPort: FlowchartPort;
  lineType: LineType;
  label?: string;
  color: string;
  strokeWidth: number;
  style: 'solid' | 'dashed';
  arrowStart?: boolean;
  arrowEnd?: boolean;
}

export interface FlowchartVersion {
  id: string;
  timestamp: number;
  name: string;
  author: string;
  nodeCount: number;
  edgeCount: number;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

export interface FlowchartPage {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

export type PrintColorMode = 'color' | 'grayscale' | 'monochrome';
export type PrintFontFamily = 'vazirmatn' | 'system' | 'shabnam' | 'sans' | 'serif' | 'custom' | string;
export type PrintPaperSize = 'a4' | 'a3' | 'letter' | 'legal';
export type PrintOrientation = 'landscape' | 'portrait';
export type PrintDescPosition = 'below' | 'above' | 'appendix';
export type PrintTextAlign = 'right' | 'center' | 'left' | 'justify';

export interface PrintSettings {
  colorMode: PrintColorMode;
  fontFamily: PrintFontFamily;
  customFontName?: string;
  customFontUrl?: string;
  descFontSize: number;
  titleFontSize: number;
  fontWeight: 'normal' | 'bold';
  textAlign: PrintTextAlign;
  spacing: number;
  descPosition: PrintDescPosition;
  paperSize: PrintPaperSize;
  orientation: PrintOrientation;
  marginSize: 'compact' | 'normal' | 'spacious';
  showPageNumbers: boolean;
  showHeaderFooter: boolean;
  showDate: boolean;
  showBorders: boolean;
  showNotes?: boolean;
  targetPages: 'all' | 'current';

  // Professional Print Layout Editor fields
  documentTitle?: string;
  documentSubtitle?: string;
  organizationName?: string;
  diagramScale?: number;
  diagramAlign?: 'center' | 'top' | 'start';
  diagramBorder?: 'none' | 'thin' | 'double' | 'dashed' | 'shadow';
  diagramBg?: 'white' | 'subtle' | 'grid';
  footerNote?: string;
  preset?: 'formal' | 'iso' | 'modern' | 'minimal' | 'diagramOnly';
  accentColor?: string;
  includeCoverPage?: boolean;
  coverSummary?: string;
}

export interface FlowchartProject {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  theme: string;
  activePageId?: string;
  pages?: FlowchartPage[];
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  versions: FlowchartVersion[];
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number } | null;
  activeNodeId?: string | null;
  lastActive: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  text: string;
  timestamp: number;
}
