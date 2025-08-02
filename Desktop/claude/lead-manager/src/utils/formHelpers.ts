import { FormPage, PageType } from '../types';

export const createNewPage = (type: PageType): FormPage => {
  const baseId = `page-${Date.now()}`;
  
  const baseProps = {
    id: baseId,
    type,
    title: '',
    content: '',
    required: true,
  };

  switch (type) {
    case 'welcome':
      return {
        ...baseProps,
        title: 'Welcome',
        content: 'Welcome to our survey!',
      };
    
    case 'short-text':
    case 'long-text':
      return {
        ...baseProps,
        title: 'Text Question',
        question: '',
        placeholder: 'Type your answer here...',
      };
    
    case 'multiple-choice':
    case 'dropdown':
      return {
        ...baseProps,
        title: 'Choice Question',
        question: '',
        choices: [
          { id: `${baseId}-choice-1`, text: 'Option 1' },
          { id: `${baseId}-choice-2`, text: 'Option 2' },
        ],
      };
    
    case 'checkbox':
      return {
        ...baseProps,
        title: 'Checkbox Question',
        question: '',
        choices: [
          { id: `${baseId}-choice-1`, text: 'Option 1' },
          { id: `${baseId}-choice-2`, text: 'Option 2' },
        ],
        multiSelect: true,
      };
    
    case 'email':
      return {
        ...baseProps,
        title: 'Email',
        question: 'What is your email address?',
        placeholder: 'email@example.com',
      };
    
    case 'phone':
      return {
        ...baseProps,
        title: 'Phone',
        question: 'What is your phone number?',
        placeholder: '(555) 123-4567',
      };
    
    case 'rating':
      return {
        ...baseProps,
        title: 'Rating',
        question: 'How would you rate your experience?',
        minRating: 1,
        maxRating: 5,
        ratingType: 'stars',
      };
    
    case 'ending':
      return {
        ...baseProps,
        title: 'Thank You',
        content: 'Thank you for your time!',
      };
    
    default:
      return baseProps as FormPage;
  }
};