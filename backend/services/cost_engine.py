from typing import Dict, Any, List

class CostEstimatorEngine:
    """
    Standard Schedule of Rates (SOR) Maintenance Budget Engine (Indian Rupees - INR ₹).
    Computes segment-level and project-level civil engineering cost estimates based on
    CPWD Delhi Schedule of Rates (DSR) & MoRTH Specification for Road & Bridge Works.
    Strictly documents unit rates, material/labor allocations, and statutory engineering assumptions.
    """

    DEFAULT_UNIT_RATES = {
        "Pothole patching": {"rate": 1450.0, "unit": "sq_m", "material_pct": 0.45, "labor_pct": 0.35, "equip_pct": 0.20},
        "Crack sealing": {"rate": 450.0, "unit": "linear_m", "material_pct": 0.50, "labor_pct": 0.30, "equip_pct": 0.20},
        "Road resurfacing": {"rate": 850.0, "unit": "sq_m", "material_pct": 0.55, "labor_pct": 0.25, "equip_pct": 0.20},
        "Road marking restoration": {"rate": 550.0, "unit": "linear_m", "material_pct": 0.40, "labor_pct": 0.40, "equip_pct": 0.20},
        "Drainage improvement": {"rate": 2400.0, "unit": "linear_m", "material_pct": 0.45, "labor_pct": 0.35, "equip_pct": 0.20},
        "Streetlight installation or maintenance": {"rate": 22000.0, "unit": "unit", "material_pct": 0.60, "labor_pct": 0.25, "equip_pct": 0.15},
        "Road sign replacement": {"rate": 8500.0, "unit": "unit", "material_pct": 0.65, "labor_pct": 0.25, "equip_pct": 0.10},
        "Shoulder edge repair": {"rate": 1200.0, "unit": "linear_m", "material_pct": 0.50, "labor_pct": 0.30, "equip_pct": 0.20}
    }

    DISCLAIMER = (
        "INDICATIVE CPWD / MoRTH SCHEDULE OF RATES (SOR): Calculated using Indian standard road civil works "
        "(CPWD DSR / MoRTH Specifications 5th Revision). Final tender quotations reflect 18% GST, "
        "regional bitumen indices, and traffic management allocations."
    )

    @classmethod
    def estimate_repair(
        cls,
        repair_action: str,
        quantity: float = 1.0,
        custom_rates: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """Calculates itemized cost for a specific maintenance action in INR (₹)."""
        rate_info = cls.DEFAULT_UNIT_RATES.get(
            repair_action,
            {"rate": 1500.0, "unit": "item", "material_pct": 0.45, "labor_pct": 0.35, "equip_pct": 0.20}
        )

        unit_rate = rate_info["rate"]
        if custom_rates and repair_action in custom_rates:
            unit_rate = custom_rates[repair_action]

        total_base = unit_rate * quantity
        material_cost = round(total_base * rate_info["material_pct"], 2)
        labor_cost = round(total_base * rate_info["labor_pct"], 2)
        equip_cost = round(total_base * rate_info["equip_pct"], 2)
        total_cost = round(material_cost + labor_cost + equip_cost, 2)

        return {
            "repair_action": repair_action,
            "quantity": quantity,
            "unit_of_measure": rate_info["unit"],
            "currency": "INR",
            "currency_symbol": "₹",
            "unit_rate_inr": unit_rate,
            "unit_rate_usd": unit_rate, # Backward compatibility
            "material_cost_inr": material_cost,
            "material_cost_usd": material_cost,
            "labor_cost_inr": labor_cost,
            "labor_cost_usd": labor_cost,
            "machinery_cost_inr": equip_cost,
            "machinery_cost_usd": equip_cost,
            "total_estimated_cost_inr": total_cost,
            "total_estimated_cost_usd": total_cost,
            "estimate_notice": cls.DISCLAIMER
        }

    @classmethod
    def estimate_project(
        cls,
        actions: List[Dict[str, Any]],
        custom_rates: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """Calculates project-level maintenance budget with contingency, quality audit, and GST in INR."""
        line_items = []
        subtotal = 0.0

        for item in actions:
            action_name = item.get("action")
            qty = item.get("quantity", 1.0)
            res = cls.estimate_repair(action_name, qty, custom_rates)
            line_items.append(res)
            subtotal += res["total_estimated_cost_inr"]

        contingency = round(subtotal * 0.05, 2) # 5% civil contingency
        supervision = round(subtotal * 0.03, 2) # 3% quality control & audit
        gst = round(subtotal * 0.18, 2)         # 18% Works Contract GST
        grand_total = round(subtotal + contingency + supervision + gst, 2)

        return {
            "currency": "INR",
            "currency_symbol": "₹",
            "line_items": line_items,
            "subtotal_inr": round(subtotal, 2),
            "subtotal_usd": round(subtotal, 2), # Backward compatibility
            "contingency_5pct_inr": contingency,
            "contingency_5pct_usd": contingency,
            "quality_audit_3pct_inr": supervision,
            "quality_audit_3pct_usd": supervision,
            "gst_18pct_inr": gst,
            "grand_total_inr": grand_total,
            "grand_total_usd": grand_total,
            "statutory_disclaimer": cls.DISCLAIMER
        }
