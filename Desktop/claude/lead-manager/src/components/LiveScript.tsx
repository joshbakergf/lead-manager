import React, { useState, useEffect } from 'react';
import { FormPage, PublishedScript, FormSubmission } from '../types';
import { AlertTriangle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import logoImage from '../assets/logo.png';
import { EnhancedAddressField } from './EnhancedAddressField';
// PaymentField removed - using simple credit card fields instead
import { useAuth } from '../contexts/AuthContext';
import { backendService } from '../services/backendService';
import { lexicalStateToHtml } from './ContentEditor';

interface LiveScriptProps {
  script: PublishedScript;
  onComplete: (submission: FormSubmission) => void;
  onClose: () => void;
}

export const LiveScript: React.FC<LiveScriptProps> = ({ script, onComplete, onClose }) => {
  const { user } = useAuth();
  const [pages, setPages] = useState<FormPage[]>(script.pages.filter(page => page.visible !== false));
  const [currentPageId, setCurrentPageId] = useState<string | null>(pages[0]?.id || null);
  const [pageHistory, setPageHistory] = useState<string[]>(pages[0] ? [pages[0].id] : []);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentPage = pages.find(page => page.id === currentPageId);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Function to process merge variables in text
  const processMergeVariables = (text: string): string => {
    if (!text) return text;
    
    // Replace merge variables with actual values from formData
    return text.replace(/\{\{([^}]+)\}\}/g, (match, fieldReference) => {
      const fieldRef = fieldReference.trim();
      
      // Check for user-specific variables first
      if (user) {
        switch (fieldRef) {
          case 'user.firstName':
          case 'agentFirstName':
            return user.firstName || match;
          case 'user.lastName':
          case 'agentLastName':
            return user.lastName || match;
          case 'user.fullName':
          case 'agentFullName':
          case 'agentName':
            return `${user.firstName} ${user.lastName}`.trim() || match;
          case 'user.email':
          case 'agentEmail':
            return user.email || match;
          case 'user.username':
          case 'agentUsername':
            return user.username || match;
        }
      }
      
      // Try to find the value by field ID first
      if (formData[fieldRef]) {
        return formData[fieldRef];
      }
      
      // Try to find by field label or apiName
      for (const page of pages) {
        if (page.fields) {
          for (const field of page.fields) {
            if (field.label === fieldRef || field.apiName === fieldRef || field.id === fieldRef) {
              return formData[field.id] || match; // Return original if no value
            }
          }
        }
      }
      
      // If no match found, return the original merge variable
      return match;
    });
  };

  // Function to determine the next page based on logic rules (simplified)
  const getNextPageId = () => {
    if (!currentPageId || !currentPage) return null;
    
    // Default: go to next page in sequence
    const currentIndex = pages.findIndex(page => page.id === currentPageId);
    if (currentIndex >= 0 && currentIndex < pages.length - 1) {
      return pages[currentIndex + 1].id;
    }
    
    return null;
  };

  const canProceed = () => {
    if (!currentPage || !currentPage.fields) {
      return true;
    }
    
    // Check if all required fields are filled
    return currentPage.fields.every(field => {
      if (!field.required) return true;
      const value = formData[field.id];
      return field.type === 'checkbox' ? value === true : value && value.toString().trim() !== '';
    });
  };

  const handleNext = () => {
    if (!canProceed()) {
      alert('Please fill in all required fields before continuing.');
      return;
    }
    
    const nextPageId = getNextPageId();
    if (nextPageId) {
      setCurrentPageId(nextPageId);
      setPageHistory(prev => [...prev, nextPageId]);
    } else {
      // End of script - submit
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (pageHistory.length > 1) {
      const newHistory = [...pageHistory];
      newHistory.pop(); // Remove current page
      const previousPageId = newHistory[newHistory.length - 1];
      
      setCurrentPageId(previousPageId);
      setPageHistory(newHistory);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      alert('Please fill in all required fields before submitting.');
      return;
    }
    
    try {
      // Create field mappings from all pages
      const fieldMappings: Record<string, string> = {};
      pages.forEach(page => {
        if (page.fields) {
          page.fields.forEach(field => {
            fieldMappings[field.id] = field.apiName;
          });
        }
      });
      
      // Submit to backend API with field mappings
      console.log('Submitting form data to backend:', formData);
      console.log('Field mappings:', fieldMappings);
      
      const response = await backendService.submitLeadWithMappings(formData, fieldMappings);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to submit form');
      }
      
      console.log('Form submission successful!', response.data);
      
      // Create submission object for local tracking
      const submission: FormSubmission = {
        id: `submission-${Date.now()}`,
        scriptId: script.id,
        scriptName: script.name,
        submittedAt: new Date().toISOString(),
        data: formData,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        assignedTo: user?.id || 'unknown',
        assignedToName: user ? `${user.firstName} ${user.lastName}` : 'Unknown Agent',
        // Add API response data
        apiResponse: response.data
      };
      
      // Save to localStorage for leads view
      const existingSubmissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
      existingSubmissions.push(submission);
      localStorage.setItem('formSubmissions', JSON.stringify(existingSubmissions));
      
      onComplete(submission);
      setIsSubmitted(true);
      
    } catch (error) {
      console.error('Form submission error:', error);
      alert(`Error submitting form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isSubmitted) {
    return (
      <div className="public-form-container">
        <div className="public-form-success">
          <div className="success-icon">✓</div>
          <h2>Lead Captured!</h2>
          <p>The information has been saved to your leads database.</p>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!currentPage || pages.length === 0) {
    return (
      <div className="public-form-container">
        <div className="public-form-error">
          <AlertTriangle size={48} />
          <h2>Script Error</h2>
          <p>This script is not properly configured.</p>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-form-container">
      <div className="public-form-header">
        <img src={logoImage} alt="Logo" className="public-form-logo" />
      </div>
      
      <div className="public-form-content">
        <div className="public-form-card">
            {/* Progress indicator */}
            {pages.length > 1 && (
              <div className="public-form-progress">
                <div className="progress-text">
                  Step {pageHistory.length} of {pages.length}
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(pageHistory.length / pages.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Page title and description */}
            <div className="public-form-header-text">
              <h1>{processMergeVariables(currentPage.title)}</h1>
              {currentPage.content && (
                <p className="page-description">{processMergeVariables(currentPage.content)}</p>
              )}
            </div>

            {/* Form fields - only show if page has fields */}
            {currentPage.fields && currentPage.fields.length > 0 && (
              <div className="public-form-fields">
                {currentPage.fields.map(field => (
                <div key={field.id} className="public-form-field">
                  <label htmlFor={field.id} className="field-label">
                    {processMergeVariables(field.label)}
                    {field.required && <span className="required-asterisk">*</span>}
                  </label>

                  {field.helpText && (
                    <p className="field-help">{processMergeVariables(field.helpText)}</p>
                  )}

                  {(field.type === 'text' || field.type === 'short-text') && (
                    <input
                      id={field.id}
                      type="text"
                      value={formData[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={processMergeVariables(field.placeholder || '')}
                      required={field.required}
                      className="field-input"
                    />
                  )}

                  {(field.type === 'textarea' || field.type === 'long-text') && (
                    <textarea
                      id={field.id}
                      value={formData[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={processMergeVariables(field.placeholder || '')}
                      required={field.required}
                      rows={4}
                      className="field-textarea"
                    />
                  )}

                  {field.type === 'email' && (
                    <input
                      id={field.id}
                      type="email"
                      value={formData[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={processMergeVariables(field.placeholder || '')}
                      required={field.required}
                      className="field-input"
                    />
                  )}

                  {field.type === 'phone' && (
                    <input
                      id={field.id}
                      type="tel"
                      value={formData[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={processMergeVariables(field.placeholder || '')}
                      required={field.required}
                      className="field-input"
                    />
                  )}

                  {field.type === 'checkbox' && (
                    <div className="checkbox-wrapper">
                      <input
                        id={field.id}
                        type="checkbox"
                        checked={formData[field.id] || false}
                        onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                        required={field.required}
                        className="field-checkbox"
                      />
                      <span className="checkbox-label">{field.label}</span>
                    </div>
                  )}

                  {(field.type === 'radio' || field.type === 'multiple-choice') && (field.choices || field.options) && (
                    <div className="radio-group">
                      {(field.options || field.choices)?.map(option => (
                        <div key={option.id} className="radio-wrapper">
                          <input
                            id={`${field.id}-${option.id}`}
                            type="radio"
                            name={field.id}
                            value={option.id}
                            checked={formData[field.id] === option.id}
                            onChange={() => handleFieldChange(field.id, option.id)}
                            required={field.required}
                            className="field-radio"
                          />
                          <label htmlFor={`${field.id}-${option.id}`} className="radio-label">
                            {option.text || option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {(field.type === 'select' || field.type === 'dropdown') && (field.choices || field.options) && (
                    <select
                      id={field.id}
                      value={formData[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      required={field.required}
                      className="field-select"
                    >
                      <option value="">Choose an option</option>
                      {(field.options || field.choices)?.map(option => (
                        <option key={option.id} value={option.id}>
                          {option.text || option.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'enhanced-address' && (
                    <EnhancedAddressField
                      value={formData[field.id] || null}
                      onChange={(value) => handleFieldChange(field.id, value)}
                      placeholder={field.placeholder || 'Start typing an address...'}
                      autoFocus={false}
                    />
                  )}

                  {field.type === 'credit-card' && (
                    <input
                      type="text"
                      value={formData[field.id] || ''}
                      onChange={(e) => {
                        // Remove non-digits and limit to 16 characters
                        const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                        // Format as XXXX XXXX XXXX XXXX
                        const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                        handleFieldChange(field.id, formatted);
                      }}
                      placeholder={field.placeholder || '1234 5678 9012 3456'}
                      required={field.required}
                      maxLength={19} // 16 digits + 3 spaces
                      className="field-input"
                    />
                  )}

                  {field.type === 'cvv' && (
                    <input
                      type="text"
                      value={formData[field.id] || ''}
                      onChange={(e) => {
                        // Remove non-digits and limit to 3 characters
                        const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                        handleFieldChange(field.id, value);
                      }}
                      placeholder={field.placeholder || 'CVV'}
                      required={field.required}
                      maxLength={3}
                      className="field-input"
                    />
                  )}

                  {field.type === 'expiry-date' && (
                    <input
                      type="text"
                      value={formData[field.id] || ''}
                      onChange={(e) => {
                        // Remove non-digits and limit to 4 characters
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        // Format as MM/YY
                        let formatted = value;
                        if (value.length >= 2) {
                          formatted = value.slice(0, 2) + '/' + value.slice(2);
                        }
                        handleFieldChange(field.id, formatted);
                      }}
                      placeholder={field.placeholder || 'MM/YY'}
                      required={field.required}
                      maxLength={5} // MM/YY
                      className="field-input"
                    />
                  )}

                  {field.type === 'card-type' && (
                    <select
                      value={formData[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      required={field.required}
                      className="field-select"
                    >
                      <option value="">Select Card Type</option>
                      <option value="1">American Express</option>
                      <option value="2">Visa</option>
                      <option value="3">MasterCard</option>
                      <option value="4">Diners Club</option>
                      <option value="5">Discover</option>
                    </select>
                  )}

                  {/* Content Block */}
                  {field.type === 'content-block' && field.contentValue && (
                    <div 
                      className="content-block-element"
                      dangerouslySetInnerHTML={{ 
                        __html: processMergeVariables(lexicalStateToHtml(field.contentValue)) 
                      }}
                    />
                  )}                </div>
              ))}
            </div>
            )}

          {/* Navigation buttons */}
          <div className="public-form-actions">
            {pageHistory.length > 1 && (
              <button 
                onClick={handlePrevious}
                className="btn-secondary"
                type="button"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
            )}
            
            <div className="btn-spacer"></div>
            
            {getNextPageId() ? (
              <button 
                onClick={handleNext}
                className="btn-primary"
                type="button"
                disabled={!canProceed()}
              >
                Next
                <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                className="btn-submit"
                type="button"
                disabled={!canProceed()}
              >
                Capture Lead
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};