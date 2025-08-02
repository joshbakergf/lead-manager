import React, { useState } from 'react';
import { PublishedScript } from '../types';
import { FormPreview } from './FormPreview';

interface PublishedScriptViewerProps {
  script: PublishedScript;
}

export const PublishedScriptViewer: React.FC<PublishedScriptViewerProps> = ({ script }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const handleNavigate = (pageIndex: number) => {
    setCurrentPageIndex(pageIndex);
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    // Store submission in admin system for data view
    const submission = {
      id: `submission-${Date.now()}`,
      scriptId: script.id,
      scriptName: script.name,
      submittedAt: new Date().toISOString(),
      data: formData,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };

    // Store locally for admin data view (in a real app, this would be sent to a backend)
    const existingSubmissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
    existingSubmissions.push(submission);
    localStorage.setItem('formSubmissions', JSON.stringify(existingSubmissions));

    // Also submit to webhooks if configured
    const activeConnections = script.webhookConnections.filter(conn => conn.isActive);
    
    for (const connection of activeConnections) {
      try {
        const payload: Record<string, any> = {};
        
        // Map form data using field mappings
        connection.fieldMappings.forEach(mapping => {
          if (mapping.enabled && formData[mapping.fieldId] !== undefined) {
            payload[mapping.webhookKey] = formData[mapping.fieldId];
          }
        });

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (connection.authenticationKey && connection.authenticationToken) {
          headers[connection.authenticationKey] = connection.authenticationToken;
        }

        await fetch(connection.baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        console.log(`Submitted to ${connection.name}:`, payload);
      } catch (error) {
        console.error(`Failed to submit to ${connection.name}:`, error);
      }
    }
    
    setIsComplete(true);
  };


  if (isComplete) {
    return (
      <div style={{
        minHeight: '100vh',
        background: script.theme.backgroundColor,
        color: script.theme.textColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: script.theme.primaryColor }}>
            Thank You!
          </h1>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.6, opacity: 0.9 }}>
            Your information has been submitted successfully. Our team will be in touch with you soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FormPreview
      pages={script.pages}
      currentPage={currentPageIndex}
      onNavigate={handleNavigate}
      fullPage={true}
      theme={script.theme}
      settings={script.settings}
      scriptName={script.name}
      onSubmit={handleSubmit}
    />
  );
};