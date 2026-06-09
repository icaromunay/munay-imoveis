
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  emailVerified: 'emailVerified',
  image: 'image',
  passwordHash: 'passwordHash',
  whatsapp: 'whatsapp',
  cpf: 'cpf',
  address: 'address',
  role: 'role',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires'
};

exports.Prisma.PasswordResetTokenScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  token: 'token',
  expiresAt: 'expiresAt',
  used: 'used',
  createdAt: 'createdAt'
};

exports.Prisma.PropertyScalarFieldEnum = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  shortDescription: 'shortDescription',
  fullDescription: 'fullDescription',
  price: 'price',
  promotionalPrice: 'promotionalPrice',
  status: 'status',
  propertyCode: 'propertyCode',
  area: 'area',
  landArea: 'landArea',
  builtArea: 'builtArea',
  bedrooms: 'bedrooms',
  bathrooms: 'bathrooms',
  suites: 'suites',
  garage: 'garage',
  floor: 'floor',
  hasElevator: 'hasElevator',
  solarPosition: 'solarPosition',
  hasEdicule: 'hasEdicule',
  ediculeArea: 'ediculeArea',
  ediculeBedrooms: 'ediculeBedrooms',
  ediculeBathrooms: 'ediculeBathrooms',
  ediculeHasLivingRoom: 'ediculeHasLivingRoom',
  ediculeHasKitchen: 'ediculeHasKitchen',
  acceptsBankFinancing: 'acceptsBankFinancing',
  acceptsFgts: 'acceptsFgts',
  acceptsCar: 'acceptsCar',
  acceptsExchange: 'acceptsExchange',
  acceptsProposal: 'acceptsProposal',
  acceptsDirectInstallments: 'acceptsDirectInstallments',
  maxDirectInstallments: 'maxDirectInstallments',
  constructionYear: 'constructionYear',
  landFrontage: 'landFrontage',
  landDepthLeft: 'landDepthLeft',
  landDepthRight: 'landDepthRight',
  hasPaving: 'hasPaving',
  hasElectricity: 'hasElectricity',
  hasWaterNetwork: 'hasWaterNetwork',
  city: 'city',
  district: 'district',
  state: 'state',
  category: 'category',
  type: 'type',
  lotsMinArea: 'lotsMinArea',
  lotsMaxArea: 'lotsMaxArea',
  lotsQuantity: 'lotsQuantity',
  developmentInfrastructure: 'developmentInfrastructure',
  developmentHasPaving: 'developmentHasPaving',
  developmentHasElectricity: 'developmentHasElectricity',
  developmentHasWaterNetwork: 'developmentHasWaterNetwork',
  readyToBuild: 'readyToBuild',
  hasDevelopmentInstallments: 'hasDevelopmentInstallments',
  developmentMaxInstallments: 'developmentMaxInstallments',
  featured: 'featured',
  launch: 'launch',
  approved: 'approved',
  reviewStatus: 'reviewStatus',
  submittedByOwner: 'submittedByOwner',
  ownerName: 'ownerName',
  ownerPhone: 'ownerPhone',
  ownerEmail: 'ownerEmail',
  googleMapsLink: 'googleMapsLink',
  latitude: 'latitude',
  longitude: 'longitude',
  youtubeLink: 'youtubeLink',
  coverImage: 'coverImage',
  pdfTableUrl: 'pdfTableUrl',
  pdfProjectUrl: 'pdfProjectUrl',
  viewCount: 'viewCount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PropertyImageScalarFieldEnum = {
  id: 'id',
  propertyId: 'propertyId',
  url: 'url',
  alt: 'alt',
  sortOrder: 'sortOrder'
};

exports.Prisma.PropertyViewScalarFieldEnum = {
  id: 'id',
  propertyId: 'propertyId',
  visitorKey: 'visitorKey',
  createdAt: 'createdAt'
};

