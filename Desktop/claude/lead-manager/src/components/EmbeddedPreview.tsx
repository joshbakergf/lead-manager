import React, { useState } from 'react';
import { FormPage } from '../types';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import logoImage from '../assets/logo.png';
import { EnhancedAddressField } from './EnhancedAddressField';
import { PaymentField } from './PaymentField';

interface EmbeddedPreviewProps {
  pages: FormPage[];
  logicRules: Record<string, string>;
}

export const EmbeddedPreview: React.FC<EmbeddedPreviewProps> = ({ pages, logicRules }) => {
  const visiblePages = pages.filter(page => page.visible !== false);
  const [currentPageId, setCurrentPageId] = useState<string | null>(visiblePages[0]?.id || null);
  const [pageHistory, setPageHistory] = useState<string[]>(visiblePages[0] ? [visiblePages[0].id] : []);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const currentPage = visiblePages.find(page => page.id === currentPageId);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const getNextPageId = () => {
    if (!currentPageId || !currentPage) return null;
    
    // Default: go to next page in sequence
    const currentIndex = visiblePages.findIndex(page => page.id === currentPageId);
    if (currentIndex >= 0 && currentIndex < visiblePages.length - 1) {
      return visiblePages[currentIndex + 1].id;
    }
    
    return null;
  };

  const canProceed = () => {
    if (!currentPage || !currentPage.fields) {
      return true;
    }
    
    return currentPage.fields.every(field => {
      if (!field.required) return true;
      const value = formData[field.id];
      return field.type === 'checkbox' ? value === true : value && value.toString().trim() !== '';
    });
  };

  const handleNext = () => {
    if (!canProceed()) {
      return;
    }
    
    const nextPageId = getNextPageId();
    if (nextPageId) {
      setCurrentPageId(nextPageId);
      setPageHistory(prev => [...prev, nextPageId]);
    }
  };

  const handlePrevious = () => {
    if (pageHistory.length > 1) {
      const newHistory = [...pageHistory];
      newHistory.pop();
      const previousPageId = newHistory[newHistory.length - 1];
      
      setCurrentPageId(previousPageId);
      setPageHistory(newHistory);
    }
  };

  if (!currentPage || visiblePages.length === 0) {
    return (
      <div className="public-form-container">
        <div className="public-form-error">
          <AlertTriangle size={48} />
          <h2>No Preview Available</h2>
          <p>This script is not properly configured.</p>
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
          {visiblePages.length > 1 && (
            <div className="public-form-progress">
              <div className="progress-text">
                Step {pageHistory.length} of {visiblePages.length}
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(pageHistory.length / visiblePages.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Page title and description */}
          <div className="public-form-header-text">
            <h1>{currentPage.title}</h1>
            {currentPage.content && (
              <p className="page-description">{currentPage.content}</p>
            )}
          </div>

          {/* Form fields - only show if page has fields */}
          {currentPage.fields && currentPage.fields.length > 0 && (
            <div className="public-form-fields">
              {currentPage.fields.map(field => (
                <div key={field.id} className="public-form-field">
                  <label htmlFor={field.id} className="field-label">
                    {field.label}
                    {field.required && <span className="required-asterisk">*</span>}
                  </label>

                  {field.helpText && (
                    <p className="field-help">{field.helpText}</p>
                  )}

                  {(field.type === 'text' || field.type === 'short-text') && (
                    <input
                      id={field.id}
                      type="text"
                      value={formData[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="field-input"
                      disabled
                    />
                  )}

                  {(field.type === 'textarea' || field.type === 'long-text') && (
                    <textarea
                      id={field.id}
                      value={formData[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      rows={4}
                      className="field-textarea"
                      disabled
                    />
                  )}

                  {field.type === 'email' && (
                    <input
                      id={field.id}
                      type="email"
                      value={formData[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="field-input"
                      disabled
                    />
                  )}

                  {field.type === 'phone' && (
                    <input
                      id={field.id}
                      type="tel"
                      value={formData[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="field-input"
                      disabled
                    />
                  )}

                  {field.type === 'checkbox' && (
                    <div className="checkbox-wrapper">
                      <input
                        id={field.id}
                        type="checkbox"
                        checked={formData[field.id] || false}
                        onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                        className="field-checkbox"
                        disabled
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
                            className="field-radio"
                            disabled
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
                      className="field-select"
                      disabled
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
                      disabled
                    />
                  )}

                  {(field.type === 'payment-card' || field.type === 'payment-ach' || field.type === 'payment-wallet') && (
                    <PaymentField
                      field={field}
                      value={formData[field.id]}
                      onChange={(value) => handleFieldChange(field.id, value)}
                      formData={formData}
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
              >
                Next
                <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                className="btn-submit"
                type="button"
                disabled
              >
                Submit (Preview)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};