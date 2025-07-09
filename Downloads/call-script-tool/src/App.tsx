import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminView from './views/AdminView';
import AgentView from './views/AgentView';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminView />} />
        <Route path="/agent" element={<AgentView />} />
      </Routes>
    </Router>
  );
}