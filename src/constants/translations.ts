export interface TranslationDictionary {
  appName: string;
  tagline: string;
  // Header
  untitledProject: string;
  cloudSaved: string;
  saving: string;
  offline: string;
  connectedTeammates: string;
  collaborate: string;
  export: string;
  theme: string;
  language: string;
  shortcuts: string;
  versionHistory: string;
  undo: string;
  redo: string;
  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
  fitScreen: string;

  // Sidebar tools
  shapes: string;
  templates: string;
  history: string;
  team: string;

  // Shapes
  shapeTerminal: string;
  shapeTerminalDesc: string;
  shapeProcess: string;
  shapeProcessDesc: string;
  shapeDecision: string;
  shapeDecisionDesc: string;
  shapeInputOutput: string;
  shapeInputOutputDesc: string;
  shapeDocument: string;
  shapeDocumentDesc: string;
  shapeSubroutine: string;
  shapeSubroutineDesc: string;
  shapeDatabase: string;
  shapeDatabaseDesc: string;
  shapeConnector: string;
  shapeConnectorDesc: string;
  shapeNote: string;
  shapeNoteDesc: string;

  // Inspector / Properties
  properties: string;
  noSelection: string;
  selectPrompt: string;
  text: string;
  dimensions: string;
  colors: string;
  fillColor: string;
  strokeColor: string;
  textColor: string;
  strokeWidth: string;
  strokeStyle: string;
  solid: string;
  dashed: string;
  dotted: string;
  fontSize: string;
  bold: string;
  alignLeft: string;
  alignCenter: string;
  alignRight: string;
  deleteSelected: string;
  duplicate: string;
  bringForward: string;
  sendBackward: string;
  edgeLabel: string;
  lineType: string;
  orthogonal: string;
  curved: string;
  straight: string;

  // Templates
  templateAuth: string;
  templateAuthDesc: string;
  templateOrder: string;
  templateOrderDesc: string;
  templateSupport: string;
  templateSupportDesc: string;
  templateData: string;
  templateDataDesc: string;
  applyTemplate: string;
  applyTemplateConfirm: string;

  // Versions
  versionsTitle: string;
  saveNewVersion: string;
  versionNamePlaceholder: string;
  versionCreated: string;
  restoreVersion: string;
  restoreConfirm: string;
  currentVersion: string;
  initialVersion: string;
  nodesCount: string;
  edgesCount: string;
  noVersionsYet: string;

  // Collaboration
  collaborationTitle: string;
  yourName: string;
  roomCode: string;
  copyLink: string;
  linkCopied: string;
  activeCollaborators: string;
  chatPlaceholder: string;
  send: string;
  you: string;

  // Export
  exportTitle: string;
  exportPng: string;
  exportPngDesc: string;
  exportSvg: string;
  exportSvgDesc: string;
  exportHtml: string;
  exportHtmlDesc: string;
  exportPdf: string;
  exportPdfDesc: string;
  exportJson: string;
  exportJsonDesc: string;
  exportSuccess: string;

  // Shortcuts
  shortcutsTitle: string;
  shortcutUndo: string;
  shortcutRedo: string;
  shortcutDelete: string;
  shortcutCopy: string;
  shortcutPaste: string;
  shortcutDuplicate: string;
  shortcutSelectAll: string;
  shortcutNudge: string;
  shortcutPan: string;
  shortcutZoom: string;
  shortcutSaveVersion: string;
  shortcutDeselect: string;

  // Canvas
  gridDots: string;
  gridLines: string;
  gridNone: string;
  snapToGrid: string;
  minimap: string;
  autoLayout: string;
  clearCanvas: string;
  clearConfirm: string;

  // Multi-page & Projects
  myProjects: string;
  allProjects: string;
  newProject: string;
  searchProjects: string;
  openProject: string;
  duplicateProject: string;
  deleteProject: string;
  deleteProjectConfirm: string;
  page: string;
  pages: string;
  addPage: string;
  renamePage: string;
  duplicatePage: string;
  deletePage: string;
  deletePageConfirm: string;
}

