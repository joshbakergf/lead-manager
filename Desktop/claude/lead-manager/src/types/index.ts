export type PageType = 
  | 'welcome' 
  | 'form'
  | 'ending';

export type FieldType = 
  | 'short-text' 
  | 'long-text' 
  | 'multiple-choice' 
  | 'checkbox' 
  | 'dropdown' 
  | 'email' 
  | 'phone' 
  | 'rating'
  | 'number'
  | 'date'
  | 'time'
  | 'url'
  | 'file-upload'
  | 'enhanced-address'
  | 'credit-card'
  | 'cvv'
  | 'expiry-date'
  | 'card-type'
  | 'content-block';

export interface Choice {
  id: string;
  text: string;
}

export interface FormField {
  id: string; // Auto-generated unique ID for internal use
  apiName: string; // Customizable name for API/database
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  choices?: Choice[];
  options?: Choice[]; // Alternative to choices for dropdown/multiple-choice fields
  multiSelect?: boolean;
  minRating?: number;
  maxRating?: number;
  ratingType?: 'stars' | 'numbers' | 'emoji';
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  fileTypes?: string[];
  maxFileSize?: number;
  helpText?: string;
  defaultValue?: string;
  // Enhanced address field properties
  zillowConnectionId?: string;
  autoPopulateFields?: { [key: string]: string }; // Map of property field to form field ID
  showPropertyPreview?: boolean;
  // Payment field properties  
  paymentType?: 'credit' | 'debit' | 'ach' | 'apple-pay' | 'google-pay';
  merchantConfig?: {
    merchantId?: string;
    enableApplePay?: boolean;
    enableGooglePay?: boolean;
    enableACH?: boolean;
  };
  paymentAmount?: number;
  paymentCurrency?: string;
  // Content block properties
  contentValue?: string; // Lexical editor state as JSON string
}

export interface LogicRule {
  condition: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'any';
  value: string;
  nextPageId: string;
}

export interface FormPage {
  id: string;
  type: PageType;
  title: string;
  content: string;
  visible?: boolean; // Whether the page is visible in the workflow (default: true)
  fields?: FormField[];
  // Legacy support for single-field pages
  question?: string;
  choices?: Choice[];
  placeholder?: string;
  required?: boolean;
  multiSelect?: boolean;
  minRating?: number;
  maxRating?: number;
  ratingType?: 'stars' | 'numbers' | 'emoji';
  logicRules?: LogicRule[];
}

export interface WorkflowPosition {
  x: number;
  y: number;
}

export interface ConnectionPoint {
  pageId: string;
  side: 'top' | 'right' | 'bottom' | 'left';
  x: number;
  y: number;
}

export interface Connection {
  from: { pageId: string; side: 'top' | 'right' | 'bottom' | 'left' };
  to: { pageId: string; side: 'top' | 'right' | 'bottom' | 'left' };
}

export interface WorkflowNode {
  id: string;
  position: { x: number; y: number };
  data: {
    page: FormPage;
    pageNumber: number;
  };
  type: 'formPage';
}

export interface FieldMapping {
  fieldId: string;
  fieldLabel: string;
  apiName: string;
  webhookKey: string; // The key to use in the webhook payload
  enabled: boolean;
}

export interface WebhookConnection {
  id: string;
  name: string;
  baseUrl: string;
  authenticationKey: string;
  authenticationToken: string;
  fieldMappings: FieldMapping[];
  createdAt: string;
  isActive: boolean;
}

export interface PublishedScript {
  id: string;
  name: string;
  description: string;
  pages: FormPage[];
  webhookConnections: WebhookConnection[];
  publishedAt: string;
  lastUpdated: string;
  isActive: boolean;
  accessUrl: string;
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    logo?: string;
  };
  settings: {
    showProgress: boolean;
    allowBack: boolean;
    autoAdvance: boolean;
    collectAnalytics: boolean;
  };
}

export interface FormSubmission {
  id: string;
  scriptId: string;
  scriptName: string;
  submittedAt: string;
  data: Record<string, any>;
  userAgent: string;
  timestamp: number;
  assignedTo?: string; // User ID who captured the lead
  assignedToName?: string; // User display name
}

export interface WebhookTrigger {
  id: string;
  name: string;
  connectionId: string; // References existing WebhookConnection
  triggerType: 'on_entry' | 'on_exit' | 'conditional';
  condition?: LogicRule; // Only used for conditional triggers
  isActive: boolean;
  position?: { x: number; y: number };
}

export interface ZillowConnection {
  id: string;
  name: string;
  apiKey: string;
  apiProvider: 'rapidapi' | 'custom';
  apiUrl: string;
  rateLimit: number; // requests per month
  isActive: boolean;
  createdAt: string;
}

export interface PropertyData {
  zpid?: string; // Zillow Property ID
  address: string;
  city: string;
  state: string;
  zipCode: string;
  sqft?: number;
  lotSize?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  propertyType?: string;
  zestimate?: number;
  rentEstimate?: number;
  taxAssessedValue?: number;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
}

export interface EnhancedAddressValue {
  address: string;
  propertyData?: PropertyData;
  manualOverride?: boolean;
}

// User Management Types
export type Permission = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'export' | 'manage';

export interface ModulePermissions {
  moduleId: string;
  moduleName: string;
  permissions: Permission[];
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean; // System roles can't be deleted
  modulePermissions: ModulePermissions[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  roleId: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const SYSTEM_MODULES = [
  { id: 'content', name: 'Content Editor' },
  { id: 'workflow', name: 'Workflow Builder' },
  { id: 'connect', name: 'Connections' },
  { id: 'share', name: 'Publishing' },
  { id: 'leads', name: 'Lead Management' },
  { id: 'users', name: 'User Management' },
  { id: 'roles', name: 'Role Management' }
] as const;