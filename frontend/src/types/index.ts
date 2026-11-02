export interface Road {
  id: number;
  code: string;
  name: string;
  highway_class: string;
  length_km: number;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  surface_type: string;
  lane_count: number;
  speed_limit_kph: number;
  segment_count: number;
  average_health_score: number;
  defect_count: number;
  accident_count: number;
  blackspot_count: number;
  start_point?: string;
  end_point?: string;
}

export interface RoadSegment {
  id: number;
  segment_index: number;
  chainage_start_m: number;
  chainage_end_m: number;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  health_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  defect_count: number;
  surface_roughness_iri: number;
  streetlight_present: boolean;
  drainage_condition: string;
}

export interface Accident {
  id: number;
  case_number: string;
  road_id: number;
  segment_id: number | null;
  accident_date: string;
  severity: 'Fatal' | 'Severe Injury' | 'Minor Injury' | 'Property Damage';
  accident_type: string;
  latitude: number;
  longitude: number;
  weather: string;
  surface_condition: string;
  lighting_condition: string;
  vehicles_involved: number;
  casualties_fatal: number;
  casualties_severe: number;
  casualties_minor: number;
  primary_factor: string;
  description: string | null;
}

export interface BlackSpot {
  id: number;
  code: string;
  name: string;
  road_id: number;
  segment_id: number | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  total_accidents: number;
  fatal_count: number;
  severe_count: number;
  minor_count: number;
  severity_index: number;
  risk_tier: 'CRITICAL_BLACK_SPOT' | 'HIGH_PRIORITY' | 'MONITORING';
  classification_reason: string;
  methodology_note: string;
  recommended_countermeasure: string | null;
  status: string;
}

export interface DefectDetection {
  id: number;
  road_id: number;
  segment_id: number | null;
  inspection_id: number | null;
  defect_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  bbox: [number, number, number, number]; // x, y, w, h
  image_url: string;
  annotated_image_url: string | null;
  pixel_length: number;
  pixel_width: number;
  estimated_length_mm: number;
  estimated_width_mm: number;
  estimated_area_cm2: number;
  measurement_calibrated: boolean;
  measurement_notes: string;
  status: string;
  detected_at: string;
}

export interface RepairTask {
  id: number;
  task_code: string;
  road_id: number;
  segment_id: number | null;
  defect_id: number | null;
  title: string;
  repair_type: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'ROUTINE';
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  estimated_quantity: number;
  unit_of_measure: string;
  unit_rate_inr?: number;
  unit_rate_usd?: number;
  currency?: string;
  currency_symbol?: string;
  material_cost: number;
  labor_cost: number;
  equipment_cost: number;
  total_estimated_cost: number;
  contractor_assigned: string;
  target_completion_date: string | null;
  created_at: string;
}

export interface ReconstructionProposal {
  id: number;
  proposal_code: string;
  title: string;
  road_id: number;
  segment_id: number | null;
  original_image_url: string;
  reconstructed_image_url: string;
  selected_actions: string[];
  estimated_total_cost: number;
  disclaimer_label: string;
  engineering_rationale: string | null;
  created_by: string;
  created_at: string;
}

export interface CommandCenterData {
  kpis: {
    total_roads: number;
    total_km_inspected: number;
    total_accidents: number;
    identified_black_spots: number;
    high_risk_segments: number;
    detected_defects: number;
    pending_repairs: number;
    total_repairs: number;
  };
  severity_distribution: Array<{ name: string; count: number; color: string }>;
  condition_distribution: Array<{ name: string; count: number; color: string }>;
  accident_timeline: Array<{ month: string; total: number; fatal: number; severe: number; minor: number }>;
  priority_overview: Array<{ name: string; count: number; color: string }>;
  recent_inspections: Array<{ id: number; session_code: string; road_name: string; date: string; defects_found: number; status: string }>;
}

export interface LocationSuggestion {
  name: string;
  display_name: string;
  lat: number;
  lng: number;
  district?: string;
  state: string;
  pincode: string;
  type: string;
}

export interface RouteSegment100m {
  segment_id: string;
  segment_index: number;
  road_name: string;
  chainage_start_m: number;
  chainage_end_m: number;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  coordinates: [number, number][];
  inspection_status: 'INSPECTED' | 'NOT_INSPECTED';
  road_condition: 'GOOD' | 'MODERATE' | 'POOR' | 'CRITICAL' | 'NOT_INSPECTED';
  health_score: number | null;
  risk_level: string;
  surface_roughness_iri: number | null;
  streetlight_present: boolean | null;
  drainage_condition: string;
  defect_count: number;
  defects: Array<{
    id?: number;
    defect_type: string;
    severity: string;
    confidence: number;
    image_url: string;
    annotated_image_url?: string | null;
    estimated_area_cm2?: number;
    detected_at?: string;
  }>;
  last_inspected: string | null;
  verification_source: string;
}

export interface RouteInspectionSummary {
  total_distance_km: number;
  total_duration_min: number;
  total_segments: number;
  inspected_segments: number;
  uninspected_segments: number;
  coverage_pct: number;
  pothole_count: number;
  crack_count: number;
  waterlogging_count: number;
  damaged_surface_count: number;
  faded_marking_count: number;
  damaged_sign_count: number;
  critical_segments_count: number;
  poor_segments_count: number;
  moderate_segments_count: number;
  good_segments_count: number;
  overall_condition: string;
  confidence_description: string;
  safety_grade?: string;
  inspected_km?: number;
  last_inspection_date: string | null;
  data_limitations_notice: string;
}

export interface RouteInspectionResponse {
  status: string;
  route: {
    status: string;
    provider: string;
    distance_m: number;
    distance_km: number;
    duration_min: number;
    duration_hours: number;
    primary_road_name: string;
    geojson_coordinates: [number, number][]; // [lng, lat]
    steps: Array<{
      instruction: string;
      road_name: string;
      distance_m: number;
      duration_s: number;
    }>;
  };
  segments: RouteSegment100m[];
  summary: RouteInspectionSummary;
  alternatives?: Array<{
    route_index: number;
    title: string;
    distance_km: number;
    duration_min: number;
    duration_hours: number;
    primary_road_name: string;
  }>;
}

export interface LiveRoadInspectResponse {
  status: 'INSPECTED' | 'NOT_INSPECTED';
  location: {
    name: string;
    display_name: string;
    state: string;
    pincode: string;
    lat: number;
    lng: number;
  };
  road: {
    id?: number;
    name: string;
    code?: string;
    segment_id?: number;
    chainage?: string;
    health_score?: number | null;
    risk_level?: string;
    condition: 'GOOD' | 'MODERATE' | 'POOR' | 'CRITICAL' | 'NOT_INSPECTED';
    defect_count?: number;
    roughness_iri?: number;
    drainage?: string;
  };
  inspection: {
    inspection_date: string | null;
    inspector: string | null;
    imagery_source: 'STREET_LEVEL_FOOTAGE' | 'SATELLITE_TOPDOWN' | 'USER_UPLOAD' | 'NONE';
    imagery_label: string;
    street_level_available: boolean;
    images: string[];
    defects: Array<{
      id: number;
      defect_type: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      confidence: number;
      bbox: [number, number, number, number];
      image_url: string;
      annotated_image_url: string | null;
      estimated_length_mm: number;
      estimated_width_mm: number;
      estimated_area_cm2: number;
      detected_at: string;
      lat: number;
      lng: number;
    }>;
  };
  satellite_info: {
    imagery_type: string;
    provider: string;
    resolution: string;
    capture_date: string;
    notice: string;
  };
  message?: string;
  prompt_upload?: boolean;
}