export const TRANSLATIONS: Record<'fa' | 'en', TranslationDictionary> = {
  fa: {
    appName: 'فلو‌کرفت',
    tagline: 'استودیوی مشارکتی طراحی فلوچارت',
    // Header
    untitledProject: 'پروژه فلوچارت جدید',
    cloudSaved: 'ذخیره در ابر',
    saving: 'در حال ذخیره‌سازی...',
    offline: 'حالت محلی',
    connectedTeammates: 'همکار آنلاین',
    collaborate: 'همکاری زنده',
    export: 'خروجی گرفتن',
    theme: 'تم رنگی',
    language: 'زبان / Language',
    shortcuts: 'کلیدهای میانبر',
    versionHistory: 'تاریخچه نسخه‌ها',
    undo: 'واگرد (Undo)',
    redo: 'از نو (Redo)',
    zoomIn: 'بزرگ‌نمایی',
    zoomOut: 'کوچک‌نمایی',
    resetZoom: 'اندازه اصلی ۱۰۰٪',
    fitScreen: 'جای‌گیری در صفحه',

    // Sidebar tools
    shapes: 'اشکال و نمادها',
    templates: 'قالب‌های آماده',
    history: 'نسخه‌ها و تغییرات',
    team: 'تیم و گفتگو',

    // Shapes
    shapeTerminal: 'شروع / پایان',
    shapeTerminalDesc: 'نقطه آغاز یا فرجام جریان',
    shapeProcess: 'فرآیند / عملیات',
    shapeProcessDesc: 'مرحله اجرایی، محاسبه یا اقدام',
    shapeDecision: 'تصمیم‌گیری / شرط',
    shapeDecisionDesc: 'انشعاب شرطی با پاسخ بله/خیر',
    shapeInputOutput: 'ورودی / خروجی',
    shapeInputOutputDesc: 'دریافت یا ارسال داده‌ها',
    shapeDocument: 'سند / گزارش',
    shapeDocumentDesc: 'سند متنی، فاکتور یا گزارش چاپی',
    shapeSubroutine: 'زیرفرآیند آماده',
    shapeSubroutineDesc: 'رویه مستقل یا تابع از پیش تعریف‌شده',
    shapeDatabase: 'پایگاه داده / دیتابیس',
    shapeDatabaseDesc: 'ذخیره یا واکشی اطلاعات',
    shapeConnector: 'اتصال‌دهنده',
    shapeConnectorDesc: 'نقطه پیوند یا پرش در نمودار',
    shapeNote: 'یادداشت / نکته',
    shapeNoteDesc: 'توضیحات و حاشیه‌نویسی',

    // Inspector
    properties: 'تنظیمات عنصر',
    noSelection: 'هیچ عنصری انتخاب نشده است',
    selectPrompt: 'روی یک شکل یا خط اتصال کلیک کنید تا خصوصیات آن را تغییر دهید.',
    text: 'متن برچسب',
    dimensions: 'ابعاد و موقعیت',
    colors: 'رنگ‌بندی و استایل',
    fillColor: 'رنگ پس‌زمینه',
    strokeColor: 'رنگ خط دور',
    textColor: 'رنگ متن',
    strokeWidth: 'ضخامت خط',
    strokeStyle: 'نوع خط',
    solid: 'یکدست',
    dashed: 'خط‌چین',
    dotted: 'نقطه‌چین',
    fontSize: 'اندازه قلم',
    bold: 'برجسته (Bold)',
    alignLeft: 'راست‌چین / چپ',
    alignCenter: 'وسط‌چین',
    alignRight: 'چپ‌چین / راست',
    deleteSelected: 'حذف عنصر',
    duplicate: 'تکثیر (Duplicate)',
    bringForward: 'انتقال به رو',
    sendBackward: 'انتقال به زیر',
    edgeLabel: 'متن شرط خط (مثلاً بله/خیر)',
    lineType: 'نوع خط اتصال',
    orthogonal: 'شکسته (پله‌ای)',
    curved: 'منحنی (بِزیه)',
    straight: 'مستقیم',

    // Templates
    templateAuth: 'احراز هویت و تأیید دو مرحله‌ای',
    templateAuthDesc: 'جریان ثبت‌نام، ورود کاربر، اعتبارسنجی رمز و پیامک تایید',
    templateOrder: 'پردازش سفارش فروشگاه آنلاین',
    templateOrderDesc: 'مراحل ثبت سبد، پرداخت درگاه، بسته‌بندی و تحویل به پست',
    templateSupport: 'چرخه تیکت پشتیبانی و حل مشکل',
    templateSupportDesc: 'دریافت گزارش خطا، اولویت‌بندی و ارجاع به کارشناس فنی',
    templateData: 'پایپ‌لاین پردازش داده‌ها',
    templateDataDesc: 'استخراج داده، پاک‌سازی، تحلیل هوش مصنوعی و ذخیره در دیتابیس',
    applyTemplate: 'بارگذاری این قالب',
    applyTemplateConfirm: 'با بارگذاری قالب جدید، اشکال فعلی جایگزین خواهند شد. آیا ادامه می‌دهید؟',

    // Versions
    versionsTitle: 'سیستم مدیریت نسخه',
    saveNewVersion: 'ثبت نسخه جدید (Snapshot)',
    versionNamePlaceholder: 'عنوان نسخه (مثلاً ویرایش نهایی تیم)',
    versionCreated: 'نسخه جدید با موفقیت ذخیره شد',
    restoreVersion: 'بازگردانی این نسخه',
    restoreConfirm: 'آیا می‌خواهید پروژه به وضعیت این نسخه بازگردانده شود؟',
    currentVersion: 'نسخه جاری فعال',
    initialVersion: 'نسخه اولیه خودکار',
    nodesCount: 'گره',
    edgesCount: 'اتصال',
    noVersionsYet: 'هنوز نسخه‌ای ثبت نشده است.',

    // Collaboration
    collaborationTitle: 'همکاری همزمان تیمی',
    yourName: 'نام شما در استودیو',
    roomCode: 'شناسه اتاق مشترک',
    copyLink: 'کپی پیوند دعوت',
    linkCopied: 'پیوند اشتراک‌گذاری کپی شد!',
    activeCollaborators: 'اعضای آنلاین در این پروژه',
    chatPlaceholder: 'ارسال پیام کوتاه یا یادداشت به تیم...',
    send: 'ارسال',
    you: 'شما',

    // Export
    exportTitle: 'خروجی گرفتن از فلوچارت',
    exportPng: 'تصویر باکیفیت (PNG)',
    exportPngDesc: 'تصویر رندر شده با رزولوشن بالا برای ارائه و وب',
    exportSvg: 'فایل برداری (SVG)',
    exportSvgDesc: 'فایل وکتور مقیاس‌پذیر با کیفیت نامحدود',
    exportHtml: 'فایل وب تعاملی (HTML)',
    exportHtmlDesc: 'صفحه وب مستقل با زوم، جابجایی و جدول خلاصه فرآیند',
    exportPdf: 'سند قابل چاپ (PDF)',
    exportPdfDesc: 'خروجی استاندارد PDF با صفحه مناسب برای گزارش و چاپ',
    exportJson: 'فایل پشتیبان داده (JSON)',
    exportJsonDesc: 'فایل خام پروژه برای انتقال یا بازگردانی بعدی',
    exportSuccess: 'فایل با موفقیت صادر و دانلود شد.',

    // Shortcuts
    shortcutsTitle: 'راهنمای میانبرهای کیبورد',
    shortcutUndo: 'واگرد آخرین تغییر',
    shortcutRedo: 'تکرار تغییر واگرد شده',
    shortcutDelete: 'حذف گره یا خط انتخاب شده',
    shortcutCopy: 'کپی کردن گره انتخاب شده',
    shortcutPaste: 'چسباندن گره کپی شده',
    shortcutDuplicate: 'تکثیر سریع شکل انتخابی',
    shortcutSelectAll: 'انتخاب همه اشکال',
    shortcutNudge: 'جابجایی ظریف گره با کلیدهای جهت‌نما',
    shortcutPan: 'جابجایی نرم صفحه با کشیدن ماوس',
    shortcutZoom: 'بزرگ‌نمایی و کوچک‌نمایی صفحه',
    shortcutSaveVersion: 'ثبت سریع نسخه جدید در ابر',
    shortcutDeselect: 'لغو انتخاب یا بستن پنجره',

    // Canvas
    gridDots: 'نقاط راهنما',
    gridLines: 'خطوط شطرنجی',
    gridNone: 'صفحه خالی',
    snapToGrid: 'چسبیدن به شبکه',
    minimap: 'نقشه کوچک (Minimap)',
    autoLayout: 'چیدمان خودکار',
    clearCanvas: 'پاکسازی کل صفحه',
    clearConfirm: 'آیا از پاکسازی تمام اشکال و اتصالات اطمینان دارید؟',

    // Multi-page & Projects
    myProjects: 'پروژه‌های من',
    allProjects: 'همه پروژه‌ها',
    newProject: 'پروژه جدید',
    searchProjects: 'جستجو در پروژه‌ها...',
    openProject: 'باز کردن پروژه',
    duplicateProject: 'تکثیر (کپی)',
    deleteProject: 'حذف پروژه',
    deleteProjectConfirm: 'آیا از حذف این پروژه مطمئن هستید؟ این عملیات قابل بازگشت نیست.',
    page: 'صفحه',
    pages: 'صفحات فلوچارت',
    addPage: 'افزودن صفحه جدید',
    renamePage: 'تغییر نام صفحه',
    duplicatePage: 'تکثیر صفحه',
    deletePage: 'حذف صفحه',
    deletePageConfirm: 'آیا از حذف این صفحه مطمئن هستید؟',
  },
  en: {
    appName: 'FlowCraft',
    tagline: 'Collaborative Flowchart Studio',
    // Header
    untitledProject: 'Untitled Flowchart',
    cloudSaved: 'Cloud Synced',
    saving: 'Saving to Cloud...',
    offline: 'Local Mode',
    connectedTeammates: 'Collaborators Online',
    collaborate: 'Live Team',
    export: 'Export',
    theme: 'Color Theme',
    language: 'Language / زبان',
    shortcuts: 'Shortcuts',
    versionHistory: 'Version History',
    undo: 'Undo',
    redo: 'Redo',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Reset 100%',
    fitScreen: 'Fit to Screen',

    // Sidebar tools
    shapes: 'Shapes & Nodes',
    templates: 'Templates',
    history: 'History & Versions',
    team: 'Team & Activity',

    // Shapes
    shapeTerminal: 'Start / End',
    shapeTerminalDesc: 'Flow boundary terminal',
    shapeProcess: 'Process Action',
    shapeProcessDesc: 'Execution step or calculation',
    shapeDecision: 'Decision / Branch',
    shapeDecisionDesc: 'Conditional branch (Yes / No)',
    shapeInputOutput: 'Input / Output',
    shapeInputOutputDesc: 'Data receipt or generation',
    shapeDocument: 'Document Report',
    shapeDocumentDesc: 'Printed document or report',
    shapeSubroutine: 'Predefined Subroutine',
    shapeSubroutineDesc: 'External subroutine procedure',
    shapeDatabase: 'Database Storage',
    shapeDatabaseDesc: 'Data storage or query',
    shapeConnector: 'Flow Connector',
    shapeConnectorDesc: 'Jump reference connector',
    shapeNote: 'Sticky Note',
    shapeNoteDesc: 'Annotation and comment',

    // Inspector
    properties: 'Element Inspector',
    noSelection: 'No Element Selected',
    selectPrompt: 'Click any node or connection line to customize its geometry, colors and labels.',
    text: 'Label Text',
    dimensions: 'Size & Position',
    colors: 'Theme Palette',
    fillColor: 'Fill Color',
    strokeColor: 'Stroke Color',
    textColor: 'Text Color',
    strokeWidth: 'Stroke Width',
    strokeStyle: 'Line Style',
    solid: 'Solid',
    dashed: 'Dashed',
    dotted: 'Dotted',
    fontSize: 'Font Size',
    bold: 'Bold Weight',
    alignLeft: 'Align Left',
    alignCenter: 'Align Center',
    alignRight: 'Align Right',
    deleteSelected: 'Delete Selected',
    duplicate: 'Duplicate',
    bringForward: 'Bring Forward',
    sendBackward: 'Send Backward',
    edgeLabel: 'Condition Label (e.g. Yes / No)',
    lineType: 'Routing Style',
    orthogonal: 'Orthogonal (Stepped)',
    curved: 'Curved (Bezier)',
    straight: 'Straight Line',

    // Templates
    templateAuth: 'User Auth & 2FA Flow',
    templateAuthDesc: 'Sign-up, login, credentials check, and SMS verification',
    templateOrder: 'E-Commerce Order Fulfillment',
    templateOrderDesc: 'Cart checkout, payment gateway, inventory, and shipment',
    templateSupport: 'Support Ticket Escalation',
    templateSupportDesc: 'Incident reporting, severity triage, and engineering handoff',
    templateData: 'Data Ingestion Pipeline',
    templateDataDesc: 'ETL ingestion, schema validation, AI analysis, and warehouse commit',
    applyTemplate: 'Load This Template',
    applyTemplateConfirm: 'Loading this template will replace the current flowchart. Continue?',

    // Versions
    versionsTitle: 'Version Control System',
    saveNewVersion: 'Create Version Snapshot',
    versionNamePlaceholder: 'Version title (e.g. Team Approved v1.0)',
    versionCreated: 'Version snapshot created successfully',
    restoreVersion: 'Restore Version',
    restoreConfirm: 'Are you sure you want to restore the canvas to this snapshot?',
    currentVersion: 'Current Live State',
    initialVersion: 'Auto Initial Snapshot',
    nodesCount: 'nodes',
    edgesCount: 'connections',
    noVersionsYet: 'No previous versions recorded yet.',

    // Collaboration
    collaborationTitle: 'Real-Time Collaboration',
    yourName: 'Your Name',
    roomCode: 'Room Identifier',
    copyLink: 'Copy Invite Link',
    linkCopied: 'Shareable link copied to clipboard!',
    activeCollaborators: 'Active Collaborators',
    chatPlaceholder: 'Send a quick update or note to the team...',
    send: 'Send',
    you: 'You',

    // Export
    exportTitle: 'Export Flowchart',
    exportPng: 'High-Res PNG',
    exportPngDesc: 'Rasterized image with transparency or background',
    exportSvg: 'Scalable Vector (SVG)',
    exportSvgDesc: 'Crisp vector graphic for publishing and printing',
    exportHtml: 'Standalone Interactive HTML',
    exportHtmlDesc: 'Self-contained webpage with embedded interactive diagram viewer',
    exportPdf: 'Print-Ready PDF Document',
    exportPdfDesc: 'Formatted PDF layout with header and centered diagram',
    exportJson: 'Backup Project (JSON)',
    exportJsonDesc: 'Raw project data file for importing later',
    exportSuccess: 'Export generated and downloaded successfully.',

    // Shortcuts
    shortcutsTitle: 'Keyboard Shortcuts Cheat Sheet',
    shortcutUndo: 'Undo previous modification',
    shortcutRedo: 'Redo undone action',
    shortcutDelete: 'Delete selected node(s) or edge(s)',
    shortcutCopy: 'Copy selected node to clipboard',
    shortcutPaste: 'Paste copied node at cursor',
    shortcutDuplicate: 'Quick duplicate selected node',
    shortcutSelectAll: 'Select all nodes on canvas',
    shortcutNudge: 'Nudge node position (Shift for 10px)',
    shortcutPan: 'Smooth pan canvas',
    shortcutZoom: 'Zoom in and out',
    shortcutSaveVersion: 'Save cloud version snapshot',
    shortcutDeselect: 'Deselect or close active modal',

    // Canvas
    gridDots: 'Dot Grid',
    gridLines: 'Mesh Grid',
    gridNone: 'Blank Canvas',
    snapToGrid: 'Snap to Grid',
    minimap: 'Minimap Radar',
    autoLayout: 'Auto Layout',
    clearCanvas: 'Clear Canvas',
    clearConfirm: 'Are you sure you want to clear all nodes and connections?',

    // Multi-page & Projects
    myProjects: 'My Projects',
    allProjects: 'All Projects',
    newProject: 'New Project',
    searchProjects: 'Search projects...',
    openProject: 'Open Project',
    duplicateProject: 'Duplicate',
    deleteProject: 'Delete Project',
    deleteProjectConfirm: 'Are you sure you want to delete this project? This cannot be undone.',
    page: 'Page',
    pages: 'Diagram Pages',
    addPage: 'Add New Page',
    renamePage: 'Rename Page',
    duplicatePage: 'Duplicate Page',
    deletePage: 'Delete Page',
    deletePageConfirm: 'Are you sure you want to delete this page?',
  },
};
