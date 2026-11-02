import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './services/api';
import type { Road } from './types';
import { SimpleNavbar } from './components/SimpleNavbar';

// The 5 Core Simplified Pages
import { HomePage } from './pages/HomePage';
import { ExploreRoadsPage } from './pages/ExploreRoadsPage';
import { AIInspectionPage } from './pages/AIInspectionPage';
import { RoadReportsPage } from './pages/RoadReportsPage';
import { SettingsSimplePage } from './pages/SettingsSimplePage';
import { LiveRoadView } from './pages/LiveRoadView';
import { GISExplorer } from './pages/GISExplorer';

export function App() {
  const [roads, setRoads] = useState<Road[]>([]);
  const [selectedRoadId, setSelectedRoadId] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialRoads = async () => {
      try {
        const data = await api.getRoads();
        setRoads(data);
        if (data.length > 0) {
          setSelectedRoadId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to connect to ROADGUARD AI backend:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialRoads();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans antialiased">
        {/* Simple 5-Item Navigation Bar */}
        <SimpleNavbar
          roads={roads}
          selectedRoadId={selectedRoadId}
          onSelectRoad={(id) => setSelectedRoadId(id)}
        />

        {/* Clean Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Routes>
            {/* 1. Home Dashboard */}
            <Route path="/" element={<HomePage roads={roads} selectedRoadId={selectedRoadId} />} />
            
            {/* 2. Explore Roads (Flagship Map & Route Inspection) */}
            <Route path="/explore" element={<ExploreRoadsPage roads={roads} selectedRoadId={selectedRoadId} />} />
            <Route path="/live-route" element={<ExploreRoadsPage roads={roads} selectedRoadId={selectedRoadId} />} />
            <Route path="/live-route-intelligence" element={<ExploreRoadsPage roads={roads} selectedRoadId={selectedRoadId} />} />
            <Route path="/gis" element={<GISExplorer roads={roads} selectedRoadId={selectedRoadId} />} />

            {/* 3. Live Road View (India-Wide Destination & Satellite Inspection) */}
            <Route path="/live-road-view" element={<LiveRoadView roads={roads} selectedRoadId={selectedRoadId} />} />
            
            {/* 4. AI Defect Inspection */}
            <Route path="/inspect" element={<AIInspectionPage roads={roads} selectedRoadId={selectedRoadId} />} />
            
            {/* 4. Road Reports */}
            <Route path="/reports" element={<RoadReportsPage roads={roads} selectedRoadId={selectedRoadId} />} />
            
            {/* 5. Settings */}
            <Route path="/settings" element={<SettingsSimplePage />} />

            {/* Backwards-compatible aliases for legacy routes */}
            <Route path="/ai-inspection" element={<Navigate to="/inspect" replace />} />
            <Route path="/explore-roads" element={<Navigate to="/explore" replace />} />
            <Route path="/live-view" element={<Navigate to="/live-road-view" replace />} />
            <Route path="/overview" element={<Navigate to="/" replace />} />
            <Route path="/command-center" element={<Navigate to="/explore" replace />} />
            <Route path="/gis-explorer" element={<Navigate to="/explore" replace />} />
            <Route path="/defect-detection" element={<Navigate to="/inspect" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