exports.Prisma.PostScalarFieldEnum = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  excerpt: 'excerpt',
  content: 'content',
  coverImage: 'coverImage',
  category: 'category',
  author: 'author',
  published: 'published',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TestimonialScalarFieldEnum = {
  id: 'id',
  name: 'name',
  photoUrl: 'photoUrl',
  text: 'text',
  rating: 'rating',
  youtubeVideo: 'youtubeVideo',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeadScalarFieldEnum = {
  id: 'id',
  name: 'name',
  phone: 'phone',
  email: 'email',
  message: 'message',
  source: 'source',
  pageOrigin: 'pageOrigin',
  propertyId: 'propertyId',
  propertyCode: 'propertyCode',
  propertyTitle: 'propertyTitle',
  propertyCity: 'propertyCity',
  interest: 'interest',
  status: 'status',
  assignedTo: 'assignedTo',
  internalNote: 'internalNote',
  nextContactAt: 'nextContactAt',
  consent: 'consent',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BlogAutomationSettingsScalarFieldEnum = {
  id: 'id',
  enabled: 'enabled',
  provider: 'provider',
  apiKey: 'apiKey',
  publishTime: 'publishTime',
  articlesPerDay: 'articlesPerDay',
  defaultAuthor: 'defaultAuthor',
  defaultCategory: 'defaultCategory',
  autoPublish: 'autoPublish',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BlogArticleQueueScalarFieldEnum = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  content: 'content',
  excerpt: 'excerpt',
  seoTitle: 'seoTitle',
  seoDescription: 'seoDescription',
  category: 'category',
  tags: 'tags',
  status: 'status',
  scheduledAt: 'scheduledAt',
  publishedAt: 'publishedAt',
  createdAt: 'createdAt'
};

exports.Prisma.SiteSettingScalarFieldEnum = {
  id: 'id',
  brandName: 'brandName',
  primaryColor: 'primaryColor',
  secondaryColor: 'secondaryColor',
  accentColor: 'accentColor',
  heroTitle: 'heroTitle',
  heroSubtitle: 'heroSubtitle',
  heroVideoUrl: 'heroVideoUrl',
  homeVideoStatus: 'homeVideoStatus',
  homeVideoUrl: 'homeVideoUrl',
  homeVideoTitle: 'homeVideoTitle',
  homeVideoDescription: 'homeVideoDescription',
  homeVideoThumbnailUrl: 'homeVideoThumbnailUrl',
  homeVideoOrder: 'homeVideoOrder',
  homeVideoAutoplay: 'homeVideoAutoplay',
  homeVideoMaskEnabled: 'homeVideoMaskEnabled',
  whatsappNumber: 'whatsappNumber',
  creci: 'creci',
  cnpj: 'cnpj',
  address: 'address',
  phone: 'phone',
  instagram: 'instagram',
  privacyUrl: 'privacyUrl',
  smtpSenderName: 'smtpSenderName',
  smtpSenderEmail: 'smtpSenderEmail',
  smtpHost: 'smtpHost',
  smtpPort: 'smtpPort',
  smtpEncryption: 'smtpEncryption',
  smtpUsername: 'smtpUsername',
  smtpPasswordEncrypted: 'smtpPasswordEncrypted',
  smtpTimeout: 'smtpTimeout',
  smtpPasswordUpdatedAt: 'smtpPasswordUpdatedAt',
  googleTagManagerId: 'googleTagManagerId',
  ga4MeasurementId: 'ga4MeasurementId',
  googleSiteVerification: 'googleSiteVerification',
  metaPixelId: 'metaPixelId',
  metaDomainVerification: 'metaDomainVerification',
  microsoftClarityId: 'microsoftClarityId',
  bingSiteVerification: 'bingSiteVerification',
  tiktokPixelId: 'tiktokPixelId',
  linkedInPartnerId: 'linkedInPartnerId',
  pinterestTagId: 'pinterestTagId',
  customHeadCode: 'customHeadCode',
  customBodyCode: 'customBodyCode',
  customFooterCode: 'customFooterCode',
  indexNowKey: 'indexNowKey',
  activeThemeLayoutId: 'activeThemeLayoutId',
  previousThemeLayoutId: 'previousThemeLayoutId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmailTemplateScalarFieldEnum = {
  id: 'id',
  slug: 'slug',
  name: 'name',
  subject: 'subject',
  htmlBody: 'htmlBody',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ThemeLayoutScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  isActive: 'isActive',
  isDefault: 'isDefault',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ThemeLayoutBlockScalarFieldEnum = {
  id: 'id',
  themeLayoutId: 'themeLayoutId',
  blockKey: 'blockKey',
  blockName: 'blockName',
  settingsJson: 'settingsJson',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ThemeLayoutActivationHistoryScalarFieldEnum = {
  id: 'id',
  themeLayoutId: 'themeLayoutId',
  layoutNameSnapshot: 'layoutNameSnapshot',
  action: 'action',
  activatedAt: 'activatedAt',
  createdAt: 'createdAt'
};

exports.Prisma.RedirectScalarFieldEnum = {
  id: 'id',
  sourcePath: 'sourcePath',
  destination: 'destination',
  type: 'type',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HomeAnalyticsDailyScalarFieldEnum = {
  id: 'id',
  date: 'date',
  homeVisits: 'homeVisits',
  homeVideoPlays: 'homeVideoPlays',
  watched25: 'watched25',
  watched50: 'watched50',
  watched75: 'watched75',
  watched100: 'watched100',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HomeAnalyticsVisitorDayScalarFieldEnum = {
  id: 'id',
  visitorKey: 'visitorKey',
  date: 'date',
  visited: 'visited',
  videoPlayTracked: 'videoPlayTracked',
  watched25Tracked: 'watched25Tracked',
  watched50Tracked: 'watched50Tracked',
  watched75Tracked: 'watched75Tracked',
  watched100Tracked: 'watched100Tracked',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PropertyAnalyticsDailyScalarFieldEnum = {
  id: 'id',
  propertyId: 'propertyId',
  date: 'date',
  propertyViews: 'propertyViews',
  whatsappClicks: 'whatsappClicks',
  scheduleVisitClicks: 'scheduleVisitClicks',
  lastViewedAt: 'lastViewedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PropertyAnalyticsVisitorDayScalarFieldEnum = {
  id: 'id',
  propertyId: 'propertyId',
  visitorKey: 'visitorKey',
  date: 'date',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.Role = exports.$Enums.Role = {
  ADMIN: 'ADMIN',
  USER: 'USER'
};

exports.PropertyStatus = exports.$Enums.PropertyStatus = {
  AVAILABLE: 'AVAILABLE',
  SOLD: 'SOLD',
  RESERVED: 'RESERVED',
  LAUNCH: 'LAUNCH'
};

exports.PropertyCategory = exports.$Enums.PropertyCategory = {
  LOTEAMENTO: 'LOTEAMENTO',
  TERRENO: 'TERRENO',
  CASA: 'CASA',
  APARTAMENTO: 'APARTAMENTO',
  COMERCIAL: 'COMERCIAL',
  RURAL: 'RURAL'
};

exports.PropertyReviewStatus = exports.$Enums.PropertyReviewStatus = {
  APPROVED: 'APPROVED',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED'
};

exports.LeadStatus = exports.$Enums.LeadStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  WAITING_RETURN: 'WAITING_RETURN',
  VISITED_PROPERTY: 'VISITED_PROPERTY',
  PROPOSAL_SENT: 'PROPOSAL_SENT',
  NEGOTIATION: 'NEGOTIATION',
  CLOSED: 'CLOSED',
  LOST: 'LOST'
};

exports.BlogArticleQueueStatus = exports.$Enums.BlogArticleQueueStatus = {
  PENDING: 'PENDING',
  GENERATED: 'GENERATED',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED'
};

exports.SmtpEncryption = exports.$Enums.SmtpEncryption = {
  SSL: 'SSL',
  TLS: 'TLS',
  NONE: 'NONE'
};

exports.Prisma.ModelName = {
  User: 'User',
  Account: 'Account',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  PasswordResetToken: 'PasswordResetToken',
  Property: 'Property',
  PropertyImage: 'PropertyImage',
  PropertyView: 'PropertyView',
  Post: 'Post',
  Testimonial: 'Testimonial',
  Lead: 'Lead',
  BlogAutomationSettings: 'BlogAutomationSettings',
  BlogArticleQueue: 'BlogArticleQueue',
  SiteSetting: 'SiteSetting',
  EmailTemplate: 'EmailTemplate',
  ThemeLayout: 'ThemeLayout',
  ThemeLayoutBlock: 'ThemeLayoutBlock',
  ThemeLayoutActivationHistory: 'ThemeLayoutActivationHistory',
  Redirect: 'Redirect',
  HomeAnalyticsDaily: 'HomeAnalyticsDaily',
  HomeAnalyticsVisitorDay: 'HomeAnalyticsVisitorDay',
  PropertyAnalyticsDaily: 'PropertyAnalyticsDaily',
  PropertyAnalyticsVisitorDay: 'PropertyAnalyticsVisitorDay'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
