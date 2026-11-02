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
import {
  calculateRouteAndInspectClient,
  searchLocationsClient,
  generateClientRouteReport,
  CURATED_TN_LOCATIONS
} from './routingClient';

const API_BASE = '/api';

const FALLBACK_ROADS: Road[] = [
  {
    id: 1,
    code: 'SH-174',
    name: 'SH-174 / NH-83 Tiruppur - Palladam - Pollachi Corridor',
    highway_class: 'State Highway',
    length_km: 65.8,
    start_lat: 11.1085,
    start_lng: 77.3411,
    end_lat: 10.6609,
    end_lng: 77.0048,
    surface_type: 'Asphalt Concrete',
    lane_count: 4,
    speed_limit_kph: 80,
    segment_count: 660,
    average_health_score: 72.4,
    defect_count: 8,
    accident_count: 14,
    blackspot_count: 3,
    start_point: 'Tiruppur (Old Bus Stand / Kumaran Road)',
    end_point: 'Pollachi (Central Bus Stand / Coimbatore Road)'
  },
  {
    id: 2,
    code: 'NH-44',
    name: 'NH-44 Cyber City - Rajiv Chowk Express Corridor',
    highway_class: 'National Highway',
    length_km: 10.0,
    start_lat: 28.4950,
    start_lng: 77.0890,
    end_lat: 28.4550,
    end_lng: 77.0630,
    surface_type: 'Bituminous Concrete',
    lane_count: 8,
    speed_limit_kph: 90,
    segment_count: 100,
    average_health_score: 78.5,
    defect_count: 5,
    accident_count: 24,
    blackspot_count: 2,
    start_point: 'Cyber City Toll Plaza',
    end_point: 'Rajiv Chowk Flyover'
  },
  {
    id: 3,
    code: 'NH-544',
    name: 'NH-544 Coimbatore - Salem Express Highway',
    highway_class: 'National Highway',
    length_km: 165.0,
    start_lat: 11.0168,
    start_lng: 76.9558,
    end_lat: 11.6643,
    end_lng: 78.1460,
    surface_type: 'Rigid Concrete',
    lane_count: 6,
    speed_limit_kph: 100,
    segment_count: 1650,
    average_health_score: 84.2,
    defect_count: 12,
    accident_count: 18,
    blackspot_count: 4,
    start_point: 'Coimbatore (Gandhipuram)',
    end_point: 'Salem (New Bus Stand)'
  }
];

export const api = {
  // Roads
  async getRoads(): Promise<Road[]> {
    try {
      const res = await fetch(`${API_BASE}/roads`);
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          return await res.json();
        }
      }
    } catch {
      // Offline / Vercel fallback
    }
    return FALLBACK_ROADS;
  },

  async getRoad(id: number): Promise<Road & { segments: RoadSegment[] }> {
    try {
      const res = await fetch(`${API_BASE}/roads/${id}`);
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          return await res.json();
        }
      }
    } catch {
      // Offline / Vercel fallback
    }
    const road = FALLBACK_ROADS.find((r) => r.id === id) || FALLBACK_ROADS[0];
    return { ...road, segments: [] };
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
    try {
      const params = new URLSearchParams();
      if (roadId) params.append('road_id', roadId.toString());
      if (severity) params.append('severity', severity);
      const res = await fetch(`${API_BASE}/accidents?${params.toString()}`);
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          return await res.json();
        }
      }
    } catch {
      // Offline / Vercel fallback
    }
    return [];
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
    try {
      const params = new URLSearchParams();
      if (roadId) params.append('road_id', roadId.toString());
      const res = await fetch(`${API_BASE}/accidents/blackspots?${params.toString()}`);
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          return await res.json();
        }
      }
    } catch {
      // Offline / Vercel fallback
    }
    return [];
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
    try {
      const params = new URLSearchParams();
      if (roadId) params.append('road_id', roadId.toString());
      if (segmentId) params.append('segment_id', segmentId.toString());
      const res = await fetch(`${API_BASE}/defects?${params.toString()}`);
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          return await res.json();
        }
      }
    } catch {
      // Offline / Vercel fallback
    }
    return [];
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
    try {
      const params = new URLSearchParams({ query, limit: limit.toString() });
      const res = await fetch(`${API_BASE}/routing/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // Fall through to client engine
    }
    return searchLocationsClient(query, limit);
  },

  async reverseGeocode(lat: number, lng: number): Promise<LocationSuggestion> {
    try {
      const params = new URLSearchParams({ lat: lat.toString(), lng: lng.toString() });
      const res = await fetch(`${API_BASE}/routing/reverse?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // Fall through
    }
    // Client-side fallback: check curated first
    for (const loc of CURATED_TN_LOCATIONS) {
      const dLat = loc.lat - lat;
      const dLng = loc.lng - lng;
      if (Math.sqrt(dLat * dLat + dLng * dLng) < 0.05) {
        return loc;
      }
    }
    return {
      name: `GPS Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      display_name: `Location at ${lat.toFixed(4)} N, ${lng.toFixed(4)} E, Tamil Nadu`,
      lat,
      lng,
      district: 'Tamil Nadu',
      state: 'Tamil Nadu'
    };
  },

  async calculateRouteAndInspect(
    source: { lat: number; lng: number; name?: string },
    destination: { lat: number; lng: number; name?: string },
    roadName?: string,
    routeIndex?: number,
    rangeStartKm?: number,
    rangeLengthKm?: number
  ): Promise<RouteInspectionResponse> {
    try {
      const res = await fetch(`${API_BASE}/routing/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          destination,
          road_name: roadName,
          route_index: routeIndex ?? 0,
          range_start_km: rangeStartKm ?? 0.0,
          range_length_km: rangeLengthKm ?? 10.0
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Backend routing unavailable, failing over to client-side OSRM routing engine:', err);
    }
    // Failover to robust client-side OSRM and defect correlation engine
    return calculateRouteAndInspectClient(source, destination, roadName, routeIndex, rangeStartKm, rangeLengthKm);
  },

  async generateRouteReport(payload: {
    source_name: string;
    destination_name: string;
    format: 'pdf' | 'csv';
    route_meta: any;
    segments: any[];
    summary_stats: any;
  }): Promise<{ download_url: string; format: string }> {
    try {
      const res = await fetch(`${API_BASE}/routing/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          return await res.json();
        }
      }
    } catch (err) {
      console.warn('Backend report generator unavailable, falling back to client-side report generator:', err);
    }
    return generateClientRouteReport(payload);
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
