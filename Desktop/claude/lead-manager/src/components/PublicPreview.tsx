import React, { useState, useEffect } from 'react';
import { FormPage } from '../types';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import logoImage from '../assets/logo.png';
import { EnhancedAddressField } from './EnhancedAddressField';
// PaymentField removed - using simple credit card fields instead
import { backendService } from '../services/backendService';
import { useAuth } from '../contexts/AuthContext';
import { lexicalStateToHtml } from './ContentEditor';

interface PublicPreviewProps {
  getScriptData?: (scriptId: string) => { pages: FormPage[], logicRules: Record<string, string> } | null;
}

export const PublicPreview: React.FC<PublicPreviewProps> = ({ getScriptData }) => {
  const { user } = useAuth();
  
  // Get script ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const scriptId = urlParams.get('preview');
  console.log('PublicPreview rendering, scriptId:', scriptId);
  
  const [pages, setPages] = useState<FormPage[]>([]);
  const [logicRules, setLogicRules] = useState<Record<string, string>>({});
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    console.log('useEffect running, scriptId:', scriptId, 'getScriptData:', !!getScriptData);
    if (scriptId && getScriptData) {
      setLoading(true);
      try {
        const scriptData = getScriptData(scriptId);
        console.log('Retrieved script data:', scriptData);
        console.log('Logic rules received:', scriptData?.logicRules);
        if (scriptData && scriptData.pages) {
          // Include all visible pages (welcome, form, ending) in the workflow
          const visiblePages = scriptData.pages.filter(page => 
            page.visible !== false
          );
          console.log('Filtered visible pages:', visiblePages);
          setPages(visiblePages);
          setLogicRules(scriptData.logicRules || {});
          
          // Start with the first visible page
          if (visiblePages.length > 0) {
            setCurrentPageId(visiblePages[0].id);
            setPageHistory([visiblePages[0].id]);
          }
          
          setError(null);
        } else {
          console.log('No script data found');
          setError('Script not found');
        }
      } catch (err) {
        console.error('Error loading script:', err);
        setError('Error loading script');
      } finally {
        setLoading(false);
      }
    } else {
      console.log('Missing scriptId or getScriptData function');
      setLoading(false);
      setError('Invalid preview link');
    }
  }, [scriptId, getScriptData]);

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

  // Function to determine the next page based on logic rules
  const getNextPageId = () => {
    if (!currentPageId || !currentPage) return null;
    
    console.log('Getting next page for:', currentPageId);
    console.log('Available logic rules:', logicRules);
    console.log('Current form data:', formData);
    
    // Check for field-level choice rules first (most specific)
    for (const field of currentPage.fields || []) {
      if (field.type === 'radio' || field.type === 'multiple-choice') {
        const selectedChoiceId = formData[field.id];
        if (selectedChoiceId) {
          // Try field-level rule format: pageId-fieldId-choiceId
          const fieldRuleKey = `${currentPageId}-${field.id}-${selectedChoiceId}`;
          if (logicRules[fieldRuleKey]) {
            console.log(`Found field choice rule: ${fieldRuleKey} -> ${logicRules[fieldRuleKey]}`);
            return logicRules[fieldRuleKey] === 'end' ? null : logicRules[fieldRuleKey];
          }
        }
      }
    }
    
    // Check for page-level choice rules (for page.choices)
    if (currentPage.choices) {
      for (const choice of currentPage.choices) {
        // Check if this choice was selected (look for any field that has this choice value)
        const isChoiceSelected = Object.values(formData).includes(choice.id);
        if (isChoiceSelected) {
          const pageChoiceRuleKey = `${currentPageId}-${choice.id}`;
          if (logicRules[pageChoiceRuleKey]) {
            console.log(`Found page choice rule: ${pageChoiceRuleKey} -> ${logicRules[pageChoiceRuleKey]}`);
            return logicRules[pageChoiceRuleKey] === 'end' ? null : logicRules[pageChoiceRuleKey];
          }
        }
      }
    }
    
    // Check for page-level rules (general page logic)
    if (logicRules[currentPageId]) {
      console.log(`Found page rule: ${currentPageId} -> ${logicRules[currentPageId]}`);
      return logicRules[currentPageId] === 'end' ? null : logicRules[currentPageId];
    }
    
    // Default: go to next page in sequence
    const currentIndex = pages.findIndex(page => page.id === currentPageId);
    if (currentIndex >= 0 && currentIndex < pages.length - 1) {
      const nextPageId = pages[currentIndex + 1].id;
      console.log(`Using default next page: ${nextPageId}`);
      return nextPageId;
    }
    
    console.log('No next page found - end of flow');
    return null;
  };

  const canProceed = () => {
    if (!currentPage || !currentPage.fields) {
      console.log('canProceed: no current page or fields, returning true');
      return true;
    }
    
    // Check if all required fields are filled
    const result = currentPage.fields.every(field => {
      if (!field.required) return true;
      const value = formData[field.id];
      const isValid = field.type === 'checkbox' ? value === true : value && value.toString().trim() !== '';
      console.log(`Field ${field.id} (required: ${field.required}): value = ${value}, isValid = ${isValid}`);
      return isValid;
    });
    
    console.log('canProceed result:', result);
    return result;
  };

  const handleNext = () => {
    console.log('handleNext called, canProceed:', canProceed(), 'currentPageId:', currentPageId);
    if (!canProceed()) {
      alert('Please fill in all required fields before continuing.');
      return;
    }
    
    const nextPageId = getNextPageId();
    if (nextPageId) {
      console.log('Moving to next page:', nextPageId);
      setCurrentPageId(nextPageId);
      setPageHistory(prev => [...prev, nextPageId]);
    } else {
      console.log('No next page found - should submit');
    }
  };

  const handlePrevious = () => {
    console.log('handlePrevious called, pageHistory:', pageHistory);
    if (pageHistory.length > 1) {
      // Remove current page from history and go to previous
      const newHistory = [...pageHistory];
      newHistory.pop(); // Remove current page
      const previousPageId = newHistory[newHistory.length - 1];
      
      console.log('Moving to previous page:', previousPageId);
      setCurrentPageId(previousPageId);
      setPageHistory(newHistory);
    } else {
      console.log('Already on first page');
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      alert('Please fill in all required fields before submitting.');
      return;
    }
    
    try {
      console.log('Submitting form data:', formData);
      
      // Use backend service to handle the complete submission flow
      const response = await backendService.submitLead(formData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to submit form');
      }
      
      console.log('Form submission complete!', response.data);
      setIsSubmitted(true);
      
    } catch (error) {
      console.error('Form submission error:', error);
      alert(`Error submitting form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="public-form-container">
        <div className="public-form-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-form-container">
        <div className="public-form-error">
          <AlertTriangle size={48} />
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="public-form-container">
        <div className="public-form-success">
          <div className="success-icon">✓</div>
          <h2>Thank you!</h2>
          <p>Your information has been submitted successfully. We'll be in touch with you soon.</p>
        </div>
      </div>
    );
  }

  if (!currentPage || pages.length === 0) {
    return (
      <div className="public-form-container">
        <div className="public-form-error">
          <AlertTriangle size={48} />
          <h2>No form available</h2>
          <p>This form is not currently available.</p>
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
                    {(field.options || field.choices)?.map((option, index) => {
                      const optionId = typeof option === 'string' ? `option-${index}` : option.id;
                      const optionText = typeof option === 'string' ? option : option.text;
                      return (
                      <div key={optionId} className="radio-wrapper">
                        <input
                          id={`${field.id}-${optionId}`}
                          type="radio"
                          name={field.id}
                          value={optionId}
                          checked={formData[field.id] === optionId}
                          onChange={() => handleFieldChange(field.id, optionId)}
                          required={field.required}
                          className="field-radio"
                        />
                        <label htmlFor={`${field.id}-${optionId}`} className="radio-label">
                          {typeof option === 'string' ? option : (option.text || option.label)}
                        </label>
                      </div>
                    )})}
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
                    {(field.options || field.choices)?.map((option, index) => {
                      const optionId = typeof option === 'string' ? `option-${index}` : option.id;
                      const optionText = typeof option === 'string' ? option : option.text;
                      return (
                      <option key={optionId} value={optionId}>
                        {typeof option === 'string' ? option : (option.text || option.label)}
                      </option>)
                    })}
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
                )}
              </div>
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
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};