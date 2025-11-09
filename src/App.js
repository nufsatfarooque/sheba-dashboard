import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ChurnPrediction from './pages/ChurnPrediction';
import SegmentationPage from './pages/SegmentationPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/predict" element={<ChurnPrediction />} />
        <Route path="/segments" element={<SegmentationPage />} />
        <Route path="/segments/:segmentName" element={<SegmentationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;