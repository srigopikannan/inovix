import type {
  Road,
  RoadSegment,
  Accident,
  BlackSpot,
  DefectDetection,
  ReconstructionProposal,
  CommandCenterData,
  LocationSuggestion,
  RouteInspectionResponse,
  LiveRoadInspectResponse
} from '../types';

const API_BASE = '/api';

export const api = {
  // Roads
  async getRoads(): Promise<Road[]> {
    const res = await fetch(`${API_BASE}/roads`);
    if (!res.ok) throw new Error('Failed to fetch roads');
    return res.json();
  },

  async getRoad(id: number): Promise<Road & { segments: RoadSegment[] }> {
    const res = await fetch(`${API_BASE}/roads/${id}`);
    if (!res.ok) throw new Error('Failed to fetch road details');
    return res.json();
  },

  async createRoad(data: any): Promise<{ road_id: number; segments_created: number }> {
    const res = await fetch(`${API_BASE}/roads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create road');
    return res.json();
  },

  // Accidents & Black Spots
  async getAccidents(roadId?: number, severity?: string): Promise<Accident[]> {
    const params = new URLSearchParams();
    if (roadId) params.append('road_id', roadId.toString());
    if (severity) params.append('severity', severity);
    const res = await fetch(`${API_BASE}/accidents?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch accidents');
    return res.json();
  },

  async createAccident(data: any): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/accidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create accident');
    return res.json();
  },

  async getBlackSpots(roadId?: number): Promise<BlackSpot[]> {
    const params = new URLSearchParams();
    if (roadId) params.append('road_id', roadId.toString());
    const res = await fetch(`${API_BASE}/accidents/blackspots?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch black spots');
    return res.json();
  },

  async recalculateBlackSpots(): Promise<{ black_spots_identified: number }> {
    const res = await fetch(`${API_BASE}/accidents/blackspots/recalculate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to recalculate black spots');
    return res.json();
  },

  // Defects & Computer Vision
  async getDefects(roadId?: number, segmentId?: number): Promise<DefectDetection[]> {
    const params = new URLSearchParams();
    if (roadId) params.append('road_id', roadId.toString());
    if (segmentId) params.append('segment_id', segmentId.toString());
    const res = await fetch(`${API_BASE}/defects?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch defects');
    return res.json();
  },

  async detectDefects(formData: FormData): Promise<{
    status: string;
    image_url: string;
    annotated_image_url: string;
    detections: any[];
  }> {
    const res = await fetch(`${API_BASE}/defects/detect`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Defect detection failed');
    return res.json();
  },

  // Analytics
  async getCommandCenter(): Promise<CommandCenterData> {
    const res = await fetch(`${API_BASE}/analytics/command-center`);
    if (!res.ok) throw new Error('Failed to fetch command center metrics');
    return res.json();
  },

  async getRiskAnalysis(roadId: number = 1): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/risk-analysis?road_id=${roadId}`);
    if (!res.ok) throw new Error('Failed to fetch risk analysis');
    return res.json();
  },

  async getLightingAnalysis(roadId: number = 1): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/lighting?road_id=${roadId}`);
    if (!res.ok) throw new Error('Failed to fetch lighting analysis');
    return res.json();
  },

  // ROADGUARD VISION Reconstruction
  async getProposals(roadId?: number): Promise<ReconstructionProposal[]> {
    const params = new URLSearchParams();
    if (roadId) params.append('road_id', roadId.toString());
    const res = await fetch(`${API_BASE}/reconstruction/proposals?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch proposals');
    return res.json();
  },

  async simulateReconstruction(data: {
    road_id: number;
    segment_id?: number;
    image_url?: string;
    selected_actions: string[];
  }): Promise<{
    status: string;
    original_image_url: string;
    reconstructed_image_url: string;
    selected_actions: string[];
    disclaimer_label: string;
    cost_estimate: any;
  }> {
    const res = await fetch(`${API_BASE}/reconstruction/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Simulation failed');
    return res.json();
  },

  async saveProposal(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/reconstruction/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save reconstruction proposal');
    return res.json();
  },

  // Reports
  async generateReport(data: {
    report_type: string;
    format: string;
    road_id: number;
  }): Promise<{ download_url: string; format: string }> {
    const res = await fetch(`${API_BASE}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to generate report');
    return res.json();
  },

  // Inspections
  async getInspections(roadId?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (roadId) params.append('road_id', roadId.toString());
    const res = await fetch(`${API_BASE}/inspections?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch inspection sessions');
    return res.json();
  },

  async getInspectionDetails(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/inspections/${id}`);
    if (!res.ok) throw new Error('Failed to fetch inspection details');
    return res.json();
  },

  // Admin & System
  async getSystemStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/system-status`);
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  async getUsers(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getAuditLogs(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  // Settings
  async getSettings(): Promise<any> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // India-Wide Routing & Road Inspection
  async searchLocations(query: string, limit: number = 10): Promise<LocationSuggestion[]> {
    const params = new URLSearchParams({ query, limit: limit.toString() });
    const res = await fetch(`${API_BASE}/routing/search?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to search locations');
    return res.json();
  },

  async reverseGeocode(lat: number, lng: number): Promise<LocationSuggestion> {
    const params = new URLSearchParams({ lat: lat.toString(), lng: lng.toString() });
    const res = await fetch(`${API_BASE}/routing/reverse?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to reverse geocode coordinate');
    return res.json();
  },

  async calculateRouteAndInspect(
    source: { lat: number; lng: number; name?: string },
    destination: { lat: number; lng: number; name?: string },
    roadName?: string,
    routeIndex?: number
  ): Promise<RouteInspectionResponse> {
    const res = await fetch(`${API_BASE}/routing/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, destination, road_name: roadName, route_index: routeIndex ?? 0 }),
    });
    if (!res.ok) throw new Error('Failed to calculate road route and defect telemetry');
    return res.json();
  },

  async generateRouteReport(payload: {
    source_name: string;
    destination_name: string;
    format: 'pdf' | 'csv';
    route_meta: any;
    segments: any[];
    summary_stats: any;
  }): Promise<{ download_url: string; format: string }> {
    const res = await fetch(`${API_BASE}/routing/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to generate destination inspection report');
    return res.json();
  },

  // ROADGUARD Live Road View
  async liveRoadInspect(payload: {
    lat: number;
    lng: number;
    road_name?: string;
    radius_m?: number;
  }): Promise<LiveRoadInspectResponse> {
    const res = await fetch(`${API_BASE}/routing/live-road-inspect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to inspect road location');
    return res.json();
  },
};
