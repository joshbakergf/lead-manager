import { useState, useEffect } from 'react';
import { FormPage, PublishedScript, WebhookTrigger } from '../types';
import { scriptService, leadService, workflowService, publishedScriptService } from '../lib/firestore';
import { useAuth } from '../contexts/AuthContext';

export const useAppData = () => {
  const { isAuthenticated, user } = useAuth();
  const [pages, setPages] = useState<FormPage[]>([]);
  const [publishedScripts, setPublishedScripts] = useState<PublishedScript[]>([]);
  const [webhookTriggers, setWebhookTriggers] = useState<WebhookTrigger[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Firestore when user is authenticated - no localStorage fallback
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Clear any localStorage conflicts when not authenticated
      localStorage.removeItem('publishedScripts');
      setPublishedScripts([]);
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        console.log('Loading published scripts from Firestore only...');
        
        // Load published scripts from Firestore only
        const scripts = await publishedScriptService.getActiveScripts();
        setPublishedScripts(scripts);
        console.log('Loaded published scripts from Firestore:', scripts.length);

        // Clear any conflicting localStorage data to prevent resurrection
        localStorage.removeItem('publishedScripts');

        // Initialize other data
        setWebhookTriggers([]);
        console.log('Data loaded successfully, localStorage cleared');
        
      } catch (error) {
        console.error('Failed to load data from Firestore:', error);
        // Start with empty state instead of localStorage fallback
        setPublishedScripts([]);
        setWebhookTriggers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user]);

  // localStorage functions removed to prevent data conflicts
  // All data now managed through Firestore only

  // Save script to Firestore
  const saveScript = async (scriptData: any, scriptId: string) => {
    // Save to localStorage immediately for instant access (preview/live scripts)
    try {
      // Format data to match what getScriptData expects
      const localStorageData = {
        pages: scriptData.pages || [],
        logicRules: scriptData.logicRules || {},
        title: scriptData.title,
        description: scriptData.description
      };
      localStorage.setItem(`script-${scriptId}`, JSON.stringify(localStorageData));
      console.log('Script saved to localStorage for immediate access:', scriptId, localStorageData);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }

    if (!isAuthenticated || !user) {
      console.warn('User not authenticated, cannot save to Firestore');
      return;
    }

    try {
      console.log('Saving script to Firestore:', scriptId);
      
      const scriptToSave = {
        name: scriptData.title || 'Untitled Script',
        pages: scriptData.pages || [],
        createdBy: user.id
      };

      await scriptService.createScript(scriptToSave);
      console.log('Script saved to Firestore successfully');
      
    } catch (error) {
      console.error('Failed to save script to Firestore:', error);
      // Don't throw error since localStorage save succeeded
      console.log('Continuing with localStorage-only save for preview/live functionality');
    }
  };

  // Publish script
  const publishScript = async (script: PublishedScript) => {
    if (!isAuthenticated || !user) {
      console.warn('User not authenticated, cannot publish script');
      return;
    }

    try {
      console.log('Publishing script to Firestore:', script.name);
      
      const scriptToPublish = {
        name: script.name,
        description: script.description,
        pages: script.pages,
        webhookConnections: script.webhookConnections || [],
        theme: script.theme,
        settings: script.settings,
        lastUpdated: new Date().toISOString()
      };

      const publishedId = await publishedScriptService.publishScript(scriptToPublish);
      
      // Update local state with the new ID
      const publishedScript = {
        ...script,
        id: publishedId,
        publishedAt: new Date().toISOString(),
        isActive: true
      };
      
      setPublishedScripts(prev => [...prev, publishedScript]);

      console.log('Script published to Firestore successfully with ID:', publishedId);
      
    } catch (error) {
      console.error('Failed to publish script to Firestore:', error);
      // No localStorage fallback to avoid data conflicts
      throw error; // Re-throw so calling code can handle the error
    }
  };

  // Save form submission (lead)
  const saveFormSubmission = async (submission: any) => {
    if (!isAuthenticated || !user) {
      console.warn('User not authenticated, cannot save form submission');
      return;
    }

    try {
      console.log('Saving form submission to Firestore');
      
      const leadData = {
        ...submission,
        submittedBy: submission.submittedBy || 'anonymous',
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await leadService.createLead(leadData);
      console.log('Form submission saved to Firestore successfully');
      
    } catch (error) {
      console.error('Failed to save form submission to Firestore:', error);
      // Fallback to localStorage
      const existingSubmissions = localStorage.getItem('formSubmissions');
      const submissions = existingSubmissions ? JSON.parse(existingSubmissions) : [];
      submissions.push(submission);
      localStorage.setItem('formSubmissions', JSON.stringify(submissions));
    }
  };

  // Save workflow
  const saveWorkflow = async (workflow: WebhookTrigger) => {
    if (!isAuthenticated || !user) {
      console.warn('User not authenticated, cannot save workflow');
      return;
    }

    try {
      console.log('Saving workflow to Firestore:', workflow.id);
      
      const workflowData = {
        ...workflow,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await workflowService.saveWorkflow(workflow.id, workflowData);
      
      // Update local state
      setWebhookTriggers(prev => {
        const existing = prev.find(w => w.id === workflow.id);
        if (existing) {
          return prev.map(w => w.id === workflow.id ? workflowData : w);
        } else {
          return [...prev, workflowData];
        }
      });

      console.log('Workflow saved to Firestore successfully');
      
    } catch (error) {
      console.error('Failed to save workflow to Firestore:', error);
    }
  };

  return {
    pages,
    setPages,
    publishedScripts,
    setPublishedScripts,
    webhookTriggers,
    setWebhookTriggers,
    isLoading,
    saveScript,
    publishScript,
    saveFormSubmission,
    saveWorkflow
  };
};