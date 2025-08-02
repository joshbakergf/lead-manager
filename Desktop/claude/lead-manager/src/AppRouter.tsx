import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App';
import { PublicPreview } from './components/PublicPreview';

export const AppRouter: React.FC = () => {
  // Function to get script data from localStorage
  const getScriptData = (scriptId: string) => {
    const data = window.localStorage.getItem(`script-${scriptId}`);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (err) {
        console.error('Error parsing script data:', err);
        return null;
      }
    }
    return null;
  };

  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/preview/:scriptId" element={<PublicPreview getScriptData={getScriptData} />} />
      <Route path="*" element={<App />} />
    </Routes>
  );
};