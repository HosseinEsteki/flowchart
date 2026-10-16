import { SiteDefaultSettings, FlowchartNodeType, ShapeTypeColorConfig } from '../types/flowchart';

export const DEFAULT_SHAPE_TYPE_COLORS: Record<FlowchartNodeType, ShapeTypeColorConfig> = {
  terminal: { fill: '#EFF6FF', stroke: '#3B82F6', textColor: '#1E3A8A' },
  process: { fill: '#F8FAFC', stroke: '#475569', textColor: '#0F172A' },
  decision: { fill: '#FEF3C7', stroke: '#F59E0B', textColor: '#78350F' },
  'input-output': { fill: '#F0FDF4', stroke: '#10B981', textColor: '#064E3B' },
  document: { fill: '#F5F3FF', stroke: '#8B5CF6', textColor: '#4C1D95' },
  subroutine: { fill: '#ECFEFF', stroke: '#06B6D4', textColor: '#164E63' },
  database: { fill: '#FFF1F2', stroke: '#F43F5E', textColor: '#881337' },
  connector: { fill: '#F1F5F9', stroke: '#64748B', textColor: '#1E293B' },
  note: { fill: '#FEFCE8', stroke: '#EAB308', textColor: '#713F12' },
  image: { fill: '#F8FAFC', stroke: '#CBD5E1', textColor: '#0F172A' },
};

export const FONT_OPTIONS = [
  { id: 'Vazirmatn, sans-serif', label: 'وزیرمتن (Vazirmatn)', family: 'Vazirmatn, sans-serif' },
  { id: 'Shabnam, sans-serif', label: 'شبنم (Shabnam)', family: 'Shabnam, sans-serif' },
  { id: 'Sahel, sans-serif', label: 'ساحل (Sahel)', family: 'Sahel, sans-serif' },
  { id: 'Samim, sans-serif', label: 'صمیم (Samim)', family: 'Samim, sans-serif' },
  { id: 'Tanha, sans-serif', label: 'تنها (Tanha)', family: 'Tanha, sans-serif' },
  { id: 'IRANYekan, sans-serif', label: 'ایران یکان (IRANYekan)', family: 'IRANYekan, sans-serif' },
  { id: 'Dana, sans-serif', label: 'دانا (Dana)', family: 'Dana, sans-serif' },
  { id: 'system-ui, sans-serif', label: 'قلم سیستمی (System UI)', family: 'system-ui, sans-serif' },
  { id: 'Tahoma, sans-serif', label: 'تاهوما (Tahoma)', family: 'Tahoma, sans-serif' },
  { id: 'Inter, sans-serif', label: 'اینتر (Inter)', family: 'Inter, sans-serif' },
  { id: 'Roboto, sans-serif', label: 'روبوتو (Roboto)', family: 'Roboto, sans-serif' },
  { id: 'Arial, sans-serif', label: 'آریال (Arial)', family: 'Arial, sans-serif' },
  { id: 'monospace', label: 'کد و مونو (Monospace)', family: 'monospace' },
  { id: 'Georgia, serif', label: 'سریف سنتی (Serif)', family: 'Georgia, serif' },
];

export const COLOR_SWATCHES = [
  { name: 'نیلی مدرن', fill: '#EEF2FF', stroke: '#4F46E5', text: '#1E1B4B' },
  { name: 'آبی اقیانوسی', fill: '#E0F2FE', stroke: '#0284C7', text: '#0C4A6E' },
  { name: 'سبز زمردی', fill: '#ECFDF5', stroke: '#059669', text: '#064E3B' },
  { name: 'کهربایی روشن', fill: '#FFFBEB', stroke: '#D97706', text: '#78350F' },
  { name: 'رز ارغوانی', fill: '#FFF1F2', stroke: '#E11D48', text: '#881337' },
  { name: 'بنفش رویال', fill: '#F5F3FF', stroke: '#7C3AED', text: '#4C1D95' },
  { name: 'خاکستری سنگی', fill: '#F8FAFC', stroke: '#64748B', text: '#0F172A' },
  { name: 'سفید مینیمال', fill: '#FFFFFF', stroke: '#CBD5E1', text: '#0F172A' },
  { name: 'تیره متالیک', fill: '#1E293B', stroke: '#475569', text: '#F8FAFC' },
  { name: 'شیشه‌ای / شفاف', fill: 'transparent', stroke: '#3B82F6', text: '#1E293B' },
];

export const DEFAULT_SITE_SETTINGS: SiteDefaultSettings = {
  // Shape defaults
  shapeFontFamily: 'Vazirmatn, sans-serif',
  shapeFontSize: 13,
  shapeFontWeight: 'normal',
  shapeFontStyle: 'normal',
  shapeTextAlign: 'center',
  shapeFill: '#EEF2FF',
  shapeStroke: '#4F46E5',
  shapeStrokeWidth: 2,
  shapeStrokeStyle: 'solid',
  shapeTextColor: '#1E1B4B',
  shapeWidth: 160,
  shapeHeight: 75,
  shapeBorderRadius: 8,
  shapeOpacity: 1,

  // Custom colors per shape type
  shapeTypeColors: { ...DEFAULT_SHAPE_TYPE_COLORS },

  // Connector defaults
  connectorLineType: 'orthogonal',
  connectorColor: '#64748B',
  connectorStrokeWidth: 2,
  connectorStyle: 'solid',

  // Canvas & App defaults
  gridMode: 'dots',
  snapToGrid: true,
  defaultTheme: 'slate',
  language: 'fa',
};

const STORAGE_KEY = 'flowcraft_site_default_settings';

export function getSiteDefaultSettings(): SiteDefaultSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SITE_SETTINGS,
        ...parsed,
        shapeTypeColors: {
          ...DEFAULT_SHAPE_TYPE_COLORS,
          ...(parsed.shapeTypeColors || {}),
        },
      };
    }
  } catch (e) {
    console.warn('Error reading default settings from localStorage:', e);
  }
  return { ...DEFAULT_SITE_SETTINGS };
}

export function saveSiteDefaultSettings(settings: SiteDefaultSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Error saving default settings to localStorage:', e);
  }
}

export function resetSiteDefaultSettings(): SiteDefaultSettings {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Error resetting default settings in localStorage:', e);
  }
  return { ...DEFAULT_SITE_SETTINGS };
}
