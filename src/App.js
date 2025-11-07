import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ChurnPrediction from './pages/ChurnPrediction';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/predict" element={<ChurnPrediction />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;