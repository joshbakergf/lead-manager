import React, { useState, useCallback, useEffect, useRef } from 'react';
import ContentEditor from './components/ContentEditor';
import Dashboard from './components/Dashboard';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Connection,
  ConnectionMode,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  reconnectEdge,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { FormPageNode } from './components/FormPageNode';
import { WebhookTriggerNode } from './components/WebhookTriggerNode';
import { ElbowEdge } from './components/ElbowEdge';
import { FormPage, FormField, WebhookConnection, FieldMapping, PublishedScript, WebhookTrigger, ZillowConnection, PageType, FieldType } from './types';
import { generateFieldId, generateApiName, ensureUniqueApiName } from './utils/fieldHelpers';
import logoImage from './assets/logo.png';
import { useAuth } from './contexts/AuthContext';
import { useAppData } from './hooks/useAppData';
import { webhookService, scriptService, publishedScriptService } from './lib/firestore';
import { Login } from './components/Login';
import { UsersView } from './components/UsersView';
import { RolesView } from './components/RolesView';
import { PublicPreview } from './components/PublicPreview';
import { LiveScript } from './components/LiveScript';
import { EmbeddedPreview } from './components/EmbeddedPreview';
import { PaymentField } from './components/PaymentField';
// Dynamic import for Zillow service to avoid initialization issues

import {
  Type,
  Zap,
  Webhook,
  Share2,
  BarChart3,
  Play,
  Share,
  Trash2,
  Database,
  Plus,
  GripVertical,
  X,
  Download,
  Upload,
  LogOut,
  Users,
  Shield,
  Loader,
  LayoutGrid,
  BarChart3,
} from 'lucide-react';

const nodeTypes = {
  formPage: FormPageNode,
  webhookTrigger: WebhookTriggerNode,
};

const edgeTypes = {
  elbow: ElbowEdge,
};

// Simple starter pages
const initialPages: FormPage[] = [
  {
    id: 'page-welcome',
    type: 'welcome',
    title: 'Welcome',
    content: 'Welcome to your script. Click to edit this page or add new pages.'
  }
];

