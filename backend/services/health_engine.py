from typing import List, Dict, Any

class RoadHealthEngine:
    """
    Transparent Road Health Scoring Engine (0 to 100 Index):
    Formula:
    RHI = 100 - sum(Defect Deductions) - sum(Infrastructure Deficiencies)
    Deductions:
      - Critical defect: 18 pts
      - High severity defect: 10 pts
      - Medium severity defect: 5 pts
      - Low severity defect: 2 pts
      - Drainage blockage / severe damage: 12 pts
      - Unlit streetlight / missing luminaire: 8 pts
      - Roughness penalty (IRI > 3.0 m/km): up to 10 pts
    """

    @classmethod
    def calculate_segment_health(
        cls,
        defects: List[Dict[str, Any]],
        drainage_condition: str = "Adequate",
        streetlight_present: bool = True,
        iri: float = 2.1,
        accident_count: int = 0
    ) -> Dict[str, Any]:
        """Calculates segment-level health score and risk level."""
        deductions = []
        total_deduction = 0.0

        for d in defects:
            sev = d.get("severity", "MEDIUM")
            dtype = d.get("defect_type", "Defect")
            if sev == "CRITICAL":
                deduction = 18.0
            elif sev == "HIGH":
                deduction = 10.0
            elif sev == "MEDIUM":
                deduction = 5.0
            else:
                deduction = 2.0
            total_deduction += deduction
            deductions.append(f"{dtype} ({sev}): -{deduction} pts")

        # Infrastructure condition deductions
        if drainage_condition in ["Partially Blocked", "Severely Damaged"]:
            p = 12.0 if drainage_condition == "Severely Damaged" else 6.0
            total_deduction += p
            deductions.append(f"Drainage deficiency ({drainage_condition}): -{p} pts")

        if not streetlight_present:
            total_deduction += 8.0
            deductions.append("Missing / inoperative lighting: -8.0 pts")

        if iri > 3.0:
            iri_pen = min(12.0, (iri - 3.0) * 6.0)
            total_deduction += iri_pen
            deductions.append(f"Excessive surface roughness (IRI {iri:.1f} m/km): -{iri_pen:.1f} pts")

        # Score clamped between 15 and 100
        score = max(15.0, round(100.0 - total_deduction, 1))

        # Classification
        if score >= 90.0:
            classification = "EXCELLENT"
            color = "#16A34A" # Green
        elif score >= 75.0:
            classification = "GOOD"
            color = "#65A30D" # Lime
        elif score >= 55.0:
            classification = "FAIR"
            color = "#D97706" # Amber
        elif score >= 40.0:
            classification = "POOR"
            color = "#EA580C" # Orange
        else:
            classification = "CRITICAL"
            color = "#DC2626" # Red

        # Risk tier calculation (combining structural score + accident history)
        if score < 45.0 or accident_count >= 3:
            risk_level = "CRITICAL"
        elif score < 65.0 or accident_count >= 2:
            risk_level = "HIGH"
        elif score < 80.0 or accident_count >= 1:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return {
            "health_score": score,
            "classification": classification,
            "color_code": color,
            "risk_level": risk_level,
            "total_deduction": round(total_deduction, 1),
            "deduction_breakdown": deductions,
            "defects_evaluated": len(defects),
            "formula_documentation": "RHI = 100 - sum(Severity_Deductions) - sum(Infra_Deficiencies) [Clamped 15..100]"
        }
