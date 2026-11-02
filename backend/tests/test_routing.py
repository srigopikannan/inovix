import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_search_indian_locations():
    response = client.get("/api/routing/search?query=Delhi&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any("Delhi" in item["name"] or "Delhi" in item["display_name"] for item in data)

def test_reverse_geocode_coordinate():
    response = client.get("/api/routing/reverse?lat=28.4950&lng=77.0890")
    assert response.status_code == 200
    data = response.json()
    assert "lat" in data
    assert "lng" in data
    assert "name" in data

def test_calculate_route_and_segmentation():
    payload = {
        "source": {"lat": 28.4950, "lng": 77.0890, "name": "Cyber City Gurugram"},
        "destination": {"lat": 28.4150, "lng": 77.0380, "name": "Sector 29 Gurugram"},
        "road_name": "NH-44 Corridor"
    }
    response = client.post("/api/routing/route", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "route" in data
    assert "segments" in data
    assert "summary" in data
    assert len(data["segments"]) > 0
    # Every segment must have 100m chainage and valid coordinates
    first_seg = data["segments"][0]
    assert first_seg["chainage_start_m"] == 0
    assert first_seg["chainage_end_m"] == 100
    assert first_seg["inspection_status"] in ["INSPECTED", "NOT_INSPECTED"]
    assert first_seg["road_condition"] in ["GOOD", "MODERATE", "POOR", "CRITICAL", "NOT_INSPECTED"]

def test_destination_report_generation():
    payload = {
        "source_name": "Cyber City Gurugram",
        "destination_name": "Sector 29 Gurugram",
        "format": "pdf",
        "route_meta": {
            "distance_km": 12.5,
            "duration_min": 19.0,
            "primary_road_name": "NH-44",
            "provider": "OSRM"
        },
        "segments": [{
            "segment_id": "SEG-0001",
            "chainage_start_m": 0,
            "chainage_end_m": 100,
            "inspection_status": "INSPECTED",
            "road_condition": "GOOD",
            "health_score": 85.0,
            "defect_count": 0
        }],
        "summary_stats": {
            "total_segments": 125,
            "inspected_segments": 10,
            "coverage_pct": 8.0,
            "pothole_count": 2,
            "crack_count": 1,
            "critical_segments_count": 1
        }
    }
    # Test PDF
    pdf_res = client.post("/api/routing/report", json=payload)
    assert pdf_res.status_code == 200
    assert pdf_res.json()["format"] == "pdf"
    assert pdf_res.json()["download_url"].endswith(".pdf")

    # Test CSV
    payload["format"] = "csv"
    csv_res = client.post("/api/routing/report", json=payload)
    assert csv_res.status_code == 200
    assert csv_res.json()["format"] == "csv"
    assert csv_res.json()["download_url"].endswith(".csv")

def test_live_road_inspect():
    # 1. Test inspected corridor segment (NH-44 Cyber City coordinates)
    inspected_res = client.post("/api/routing/live-road-inspect", json={"lat": 28.4950, "lng": 77.0890})
    assert inspected_res.status_code == 200
    inspected_data = inspected_res.json()
    assert inspected_data["status"] == "INSPECTED"
    assert "road" in inspected_data
    assert "inspection" in inspected_data
    assert "satellite_info" in inspected_data

    # 2. Test uninspected Indian coordinate (Honest Data Representation)
    uninspected_res = client.post("/api/routing/live-road-inspect", json={"lat": 19.0760, "lng": 72.8777})
    assert uninspected_res.status_code == 200
    uninspected_data = uninspected_res.json()
    assert uninspected_data["status"] == "NOT_INSPECTED"
    assert uninspected_data["prompt_upload"] is True
    assert "No verified street-level mobile scanner footage" in uninspected_data["message"]
