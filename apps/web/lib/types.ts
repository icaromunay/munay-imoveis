export type Property = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  price: number | string;
  promotionalPrice?: number | string | null;
  status: 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'LAUNCH';
  propertyCode: string;
  area: number;
  landArea?: number | null;
  builtArea?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  suites?: number | null;
  garage?: number | null;
  floor?: number | null;
  hasElevator?: boolean;
  solarPosition?: string | null;
  hasEdicule?: boolean;
  ediculeArea?: number | null;
  ediculeBedrooms?: number | null;
  ediculeBathrooms?: number | null;
  ediculeHasLivingRoom?: boolean;
  ediculeHasKitchen?: boolean;
  acceptsBankFinancing?: boolean;
  acceptsFgts?: boolean;
  acceptsCar?: boolean;
  acceptsExchange?: boolean;
  acceptsProposal?: boolean;
  acceptsDirectInstallments?: boolean;
  maxDirectInstallments?: number | null;
  constructionYear?: number | null;
  landFrontage?: number | null;
  landDepthLeft?: number | null;
  landDepthRight?: number | null;
  hasPaving?: boolean;
  hasElectricity?: boolean;
  hasWaterNetwork?: boolean;
  lotsMinArea?: number | null;
  lotsMaxArea?: number | null;
  lotsQuantity?: number | null;
  developmentInfrastructure?: string | null;
  developmentHasPaving?: boolean;
  developmentHasElectricity?: boolean;
  developmentHasWaterNetwork?: boolean;
  readyToBuild?: boolean;
  hasDevelopmentInstallments?: boolean;
  developmentMaxInstallments?: number | null;
  city: string;
  district: string;
  state: string;
  category: 'LOTEAMENTO' | 'TERRENO' | 'CASA' | 'APARTAMENTO' | 'COMERCIAL' | 'RURAL';
  type: string;
  featured: boolean;
  launch?: boolean;
  approved?: boolean;
  reviewStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  submittedByOwner?: boolean;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  googleMapsLink?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  youtubeLink?: string | null;
  coverImage: string;
  pdfTableUrl?: string | null;
  pdfProjectUrl?: string | null;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
  related?: Property[];
  images: { id?: string; url: string; alt?: string | null; sortOrder?: number }[];
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BlogAutomationSettings = {
  id: string;
  enabled: boolean;
  provider: 'OPENAI' | 'GEMINI' | 'CLAUDE' | 'DEEPSEEK' | 'CUSTOM';
  apiKey?: string | null;
  publishTime: string;
  articlesPerDay: number;
  defaultAuthor: string;
  defaultCategory: string;
  autoPublish: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BlogArticleQueueStatus = 'PENDING' | 'GENERATED' | 'PUBLISHED' | 'FAILED';

export type BlogArticleQueue = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  category: string;
  tags: string[];
  status: BlogArticleQueueStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
};

export type Testimonial = {
  id: string;
  name: string;
  photoUrl: string;
  text: string;
  rating: number;
  youtubeVideo?: string | null;
};

export type ThemeBlockSettings = {
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  accent: string;
  buttonPrimary: string;
  buttonSecondary: string;
  shadow: 'none' | 'soft' | 'medium' | 'strong' | 'glow';
  radius: 'md' | 'lg' | 'xl' | '2xl' | 'pill';
  hoverEffect: 'none' | 'lift' | 'glow' | 'underline' | 'scale';
  height: 'compact' | 'comfortable' | 'tall';
};

export type ThemeLayoutBlock = {
  id: string;
  themeLayoutId?: string;
  blockKey: string;
  blockName: string;
  settingsJson: ThemeBlockSettings;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ThemeLayout = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
  blocks: ThemeLayoutBlock[];
  blockMap?: Record<string, ThemeBlockSettings>;
  warnings?: string[];
  contrastOk?: boolean;
};

export type ThemeLayoutActivationHistory = {
  id: string;
  themeLayoutId: string;
  layoutNameSnapshot: string;
  action: 'ACTIVATE' | 'RESTORE_PREVIOUS' | 'RESTORE_HISTORY' | 'INITIAL_SEED' | 'RECOVERY' | string;
  activatedAt: string;
  createdAt?: string;
  themeLayout?: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    isDefault: boolean;
  };
};

export type PropertyLocationGroup = {
  city: string;
  total: number;
  districts: { district: string; total: number }[];
};

export type SiteSettings = {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  heroTitle: string;
  heroSubtitle: string;
  heroVideoUrl: string;
  homeVideoStatus: 'ACTIVE' | 'INACTIVE';
  homeVideoUrl?: string | null;
  homeVideoTitle?: string | null;
  homeVideoDescription?: string | null;
  homeVideoThumbnailUrl?: string | null;
  homeVideoOrder?: number;
  homeVideoAutoplay?: boolean;
  homeVideoMaskEnabled?: boolean;
  whatsappNumber: string;
  creci: string;
  cnpj: string;
  address: string;
  phone: string;
  instagram: string;
  privacyUrl: string;
  googleTagManagerId?: string | null;
  ga4MeasurementId?: string | null;
  googleSiteVerification?: string | null;
  metaPixelId?: string | null;
  metaDomainVerification?: string | null;
  microsoftClarityId?: string | null;
  bingSiteVerification?: string | null;
  tiktokPixelId?: string | null;
  linkedInPartnerId?: string | null;
  pinterestTagId?: string | null;
  customHeadCode?: string | null;
  customBodyCode?: string | null;
  customFooterCode?: string | null;
  indexNowKey?: string | null;
  activeThemeLayoutId?: string | null;
  previousThemeLayoutId?: string | null;
};

