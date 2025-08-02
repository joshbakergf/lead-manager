import React, { useState } from 'react';
import { FormPage, FormField } from '../types';
import { ChevronLeft, ChevronRight, X, Star } from 'lucide-react';
import { PaymentField } from './PaymentField';

interface FormPreviewProps {
  pages: FormPage[];
  currentPage: number;
  onNavigate: (pageIndex: number) => void;
  onClose?: () => void;
  fullPage?: boolean;
  theme?: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  settings?: {
    showProgress: boolean;
    allowBack: boolean;
  };
  scriptName?: string;
  onSubmit?: (data: Record<string, any>) => void;
}

export const FormPreview: React.FC<FormPreviewProps> = ({
  pages,
  currentPage,
  onNavigate,
  onClose,
  fullPage = false,
  theme = {
    primaryColor: '#4285f4',
    backgroundColor: '#0f1419',
    textColor: '#ffffff'
  },
  settings = {
    showProgress: true,
    allowBack: true
  },
  scriptName,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const page = pages[currentPage];

  if (!page) return null;

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleLegacyInputChange = (value: any) => {
    setFormData(prev => ({
      ...prev,
      [page.id]: value,
    }));
  };

  const renderFormField = (field: FormField) => {
    const fieldId = field.id;
    const value = formData[fieldId];

    const commonInputStyle = {
      width: '100%',
      padding: '0.75rem 1rem',
      border: `2px solid ${theme.primaryColor}20`,
      borderRadius: '0.5rem',
      backgroundColor: fullPage ? '#ffffff' : '#1a202c',
      color: fullPage ? '#333333' : theme.textColor,
      fontSize: '1rem',
      fontFamily: 'inherit'
    };

    const labelStyle = {
      display: 'block',
      color: theme.textColor,
      fontWeight: 600,
      marginBottom: '0.5rem',
      fontSize: '0.95rem'
    };

    const fieldContainerStyle = {
      marginBottom: '1.5rem'
    };

    switch (field.type) {
      case 'short-text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <div key={fieldId} style={fieldContainerStyle}>
            <label style={labelStyle}>
              {field.label}
              {field.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
            </label>
            <input
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : 'text'}
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              style={commonInputStyle}
              required={field.required}
            />
          </div>
        );

      case 'long-text':
        return (
          <div key={fieldId} style={fieldContainerStyle}>
            <label style={labelStyle}>
              {field.label}
              {field.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
            </label>
            <textarea
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              rows={4}
              style={{
                ...commonInputStyle,
                resize: 'vertical',
                minHeight: '100px'
              }}
              required={field.required}
            />
          </div>
        );

      case 'number':
        return (
          <div key={fieldId} style={fieldContainerStyle}>
            <label style={labelStyle}>
              {field.label}
              {field.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
            </label>
            <input
              type="number"
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              min={field.minValue}
              max={field.maxValue}
              style={commonInputStyle}
              required={field.required}
            />
          </div>
        );

      case 'date':
        return (
          <div key={fieldId} style={fieldContainerStyle}>
            <label style={labelStyle}>
              {field.label}
              {field.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
            </label>
            <input
              type="date"
              value={value || ''}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              style={commonInputStyle}
              required={field.required}
            />
          </div>
        );

      case 'time':
        return (
          <div key={fieldId} style={fieldContainerStyle}>
            <label style={labelStyle}>
              {field.label}
              {field.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
            </label>
            <input
              type="time"
              value={value || ''}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              style={commonInputStyle}
              required={field.required}
            />
          </div>
        );

      case 'multiple-choice':
        return (
          <div key={fieldId} style={fieldContainerStyle}>
            <label style={labelStyle}>
              {field.label}
              {field.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(field.options || field.choices)?.map((option, index) => {
                const optionId = typeof option === 'string' ? `option-${index}` : option.id;
                const optionValue = typeof option === 'string' ? option : option.text;
                return (
                <label 
                  key={optionId} 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                >
                  <input
                    type={field.multiSelect ? 'checkbox' : 'radio'}
                    name={fieldId}
                    value={optionValue}
                    checked={field.multiSelect ? 
                      (Array.isArray(value) ? value.includes(optionValue) : false) :
                      value === optionValue
                    }
                    onChange={(e) => {
                      if (field.multiSelect) {
                        const currentValues = Array.isArray(value) ? value : [];
                        const newValues = e.target.checked
                          ? [...currentValues, optionValue]
                          : currentValues.filter(v => v !== optionValue);
                        handleInputChange(fieldId, newValues);
                      } else {
                        handleInputChange(fieldId, e.target.value);
                      }
                    }}
                    style={{ 
                      width: '1rem', 
                      height: '1rem',
                      accentColor: '#4285f4'
                    }}
                  />
                  <span style={{ color: '#e2e8f0' }}>{typeof option === 'string' ? option : (option.text || option.label)}</span>
                </label>)
              })}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={fieldId} style={fieldContainerStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(field.options || field.choices)?.map((option) => (
                <label 
                  key={option.id} 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    value={option.id}
                    checked={Array.isArray(value) ? value.includes(option.id) : false}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.id]
                        : currentValues.filter(v => v !== option.id);
                      handleInputChange(fieldId, newValues);
                    }}
                    style={{ 
                      width: '1rem', 
                      height: '1rem',
                      accentColor: '#4285f4'
                    }}
                  />
                  <span style={{ color: '#e2e8f0' }}>{option.text || option.label}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'dropdown':
        return (
          <div key={fieldId} style={fieldContainerStyle}>
            <label style={labelStyle}>
              {field.label}
              {field.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              style={commonInputStyle}
              required={field.required}
            >
              <option value="">Select an option...</option>
              {(field.options || field.choices)?.map((option) => (
                <option key={choice.id} value={choice.id}>
                  {option.text || option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'rating':
        const minRating = field.minRating || 1;
        const maxRating = field.maxRating || 5;
        const ratings = Array.from({ length: maxRating - minRating + 1 }, (_, i) => minRating + i);
        
        return (
          <div key={fieldId} style={fieldContainerStyle}>
            <label style={labelStyle}>
              {field.label}
              {field.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {ratings.map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleInputChange(fieldId, rating)}
                  style={{
                    background: value === rating ? '#4285f4' : 'transparent',
                    border: '2px solid #4285f4',
                    borderRadius: '0.5rem',
                    color: value === rating ? '#ffffff' : '#4285f4',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  {field.ratingType === 'stars' ? (
                    <Star size={16} fill={value >= rating ? 'currentColor' : 'none'} />
                  ) : (
                    rating
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 'file-upload':
        return (
          <div key={fieldId} style={fieldContainerStyle}>
            <label style={labelStyle}>
              {field.label}
              {field.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
            </label>
            <input
              type="file"
              onChange={(e) => handleInputChange(fieldId, e.target.files?.[0])}
              accept={field.fileTypes?.join(',')}
              style={{
                ...commonInputStyle,
                padding: '0.5rem'
              }}
              required={field.required}
            />
            {field.fileTypes && (
              <p style={{ color: '#a0aec0', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Accepted formats: {field.fileTypes.join(', ')}
              </p>
            )}
          </div>
        );

      case 'payment-card':
      case 'payment-ach':
      case 'payment-wallet':
        return (
          <div key={fieldId} style={fieldContainerStyle}>
            <PaymentField
              field={field}
              value={value}
              onChange={(value) => handleInputChange(fieldId, value)}
              formData={formData}
            />
          </div>
        );

      default:
        return (
          <div key={fieldId} style={fieldContainerStyle}>
            <p style={{ color: '#ef4444' }}>Unknown field type: {field.type}</p>
          </div>
        );
    }
  };

  const renderPageContent = () => {
    switch (page.type) {
      case 'welcome':
      case 'ending':
        return (
          <div style={{ textAlign: fullPage ? 'center' : 'center', maxWidth: fullPage ? '600px' : 'auto', margin: fullPage ? '0 auto' : '0' }}>
            <h2 style={{ fontSize: fullPage ? '2rem' : '1.5rem', fontWeight: 700, color: theme.textColor, marginBottom: '1rem' }}>
              {page.title}
            </h2>
            <p style={{ color: theme.textColor, opacity: 0.8, whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: fullPage ? '1.1rem' : '1rem' }}>{page.content}</p>
          </div>
        );

      case 'short-text':
        return (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
              {page.title}
            </h2>
            {page.question && (
              <p style={{ color: '#e2e8f0', marginBottom: '1rem' }}>{page.question}</p>
            )}
            <input
              type="text"
              placeholder={page.placeholder}
              value={formData[page.id] || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #4a5568',
                borderRadius: '0.5rem',
                backgroundColor: '#1a202c',
                color: '#ffffff',
                fontSize: '1rem'
              }}
            />
          </div>
        );

      case 'long-text':
        return (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
              {page.title}
            </h2>
            {page.question && (
              <p style={{ color: '#e2e8f0', marginBottom: '1rem' }}>{page.question}</p>
            )}
            <div style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>{page.content}</div>
          </div>
        );

      case 'multiple-choice':
        return (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
              {page.title}
            </h2>
            {page.question && (
              <p style={{ color: '#e2e8f0', marginBottom: '1rem' }}>{page.question}</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {page.choices?.map((choice) => (
                <label 
                  key={option.id} 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                >
                  <input
                    type="radio"
                    name={page.id}
                    value={option.id}
                    checked={formData[page.id] === choice.id}
                    onChange={(e) => handleLegacyInputChange(e.target.value)}
                    style={{ 
                      width: '1rem', 
                      height: '1rem',
                      accentColor: '#4285f4'
                    }}
                  />
                  <span style={{ color: '#e2e8f0' }}>{option.text || option.label}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'form':
        return (
          <div style={{ maxWidth: fullPage ? '600px' : 'auto', margin: fullPage ? '0 auto' : '0' }}>
            <h2 style={{ fontSize: fullPage ? '1.75rem' : '1.25rem', fontWeight: 600, color: theme.textColor, marginBottom: '0.5rem' }}>
              {page.title}
            </h2>
            {page.content && (
              <p style={{ color: theme.textColor, opacity: 0.8, marginBottom: '1.5rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{page.content}</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {page.fields?.map(field => renderFormField(field))}
            </div>
          </div>
        );

      default:
        return (
          <div style={{ textAlign: 'center', color: '#718096' }}>
            Unknown page type: {page.type}
          </div>
        );
    }
  };

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      onNavigate(currentPage + 1);
    } else if (fullPage && onSubmit) {
      onSubmit(formData);
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      onNavigate(currentPage - 1);
    }
  };

  const progress = ((currentPage + 1) / pages.length) * 100;

  if (fullPage) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme.backgroundColor,
        color: theme.textColor,
        padding: '2rem',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          maxWidth: '800px',
          margin: '0 auto 2rem auto',
        }}>
          <h2 style={{ 
            fontSize: '1.2rem', 
            fontWeight: 600, 
            color: theme.primaryColor,
            margin: 0,
          }}>
            {scriptName || 'Sales Script'}
          </h2>
          
          {settings.showProgress && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                {currentPage + 1} of {pages.length}
              </span>
              <div style={{
                width: '120px',
                height: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: theme.primaryColor,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ marginBottom: '3rem' }}>
          {renderPageContent()}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          <button
            onClick={handleBack}
            disabled={currentPage === 0 || !settings.allowBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              border: `2px solid ${theme.primaryColor}`,
              color: theme.primaryColor,
              borderRadius: '8px',
              cursor: currentPage === 0 || !settings.allowBack ? 'not-allowed' : 'pointer',
              opacity: currentPage === 0 || !settings.allowBack ? 0.5 : 1,
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <button
            onClick={handleNext}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: theme.primaryColor,
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            {currentPage === pages.length - 1 ? 'Submit' : 'Next'}
            {currentPage < pages.length - 1 && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <h1 className="modal-title">Call Script Preview</h1>
          {onClose && (
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#a0aec0', cursor: 'pointer' }}
            >
              <X style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="modal-body">
          {renderPageContent()}
        </div>

        {/* Navigation */}
        <div className="modal-footer">
          <button
            onClick={() => onNavigate(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="modal-nav-btn"
          >
            <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
            Previous
          </button>

          <span className="modal-page-info">
            {currentPage + 1} of {pages.length}
          </span>

          <button
            onClick={() => onNavigate(Math.min(pages.length - 1, currentPage + 1))}
            disabled={currentPage === pages.length - 1}
            className="modal-nav-btn"
          >
            Next
            <ChevronRight style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
      </div>
    </div>
  );
};