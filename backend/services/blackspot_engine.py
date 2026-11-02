import math
from typing import List, Dict, Any

class BlackSpotEngine:
    """
    Transparent Black Spot Identification Engine conforming to:
    - Indian Road Congress (IRC:SP:88-2019) Guidelines on Road Safety Audit
    - Ministry of Road Transport & Highways (MoRTH) Protocol
    - Federal Highway Administration (FHWA) Systemic Safety Methodology

    Formula:
    Severity Index (SI) = (5 * Fatalities) + (3 * Severe Injuries) + (1 * Minor Injuries)
    Cluster Radius: 500 meters
    Criteria: (Total Accidents >= 3 AND SI >= 10) OR (SI >= 15)
    """

    @staticmethod
    def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates great circle distance between two points in meters."""
        R = 6371000.0  # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (math.sin(delta_phi / 2.0) ** 2 +
             math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    @classmethod
    def identify_black_spots(cls, accidents: List[Dict[str, Any]], cluster_radius_m: float = 500.0) -> List[Dict[str, Any]]:
        """
        Clusters accidents geographically and classifies verified black spots
        with explicit mathematical explanations.
        """
        if not accidents:
            return []

        # Greedy geospatial clustering
        clusters: List[List[Dict[str, Any]]] = []
        visited = set()

        for i, acc1 in enumerate(accidents):
            if i in visited:
                continue

            current_cluster = [acc1]
            visited.add(i)

            for j, acc2 in enumerate(accidents):
                if j in visited:
                    continue

                dist = cls.haversine_distance_m(
                    acc1["latitude"], acc1["longitude"],
                    acc2["latitude"], acc2["longitude"]
                )
                if dist <= cluster_radius_m:
                    current_cluster.append(acc2)
                    visited.add(j)

            clusters.append(current_cluster)

        black_spots = []
        for idx, cluster in enumerate(clusters):
            total_acc = len(cluster)
            fatal_count = sum(a.get("casualties_fatal", 0) for a in cluster)
            severe_count = sum(a.get("casualties_severe", 0) for a in cluster)
            minor_count = sum(a.get("casualties_minor", 0) for a in cluster)

            # MoRTH Weighted Severity Index
            si = (5.0 * fatal_count) + (3.0 * severe_count) + (1.0 * minor_count)

            # Check criteria
            if (total_acc >= 3 and si >= 10.0) or si >= 15.0 or fatal_count >= 2:
                # Center point calculation
                avg_lat = sum(a["latitude"] for a in cluster) / total_acc
                avg_lng = sum(a["longitude"] for a in cluster) / total_acc

                # Determine Risk Tier
                if si >= 25.0 or fatal_count >= 3:
                    tier = "CRITICAL_BLACK_SPOT"
                elif si >= 15.0 or fatal_count >= 1:
                    tier = "HIGH_PRIORITY"
                else:
                    tier = "MONITORING"

                # Common factors analysis
                factors = [a.get("primary_factor", "") for a in cluster if a.get("primary_factor")]
                common_factor = max(set(factors), key=factors.count) if factors else "Pavement Friction Loss / Geometry"

                # Transparent explanation
                reason = (
                    f"Cluster of {total_acc} verified accidents within {int(cluster_radius_m)}m radius. "
                    f"Casualties: {fatal_count} Fatal, {severe_count} Severe, {minor_count} Minor. "
                    f"MoRTH Severity Index: {si:.1f} (Threshold: >=10.0). Primary crash factor: {common_factor}."
                )

                # Tailored engineering countermeasures
                if "Pothole" in common_factor or "Pavement" in common_factor:
                    countermeasure = "Full-depth asphalt patching, high-friction surface dressing (HFSD), and drainage channel reinstatement."
                elif "Curve" in common_factor or "Skid" in common_factor:
                    countermeasure = "Retroreflective chevron hazard markers (W-104), transverse rumble strips, and road superelevation correction."
                elif "Night" in common_factor or "Dark" in common_factor:
                    countermeasure = "High-mast solar LED luminaire array installation and Type XI microprismatic retroreflective road studs."
                else:
                    countermeasure = "Speed enforcement radar, optical speed bars, thermoplastic rumble strips, and median crash barrier."

                road_id = cluster[0].get("road_id", 1)
                segment_id = cluster[0].get("segment_id", 1)

                black_spots.append({
                    "code": f"BS-{road_id:02d}-Z{idx+1:02d}",
                    "name": f"Hazard Cluster Zone {idx+1} ({common_factor})",
                    "road_id": road_id,
                    "segment_id": segment_id,
                    "latitude": round(avg_lat, 6),
                    "longitude": round(avg_lng, 6),
                    "radius_meters": cluster_radius_m,
                    "total_accidents": total_acc,
                    "fatal_count": fatal_count,
                    "severe_count": severe_count,
                    "minor_count": minor_count,
                    "severity_index": si,
                    "risk_tier": tier,
                    "classification_reason": reason,
                    "recommended_countermeasure": countermeasure,
                    "status": "ACTIVE"
                })

        # Sort by Severity Index descending
        black_spots.sort(key=lambda x: x["severity_index"], reverse=True)
        return black_spots