// Sortable Field Item Component - moved outside App to prevent recreations
const SortableFieldItem = React.memo<{
  field: FormField;
  fieldIndex: number;
  selectedPageId: string;
  formPages: FormPage[];
  onUpdateField: (pageId: string, fieldId: string, updates: Partial<FormField>) => void;
  onDeleteField: (pageId: string, fieldId: string) => void;
  generateApiName: (label: string) => string;
  ensureUniqueApiName: (apiName: string, existingFields: FormField[], excludeFieldId?: string) => string;
  zillowConnections: any[];
}>(({ field, fieldIndex, selectedPageId, formPages, onUpdateField, onDeleteField, generateApiName, ensureUniqueApiName, zillowConnections }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Stable event handlers
  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateField(selectedPageId, field.id, { label: e.target.value });
  }, [selectedPageId, field.id, onUpdateField]);

  const handleApiNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateField(selectedPageId, field.id, { apiName: e.target.value });
  }, [selectedPageId, field.id, onUpdateField]);

  const handlePlaceholderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateField(selectedPageId, field.id, { placeholder: e.target.value });
  }, [selectedPageId, field.id, onUpdateField]);

  const handleRequiredChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateField(selectedPageId, field.id, { required: e.target.checked });
  }, [selectedPageId, field.id, onUpdateField]);

  const handleFieldTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as FieldType;
    const updates: Partial<FormField> = { type: newType };
    
    // Initialize options for dropdown and multiple-choice fields
    if ((newType === 'dropdown' || newType === 'multiple-choice') && !field.options) {
      updates.options = [
        { id: `option-${Date.now()}-0`, text: 'Option 1' },
        { id: `option-${Date.now()}-1`, text: 'Option 2' },
        { id: `option-${Date.now()}-2`, text: 'Option 3' }
      ];
    }
    
    onUpdateField(selectedPageId, field.id, updates);
  }, [selectedPageId, field.id, field.options, onUpdateField]);

  const handleDeleteField = useCallback(() => {
    onDeleteField(selectedPageId, field.id);
  }, [selectedPageId, field.id, onDeleteField]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`field-editor ${isDragging ? 'dragging' : ''}`}
    >
      <div className="field-header">
        <div 
          className="field-drag-handle"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </div>
        <span className="field-number">{fieldIndex + 1}</span>
        <input
          type="text"
          className="field-label-input"
          value={field.label}
          key={`field-label-${field.id}`}
          onChange={handleLabelChange}
          placeholder="Field label..."
        />
        <button
          className="delete-field-btn"
          onClick={handleDeleteField}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="field-config">
        <div className="field-meta-section">
          <div className="field-id-display">
            <label>Field ID</label>
            <code className="field-id-code">{field.id}</code>
          </div>
        </div>

        <div className="field-config-row">
          <div className="field-config-item">
            <label>API Name</label>
            <input
              type="text"
              value={field.apiName}
              key={`api-name-${field.id}`}
              onChange={handleApiNameChange}
              className="api-name-input"
              placeholder="field_name"
            />
          </div>
          <div className="field-config-item">
            <label>Field Type</label>
            <select
              value={field.type}
              onChange={handleFieldTypeChange}
            >
              <option value="short-text">Short Text</option>
              <option value="long-text">Long Text</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="url">URL</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="time">Time</option>
              <option value="multiple-choice">Multiple Choice</option>
              <option value="checkbox">Checkbox</option>
              <option value="dropdown">Dropdown</option>
              <option value="rating">Rating</option>
              <option value="file-upload">File Upload</option>
              <option value="enhanced-address">Enhanced Address</option>
              <option value="credit-card">💳 Credit Card Number</option>
              <option value="cvv">🔒 CVV</option>
              <option value="expiry-date">📅 Expiry Date (MMYY)</option>
              <option value="card-type">💰 Card Type</option>
              <option value="content-block">📄 Content Block</option>
            </select>
          </div>
        </div>

        <div className="field-config-row">
          <div className="field-config-item">
            <label>Placeholder Text</label>
            <input
              type="text"
              value={field.placeholder || ''}
              key={`placeholder-${field.id}`}
              onChange={handlePlaceholderChange}
              placeholder="Enter placeholder text..."
            />
          </div>
          <div className="field-config-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={handleRequiredChange}
              />
              Required field
            </label>
          </div>
        </div>

        {/* Content Block Configuration */}
        {field.type === "content-block" && (
          <div className="field-config-section">
            <h4>Content Block</h4>
            <div className="help-text" style={{ marginBottom: "10px", fontSize: "14px", color: "#666" }}>
              <p>Create rich content with formatted text, images, tables, lists, and more using the WYSIWYG editor below.</p>
            </div>
            <ContentEditor
              value={field.contentValue || ""}
              onChange={(value) => onUpdateField(selectedPageId, field.id, { contentValue: value })}
              placeholder="Start typing to create rich content..."
            />
          </div>
        )}
        
        {/* Options for dropdown and multiple choice fields */}
        {(field.type === 'dropdown' || field.type === 'multiple-choice') && (
          <div className="field-config-section">
            <h4>Options</h4>
            <div className="options-list">
              {field.options?.map((option, optionIndex) => (
                <div key={optionIndex} className="option-row">
                  <span>{optionIndex + 1}</span>
                  <input
                    type="text"
                    value={typeof option === 'string' ? option : option.text}
                    onChange={(e) => {
                      const newOptions = [...(field.options || [])];
                      newOptions[optionIndex] = {
                        id: typeof option === 'string' ? `option-${Date.now()}-${optionIndex}` : option.id,
                        text: e.target.value
                      };
                      onUpdateField(selectedPageId, field.id, { options: newOptions });
                    }}
                    placeholder={`Option ${optionIndex + 1}`}
                  />
                  <button
                    onClick={() => {
                      const newOptions = field.options?.filter((_, i) => i !== optionIndex) || [];
                      onUpdateField(selectedPageId, field.id, { options: newOptions });
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              className="add-option-btn"
              onClick={() => {
                const newOptions = [...(field.options || []), {
                  id: `option-${Date.now()}-${(field.options || []).length}`,
                  text: ''
                }];
                onUpdateField(selectedPageId, field.id, { options: newOptions });
              }}
            >
              <Plus size={16} />
              Add Option
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

function App() {
  // Check if this is a preview mode based on URL parameters or path
  const urlParams = new URLSearchParams(window.location.search);
  let previewId = urlParams.get('preview');
  const liveId = urlParams.get('live');
  
  // Handle /s/ URL format (e.g., /s/scriptId) by extracting scriptId for preview
  const pathMatch = window.location.pathname.match(/^\/s\/(.+)$/);
  if (pathMatch && !previewId) {
    previewId = pathMatch[1];
    console.log('Detected /s/ URL format, using as preview:', previewId);
  }
  
  // Get Firestore-integrated data
  const appData = useAppData();
  
  // Function to get script data from localStorage or published scripts
  const getScriptData = (scriptId: string) => {
    // First try localStorage for working scripts
    const localData = window.localStorage.getItem(`script-${scriptId}`);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        return {
          pages: parsed.pages || [],
          logicRules: parsed.logicRules || {}
        };
      } catch (err) {
        console.error('Error parsing local script data:', err);
      }
    }

    // Then check published scripts
    const publishedScript = appData.publishedScripts.find(script => script.id === scriptId);
    if (publishedScript) {
      return {
        pages: publishedScript.pages || [],
        logicRules: {} // Published scripts don't store logic rules
      };
    }

    // For live scripts, provide a default demo script if none found
    if (scriptId.startsWith('live-')) {
      console.log('Live script not found, providing demo script:', scriptId);
      return {
        pages: [
          {
            id: 'welcome',
            type: 'form' as const,
            title: 'Demo Form',
            fields: [
              {
                id: 'name',
                type: 'text' as const,
                label: 'Your Name',
                required: true,
                apiName: 'name'
              },
              {
                id: 'email',
                type: 'email' as const,
                label: 'Email Address', 
                required: true,
                apiName: 'email'
              }
            ]
          }
        ],
        logicRules: {}
      };
    }

    return null;
  };
  
  // If preview mode, show the public preview component
  if (previewId) {
    // Enhanced getScriptData for preview that includes a fallback
    const getPreviewScriptData = (scriptId: string) => {
      const scriptData = getScriptData(scriptId);
      if (scriptData) {
        return scriptData;
      }
      
      // Fallback demo script for preview if no script found
      console.log('No script found for preview, providing demo script');
      return {
        pages: [
          {
            id: 'welcome',
            type: 'welcome' as const,
            title: 'Demo Preview Form',
            content: 'This is a demo form for preview purposes.',
            visible: true
          },
          {
            id: 'form',
            type: 'form' as const,
            title: 'Contact Information',
            fields: [
              {
                id: 'name',
                type: 'text' as const,
                label: 'Full Name',
                required: true,
                apiName: 'name'
              },
              {
                id: 'email',
                type: 'email' as const,
                label: 'Email Address',
                required: true,
                apiName: 'email'
              },
              {
                id: 'phone',
                type: 'tel' as const,
                label: 'Phone Number',
                required: false,
                apiName: 'phone'
              }
            ],
            visible: true
          },
          {
            id: 'thank-you',
            type: 'ending' as const,
            title: 'Thank You!',
            content: 'Thank you for testing the demo preview.',
            visible: true
          }
        ],
        logicRules: {
          'welcome': 'form',
          'form': 'thank-you'
        }
      };
    };
    
    return <PublicPreview getScriptData={getPreviewScriptData} />;
  }
  
  // If live mode, show the live script component
  if (liveId) {
    const liveScriptData = getScriptData(liveId);
    if (liveScriptData) {
      const liveScript = {
        id: liveId,
        name: 'Live Script',
        description: 'Live call script',
        pages: liveScriptData.pages,
        webhookConnections: [],
        publishedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        isActive: true,
        accessUrl: '',
        theme: {
          primaryColor: '#4285f4',
          backgroundColor: '#ffffff',
          textColor: '#1a202c'
        },
        settings: {
          showProgress: true,
          allowBack: true,
          autoAdvance: false,
          collectAnalytics: true
        }
      };
      
      return (
        <LiveScript
          script={liveScript}
          onComplete={(submission) => {
            console.log('Lead captured:', submission);
            window.close();
          }}
          onClose={() => window.close()}
        />
      );
    }
    return <div>Script not found</div>;
  }

  const { isAuthenticated, isLoading, user, logout, hasModuleAccess, hasPermission } = useAuth();
  const [activeView, setActiveView] = useState<'dashboard' | 'content' | 'workflow' | 'connect' | 'share' | 'data' | 'users' | 'roles'>('dashboard');

  // Load webhooks from Firestore on app start
  React.useEffect(() => {
    const loadWebhooks = async () => {
      if (!isAuthenticated) return;
      
      try {
        console.log('Loading webhook connections from Firestore...');
        const webhooks = await webhookService.getWebhooks();
        setWebhookConnections(webhooks);
        console.log('Loaded webhook connections from Firestore:', webhooks.length);
      } catch (error) {
        console.error('Failed to load webhook connections from Firestore:', error);
        // Don't crash the app, just continue with empty webhooks
        setWebhookConnections([]);
      }
    };
    
    loadWebhooks();
  }, [isAuthenticated]);

  // Zillow integration temporarily disabled due to initialization conflicts
  // TODO: Re-implement Zillow integration with proper error handling

  // Check if current view is accessible, if not redirect to first available
  const getValidActiveView = () => {
    if (!isAuthenticated || !user) return activeView;
    
    // Dashboard is always accessible to all authenticated users
    if (activeView === 'dashboard') {
      return activeView;
    }
    
    const currentModuleId = activeView === 'data' ? 'leads' : activeView;
    if (hasModuleAccess(currentModuleId)) {
      return activeView;
    }
    
    // Find first available module, with dashboard as the first option
    const availableModules = ['dashboard', 'share', 'data', 'content', 'workflow', 'connect', 'users', 'roles'] as const;
    const firstAvailable = availableModules.find(module => {
      if (module === 'dashboard') return true; // Dashboard is always available
      const moduleId = module === 'data' ? 'leads' : module;
      return hasModuleAccess(moduleId);
    });
    
    return firstAvailable || 'dashboard'; // Fallback to dashboard
  };

  const validActiveView = getValidActiveView();
  const [formPages, setFormPages] = useState<FormPage[]>(initialPages);

  // Stable field update functions to prevent recreations
  const updateField = useCallback((pageId: string, fieldId: string, updates: Partial<FormField>) => {
    setFormPages(pages => pages.map(p => 
      p.id === pageId ? {
        ...p,
        fields: p.fields?.map(f => 
          f.id === fieldId ? { ...f, ...updates } : f
        )
      } : p
    ));
  }, []);

  const deleteField = useCallback((pageId: string, fieldId: string) => {
    setFormPages(pages => pages.map(p => 
      p.id === pageId ? {
        ...p,
        fields: p.fields?.filter(f => f.id !== fieldId)
      } : p
    ));
  }, []);
  const [selectedPageId, setSelectedPageId] = useState<string | null>('page-welcome');
  
  const [hasAutoLayoutRun, setHasAutoLayoutRun] = useState(false);
  
  // Webhook connections state with sample data
  const [webhookConnections, setWebhookConnections] = useState<WebhookConnection[]>([
    {
      id: 'conn-salesforce',
      name: 'Salesforce CRM',
      baseUrl: 'https://your-org.salesforce.com/services/data/v57.0/sobjects/Lead',
      authenticationKey: 'Authorization',
      authenticationToken: 'Bearer YOUR_SF_TOKEN',
      fieldMappings: [
        {
          fieldId: 'field-name',
          fieldLabel: 'Full Name',
          apiName: 'name',
          webhookKey: 'Name',
          enabled: true,
        },
        {
          fieldId: 'field-email',
          fieldLabel: 'Email Address',
          apiName: 'email',
          webhookKey: 'Email',
          enabled: true,
        },
        {
          fieldId: 'field-phone',
          fieldLabel: 'Phone Number',
          apiName: 'phone',
          webhookKey: 'Phone',
          enabled: true,
        },
      ],
      createdAt: '2025-01-15T10:00:00Z',
      isActive: true,
    },
    {
      id: 'conn-hubspot',
      name: 'HubSpot Marketing',
      baseUrl: 'https://api.hubapi.com/contacts/v1/contact',
      authenticationKey: 'Authorization',
      authenticationToken: 'Bearer YOUR_HUBSPOT_TOKEN',
      fieldMappings: [
        {
          fieldId: 'field-name',
          fieldLabel: 'Full Name',
          apiName: 'name',
          webhookKey: 'firstname',
          enabled: true,
        },
        {
          fieldId: 'field-email',
          fieldLabel: 'Email Address',
          apiName: 'email',
          webhookKey: 'email',
          enabled: true,
        },
      ],
      createdAt: '2025-01-15T11:30:00Z',
      isActive: true,
    },
    {
      id: 'conn-slack',
      name: 'Slack Notifications',
      baseUrl: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
      authenticationKey: '',
      authenticationToken: '',
      fieldMappings: [
        {
          fieldId: 'field-name',
          fieldLabel: 'Full Name',
          apiName: 'name',
          webhookKey: 'text',
          enabled: true,
        },
      ],
      createdAt: '2025-01-15T12:00:00Z',
      isActive: false,
    },
  ]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [showCreateConnection, setShowCreateConnection] = useState(false);
  
  // Zillow connections state
  const [zillowConnections, setZillowConnections] = useState<ZillowConnection[]>([
    {
      id: 'zillow-prod',
      name: 'Production Zillow API',
      apiKey: '720c9f75b4mshc000a48d1ab5353p1e9212jsnfda95ae44e14',
      apiProvider: 'rapidapi',
      apiUrl: 'https://zillow-com1.p.rapidapi.com',
      rateLimit: 500,
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ]);
  const [selectedZillowConnectionId, setSelectedZillowConnectionId] = useState<string | null>('zillow-prod');
  const [showCreateZillowConnection, setShowCreateZillowConnection] = useState(false);
  
  // Submission viewing state
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  // Webhook trigger editing state
  const [showTriggerEditor, setShowTriggerEditor] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<WebhookTrigger | null>(null);
  
  // Leads table filters
  const [leadsFilters, setLeadsFilters] = useState({
    scriptName: '',
    assignedAgent: '',
    dateRange: '',
    searchText: ''
  });
  
  // Use Firestore-integrated data from hook
  const { 
    publishedScripts, 
    setPublishedScripts, 
    webhookTriggers, 
    setWebhookTriggers,
    saveScript,
    publishScript,
    saveFormSubmission,
    saveWorkflow
  } = appData;
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  // Initialize sample form submissions for demo purposes
  React.useEffect(() => {
    const existingSubmissions = localStorage.getItem('formSubmissions');
    if (!existingSubmissions) {
      const sampleSubmissions = [
        {
          id: 'submission-1704034800000',
          scriptId: 'script-demo',
          scriptName: 'Lead Generation Form',
          submittedAt: '2025-01-15T14:30:00Z',
          data: {
            'field-name': 'John Smith',
            'field-email': 'john.smith@email.com',
            'field-phone': '(555) 123-4567',
            'field-company': 'Acme Corporation',
            'field-interest': 'Enterprise Solutions',
          },
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          timestamp: 1704034800000,
        },
        {
          id: 'submission-1704038400000',
          scriptId: 'script-demo',
          scriptName: 'Contact Form',
          submittedAt: '2025-01-15T15:45:00Z',
          data: {
            'field-name': 'Sarah Johnson',
            'field-email': 'sarah.j@company.com',
            'field-message': 'Interested in your pest control services for our office building.',
            'field-service-type': 'Commercial',
          },
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: 1704038400000,
        },
        {
          id: 'submission-1704042000000',
          scriptId: 'script-demo',
          scriptName: 'Service Request',
          submittedAt: '2025-01-15T16:20:00Z',
          data: {
            'field-name': 'Mike Davis',
            'field-email': 'mike.davis@home.com',
            'field-phone': '(555) 987-6543',
            'field-address': '123 Main St, Anytown USA',
            'field-urgency': 'High',
            'field-pest-type': 'Ants',
          },
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
          timestamp: 1704042000000,
        },
      ];
      localStorage.setItem('formSubmissions', JSON.stringify(sampleSubmissions));
    }
  }, []);
  
  // Logic rules state - tracks where each page/choice should go
  const [logicRules, setLogicRules] = useState<Record<string, string>>({
    // Clean start - no connections defined
  });

  // Working script management
  const WORKING_SCRIPT_KEY = 'working-script-id';
  const [workingScriptId, setWorkingScriptId] = useState<string | null>(null);
  const [isLoadingScript, setIsLoadingScript] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load or create working script on initialization
  useEffect(() => {
    const initializeWorkingScript = async () => {
      if (!isAuthenticated || !user) {
        setIsLoadingScript(false);
        return;
      }
      
      try {
        // Check if we have a stored working script ID
        const storedScriptId = localStorage.getItem(WORKING_SCRIPT_KEY);
        
        if (storedScriptId) {
          // Try to load the existing script
          const existingScript = await scriptService.getScript(storedScriptId);
          
          if (existingScript && existingScript.pages) {
            console.log('Loaded existing working script:', storedScriptId);
            setFormPages(existingScript.pages);
            setWorkingScriptId(storedScriptId);
            
            // Load logic rules from localStorage for now
            const storedRules = localStorage.getItem('script-logic-rules');
            if (storedRules) {
              try {
                setLogicRules(JSON.parse(storedRules));
              } catch (error) {
                console.error('Failed to parse stored logic rules:', error);
              }
            }
          } else {
            // Script not found or invalid, create new one
            console.log('Working script not found, creating new one');
            const newScriptId = await createNewWorkingScript();
            setWorkingScriptId(newScriptId);
          }
        } else {
          // No stored script ID, create new working script
          console.log('Creating new working script');
          const newScriptId = await createNewWorkingScript();
          setWorkingScriptId(newScriptId);
        }
      } catch (error) {
        console.error('Failed to initialize working script:', error);
      } finally {
        setIsLoadingScript(false);
      }
    };
    
    initializeWorkingScript();
  }, [isAuthenticated, user]);
  
  // Create new working script
  const createNewWorkingScript = async () => {
    const scriptId = await scriptService.createScript({
      name: 'Working Script',
      pages: initialPages, // Use initial pages for new scripts
      createdBy: user?.id || 'anonymous'
    });
    localStorage.setItem(WORKING_SCRIPT_KEY, scriptId);
    console.log('Created new working script:', scriptId);
    return scriptId;
  };
  
  // Debounced save to Firestore
  const debouncedSaveToFirestore = useCallback(async (pages: FormPage[], rules: Record<string, string>) => {
    if (!workingScriptId || !isAuthenticated) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await scriptService.updateScript(workingScriptId, {
          pages: pages
        });
        console.log('Pages auto-saved to Firestore');
        
        // Also save logic rules to localStorage for now
        // TODO: Add logic rules to script schema in Firestore
        localStorage.setItem('script-logic-rules', JSON.stringify(rules));
      } catch (error) {
        console.error('Failed to auto-save pages:', error);
      }
    }, 1000); // 1 second debounce
  }, [workingScriptId, isAuthenticated]);
  
  // Auto-save whenever formPages or logicRules change
  useEffect(() => {
    if (formPages.length > 0 && !isLoadingScript) {
      debouncedSaveToFirestore(formPages, logicRules);
    }
  }, [formPages, logicRules, debouncedSaveToFirestore, isLoadingScript]);

  // Initialize nodes only once, then preserve positions
  const [nodes, setNodes, onNodesChange] = useNodesState([]);

  // Initialize nodes when formPages or webhookTriggers change
  React.useEffect(() => {
    setNodes(prevNodes => {
      const existingNodeIds = new Set(prevNodes.map(n => n.id));
      
      // Add new form page nodes
      const newPages = formPages.filter(page => !existingNodeIds.has(page.id));
      const newPageNodes = newPages.map((page) => ({
        id: page.id,
        type: 'formPage',
        position: { 
          x: Math.random() * 300 + 100,
          y: Math.random() * 200 + 150
        },
        data: {
          page,
          pageNumber: null,
          isSelected: false, // Will be updated by separate effect
        },
      }));
      
      // Add new webhook trigger nodes
      const newTriggers = webhookTriggers.filter(trigger => !existingNodeIds.has(trigger.id));
      const newTriggerNodes = newTriggers.map((trigger) => ({
        id: trigger.id,
        type: 'webhookTrigger',
        position: trigger.position || { 
          x: Math.random() * 300 + 500,
          y: Math.random() * 200 + 150
        },
        data: {
          trigger,
          connection: webhookConnections.find(conn => conn.id === trigger.connectionId),
          onEdit: (triggerId: string) => {
            const trigger = webhookTriggers.find(t => t.id === triggerId);
            if (trigger) {
              setSelectedTrigger(trigger);
              setShowTriggerEditor(true);
            }
          },
        },
      }));
      
      // If there are new nodes to add, return updated list
      if (newPageNodes.length > 0 || newTriggerNodes.length > 0) {
        return [...prevNodes, ...newPageNodes, ...newTriggerNodes];
      }
      
      return prevNodes;
    });
  }, [formPages, webhookTriggers, webhookConnections, setNodes]);

  // Separate effect to update selection state and page data without recreating nodes
  React.useEffect(() => {
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.type === 'formPage') {
          // Update form page data and selection state
          const updatedPage = formPages.find(p => p.id === node.id);
          return {
            ...node,
            data: {
              ...node.data,
              page: updatedPage || node.data.page,
              isSelected: selectedPageId === node.id,
            }
          };
        } else if (node.type === 'webhookTrigger') {
          // Update webhook trigger connection data
          const updatedTrigger = webhookTriggers.find(t => t.id === node.id);
          return {
            ...node,
            data: {
              ...node.data,
              trigger: updatedTrigger || node.data.trigger,
              connection: webhookConnections.find(conn => conn.id === node.data.trigger.connectionId),
            }
          };
        }
        return node;
      })
    );
  }, [selectedPageId, formPages, webhookTriggers, webhookConnections, setNodes]);


  // Generate edges based on logic rules
  const createInitialEdges = useCallback(() => {
    const edges = [];
    const addedEdges = new Set<string>();
    
    // Create edges based on logic rules
    Object.entries(logicRules).forEach(([sourceKey, targetId]) => {
      // Handle page-level rules
      const sourcePage = formPages.find(p => p.id === sourceKey);
      if (sourcePage && targetId) {
        const edgeId = `${sourcePage.id}-${targetId}`;
        if (!addedEdges.has(edgeId)) {
          edges.push({
            id: edgeId,
            source: sourcePage.id,
            target: targetId,
            sourceHandle: 'right-source',
            targetHandle: 'left',
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#4285f4', strokeWidth: 4 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#4285f4' },
          });
          addedEdges.add(edgeId);
        }
      }
      
      // Handle choice-level rules for both legacy format (page-choice) and new format (page-field-choice)
      const keyParts = sourceKey.split('-');
      let pageId, fieldId, choiceId, labelText;
      
      // More robust page ID reconstruction - find the actual page that matches
      const findPageForRuleKey = (ruleKey: string) => {
        return formPages.find(page => ruleKey.startsWith(page.id + '-'));
      };
      
      const matchingPage = findPageForRuleKey(sourceKey);
      if (matchingPage && keyParts.length > 2) {
        pageId = matchingPage.id;
        const remainingParts = sourceKey.substring(pageId.length + 1).split('-');
        
        if (remainingParts.length >= 2) {
          // New format: page-field-choice  
          fieldId = remainingParts.slice(0, -1).join('-'); // All but last part is field ID
          choiceId = remainingParts[remainingParts.length - 1]; // Last part is choice ID
        
          // Find the actual choice text for the label
          const field = matchingPage?.fields?.find(f => f.id === fieldId);
          const choice = field?.choices?.find(c => c.id === choiceId);
          labelText = choice?.text || choiceId;
        } else if (remainingParts.length === 1) {
          // Legacy format: page-choice
          choiceId = remainingParts[0];
          labelText = choiceId;
        }
      }
      
      if (choiceId && targetId && pageId !== sourceKey) {
        const sourcePage = formPages.find(p => p.id === pageId);
        if (sourcePage) {
          const edgeId = `${sourcePage.id}-${targetId}-${choiceId}`;
          if (!addedEdges.has(edgeId)) {
            edges.push({
              id: edgeId,
              source: sourcePage.id,
              target: targetId,
              sourceHandle: 'right-source',
              targetHandle: 'left',
              type: 'smoothstep',
              animated: true,
              style: { 
                stroke: '#4285f4', 
                strokeWidth: 4,
                strokeDasharray: '8,8' 
              },
              label: labelText,
              labelStyle: { fill: '#fff', fontSize: 12 },
              labelBgStyle: { fill: '#4285f4' },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#4285f4' },
            });
            addedEdges.add(edgeId);
          }
        }
      }
    });
    
    // Add default placeholder connections based on page order for pages without explicit logic rules
    const pagesWithRules = new Set();
    Object.keys(logicRules).forEach(ruleKey => {
      // Find which page this rule belongs to using the same robust logic
      const matchingPage = formPages.find(page => ruleKey.startsWith(page.id + '-') || ruleKey === page.id);
      if (matchingPage) {
        pagesWithRules.add(matchingPage.id);
      }
    });
    
    // Create placeholder connections for pages without explicit rules
    formPages.forEach((page, index) => {
      if (!pagesWithRules.has(page.id) && index < formPages.length - 1) {
        const nextPage = formPages[index + 1];
        const edgeId = `${page.id}-${nextPage.id}-placeholder`;
        
        if (!addedEdges.has(edgeId)) {
          edges.push({
            id: edgeId,
            source: page.id,
            target: nextPage.id,
            sourceHandle: 'right-source',
            targetHandle: 'left',
            type: 'smoothstep',
            animated: false, // Not animated to show it's placeholder
            style: { 
              stroke: '#94a3b8', // Gray color to indicate placeholder
              strokeWidth: 2,
              strokeDasharray: '5,5' // Dashed to show it's not final
            },
            label: 'Auto',
            labelStyle: { fill: '#6b7280', fontSize: 10 },
            labelBgStyle: { fill: '#f3f4f6', stroke: '#d1d5db' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
            className: 'placeholder-edge'
          });
          addedEdges.add(edgeId);
        }
      }
    });
    
    return edges;
  }, [formPages, logicRules]);

  const [edges, setEdges, onEdgesChangeBase] = useEdgesState(createInitialEdges());
  
  // Custom edge change handler that also updates logic rules
  const onEdgesChange = useCallback((changes: any[]) => {
    // Handle edge deletions by removing corresponding logic rules
    changes.forEach(change => {
      if (change.type === 'remove') {
        const edge = edges.find(e => e.id === change.id);
        if (edge && edge.source && edge.target) {
          const isWebhookConnection = edge.sourceHandle?.includes('webhook') || edge.targetHandle?.includes('webhook');
          
          // Only remove logic rules for page-to-page connections
          if (!isWebhookConnection) {
            const sourcePageId = edge.source;
            const sourceHandle = edge.sourceHandle || 'right-source';
            
            // Find the source page
            const sourcePage = formPages.find(p => p.id === sourcePageId);
            if (sourcePage) {
              // Determine the logic rule key to remove
              let ruleKey = sourcePageId;
              
              if (sourcePage.fields && sourcePage.fields.length > 0) {
                const multipleChoiceField = sourcePage.fields.find(f => f.type === 'multiple-choice' || f.type === 'radio');
                if (multipleChoiceField && multipleChoiceField.choices) {
                  ruleKey = `${sourcePageId}-${multipleChoiceField.id}`;
                }
              }
              
              // Remove the logic rule
              setLogicRules(prev => {
                const updated = { ...prev };
                delete updated[ruleKey];
                return updated;
              });
            }
          }
        }
      }
    });
    
    // Apply the visual changes
    onEdgesChangeBase(changes);
  }, [edges, formPages, onEdgesChangeBase]);

  // Update edges when logic rules change or pages change (but not auto-create placeholder connections)
  React.useEffect(() => {
    setEdges(createInitialEdges());
  }, [logicRules, formPages, createInitialEdges, setEdges]);

  // Handle preview in new window/tab
  const handlePreview = async () => {
    // Generate a temporary script ID (in a real app, this would be a saved script ID)
    const scriptId = 'preview-' + Date.now();
    
    // Store the script data (now using Firestore)
    await saveScript({ 
      pages: formPages,
      logicRules: logicRules,
      title: 'Preview Script',
      description: 'Preview script for testing'
    }, scriptId);
    
    // Create preview URL with query parameter
    const previewUrl = `${window.location.origin}?preview=${scriptId}`;
    
    // Open preview in new tab
    window.open(previewUrl, '_blank');
  };

  const handleStartLiveCall = async (script: PublishedScript) => {
    // Generate a temporary script ID for the live session
    const liveScriptId = 'live-' + Date.now();
    
    console.log('Starting live call with script:', script);
    console.log('Script pages:', script.pages);
    
    // Ensure we have valid pages data
    const pages = script.pages && script.pages.length > 0 ? script.pages : formPages;
    console.log('Using pages for live script:', pages);
    
    // Store the script data for the live session (now using Firestore)
    await saveScript({ 
      pages: pages,
      logicRules: {}, // Could include script logic rules if available
      title: script.name || 'Live Script',
      description: script.description || 'Live script for calling'
    }, liveScriptId);
    
    // Create live URL with query parameter format (same as preview)
    const liveUrl = `${window.location.origin}?live=${liveScriptId}`;
    
    // Open live script in new tab
    window.open(liveUrl, '_blank');
  };

  // Create a new page
  const createPage = () => {
    if (!hasPermission('content', 'create')) {
      alert('You do not have permission to create pages');
      return;
    }
    
    const newPage: FormPage = {
      id: `page-${Date.now()}`,
      type: 'form',
      title: 'New Page',
      content: '',
      fields: [],
    };
    
    setFormPages([...formPages, newPage]);
    setSelectedPageId(newPage.id);
  };

  // Auto layout function with absolute positioning and overlap prevention
  const autoLayout = () => {
    const nodePositions = new Map<string, { x: number; y: number }>();
    const nodeWidth = 350; // Approximate node width with padding
    const nodeHeight = 200; // Approximate node height with padding
    const horizontalSpacing = 600; // Increased space between columns
    const verticalSpacing = 300;   // Increased minimum space between nodes
    const baseY = 300;
    const unmatchedStartX = 2000; // Far right for unmatched pages
    
    // Helper function to check if two nodes overlap
    const nodesOverlap = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
      return Math.abs(pos1.x - pos2.x) < nodeWidth && Math.abs(pos1.y - pos2.y) < nodeHeight;
    };
    
    // Helper function to find a non-overlapping position
    const findNonOverlappingPosition = (basePos: { x: number; y: number }, existingPositions: Map<string, { x: number; y: number }>) => {
      let position = { ...basePos };
      let attempts = 0;
      const maxAttempts = 20;
      
      while (attempts < maxAttempts) {
        let hasOverlap = false;
        
        for (const [, existingPos] of existingPositions) {
          if (nodesOverlap(position, existingPos)) {
            hasOverlap = true;
            break;
          }
        }
        
        if (!hasOverlap) {
          return position;
        }
        
        // Try moving down
        position.y += verticalSpacing / 2;
        attempts++;
      }
      
      // If still overlapping after max attempts, move to the right
      position.x += horizontalSpacing / 2;
      position.y = basePos.y;
      return position;
    };
    
    // Build connection graph including webhook triggers and placeholder connections
    const connections = new Map<string, Set<string>>();
    const incomingConnections = new Map<string, Set<string>>();
    const connectedNodes = new Set<string>(); // Now includes both pages and triggers
    
    // Combine all nodes (form pages + webhook triggers)
    const allNodes = [...formPages, ...webhookTriggers];
    
    // Helper function to add a connection
    const addConnection = (sourceId: string, targetId: string) => {
      connectedNodes.add(sourceId);
      connectedNodes.add(targetId);
      
      if (!connections.has(sourceId)) {
        connections.set(sourceId, new Set());
      }
      if (!incomingConnections.has(targetId)) {
        incomingConnections.set(targetId, new Set());
      }
      
      connections.get(sourceId)!.add(targetId);
      incomingConnections.get(targetId)!.add(sourceId);
    };
    
    // Add explicit logic rule connections first
    Object.entries(logicRules).forEach(([ruleKey, targetId]) => {
      if (!targetId || targetId === 'end') return;
      
      // Find which page this rule belongs to using robust logic
      const matchingPage = formPages.find(page => ruleKey.startsWith(page.id + '-') || ruleKey === page.id);
      if (matchingPage) {
        addConnection(matchingPage.id, targetId);
      }
    });
    
    // Removed auto connections - let users create their own connections manually
    
    // Separate connected and unconnected nodes
    const connectedNodesList = allNodes.filter(node => connectedNodes.has(node.id));
    const unconnectedNodes = allNodes.filter(node => !connectedNodes.has(node.id));
    
    // Layout connected nodes (pages and webhook triggers)
    if (connectedNodesList.length > 0) {
      // Find root nodes (no incoming connections but have outgoing connections)
      const rootNodes = connectedNodesList.filter(node => !incomingConnections.has(node.id) && connections.has(node.id));
      
      // If no clear root nodes, use welcome pages first, then any connected node
      let startNodes = rootNodes;
      if (startNodes.length === 0) {
        const welcomeNodes = connectedNodesList.filter(node => 'type' in node && node.type === 'welcome');
        if (welcomeNodes.length > 0) {
          startNodes = welcomeNodes;
        } else {
          startNodes = [connectedNodesList[0]]; // Use first connected node
        }
      }
      
      // Build layers for connected nodes
      const layers: string[][] = [];
      const processedNodes = new Set<string>();
      
      // Start with root nodes
      layers.push(startNodes.map(n => n.id));
      startNodes.forEach(n => processedNodes.add(n.id));
      
      // Build subsequent layers
      while (true) {
        const currentLayer = layers[layers.length - 1];
        const nextLayer: string[] = [];
        
        currentLayer.forEach(nodeId => {
          const targets = connections.get(nodeId);
          if (targets) {
            targets.forEach(targetId => {
              if (!processedNodes.has(targetId)) {
                nextLayer.push(targetId);
                processedNodes.add(targetId);
              }
            });
          }
        });
        
        if (nextLayer.length === 0) break;
        layers.push([...new Set(nextLayer)]);
      }
      
      // Add any connected nodes that weren't reached (isolated clusters)
      const unreachedConnected = connectedNodesList.filter(node => !processedNodes.has(node.id));
      if (unreachedConnected.length > 0) {
        layers.push(unreachedConnected.map(n => n.id));
      }
      
      // Position connected pages in layers with overlap prevention and branching consideration
      layers.forEach((layer, layerIndex) => {
        const layerX = 100 + layerIndex * horizontalSpacing;
        
        // Group nodes by their source to keep branches together
        const nodesBySource = new Map<string, string[]>();
        const noSources: string[] = [];
        
        layer.forEach(nodeId => {
          const sources = incomingConnections.get(nodeId);
          if (sources && sources.size > 0) {
            // Group by first source (main parent)
            const mainSource = Array.from(sources)[0];
            if (!nodesBySource.has(mainSource)) {
              nodesBySource.set(mainSource, []);
            }
            nodesBySource.get(mainSource)!.push(nodeId);
          } else {
            noSources.push(nodeId);
          }
        });
        
        let currentY = baseY - ((layer.length - 1) * verticalSpacing) / 2;
        
        // Position nodes without sources first
        noSources.forEach(nodeId => {
          const basePosition = { x: layerX, y: currentY };
          const finalPosition = findNonOverlappingPosition(basePosition, nodePositions);
          nodePositions.set(nodeId, finalPosition);
          currentY += verticalSpacing;
        });
        
        // Position grouped nodes (branches from same source)
        nodesBySource.forEach((branchNodes, sourceId) => {
          const sourcePos = nodePositions.get(sourceId);
          if (sourcePos) {
            // Try to center branches around their source's Y position
            const branchStartY = sourcePos.y - ((branchNodes.length - 1) * verticalSpacing) / 2;
            branchNodes.forEach((nodeId, index) => {
              const basePosition = { x: layerX, y: branchStartY + index * verticalSpacing };
              const finalPosition = findNonOverlappingPosition(basePosition, nodePositions);
              nodePositions.set(nodeId, finalPosition);
            });
          } else {
            // Fallback if source position not found
            branchNodes.forEach(nodeId => {
              const basePosition = { x: layerX, y: currentY };
              const finalPosition = findNonOverlappingPosition(basePosition, nodePositions);
              nodePositions.set(nodeId, finalPosition);
              currentY += verticalSpacing;
            });
          }
        });
      });
    }
    
    // Position unconnected nodes on the far right with overlap prevention
    unconnectedNodes.forEach((node, index) => {
      const unmatchedY = baseY + (index - Math.floor(unconnectedNodes.length / 2)) * verticalSpacing;
      const basePosition = { x: unmatchedStartX, y: unmatchedY };
      const finalPosition = findNonOverlappingPosition(basePosition, nodePositions);
      
      nodePositions.set(node.id, finalPosition);
    });
    
    // Final adjustment pass to ensure proper spacing for edge routing
    const finalPositions = new Map<string, { x: number; y: number }>();
    
    // Process in layer order to maintain flow
    const allPositionedNodes = Array.from(nodePositions.entries());
    allPositionedNodes.sort((a, b) => a[1].x - b[1].x);
    
    allPositionedNodes.forEach(([nodeId, position]) => {
      let adjustedPosition = { ...position };
      
      // Check if this node has connections that might cause edge overlaps
      const targets = connections.get(nodeId);
      if (targets && targets.size > 1) {
        // Node has multiple outgoing connections - ensure enough vertical space
        const targetPositions = Array.from(targets)
          .map(t => nodePositions.get(t))
          .filter(p => p !== undefined) as { x: number; y: number }[];
        
        if (targetPositions.length > 1) {
          // Calculate required vertical span for clean routing
          const minY = Math.min(...targetPositions.map(p => p.y));
          const maxY = Math.max(...targetPositions.map(p => p.y));
          const requiredSpan = maxY - minY;
          
          // If span is too small, adjust this node's position
          if (requiredSpan < verticalSpacing * (targetPositions.length - 1)) {
            adjustedPosition.y = (minY + maxY) / 2;
          }
        }
      }
      
      finalPositions.set(nodeId, adjustedPosition);
    });
    
    // Apply absolute positions to existing nodes without recreating them
    setNodes(prevNodes => 
      prevNodes.map(node => {
        // Update positions for both form pages and webhook triggers
        const newPosition = finalPositions.get(node.id) || nodePositions.get(node.id);
        return newPosition ? {
          ...node,
          position: newPosition
        } : node;
      })
    );
  };

  // Removed auto-trigger layout - users can manually trigger layout

  // Reset auto layout flag when pages or triggers change significantly
  React.useEffect(() => {
    setHasAutoLayoutRun(false);
  }, [formPages.length, webhookTriggers.length]);

  // Removed updateConnections function - connections are now manual only

  // Handle node position changes
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    // Removed auto-connection updates when nodes are moved
  }, [onNodesChange]);

  // Update logic rule
  const updateLogicRule = (ruleKey: string, targetPageId: string) => {
    setLogicRules(prev => ({
      ...prev,
      [ruleKey]: targetPageId
    }));
  };

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      
      // Determine connection type and styling based on handles
      const isWebhookConnection = params.sourceHandle?.includes('webhook') || params.targetHandle?.includes('webhook');
      
      // Create the visual edge
      const edge = {
        ...params,
        sourceHandle: params.sourceHandle || 'right-source',
        targetHandle: params.targetHandle || 'left',
        type: 'smoothstep',
        animated: true,
        style: { 
          stroke: isWebhookConnection ? '#10b981' : '#4285f4', 
          strokeWidth: 3 
        },
        markerEnd: { 
          type: MarkerType.ArrowClosed, 
          color: isWebhookConnection ? '#10b981' : '#4285f4' 
        },
      };
      
      // Only update logic rules for page-to-page connections (not webhook connections)
      if (!isWebhookConnection) {
        const sourcePageId = params.source;
        const targetPageId = params.target;
        const sourceHandle = params.sourceHandle || 'right-source';
        
        // Find the source page to understand its structure
        const sourcePage = formPages.find(p => p.id === sourcePageId);
        if (!sourcePage) return;
        
        // Determine the appropriate logic rule key based on page type and handle
        let ruleKey = sourcePageId; // Default rule key
        
        // For pages with multiple choice fields, we need to map handles to specific choices
        if (sourcePage.fields && sourcePage.fields.length > 0) {
          const multipleChoiceField = sourcePage.fields.find(f => f.type === 'multiple-choice' || f.type === 'radio');
          if (multipleChoiceField && multipleChoiceField.choices) {
            // For multiple choice fields with the new simplified handle structure
            // We'll use the default rule key for now since we only have right-source
            ruleKey = `${sourcePageId}-${multipleChoiceField.id}`;
          }
        }
        
        // Update the logic rule
        updateLogicRule(ruleKey, targetPageId);
      }
      
      // Add the visual edge
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges, formPages, updateLogicRule]
  );

  // Handle edge reconnection
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      // Update visual edges
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
      
      // Update logic rules for the new connection (only for page-to-page connections)
      if (newConnection.source && newConnection.target) {
        const isWebhookConnection = newConnection.sourceHandle?.includes('webhook') || newConnection.targetHandle?.includes('webhook');
        
        if (!isWebhookConnection) {
          const sourcePageId = newConnection.source;
          const targetPageId = newConnection.target;
          const sourceHandle = newConnection.sourceHandle || 'right-source';
          
          // Find the source page
          const sourcePage = formPages.find(p => p.id === sourcePageId);
          if (!sourcePage) return;
          
          // Determine the logic rule key
          let ruleKey = sourcePageId;
          
          if (sourcePage.fields && sourcePage.fields.length > 0) {
            const multipleChoiceField = sourcePage.fields.find(f => f.type === 'multiple-choice' || f.type === 'radio');
            if (multipleChoiceField && multipleChoiceField.choices) {
              ruleKey = `${sourcePageId}-${multipleChoiceField.id}`;
            }
          }
          
          // Update the logic rule
          updateLogicRule(ruleKey, targetPageId);
        }
      }
    },
    [setEdges, formPages, updateLogicRule]
  );

  const onReconnectStart = useCallback(() => {
    // Optional: Add visual feedback when reconnection starts
  }, []);

  const onReconnectEnd = useCallback(() => {
    // Optional: Add visual feedback when reconnection ends
  }, []);

  const selectedPage = selectedPageId ? formPages.find(p => p.id === selectedPageId) : null;
  const currentPageIndex = formPages.findIndex(p => p.id === selectedPageId);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for pages
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = formPages.findIndex(page => page.id === active.id);
      const newIndex = formPages.findIndex(page => page.id === over.id);
      
      setFormPages(arrayMove(formPages, oldIndex, newIndex));
    }
  };

  // Handle drag end for fields within a page
  const handleFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !selectedPageId) return;

    const selectedPage = formPages.find(p => p.id === selectedPageId);
    if (!selectedPage?.fields) return;

    const oldIndex = selectedPage.fields.findIndex(field => field.id === active.id);
    const newIndex = selectedPage.fields.findIndex(field => field.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedFields = arrayMove(selectedPage.fields, oldIndex, newIndex);
    
    const updatedPages = formPages.map(p => 
      p.id === selectedPageId ? {
        ...p,
        fields: reorderedFields
      } : p
    );
    
    setFormPages(updatedPages);
  };

  // Add new page function
  const addNewPage = () => {
    const newPageId = `page-${formPages.length + 1}`;
    const defaultFieldLabel = 'New Field';
    const newPage: FormPage = {
      id: newPageId,
      type: 'form',
      title: 'New Form Page',
      content: 'Add your description here...',
      fields: [
        {
          id: generateFieldId(),
          apiName: generateApiName(defaultFieldLabel),
          type: 'short-text',
          label: defaultFieldLabel,
          placeholder: 'Enter text...',
          required: false,
        }
      ],
    };
    setFormPages([...formPages, newPage]);
    setSelectedPageId(newPageId);
  };

  // Delete page function
  const deletePage = (pageId: string) => {
    if (!hasPermission('content', 'delete')) {
      alert('You do not have permission to delete pages');
      return;
    }
    
    if (formPages.length <= 1) {
      alert('Cannot delete the last page');
      return;
    }
    
    // Get page name for confirmation
    const pageToDelete = formPages.find(p => p.id === pageId);
    if (!confirm(`Are you sure you want to delete "${pageToDelete?.name || 'this page'}"?`)) {
      return;
    }
    
    // Remove page from pages array
    const updatedPages = formPages.filter(p => p.id !== pageId);
    setFormPages(updatedPages);
    
    // Clean up logic rules that reference this page
    const updatedLogicRules = logicRules.filter(rule => 
      rule.sourcePageId !== pageId && rule.targetPageId !== pageId
    );
    setLogicRules(updatedLogicRules);
    
    // Update selected page if the deleted page was selected
    if (selectedPageId === pageId) {
      setSelectedPageId(updatedPages[0]?.id || null);
    }
    
    // If we're in workflow view, switch back to content editor
    if (activeView === 'workflow') {
      setActiveView('content');
    }
  };

  // Webhook connection functions
  const createWebhookConnection = async (connectionData: {
    name: string;
    baseUrl: string;
    authenticationKey: string;
    authenticationToken: string;
  }) => {
    try {
      console.log('Creating webhook connection:', connectionData.name);
      
      const webhookData = {
        ...connectionData,
        fieldMappings: [],
        isActive: true,
      };

      // Save to Firestore
      const webhookId = await webhookService.createWebhook(webhookData);
      
      // Create the full connection object for local state
      const newConnection: WebhookConnection = {
        id: webhookId,
        ...connectionData,
        fieldMappings: [],
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      
      setWebhookConnections(prev => [...prev, newConnection]);
      setSelectedConnectionId(webhookId);
      setShowCreateConnection(false);
      
      console.log('Webhook connection saved to Firestore with ID:', webhookId);
    } catch (error) {
      console.error('Failed to save webhook connection to Firestore:', error);
      alert('Failed to save webhook to database. It will be saved locally only.');
      // Fallback to local-only creation
      const newConnection: WebhookConnection = {
        id: `connection-${Date.now()}`,
        ...connectionData,
        fieldMappings: [],
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      
      setWebhookConnections(prev => [...prev, newConnection]);
      setSelectedConnectionId(newConnection.id);
      setShowCreateConnection(false);
    }
  };

  const deleteWebhookConnection = async (connectionId: string) => {
    try {
      console.log('Deleting webhook connection:', connectionId);
      
      // Delete from Firestore
      await webhookService.deleteWebhook(connectionId);
      
      // Update local state
      setWebhookConnections(prev => prev.filter(conn => conn.id !== connectionId));
      if (selectedConnectionId === connectionId) {
        setSelectedConnectionId(null);
      }
      
      console.log('Webhook connection deleted from Firestore');
    } catch (error) {
      console.error('Failed to delete webhook connection from Firestore:', error);
      // Still update local state even if Firestore delete fails
      setWebhookConnections(prev => prev.filter(conn => conn.id !== connectionId));
      if (selectedConnectionId === connectionId) {
        setSelectedConnectionId(null);
      }
    }
  };

  const updateWebhookConnection = async (connectionId: string, updates: Partial<WebhookConnection>) => {
    try {
      console.log('Updating webhook connection:', connectionId);
      
      // Update in Firestore
      await webhookService.updateWebhook(connectionId, updates);
      
      // Update local state
      setWebhookConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId ? { ...conn, ...updates } : conn
        )
      );
      
      console.log('Webhook connection updated in Firestore');
    } catch (error) {
      console.error('Failed to update webhook connection in Firestore:', error);
      // Still update local state even if Firestore update fails
      setWebhookConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId ? { ...conn, ...updates } : conn
        )
      );
    }
  };

  const updateFieldMapping = (connectionId: string, fieldId: string, mapping: Partial<FieldMapping>) => {
    setWebhookConnections(prev => 
      prev.map(conn => {
        if (conn.id !== connectionId) return conn;
        
        const existingMappingIndex = conn.fieldMappings.findIndex(fm => fm.fieldId === fieldId);
        const updatedMappings = [...conn.fieldMappings];
        
        if (existingMappingIndex >= 0) {
          updatedMappings[existingMappingIndex] = { ...updatedMappings[existingMappingIndex], ...mapping };
        } else {
          // Create new mapping if it doesn't exist
          const field = getAllFormFields().find(f => f.id === fieldId);
          if (field) {
            updatedMappings.push({
              fieldId,
              fieldLabel: field.label,
              apiName: field.apiName,
              webhookKey: mapping.webhookKey || field.apiName,
              enabled: mapping.enabled ?? true,
            });
          }
        }
        
        return { ...conn, fieldMappings: updatedMappings };
      })
    );
  };

  // Helper function to get all form fields from all pages
  const getAllFormFields = (): FormField[] => {
    const allFields: FormField[] = [];
    
    formPages.forEach(page => {
      if (page.fields) {
        allFields.push(...page.fields);
      }
    });
    
    return allFields;
  };

  // Webhook trigger management functions
  const createWebhookTrigger = (triggerData: Omit<WebhookTrigger, 'id'>) => {
    const newTrigger: WebhookTrigger = {
      ...triggerData,
      id: `trigger-${Date.now()}`,
    };
    
    setWebhookTriggers(prev => [...prev, newTrigger]);
    return newTrigger;
  };

  const updateWebhookTrigger = (triggerId: string, updates: Partial<WebhookTrigger>) => {
    setWebhookTriggers(prev => 
      prev.map(trigger => 
        trigger.id === triggerId ? { ...trigger, ...updates } : trigger
      )
    );
  };

  const deleteWebhookTrigger = (triggerId: string) => {
    setWebhookTriggers(prev => prev.filter(trigger => trigger.id !== triggerId));
    // Also remove the node from the flow
    setNodes(prev => prev.filter(node => node.id !== triggerId));
  };

  // Export and Import functions
  const exportWorkflow = () => {
    const workflowData = {
      formPages,
      logicRules,
      webhookConnections,
      webhookTriggers,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    const dataStr = JSON.stringify(workflowData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflowData = JSON.parse(e.target?.result as string);
        
        // Validate the imported data structure
        if (!workflowData.formPages || !Array.isArray(workflowData.formPages)) {
          alert('Invalid workflow file: Missing or invalid form pages');
          return;
        }

        // Import all the data
        setFormPages(workflowData.formPages || []);
        setLogicRules(workflowData.logicRules || {});
        setWebhookConnections(workflowData.webhookConnections || []);
        setWebhookTriggers(workflowData.webhookTriggers || []);
        
        // Reset selection and auto layout flag
        setSelectedPageId(workflowData.formPages[0]?.id || null);
        setHasAutoLayoutRun(false);
        
        alert('Workflow imported successfully!');
      } catch (error) {
        alert('Error importing workflow: Invalid JSON file');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
    
    // Clear the input so the same file can be imported again
    event.target.value = '';
  };

  // Publishing functions
  const handlePublishScript = async (scriptData: {
    name: string;
    description: string;
    theme?: Partial<PublishedScript['theme']>;
    settings?: Partial<PublishedScript['settings']>;
  }) => {
    const scriptId = `script-${Date.now()}`;
    const accessUrl = `/s/${scriptId}`;
    
    const newScript: PublishedScript = {
      id: scriptId,
      name: scriptData.name,
      description: scriptData.description,
      pages: [...formPages],
      webhookConnections: [...webhookConnections],
      publishedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      isActive: true,
      accessUrl,
      theme: {
        primaryColor: '#4285f4',
        backgroundColor: '#0a0a0a',
        textColor: '#ffffff',
        ...scriptData.theme,
      },
      settings: {
        showProgress: true,
        allowBack: true,
        autoAdvance: false,
        collectAnalytics: true,
        ...scriptData.settings,
      },
    };
    
    // Save to Firestore using the hook function
    await publishScript(newScript);
    
    // Also save to localStorage for immediate access/preview
    const localScriptData = {
      title: newScript.name,
      pages: newScript.pages,
      webhookConnections: newScript.webhookConnections || []
    };
    window.localStorage.setItem(`script-${scriptId}`, JSON.stringify(localScriptData));
    
    setShowPublishDialog(false);
    
    console.log('Published script to Firestore and localStorage:', newScript);
    return newScript;
  };

  const updatePublishedScript = (scriptId: string, updates: Partial<PublishedScript>) => {
    setPublishedScripts(prev =>
      prev.map(script =>
        script.id === scriptId
          ? { ...script, ...updates, lastUpdated: new Date().toISOString() }
          : script
      )
    );
  };

  const deletePublishedScript = async (scriptId: string) => {
    try {
      // First, delete from Firestore
      await publishedScriptService.deletePublishedScript(scriptId);
      
      // Then update local state
      setPublishedScripts(prev => prev.filter(script => script.id !== scriptId));
      
      console.log('Published script deleted successfully:', scriptId);
    } catch (error) {
      console.error('Failed to delete published script:', error);
      alert('Failed to delete script. Please try again.');
    }
  };

  const republishScript = (scriptId: string) => {
    const updatedScript = {
      pages: [...formPages],
      webhookConnections: [...webhookConnections],
      lastUpdated: new Date().toISOString(),
    };
    updatePublishedScript(scriptId, updatedScript);
  };

  // Sortable Page Item Component
  const SortablePageItem = ({ page, index }: { page: FormPage; index: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: page.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`page-item ${selectedPageId === page.id ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
        onClick={() => setSelectedPageId(page.id)}
      >
        <div 
          className="drag-handle"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </div>
        <div className="page-number">{index + 1}</div>
        <div className="page-info">
          <div className="page-title">
            {page.title}
            {page.visible === false && <span className="hidden-indicator"> (Hidden)</span>}
          </div>
          <div className="page-type">
            {page.type === 'form' && page.fields 
              ? `${page.fields.length} field${page.fields.length !== 1 ? 's' : ''}`
              : page.type.replace('-', ' ')
            }
          </div>
        </div>
        <button 
          className="delete-btn" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            deletePage(page.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  // SortableFieldItem is now defined outside App component

  // Webhook Trigger Editor Component
  const WebhookTriggerEditor = () => {
    if (!selectedTrigger) return null;

    const [formData, setFormData] = useState({
      name: selectedTrigger.name,
      connectionId: selectedTrigger.connectionId,
      triggerType: selectedTrigger.triggerType,
      isActive: selectedTrigger.isActive,
      targetPageId: '', // New field to specify which page this trigger should connect to
      condition: selectedTrigger.condition || { condition: 'equals', value: '', nextPageId: '' }
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      const updatedTrigger: WebhookTrigger = {
        ...selectedTrigger,
        name: formData.name,
        connectionId: formData.connectionId,
        triggerType: formData.triggerType,
        isActive: formData.isActive,
        condition: formData.triggerType === 'conditional' ? formData.condition : undefined
      };

      updateWebhookTrigger(selectedTrigger.id, updatedTrigger);

      // If a target page is specified, create a connection
      if (formData.targetPageId) {
        const ruleKey = `${selectedTrigger.id}-to-${formData.targetPageId}`;
        setLogicRules(prev => ({
          ...prev,
          [ruleKey]: formData.targetPageId
        }));
      }

      setShowTriggerEditor(false);
      setSelectedTrigger(null);
    };

    const handleCancel = () => {
      setShowTriggerEditor(false);
      setSelectedTrigger(null);
    };

    const handleDelete = () => {
      if (confirm('Are you sure you want to delete this webhook trigger?')) {
        deleteWebhookTrigger(selectedTrigger.id);
        setShowTriggerEditor(false);
        setSelectedTrigger(null);
      }
    };

    return (
      <div className="modal-overlay" style={{ zIndex: 9999 }}>
        <div className="modal-content webhook-trigger-editor">
          <div className="modal-header">
            <h2>Edit Webhook Trigger</h2>
            <button onClick={handleCancel} className="close-btn">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="trigger-form">
            <div className="form-section">
              <h3>Trigger Details</h3>
              
              <div className="form-group">
                <label>Trigger Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter trigger name..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Webhook Connection *</label>
                <select
                  value={formData.connectionId}
                  onChange={(e) => setFormData({ ...formData, connectionId: e.target.value })}
                  required
                >
                  <option value="">Select a connection...</option>
                  {webhookConnections.map(conn => (
                    <option key={conn.id} value={conn.id}>
                      {conn.name} {!conn.isActive ? '(Inactive)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Trigger Type *</label>
                <select
                  value={formData.triggerType}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    triggerType: e.target.value as 'on_entry' | 'on_exit' | 'conditional'
                  })}
                  required
                >
                  <option value="on_entry">On Entry - Fires when user enters a page</option>
                  <option value="on_exit">On Exit - Fires when user leaves a page</option>
                  <option value="conditional">Conditional - Fires based on form data</option>
                </select>
              </div>

              <div className="form-group">
                <label>Target Page</label>
                <select
                  value={formData.targetPageId}
                  onChange={(e) => setFormData({ ...formData, targetPageId: e.target.value })}
                >
                  <option value="">Select which page triggers this webhook...</option>
                  {formPages.map(page => (
                    <option key={page.id} value={page.id}>
                      {page.title} ({page.type})
                    </option>
                  ))}
                </select>
                <small>Choose which page this webhook should be connected to in the workflow</small>
              </div>

              {formData.triggerType === 'conditional' && (
                <div className="conditional-section">
                  <h4>Conditional Logic</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Condition</label>
                      <select
                        value={formData.condition.condition}
                        onChange={(e) => setFormData({
                          ...formData,
                          condition: {
                            ...formData.condition,
                            condition: e.target.value as 'equals' | 'contains' | 'greater_than' | 'less_than' | 'any'
                          }
                        })}
                      >
                        <option value="equals">Equals</option>
                        <option value="contains">Contains</option>
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                        <option value="any">Any Value</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Value</label>
                      <input
                        type="text"
                        value={formData.condition.value}
                        onChange={(e) => setFormData({
                          ...formData,
                          condition: {
                            ...formData.condition,
                            value: e.target.value
                          }
                        })}
                        placeholder="Enter comparison value..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active (trigger will fire when conditions are met)
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={handleDelete}
                className="btn btn-danger"
                style={{ marginRight: 'auto' }}
              >
                Delete Trigger
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Create Connection Form Component
  const CreateConnectionForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      baseUrl: '',
      authenticationKey: '',
      authenticationToken: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (formData.name && formData.baseUrl) {
        createWebhookConnection(formData);
        setFormData({ name: '', baseUrl: '', authenticationKey: '', authenticationToken: '' });
      }
    };

    const handleCancel = () => {
      setShowCreateConnection(false);
      setFormData({ name: '', baseUrl: '', authenticationKey: '', authenticationToken: '' });
    };

    return (
      <div className="create-connection-form">
        <h3>Create New Connection</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Connection name..."
              required
            />
          </div>
          
          <div className="form-group">
            <label>Base URL *</label>
            <input
              type="url"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder="https://api.example.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Authentication Key</label>
            <input
              type="text"
              value={formData.authenticationKey}
              onChange={(e) => setFormData({ ...formData, authenticationKey: e.target.value })}
              placeholder="API key header name..."
            />
          </div>
          
          <div className="form-group">
            <label>Authentication Token</label>
            <input
              type="password"
              value={formData.authenticationToken}
              onChange={(e) => setFormData({ ...formData, authenticationToken: e.target.value })}
              placeholder="API key value..."
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Connection
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Publish Dialog Component
  const PublishDialog = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      primaryColor: '#4285f4',
      showProgress: true,
      allowBack: true,
      autoAdvance: false,
      collectAnalytics: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (formData.name) {
        await handlePublishScript({
          name: formData.name,
          description: formData.description,
          theme: {
            primaryColor: formData.primaryColor,
          },
          settings: {
            showProgress: formData.showProgress,
            allowBack: formData.allowBack,
            autoAdvance: formData.autoAdvance,
            collectAnalytics: formData.collectAnalytics,
          },
        });
        setFormData({
          name: '',
          description: '',
          primaryColor: '#4285f4',
          showProgress: true,
          allowBack: true,
          autoAdvance: false,
          collectAnalytics: true,
        });
      }
    };

    const handleCancel = () => {
      setShowPublishDialog(false);
      setFormData({
        name: '',
        description: '',
        primaryColor: '#4285f4',
        showProgress: true,
        allowBack: true,
        autoAdvance: false,
        collectAnalytics: true,
      });
    };

    return (
      <div className="modal-overlay" style={{ zIndex: 9999 }}>
        <div className="modal-content publish-dialog">
          <div className="modal-header">
            <h2>Publish Sales Script</h2>
            <button onClick={handleCancel} className="close-btn">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="publish-form">
            <div className="form-section">
              <h3>Script Details</h3>
              <div className="form-group">
                <label>Script Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter script name..."
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this script..."
                  rows={3}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Appearance</h3>
              <div className="form-group">
                <label>Primary Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    placeholder="#4285f4"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Settings</h3>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.showProgress}
                    onChange={(e) => setFormData({ ...formData, showProgress: e.target.checked })}
                  />
                  Show progress indicator
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.allowBack}
                    onChange={(e) => setFormData({ ...formData, allowBack: e.target.checked })}
                  />
                  Allow users to go back
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.autoAdvance}
                    onChange={(e) => setFormData({ ...formData, autoAdvance: e.target.checked })}
                  />
                  Auto-advance after selections
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.collectAnalytics}
                    onChange={(e) => setFormData({ ...formData, collectAnalytics: e.target.checked })}
                  />
                  Collect analytics data
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Share size={16} />
                Publish Script
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderSidebar = () => {
    switch (validActiveView) {
      case 'dashboard':
        return null; // Dashboard doesn't need a sidebar
        
      case 'content':
        return (
          <div className="sidebar">
            <div className="sidebar-header">
              <h3 className="sidebar-title">Form Pages</h3>
              <button onClick={addNewPage} className="add-page-btn">
                <Plus size={16} />
              </button>
            </div>
            
            <div className="pages-list">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={formPages.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {formPages.map((page, index) => (
                    <SortablePageItem
                      key={page.id}
                      page={page}
                      index={index}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </div>
        );

      case 'data':
        const submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
        const uniqueScripts = [...new Set(submissions.map((s: any) => s.scriptName))];
        const uniqueAgents = [...new Set(submissions.map((s: any) => s.assignedToName).filter(Boolean))];
        
        return (
          <div className="sidebar">
            <div className="sidebar-header">
              <h3 className="sidebar-title">Filters</h3>
              <button 
                onClick={() => setLeadsFilters({ scriptName: '', assignedAgent: '', dateRange: '', searchText: '' })}
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              >
                Clear All
              </button>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Search</label>
              <input
                type="text"
                placeholder="Search submissions..."
                value={leadsFilters.searchText}
                onChange={(e) => setLeadsFilters(prev => ({ ...prev, searchText: e.target.value }))}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Script Name</label>
              <select
                value={leadsFilters.scriptName}
                onChange={(e) => setLeadsFilters(prev => ({ ...prev, scriptName: e.target.value }))}
                className="filter-select"
              >
                <option value="">All Scripts</option>
                {uniqueScripts.map(script => (
                  <option key={script} value={script}>{script}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Assigned Agent</label>
              <select
                value={leadsFilters.assignedAgent}
                onChange={(e) => setLeadsFilters(prev => ({ ...prev, assignedAgent: e.target.value }))}
                className="filter-select"
              >
                <option value="">All Agents</option>
                {uniqueAgents.map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Date Range</label>
              <select
                value={leadsFilters.dateRange}
                onChange={(e) => setLeadsFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="filter-select"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
          </div>
        );

      case 'workflow':
        return (
          <div className="sidebar">
            <div className="sidebar-header">
              <h3 className="sidebar-title">Workflow Logic</h3>
            </div>
            
            {selectedPage ? (
              <div className="workflow-details">
                <div className="selected-page-info">
                  <div className="page-badge">
                    <div>
                      <div className="page-title">{selectedPage.title}</div>
                      <div className="page-type">{selectedPage.type.replace('-', ' ')}</div>
                    </div>
                  </div>
                </div>

                <div className="logic-section">
                  <h4 className="section-title">Connection Rules</h4>
                  
                  {/* Handle legacy multiple-choice pages */}
                  {selectedPage.type === 'multiple-choice' && selectedPage.choices ? (
                    <div className="logic-rules">
                      {selectedPage.choices.map((choice, index) => {
                        const ruleKey = `${selectedPage.id}-${choice.id}`;
                        const currentTarget = logicRules[ruleKey] || 'end';
                        
                        return (
                          <div key={choice.id} className="logic-rule">
                            <div className="rule-condition">
                              <span className="condition-label">If customer selects:</span>
                              <span className="condition-value">"{choice.text}"</span>
                            </div>
                            <div className="rule-action">
                              <span className="action-label">Go to:</span>
                              <select 
                                className="page-select"
                                value={currentTarget}
                                onChange={(e) => updateLogicRule(ruleKey, e.target.value)}
                              >
                                {formPages.filter(page => page.visible !== false).map((page, idx) => (
                                  <option key={page.id} value={page.id}>
                                    Page {idx + 1}: {page.title}
                                  </option>
                                ))}
                                <option value="end">End Script</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : selectedPage.type === 'form' && selectedPage.fields ? (
                    <div className="logic-rules">
                      {/* Show choice-based routing for form fields with options */}
                      {selectedPage.fields
                        .filter(field => (field.options && field.options.length > 0) || (field.choices && field.choices.length > 0))
                        .map(field => (
                          <div key={field.id} className="field-logic-group">
                            <h5 className="field-logic-title">{field.label}</h5>
                            {(field.options || field.choices)?.map(option => {
                              const ruleKey = `${selectedPage.id}-${field.id}-${option.id}`;
                              const currentTarget = logicRules[ruleKey] || 'end';
                              
                              return (
                                <div key={option.id} className="logic-rule">
                                  <div className="rule-condition">
                                    <span className="condition-label">If customer selects:</span>
                                    <span className="condition-value">"{option.text || option.label}"</span>
                                  </div>
                                  <div className="rule-action">
                                    <span className="action-label">Go to:</span>
                                    <select 
                                      className="page-select"
                                      value={currentTarget}
                                      onChange={(e) => updateLogicRule(ruleKey, e.target.value)}
                                    >
                                      {formPages.filter(page => page.visible !== false).map((page, idx) => (
                                        <option key={page.id} value={page.id}>
                                          Page {idx + 1}: {page.title}
                                        </option>
                                      ))}
                                      <option value="end">End Script</option>
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      
                      {/* Default flow for pages without conditional routing */}
                      {selectedPage.fields.filter(field => (field.options && field.options.length > 0) || (field.choices && field.choices.length > 0)).length === 0 && (
                        <div className="logic-rule">
                          <div className="rule-condition">
                            <span className="condition-label">Page flow:</span>
                            <span className="condition-value">After completing this page</span>
                          </div>
                          <div className="rule-action">
                            <span className="action-label">Go to:</span>
                            <select 
                              className="page-select"
                              value={logicRules[selectedPage.id] || 'end'}
                              onChange={(e) => updateLogicRule(selectedPage.id, e.target.value)}
                            >
                              <option value="">-- Select destination --</option>
                              {formPages.filter(p => p.id !== selectedPage.id && p.visible !== false).map((page, idx) => (
                                <option key={page.id} value={page.id}>
                                  {page.title}
                                </option>
                              ))}
                              <option value="end">End Script</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="logic-rule">
                      <div className="rule-condition">
                        <span className="condition-label">Page flow:</span>
                        <span className="condition-value">After completing this page</span>
                      </div>
                      <div className="rule-action">
                        <span className="action-label">Go to:</span>
                        <select 
                          className="page-select"
                          value={logicRules[selectedPage.id] || 'end'}
                          onChange={(e) => updateLogicRule(selectedPage.id, e.target.value)}
                        >
                          <option value="">-- Select destination --</option>
                          {formPages.filter(p => p.id !== selectedPage.id && p.visible !== false).map((page, idx) => (
                            <option key={page.id} value={page.id}>
                              {page.title}
                            </option>
                          ))}
                          <option value="end">End Script</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="workflow-actions">
                  <p className="workflow-note">
                    <strong>Note:</strong> Create connections manually by dragging from one page's output to another page's input.
                  </p>
                </div>
              </div>
            ) : (
              <div className="workflow-empty">
                <Type size={32} />
                <p>Select a page to edit its workflow logic</p>
              </div>
            )}
          </div>
        );

      case 'connect':
        return (
          <div className="sidebar">
            <div className="sidebar-header">
              <h3 className="sidebar-title">Webhook Connections</h3>
              <button 
                onClick={() => setShowCreateConnection(true)} 
                className="add-page-btn"
                disabled={showCreateConnection}
              >
                <Plus size={16} />
              </button>
            </div>
            
            {showCreateConnection && <CreateConnectionForm />}
            
            <div className="connections-list">
              {webhookConnections.map((connection) => (
                <div
                  key={connection.id}
                  className={`connection-item ${selectedConnectionId === connection.id ? 'selected' : ''}`}
                  onClick={() => setSelectedConnectionId(connection.id)}
                >
                  <div className="connection-info">
                    <div className="connection-name">{connection.name}</div>
                    <div className="connection-url">{connection.baseUrl}</div>
                    <div className="connection-status">
                      <span className={`status-indicator ${connection.isActive ? 'active' : 'inactive'}`}>
                        {connection.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="delete-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWebhookConnection(connection.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              
              {webhookConnections.length === 0 && !showCreateConnection && (
                <div className="empty-state">
                  <p>No webhook connections yet. Create your first connection to get started.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'share':
        return (
          <div className="sidebar">
            <div className="sidebar-header">
              <h3 className="sidebar-title">Published Scripts</h3>
              <button 
                onClick={() => setShowPublishDialog(true)} 
                className="add-page-btn"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div className="published-scripts-list">
              {publishedScripts.map((script) => (
                <div
                  key={script.id}
                  className={`published-script-item ${selectedScriptId === script.id ? 'selected' : ''}`}
                  onClick={() => setSelectedScriptId(script.id)}
                >
                  <div className="script-info">
                    <div className="script-name">{script.name}</div>
                    <div className="script-description">{script.description}</div>
                    <div className="script-meta">
                      <span className={`script-status ${script.isActive ? 'active' : 'inactive'}`}>
                        {script.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="script-date">
                        Updated {new Date(script.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="script-url">
                      <code>{window.location.origin}{script.accessUrl}</code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}${script.accessUrl}`);
                          // TODO: Show toast notification
                        }}
                        className="copy-url-btn"
                        title="Copy URL"
                      >
                        <Share2 size={12} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="script-actions">
                    <button
                      onClick={() => updatePublishedScript(script.id, { isActive: !script.isActive })}
                      className={`toggle-btn ${script.isActive ? 'active' : 'inactive'}`}
                      title={script.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {script.isActive ? 'Active' : 'Inactive'}
                    </button>
                    
                    <button
                      onClick={() => republishScript(script.id)}
                      className="republish-btn"
                      title="Update with current content"
                    >
                      <Zap size={14} />
                    </button>
                    
                    <button 
                      className="delete-btn" 
                      onClick={() => deletePublishedScript(script.id)}
                      title="Delete script"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              
              {publishedScripts.length === 0 && (
                <div className="empty-state">
                  <Share size={48} />
                  <h3>No Published Scripts</h3>
                  <p>Click the + button to publish your first sales script.</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="sidebar">
            <h3 className="sidebar-title">
              {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
            </h3>
            <p className="coming-soon">Coming soon...</p>
          </div>
        );
    }
  };

  const renderMainContent = () => {
    if (activeView === 'dashboard') {
      return (
        <div className="main-content dashboard-wrapper">
          <Dashboard />
        </div>
      );
    }
    
    if (activeView === 'workflow') {
      return (
        <ReactFlowProvider>
          <div className="main-content">
            <div className="workflow-header">
              <h2 className="workflow-title">Call Script Workflow</h2>
              <div className="workflow-controls">
                {hasPermission('content', 'create') && (
                  <button 
                    onClick={createPage}
                    className="btn btn-secondary workflow-btn"
                    title="Add Page"
                  >
                    <Plus size={14} />
                  </button>
                )}
                <button 
                  onClick={autoLayout}
                  className="btn btn-secondary workflow-btn"
                  title="Auto Layout"
                >
                  <LayoutGrid size={14} />
                </button>
                <button 
                  onClick={() => {
                    // Create a webhook trigger cycling through available connections
                    if (webhookConnections.length === 0) {
                      alert('Please create a webhook connection first in the Connect view.');
                      return;
                    }
                    
                    // Cycle through different trigger types and connections
                    const triggerTypes: Array<'on_entry' | 'on_exit' | 'conditional'> = ['on_entry', 'on_exit', 'conditional'];
                    const connectionIndex = webhookTriggers.length % webhookConnections.length;
                    const triggerTypeIndex = webhookTriggers.length % triggerTypes.length;
                    
                    createWebhookTrigger({
                      name: `${webhookConnections[connectionIndex].name} Trigger`,
                      connectionId: webhookConnections[connectionIndex].id,
                      triggerType: triggerTypes[triggerTypeIndex],
                      isActive: Math.random() > 0.3, // 70% chance of being active for demo variety
                    });
                  }}
                  className="btn btn-secondary workflow-btn"
                  title="Add Webhook"
                >
                  <Zap size={14} />
                </button>
                <button 
                  onClick={handlePreview}
                  className="btn btn-primary workflow-btn"
                  title="Test Flow"
                >
                  <Play size={14} />
                </button>
              
              {/* Import/Export section */}
              {(hasPermission('workflow', 'export') || hasPermission('workflow', 'update')) && (
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '1rem', marginLeft: '1rem', display: 'flex', gap: '0.5rem' }}>
                  {hasPermission('workflow', 'export') && (
                    <button 
                      onClick={exportWorkflow}
                      className="btn btn-secondary workflow-btn"
                      title="Export Workflow"
                    >
                      <Download size={14} />
                    </button>
                  )}
                  
                  {hasPermission('workflow', 'update') && (
                    <label className="btn btn-secondary workflow-btn" style={{ margin: 0, cursor: 'pointer' }} title="Import Workflow">
                      <Upload size={14} />
                      <input
                        type="file"
                        accept=".json"
                        onChange={importWorkflow}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
            </div>
            
            <div className="workflow-canvas">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onReconnect={onReconnect}
                onReconnectStart={onReconnectStart}
                onReconnectEnd={onReconnectEnd}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionMode={ConnectionMode.Strict}
                snapToGrid
                snapGrid={[20, 20]}
                defaultViewport={{ x: 0, y: 0, zoom: 0.3 }}
                onNodeClick={(_, node) => setSelectedPageId(node.id)}
                minZoom={0.05}
                maxZoom={2}
                fitViewOptions={{ padding: 0.2 }}
              >
                <Background 
                  color="#4a5568" 
                  gap={20} 
                  size={1}
                  variant={BackgroundVariant.Dots} 
                />
                <Controls 
                  showZoom={true}
                  showFitView={true}
                  showInteractive={true}
                />
                <MiniMap 
                  nodeColor={(node) => {
                    if (node.data?.isSelected) return '#f59e0b';
                    switch (node.data?.page?.type) {
                      case 'welcome': return '#10b981';
                      case 'ending': return '#ef4444';
                      case 'multiple-choice': return '#8b5cf6';
                      default: return '#4285f4';
                    }
                  }}
                  maskColor="rgba(26, 32, 44, 0.8)"
                />
              </ReactFlow>
            </div>
          </div>
        </ReactFlowProvider>
      );
    }

    if (activeView === 'data') {
      // Get form submissions from localStorage
      const allSubmissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
      
      // Filter submissions based on current filters
      const filteredSubmissions = allSubmissions.filter((submission: any) => {
        // Search text filter
        if (leadsFilters.searchText) {
          const searchLower = leadsFilters.searchText.toLowerCase();
          const searchableText = [
            submission.id,
            submission.scriptName,
            submission.assignedToName,
            JSON.stringify(submission.data)
          ].join(' ').toLowerCase();
          
          if (!searchableText.includes(searchLower)) {
            return false;
          }
        }
        
        // Script name filter
        if (leadsFilters.scriptName && submission.scriptName !== leadsFilters.scriptName) {
          return false;
        }
        
        // Assigned agent filter
        if (leadsFilters.assignedAgent && submission.assignedToName !== leadsFilters.assignedAgent) {
          return false;
        }
        
        // Date range filter
        if (leadsFilters.dateRange) {
          const submissionDate = new Date(submission.submittedAt);
          const now = new Date();
          
          switch (leadsFilters.dateRange) {
            case 'today':
              if (submissionDate.toDateString() !== now.toDateString()) {
                return false;
              }
              break;
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              if (submissionDate < weekAgo) {
                return false;
              }
              break;
            case 'month':
              const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
              if (submissionDate < monthAgo) {
                return false;
              }
              break;
            case 'quarter':
              const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
              if (submissionDate < quarterAgo) {
                return false;
              }
              break;
          }
        }
        
        return true;
      });

      return (
        <div className="main-content">
          <div className="data-view">
            <div className="data-header">
              <h2 className="data-title">Form Submissions</h2>
              <div className="results-count">
                {filteredSubmissions.length} of {allSubmissions.length} submissions
              </div>
            </div>
            
            {allSubmissions.length === 0 ? (
              <div className="empty-state">
                <Database size={48} />
                <h3>No Submissions Yet</h3>
                <p>Form submissions will appear here when users complete published scripts.</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="empty-state">
                <Database size={48} />
                <h3>No Matching Submissions</h3>
                <p>No submissions match your current filters. Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="data-table">
                <div className="table-header">
                  <div>Submission ID</div>
                  <div>Script Name</div>
                  <div>Assigned Agent</div>
                  <div>Submitted At</div>
                  <div>Data Preview</div>
                  <div>Actions</div>
                </div>
                {filteredSubmissions.map((submission: any) => (
                  <div key={submission.id} className="table-row">
                    <div>{submission.id.substring(0, 8)}...</div>
                    <div>{submission.scriptName}</div>
                    <div>{submission.assignedToName || 'Unknown Agent'}</div>
                    <div>{new Date(submission.submittedAt).toLocaleString()}</div>
                    <div>
                      {Object.keys(submission.data).length} fields submitted
                    </div>
                    <div>
                      <button 
                        className="btn btn-sm"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Submission Detail Modal */}
          {selectedSubmission && (
            <div className="modal-overlay" onClick={() => setSelectedSubmission(null)}>
              <div className="modal-content submission-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Submission Details</h3>
                  <button className="modal-close" onClick={() => setSelectedSubmission(null)}>
                    <X size={20} />
                  </button>
                </div>
                
                <div className="modal-body">
                  <div className="submission-info">
                    <div className="info-row">
                      <span className="info-label">Submission ID:</span>
                      <span className="info-value">{selectedSubmission.id}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Script Name:</span>
                      <span className="info-value">{selectedSubmission.scriptName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Submitted At:</span>
                      <span className="info-value">{new Date(selectedSubmission.submittedAt).toLocaleString()}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">User Agent:</span>
                      <span className="info-value" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                        {selectedSubmission.userAgent}
                      </span>
                    </div>
                  </div>
                  
                  <div className="submission-data">
                    <h4>Lead Data</h4>
                    <div className="data-fields">
                      {Object.entries(selectedSubmission.data).map(([key, value]) => (
                        <div key={key} className="data-field">
                          <span className="field-key">{key}:</span>
                          <span className="field-value">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setSelectedSubmission(null)}>
                    Close
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      const dataStr = JSON.stringify(selectedSubmission, null, 2);
                      const blob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `submission-${selectedSubmission.id}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Export JSON
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeView === 'users') {
      return <UsersView />;
    }

    if (activeView === 'roles') {
      return <RolesView />;
    }

    if (activeView === 'connect') {
      const selectedConnection = webhookConnections.find(conn => conn.id === selectedConnectionId);
      const allFields = getAllFormFields();

      return (
        <div className="main-content connect-view">
          {selectedConnection ? (
            <div className="connection-editor">
              <div className="editor-header">
                <h2>Configure Connection: {selectedConnection.name}</h2>
                <div className="connection-status">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={selectedConnection.isActive}
                      onChange={(e) => updateWebhookConnection(selectedConnection.id, { isActive: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">{selectedConnection.isActive ? 'Active' : 'Inactive'}</span>
                  </label>
                </div>
              </div>

              <div className="connection-sections">
                {/* Section 1: Connection Details */}
                <div className="connection-section">
                  <h3>Connection Details</h3>
                  <div className="connection-details">
                    <div className="detail-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={selectedConnection.name}
                        onChange={(e) => updateWebhookConnection(selectedConnection.id, { name: e.target.value })}
                      />
                    </div>
                    
                    <div className="detail-group">
                      <label>Base URL</label>
                      <input
                        type="url"
                        value={selectedConnection.baseUrl}
                        onChange={(e) => updateWebhookConnection(selectedConnection.id, { baseUrl: e.target.value })}
                      />
                    </div>
                    
                    <div className="detail-group">
                      <label>Authentication Key</label>
                      <input
                        type="text"
                        value={selectedConnection.authenticationKey}
                        onChange={(e) => updateWebhookConnection(selectedConnection.id, { authenticationKey: e.target.value })}
                        placeholder="API key header name..."
                      />
                    </div>
                    
                    <div className="detail-group">
                      <label>Authentication Token</label>
                      <input
                        type="password"
                        value={selectedConnection.authenticationToken}
                        onChange={(e) => updateWebhookConnection(selectedConnection.id, { authenticationToken: e.target.value })}
                        placeholder="API key value..."
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Field Mappings */}
                <div className="connection-section">
                  <h3>Field Mappings</h3>
                  <div className="field-mappings">
                    <div className="mappings-header">
                      <div>Field Name</div>
                      <div>API Name</div>
                      <div>Webhook Key</div>
                      <div>Enabled</div>
                    </div>
                    
                    {allFields.map((field) => {
                      const mapping = selectedConnection.fieldMappings.find(fm => fm.fieldId === field.id);
                      const webhookKey = mapping?.webhookKey || field.apiName;
                      const isEnabled = mapping?.enabled ?? true;
                      
                      return (
                        <div key={field.id} className="mapping-row">
                          <div className="field-name">{field.label}</div>
                          <div className="api-name">{field.apiName}</div>
                          <div className="webhook-key">
                            <input
                              type="text"
                              value={webhookKey}
                              onChange={(e) => updateFieldMapping(selectedConnection.id, field.id, { webhookKey: e.target.value })}
                              placeholder={field.apiName}
                            />
                          </div>
                          <div className="mapping-enabled">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(e) => updateFieldMapping(selectedConnection.id, field.id, { enabled: e.target.checked })}
                            />
                          </div>
                        </div>
                      );
                    })}
                    
                    {allFields.length === 0 && (
                      <div className="no-fields">
                        <p>No form fields available. Create form pages with fields to configure mappings.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Webhook size={48} />
              <h3>Select a Connection</h3>
              <p>Choose a webhook connection from the sidebar to configure its settings and field mappings.</p>
            </div>
          )}
        </div>
      );
    }

    if (validActiveView === 'share') {
      const selectedScript = publishedScripts.find(script => script.id === selectedScriptId);
      
      return (
        <div className="main-content">
          {selectedScript ? (
            <div className="active-script-view">
              <div className="script-header">
                <div className="script-info">
                  <h2>{selectedScript.name}</h2>
                  <p>{selectedScript.description}</p>
                </div>
                <button 
                  className="start-call-btn"
                  onClick={() => handleStartLiveCall(selectedScript)}
                >
                  <Play size={16} />
                  Start Call
                </button>
              </div>
              
              <div className="script-preview-container">
                <EmbeddedPreview 
                  pages={selectedScript.pages}
                  logicRules={{}}
                />
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Share size={48} />
              <h3>Select a Script</h3>
              <p>Choose an active script from the sidebar to preview and start calls.</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="main-content">
        {selectedPage ? (
          <div className="page-editor">
            <div className="editor-header">
              <h2>Edit Page: {selectedPage.title}</h2>
              <button 
                onClick={handlePreview}
                className="preview-btn"
              >
                <Play size={16} />
                Preview
              </button>
            </div>

            <div className="editor-form">
              <div className="form-row">
                <label>Page Title</label>
                <input
                  type="text"
                  value={selectedPage.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    const updatedPages = formPages.map(p => 
                      p.id === selectedPageId ? { ...p, title: newTitle } : p
                    );
                    setFormPages(updatedPages);
                  }}
                  key={`title-${selectedPageId}`} // Add key to prevent React reconciliation issues
                />
              </div>

              <div className="form-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedPage.visible !== false} // Default to true if undefined
                    onChange={(e) => {
                      const isVisible = e.target.checked;
                      const updatedPages = formPages.map(p => 
                        p.id === selectedPageId ? { ...p, visible: isVisible } : p
                      );
                      setFormPages(updatedPages);
                    }}
                  />
                  <span>Visible in workflow</span>
                </label>
                <small className="field-help">Uncheck to hide this page from the public form flow without deleting it</small>
              </div>

              <div className="form-row">
                <label>Page Type</label>
                <select
                  value={selectedPage.type}
                  onChange={(e) => {
                    const newType = e.target.value as PageType;
                    const updatedPages = formPages.map(p => 
                      p.id === selectedPageId ? { 
                        ...p, 
                        type: newType,
                        fields: newType === 'form' ? (p.fields || []) : undefined
                      } : p
                    );
                    setFormPages(updatedPages);
                  }}
                >
                  <option value="welcome">Welcome Page</option>
                  <option value="form">Form Page</option>
                  <option value="ending">Ending Page</option>
                </select>
              </div>

              <div className="form-row">
                <label>Page Description</label>
                <textarea
                  value={selectedPage.content || ''}
                  onChange={(e) => {
                    const newContent = e.target.value;
                    const updatedPages = formPages.map(p => 
                      p.id === selectedPageId ? { ...p, content: newContent } : p
                    );
                    setFormPages(updatedPages);
                  }}
                  key={`content-${selectedPageId}`} // Add key to prevent React reconciliation issues
                  rows={3}
                  placeholder="Add a description or instructions for this page..."
                />
              </div>

              {selectedPage.type === 'form' && (
                <div className="fields-section">
                  <div className="fields-header">
                    <h3>Form Fields</h3>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        const newFieldLabel = 'New Field';
                        const existingFields = selectedPage.fields || [];
                        const newField = {
                          id: generateFieldId(),
                          apiName: generateApiName(newFieldLabel),
                          type: 'short-text' as FieldType,
                          label: newFieldLabel,
                          placeholder: 'Enter text...',
                          required: false,
                        };
                        const updatedPages = formPages.map(p => 
                          p.id === selectedPageId ? {
                            ...p,
                            fields: [...existingFields, newField]
                          } : p
                        );
                        setFormPages(updatedPages);
                      }}
                    >
                      <Plus size={16} />
                      Add Field
                    </button>
                  </div>

                  <div className="fields-list">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleFieldDragEnd}
                    >
                      <SortableContext
                        items={selectedPage.fields?.map(f => f.id) || []}
                        strategy={verticalListSortingStrategy}
                      >
                        {selectedPage.fields?.map((field, fieldIndex) => (
                          <SortableFieldItem
                            key={field.id}
                            field={field}
                            fieldIndex={fieldIndex}
                            selectedPageId={selectedPageId}
                            formPages={formPages}
                            onUpdateField={updateField}
                            onDeleteField={deleteField}
                            generateApiName={generateApiName}
                            ensureUniqueApiName={ensureUniqueApiName}
                            zillowConnections={zillowConnections}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <Type size={48} />
            <h3>Select a page to edit</h3>
            <p>Choose a page from the sidebar to customize its content</p>
          </div>
        )}
      </div>
    );
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <Loader size={48} className="spinning" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className={`app ${activeView === 'dashboard' ? 'dashboard-view' : ''}`}>
      {/* Publish Dialog */}
      {showPublishDialog && <PublishDialog />}
      
      {/* Webhook Trigger Editor */}
      {showTriggerEditor && <WebhookTriggerEditor />}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <img src={logoImage} alt="Sales-Forth Logo" width="32" height="32" />
            </div>
            <div className="header-title">
              <h1>Go-Forth Lead Manager</h1>
              <span>Sales Scripts & Lead Management</span>
            </div>
          </div>
          <div className="header-right">
            <button 
              onClick={handlePreview}
              className="btn btn-primary"
            >
              <Play size={16} />
              Preview
            </button>
            <button 
              onClick={() => setShowPublishDialog(true)}
              className="btn btn-secondary"
            >
              <Share size={16} />
              Publish
            </button>
            
            <div className="user-menu">
              <div className="user-info">
                {user?.avatar && (
                  <img 
                    src={user.avatar} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="user-avatar"
                    width="32"
                    height="32"
                  />
                )}
                <div className="user-details">
                  <span className="user-name">{user?.firstName} {user?.lastName}</span>
                  <span className="user-role">{user?.roleId}</span>
                </div>
              </div>
              <button 
                onClick={logout}
                className="logout-btn"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav">
        {[
          { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
          ...(hasModuleAccess('content') ? [{ id: 'content', icon: Type, label: 'Content' }] : []),
          ...(hasModuleAccess('workflow') ? [{ id: 'workflow', icon: Zap, label: 'Workflow' }] : []),
          ...(hasModuleAccess('connect') ? [{ id: 'connect', icon: Webhook, label: 'Connect' }] : []),
          ...(hasModuleAccess('share') ? [{ id: 'share', icon: Share2, label: 'Active Scripts' }] : []),
          ...(hasModuleAccess('leads') ? [{ id: 'data', icon: Database, label: 'Leads' }] : []),
          ...(hasModuleAccess('users') ? [{ id: 'users', icon: Users, label: 'Users' }] : []),
          ...(hasModuleAccess('roles') ? [{ id: 'roles', icon: Shield, label: 'Roles' }] : []),
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`nav-tab ${validActiveView === tab.id ? 'active' : ''}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Main Layout */}
      <div className="layout">
        {renderSidebar()}
        {renderMainContent()}
      </div>
    </div>
  );
}

export default App;