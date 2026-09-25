export interface ColorTheme {
  id: string;
  nameEn: string;
  nameFa: string;
  isDark: boolean;
  ui: {
    bg: string;
    cardBg: string;
    surface: string;
    border: string;
    textPrimary: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    accentText: string;
    canvasBg: string;
    canvasDot: string;
    canvasGrid: string;
  };
  palette: {
    terminal: { fill: string; stroke: string; text: string };
    process: { fill: string; stroke: string; text: string };
    decision: { fill: string; stroke: string; text: string };
    inputOutput: { fill: string; stroke: string; text: string };
    document: { fill: string; stroke: string; text: string };
    subroutine: { fill: string; stroke: string; text: string };
    database: { fill: string; stroke: string; text: string };
    connector: { fill: string; stroke: string; text: string };
    note: { fill: string; stroke: string; text: string };
  };
  nodeColorPresets: Array<{ name: string; fill: string; stroke: string; text: string }>;
}

export const THEMES: Record<string, ColorTheme> = {
  slate: {
    id: 'slate',
    nameEn: 'Modern Light',
    nameFa: 'روشن مدرن',
    isDark: false,
    ui: {
      bg: '#F8FAFC',
      cardBg: '#FFFFFF',
      surface: '#F1F5F9',
      border: '#E2E8F0',
      textPrimary: '#0F172A',
      textMuted: '#64748B',
      accent: '#2563EB',
      accentHover: '#1D4ED8',
      accentText: '#FFFFFF',
      canvasBg: '#F8FAFC',
      canvasDot: '#CBD5E1',
      canvasGrid: '#E2E8F0',
    },
    palette: {
      terminal: { fill: '#EFF6FF', stroke: '#3B82F6', text: '#1E3A8A' },
      process: { fill: '#F8FAFC', stroke: '#64748B', text: '#0F172A' },
      decision: { fill: '#FEF3C7', stroke: '#F59E0B', text: '#78350F' },
      inputOutput: { fill: '#F0FDF4', stroke: '#10B981', text: '#064E3B' },
      document: { fill: '#F5F3FF', stroke: '#8B5CF6', text: '#4C1D95' },
      subroutine: { fill: '#ECFEFF', stroke: '#06B6D4', text: '#164E63' },
      database: { fill: '#FFF1F2', stroke: '#F43F5E', text: '#881337' },
      connector: { fill: '#E2E8F0', stroke: '#475569', text: '#0F172A' },
      note: { fill: '#FEFCE8', stroke: '#EAB308', text: '#713F12' },
    },
    nodeColorPresets: [
      { name: 'Default', fill: '#FFFFFF', stroke: '#94A3B8', text: '#0F172A' },
      { name: 'Blue', fill: '#EFF6FF', stroke: '#3B82F6', text: '#1E3A8A' },
      { name: 'Green', fill: '#F0FDF4', stroke: '#10B981', text: '#064E3B' },
      { name: 'Amber', fill: '#FEF3C7', stroke: '#F59E0B', text: '#78350F' },
      { name: 'Purple', fill: '#FAF5FF', stroke: '#A855F7', text: '#581C87' },
      { name: 'Rose', fill: '#FFF1F2', stroke: '#F43F5E', text: '#881337' },
      { name: 'Cyan', fill: '#ECFEFF', stroke: '#06B6D4', text: '#164E63' },
      { name: 'Dark', fill: '#1E293B', stroke: '#0F172A', text: '#F8FAFC' },
    ],
  },
  dark: {
    id: 'dark',
    nameEn: 'Deep Dark',
    nameFa: 'تیره عمیق',
    isDark: true,
    ui: {
      bg: '#0B0F19',
      cardBg: '#131B2E',
      surface: '#1A233A',
      border: '#232F4D',
      textPrimary: '#F1F5F9',
      textMuted: '#94A3B8',
      accent: '#6366F1',
      accentHover: '#4F46E5',
      accentText: '#FFFFFF',
      canvasBg: '#090D16',
      canvasDot: '#2A3655',
      canvasGrid: '#182238',
    },
    palette: {
      terminal: { fill: '#1E293B', stroke: '#60A5FA', text: '#DBEAFE' },
      process: { fill: '#131B2E', stroke: '#475569', text: '#F1F5F9' },
      decision: { fill: '#2E2210', stroke: '#FBBF24', text: '#FEF3C7' },
      inputOutput: { fill: '#0E2E1F', stroke: '#34D399', text: '#D1FAE5' },
      document: { fill: '#28173D', stroke: '#C084FC', text: '#F3E8FF' },
      subroutine: { fill: '#0E2933', stroke: '#22D3EE', text: '#CFFAFE' },
      database: { fill: '#331320', stroke: '#FB7185', text: '#FFE4E6' },
      connector: { fill: '#232F4D', stroke: '#94A3B8', text: '#F8FAFC' },
      note: { fill: '#2B2810', stroke: '#FACC15', text: '#FEF9C3' },
    },
    nodeColorPresets: [
      { name: 'Dark Navy', fill: '#131B2E', stroke: '#3B82F6', text: '#F8FAFC' },
      { name: 'Charcoal', fill: '#1E293B', stroke: '#64748B', text: '#F8FAFC' },
      { name: 'Emerald', fill: '#064E3B', stroke: '#10B981', text: '#ECFDF5' },
      { name: 'Amber', fill: '#451A03', stroke: '#F59E0B', text: '#FEF3C7' },
      { name: 'Purple', fill: '#3B0764', stroke: '#A855F7', text: '#FAF5FF' },
      { name: 'Rose', fill: '#4C0519', stroke: '#F43F5E', text: '#FFF1F2' },
      { name: 'Cyan', fill: '#164E63', stroke: '#06B6D4', text: '#ECFEFF' },
      { name: 'Pure Black', fill: '#05070B', stroke: '#334155', text: '#E2E8F0' },
    ],
  },
  ocean: {
    id: 'ocean',
    nameEn: 'Pacific Ocean',
    nameFa: 'اقیانوسی',
    isDark: true,
    ui: {
      bg: '#081426',
      cardBg: '#0F233D',
      surface: '#153255',
      border: '#1E4370',
      textPrimary: '#E0F2FE',
      textMuted: '#7DD3FC',
      accent: '#0284C7',
      accentHover: '#0369A1',
      accentText: '#FFFFFF',
      canvasBg: '#06101E',
      canvasDot: '#1B3E68',
      canvasGrid: '#112948',
    },
    palette: {
      terminal: { fill: '#0F2E52', stroke: '#38BDF8', text: '#F0F9FF' },
      process: { fill: '#0C223D', stroke: '#0284C7', text: '#E0F2FE' },
      decision: { fill: '#2A291A', stroke: '#FACC15', text: '#FEF08A' },
      inputOutput: { fill: '#0A3331', stroke: '#2DD4BF', text: '#CCFBF1' },
      document: { fill: '#221D42', stroke: '#A78BFA', text: '#EDE9FE' },
      subroutine: { fill: '#083344', stroke: '#38BDF8', text: '#E0F2FE' },
      database: { fill: '#2E1527', stroke: '#F472B6', text: '#FCE7F3' },
      connector: { fill: '#143860', stroke: '#7DD3FC', text: '#F0F9FF' },
      note: { fill: '#282C1A', stroke: '#EAB308', text: '#FEF9C3' },
    },
    nodeColorPresets: [
      { name: 'Pacific', fill: '#0F2848', stroke: '#38BDF8', text: '#F0F9FF' },
      { name: 'Teal', fill: '#0B3B39', stroke: '#2DD4BF', text: '#E6FFFA' },
      { name: 'Sky', fill: '#1E3A5F', stroke: '#60A5FA', text: '#EFF6FF' },
      { name: 'Navy', fill: '#08172B', stroke: '#1D4ED8', text: '#DBEAFE' },
      { name: 'Sand', fill: '#332717', stroke: '#F59E0B', text: '#FEF3C7' },
      { name: 'Coral', fill: '#3E1C24', stroke: '#FB7185', text: '#FFE4E6' },
      { name: 'Deep', fill: '#040B14', stroke: '#20436F', text: '#BAE6FD' },
      { name: 'White', fill: '#F8FAFC', stroke: '#0284C7', text: '#0F172A' },
    ],
  },
  emerald: {
    id: 'emerald',
    nameEn: 'Nordic Pine',
    nameFa: 'کاج نوردیک',
    isDark: false,
    ui: {
      bg: '#F4F7F5',
      cardBg: '#FFFFFF',
      surface: '#E8EFEA',
      border: '#D3DFD6',
      textPrimary: '#132418',
      textMuted: '#526959',
      accent: '#059669',
      accentHover: '#047857',
      accentText: '#FFFFFF',
      canvasBg: '#F5F8F6',
      canvasDot: '#BACDC0',
      canvasGrid: '#DCE6DF',
    },
    palette: {
      terminal: { fill: '#ECFDF5', stroke: '#10B981', text: '#064E3B' },
      process: { fill: '#FFFFFF', stroke: '#6B8071', text: '#132418' },
      decision: { fill: '#FEF3C7', stroke: '#F59E0B', text: '#78350F' },
      inputOutput: { fill: '#F0FDF4', stroke: '#34D399', text: '#065F46' },
      document: { fill: '#F5F3FF', stroke: '#8B5CF6', text: '#4C1D95' },
      subroutine: { fill: '#F0FDFA', stroke: '#14B8A6', text: '#134E4A' },
      database: { fill: '#FFF1F2', stroke: '#F43F5E', text: '#881337' },
      connector: { fill: '#E8EFEA', stroke: '#405B48', text: '#132418' },
      note: { fill: '#FEFCE8', stroke: '#EAB308', text: '#713F12' },
    },
    nodeColorPresets: [
      { name: 'Pine Mint', fill: '#ECFDF5', stroke: '#059669', text: '#064E3B' },
      { name: 'Forest', fill: '#064E3B', stroke: '#10B981', text: '#FFFFFF' },
      { name: 'Sage', fill: '#F1F6F2', stroke: '#738F7A', text: '#1B2E20' },
      { name: 'Amber Glow', fill: '#FFFBEB', stroke: '#D97706', text: '#78350F' },
      { name: 'Teal Lake', fill: '#CCFBF1', stroke: '#0D9488', text: '#115E59' },
      { name: 'Clean White', fill: '#FFFFFF', stroke: '#D3DFD6', text: '#132418' },
      { name: 'Earth Stone', fill: '#F5F5F4', stroke: '#78716C', text: '#292524' },
      { name: 'Olive Slate', fill: '#36443A', stroke: '#526959', text: '#F4F7F5' },
    ],
  },
  sunset: {
    id: 'sunset',
    nameEn: 'Desert Sunset',
    nameFa: 'غروب کویر',
    isDark: false,
    ui: {
      bg: '#FAF7F5',
      cardBg: '#FFFFFF',
      surface: '#F3EBE6',
      border: '#E8DDD6',
      textPrimary: '#2E1911',
      textMuted: '#7C655A',
      accent: '#EA580C',
      accentHover: '#C2410C',
      accentText: '#FFFFFF',
      canvasBg: '#FAF7F5',
      canvasDot: '#DFCAC0',
      canvasGrid: '#ECE0D8',
    },
    palette: {
      terminal: { fill: '#FFF7ED', stroke: '#FB923C', text: '#7C2D12' },
      process: { fill: '#FFFFFF', stroke: '#9A8277', text: '#2E1911' },
      decision: { fill: '#FEF3C7', stroke: '#F59E0B', text: '#78350F' },
      inputOutput: { fill: '#FEF2F2', stroke: '#F87171', text: '#7F1D1D' },
      document: { fill: '#FAF5FF', stroke: '#A855F7', text: '#581C87' },
      subroutine: { fill: '#FDF4FF', stroke: '#D946EF', text: '#701A75' },
      database: { fill: '#EFF6FF', stroke: '#3B82F6', text: '#1E3A8A' },
      connector: { fill: '#F3EBE6', stroke: '#7C655A', text: '#2E1911' },
      note: { fill: '#FFFBEB', stroke: '#F59E0B', text: '#78350F' },
    },
    nodeColorPresets: [
      { name: 'Terracotta', fill: '#FFF7ED', stroke: '#EA580C', text: '#7C2D12' },
      { name: 'Sunbeam', fill: '#FEF3C7', stroke: '#F59E0B', text: '#78350F' },
      { name: 'Warm Cream', fill: '#FFFBEB', stroke: '#D97706', text: '#451A03' },
      { name: 'Rose Clay', fill: '#FFF1F2', stroke: '#FB7185', text: '#881337' },
      { name: 'Canyon', fill: '#7C2D12', stroke: '#FB923C', text: '#FFFFFF' },
      { name: 'Pure White', fill: '#FFFFFF', stroke: '#E8DDD6', text: '#2E1911' },
      { name: 'Desert Night', fill: '#2A1A14', stroke: '#9A8277', text: '#FAF7F5' },
      { name: 'Dusty Peach', fill: '#FFE4E6', stroke: '#E11D48', text: '#4C0519' },
    ],
  },
  blueprint: {
    id: 'blueprint',
    nameEn: 'Technical Blueprint',
    nameFa: 'بلوپرینت مهندسی',
    isDark: true,
    ui: {
      bg: '#0A192F',
      cardBg: '#102A4C',
      surface: '#173B6B',
      border: '#23528F',
      textPrimary: '#E6F1FF',
      textMuted: '#8892B0',
      accent: '#64FFDA',
      accentHover: '#42DAB7',
      accentText: '#0A192F',
      canvasBg: '#071527',
      canvasDot: '#1D457B',
      canvasGrid: '#112F58',
    },
    palette: {
      terminal: { fill: '#102A4C', stroke: '#64FFDA', text: '#E6F1FF' },
      process: { fill: '#0C203B', stroke: '#4CC9F0', text: '#E6F1FF' },
      decision: { fill: '#1C2942', stroke: '#FFD166', text: '#FFF2C5' },
      inputOutput: { fill: '#103042', stroke: '#06D6A0', text: '#E0FBF4' },
      document: { fill: '#22234B', stroke: '#B588F7', text: '#F2EBFF' },
      subroutine: { fill: '#0E2849', stroke: '#3A86FF', text: '#EBF4FF' },
      database: { fill: '#2A1835', stroke: '#EF476F', text: '#FFE6EC' },
      connector: { fill: '#173B6B', stroke: '#64FFDA', text: '#0A192F' },
      note: { fill: '#262A2B', stroke: '#FFD166', text: '#FFFBE6' },
    },
    nodeColorPresets: [
      { name: 'Cyan Glow', fill: '#0C233E', stroke: '#64FFDA', text: '#E6F1FF' },
      { name: 'Sky Grid', fill: '#102A4C', stroke: '#4CC9F0', text: '#E6F1FF' },
      { name: 'Gold Spec', fill: '#1F2937', stroke: '#FFD166', text: '#FFF8DB' },
      { name: 'Navy Core', fill: '#071527', stroke: '#23528F', text: '#CCD6F6' },
      { name: 'High Volt', fill: '#64FFDA', stroke: '#102A4C', text: '#0A192F' },
      { name: 'Laser Rose', fill: '#2B1527', stroke: '#EF476F', text: '#FFE6ED' },
      { name: 'Solid Blueprint', fill: '#143A67', stroke: '#8892B0', text: '#FFFFFF' },
      { name: 'Steel Wire', fill: '#1B2A3A', stroke: '#94A3B8', text: '#F1F5F9' },
    ],
  },
};