export type TrafficSettings = Pick<
  SiteSettings,
  | 'googleTagManagerId'
  | 'ga4MeasurementId'
  | 'googleSiteVerification'
  | 'metaPixelId'
  | 'metaDomainVerification'
  | 'microsoftClarityId'
  | 'bingSiteVerification'
  | 'tiktokPixelId'
  | 'linkedInPartnerId'
  | 'pinterestTagId'
  | 'customHeadCode'
  | 'customBodyCode'
  | 'customFooterCode'
  | 'indexNowKey'
>;

export type RedirectItem = {
  id: string;
  sourcePath: string;
  destination: string;
  type: 301 | 302;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  source?: string | null;
  pageOrigin?: string | null;
  propertyCode?: string | null;
  propertyTitle?: string | null;
  propertyCity?: string | null;
  interest?: string | null;
  status: 'NEW' | 'CONTACTED' | 'WAITING_RETURN' | 'VISITED_PROPERTY' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'CLOSED' | 'LOST';
  assignedTo?: string | null;
  internalNote?: string | null;
  nextContactAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  property?: Property | null;
};

export type OwnerUser = {
  id: string;
  name: string;
  email: string;
  picture?: string | null;
  role: 'OWNER';
};

export type OwnerSession = {
  token: string;
  user: OwnerUser;
};

export type DashboardRecentProperty = {
  id: string;
  title: string;
  slug?: string;
  propertyCode: string;
  city: string;
  district: string;
  createdAt: string;
  featured: boolean;
  launch: boolean;
  approved: boolean;
  reviewStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  submittedByOwner?: boolean;
  ownerName?: string | null;
  viewCount?: number;
};

export type DashboardRecentLead = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  propertyCode?: string | null;
  propertyTitle?: string | null;
  propertyCity?: string | null;
  pageOrigin?: string | null;
  createdAt: string;
  status: 'NEW' | 'CONTACTED' | 'WAITING_RETURN' | 'VISITED_PROPERTY' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'CLOSED' | 'LOST';
};

export type DashboardRecentAccess = {
  id: string;
  visitorKey: string;
  createdAt: string;
  property: {
    id: string;
    slug: string;
    title: string;
    propertyCode: string;
    city: string;
    district: string;
  };
};

export type DashboardTopViewedProperty = {
  id: string;
  slug: string;
  title: string;
  propertyCode: string;
  city: string;
  district: string;
  viewCount: number;
  createdAt: string;
};

export type DashboardData = {
  properties: number;
  developments: number;
  owners: number;
  posts: number;
  testimonials: number;
  leads: number;
  featured: number;
  launches: number;
  pendingApproval: number;
  totalViews: number;
  last7dViews: number;
  last30dViews: number;
  mostViewedProperty?: DashboardTopViewedProperty | null;
  topViewedProperties: DashboardTopViewedProperty[];
  recentProperties: DashboardRecentProperty[];
  recentLeads: DashboardRecentLead[];
  recentAccesses: DashboardRecentAccess[];
};

export type ViewsSummary = {
  homeVisitsToday: number;
  homeVisitsLast7Days: number;
  homeVisitsLast30Days: number;
  homeVisitsTotal: number;
  homeVideoPlays: number;
  watched25: number;
  watched50: number;
  watched75: number;
  watched100: number;
  whatsappClicks: number;
  scheduleVisitClicks: number;
};

export type ViewsTopViewedItem = {
  position: number;
  title: string;
  propertyCode: string;
  views: number;
  slug: string;
};

export type ViewsTopContactsItem = {
  title: string;
  propertyCode: string;
  whatsappClicks: number;
  scheduleVisitClicks: number;
  totalConversions: number;
  slug: string;
};

export type ViewsPropertyStat = {
  id: string;
  title: string;
  slug: string;
  propertyCode: string;
  coverImage: string;
  city: string;
  district: string;
  totalViews: number;
  periodViews: number;
  whatsappClicks: number;
  scheduleVisitClicks: number;
  totalConversions: number;
  conversionRate: number;
  lastViewedAt: string | null;
  createdAt: string;
};

export type ViewsCharts = {
  labels: string[];
  homeVisits: number[];
  videoPlays: number[];
  whatsappClicks: number[];
  scheduleVisitClicks: number[];
};

export type ViewsDashboardData = {
  selectedRange: {
    range: 'today' | '7d' | '30d' | '90d' | 'custom';
    startDate: string;
    endDate: string;
  };
  summary: ViewsSummary;
  topViewed: ViewsTopViewedItem[];
  topContacts: ViewsTopContactsItem[];
  propertyStats: ViewsPropertyStat[];
  charts: ViewsCharts;
};
