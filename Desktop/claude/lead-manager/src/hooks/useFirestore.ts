import { useState, useEffect } from 'react';
import { 
  scriptService, 
  leadService, 
  publishedScriptService,
  webhookService,
  workflowService 
} from '../lib/firestore';
import { FormPage, FormSubmission, PublishedScript, WebhookConnection } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Hook for managing scripts
export const useScripts = () => {
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = scriptService.subscribeToScripts((scripts) => {
      setScripts(scripts);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const createScript = async (name: string, pages: FormPage[]) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const scriptId = await scriptService.createScript({
        name,
        pages,
        createdBy: user.id
      });
      return scriptId;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateScript = async (scriptId: string, updates: { name?: string; pages?: FormPage[] }) => {
    try {
      await scriptService.updateScript(scriptId, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteScript = async (scriptId: string) => {
    try {
      await scriptService.deleteScript(scriptId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    scripts,
    loading,
    error,
    createScript,
    updateScript,
    deleteScript
  };
};

// Hook for managing leads
export const useLeads = () => {
  const [leads, setLeads] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = leadService.subscribeToLeads((leads) => {
      setLeads(leads);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const createLead = async (leadData: Omit<FormSubmission, 'id'>) => {
    try {
      const leadId = await leadService.createLead(leadData);
      return leadId;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateLead = async (leadId: string, updates: Partial<FormSubmission>) => {
    try {
      await leadService.updateLead(leadId, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    leads,
    loading,
    error,
    createLead,
    updateLead
  };
};

// Hook for managing published scripts
export const usePublishedScripts = () => {
  const [publishedScripts, setPublishedScripts] = useState<PublishedScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = publishedScriptService.subscribeToActiveScripts((scripts) => {
      setPublishedScripts(scripts);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const publishScript = async (scriptData: Omit<PublishedScript, 'id' | 'publishedAt' | 'accessUrl'>) => {
    try {
      const scriptId = await publishedScriptService.publishScript(scriptData);
      return scriptId;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    publishedScripts,
    loading,
    error,
    publishScript
  };
};

// Hook for managing webhooks
export const useWebhooks = () => {
  const [webhooks, setWebhooks] = useState<WebhookConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, hasModuleAccess } = useAuth();

  useEffect(() => {
    if (!user || !hasModuleAccess('connect')) return;

    const loadWebhooks = async () => {
      try {
        const webhookList = await webhookService.getWebhooks();
        setWebhooks(webhookList);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadWebhooks();
  }, [user, hasModuleAccess]);

  const createWebhook = async (webhookData: Omit<WebhookConnection, 'id' | 'createdAt'>) => {
    try {
      const webhookId = await webhookService.createWebhook(webhookData);
      // Reload webhooks
      const updatedWebhooks = await webhookService.getWebhooks();
      setWebhooks(updatedWebhooks);
      return webhookId;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateWebhook = async (webhookId: string, updates: Partial<WebhookConnection>) => {
    try {
      await webhookService.updateWebhook(webhookId, updates);
      // Reload webhooks
      const updatedWebhooks = await webhookService.getWebhooks();
      setWebhooks(updatedWebhooks);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    try {
      await webhookService.deleteWebhook(webhookId);
      // Reload webhooks
      const updatedWebhooks = await webhookService.getWebhooks();
      setWebhooks(updatedWebhooks);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    webhooks,
    loading,
    error,
    createWebhook,
    updateWebhook,
    deleteWebhook
  };
};

// Hook for managing workflows
export const useWorkflow = (scriptId: string | null) => {
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scriptId) {
      setWorkflow(null);
      setLoading(false);
      return;
    }

    const loadWorkflow = async () => {
      try {
        const workflowData = await workflowService.getWorkflow(scriptId);
        setWorkflow(workflowData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadWorkflow();
  }, [scriptId]);

  const saveWorkflow = async (workflowData: any) => {
    if (!scriptId) throw new Error('No script ID provided');
    
    try {
      await workflowService.saveWorkflow(scriptId, workflowData);
      setWorkflow(workflowData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    workflow,
    loading,
    error,
    saveWorkflow
  };
};