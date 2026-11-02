import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.blackspot_engine import BlackSpotEngine
from backend.services.health_engine import RoadHealthEngine
from backend.services.measurement_engine import MeasurementEngine
from backend.services.reconstruction_engine import ReconstructionEngine

client = TestClient(app)

def test_root_health():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["product"] == "ROADGUARD AI"
    assert data["status"] == "OPERATIONAL"

def test_roads_endpoint():
    res = client.get("/api/roads")
    assert res.status_code == 200
    roads = res.json()
    assert len(roads) >= 1
    # Check 10-km signature road
    nh44 = next((r for r in roads if "NH-44" in r["code"]), None)
    assert nh44 is not None
    assert nh44["length_km"] == 10.0

def test_road_segments_100m():
    res = client.get("/api/roads/1")
    assert res.status_code == 200
    road = res.json()
    assert len(road["segments"]) == 100
    assert road["segments"][0]["chainage_start_m"] == 0
    assert road["segments"][0]["chainage_end_m"] == 100
    assert road["segments"][99]["chainage_end_m"] == 10000

def test_morth_blackspot_formula():
    """Verify MoRTH Severity Index formula: SI = 5*Fatal + 3*Severe + 1*Minor"""
    accidents = [
        {"latitude": 28.4680, "longitude": 77.0680, "casualties_fatal": 2, "casualties_severe": 2, "casualties_minor": 1},
        {"latitude": 28.4682, "longitude": 77.0681, "casualties_fatal": 1, "casualties_severe": 1, "casualties_minor": 0},
    ]
    clusters = BlackSpotEngine.identify_black_spots(accidents, cluster_radius_m=500.0)
    assert len(clusters) == 1
    # Total Fatal = 3, Severe = 3, Minor = 1
    # SI = (5*3) + (3*3) + (1*1) = 15 + 9 + 1 = 25.0
    assert clusters[0]["severity_index"] == 25.0
    assert clusters[0]["risk_tier"] == "CRITICAL_BLACK_SPOT"

def test_road_health_deduction_formula():
    """Verify transparent health scoring formula deduction logic."""
    defects = [
        {"severity": "CRITICAL", "defect_type": "Potholes"},
        {"severity": "HIGH", "defect_type": "Road cracks"}
    ]
    # Base 100 - 18 (Critical) - 10 (High) = 72
    result = RoadHealthEngine.calculate_segment_health(
        defects=defects,
        drainage_condition="Adequate",
        streetlight_present=True,
        iri=2.1
    )
    assert result["health_score"] == 72.0
    assert result["classification"] == "FAIR"

def test_measurement_engine_calibration_standards():
    """Verify pixel to metric scaling with mandatory scientific disclaimer."""
    calc = MeasurementEngine.compute_dimensions(
        pixel_length=200.0,
        pixel_width=100.0,
        contour_area_px=15000.0,
        reference_object="coin_25mm"
    )
    assert calc["calibration"]["is_calibrated"] is True
    assert calc["metric_dimensions"]["length_mm"] == round(200.0 * 0.38, 1)
    assert "CALIBRATED METROLOGY" in calc["calibration"]["metrology_notice"]

def test_reconstruction_mandatory_disclaimer():
    """Verify that ROADGUARD VISION strictly watermarks output with statutory disclaimer."""
    assert ReconstructionEngine.MANDATORY_DISCLAIMER == "AI-GENERATED PROPOSED RECONSTRUCTION - NOT AN ACTUAL COMPLETED ROAD."

def test_reports_generation_pdf():
    """Verify PDF export builds and produces downloadable file."""
    res = client.post("/api/reports/generate", json={
        "report_type": "blackspot",
        "format": "pdf",
        "road_id": 1
    })
    assert res.status_code == 200
    data = res.json()
    assert data["format"] == "pdf"
    assert "/reports/" in data["download_url"]

def test_reports_generation_csv():
    """Verify CSV export builds and produces downloadable file."""
    res = client.post("/api/reports/generate", json={
        "report_type": "blackspot",
        "format": "csv",
        "road_id": 1
    })
    assert res.status_code == 200
    data = res.json()
    assert data["format"] == "csv"
    assert data["download_url"].endswith(".csv")

def test_security_disallowed_file_extension():
    """Verify upload rejection for non-image file extensions."""
    files = {"file": ("malicious.exe", b"MZexecutabledata", "application/x-msdownload")}
    res = client.post("/api/defects/detect", files=files, data={"road_id": 1})
    assert res.status_code == 400
    assert "Unsupported file format" in res.json()["detail"]

def test_security_path_traversal_prevention():
    """Verify reports download endpoint prevents directory traversal."""
    res = client.get("/api/reports/download/../../etc/passwd")
    # Path('...').name strips the traversal leading to 404 (file not found in reports dir)
    assert res.status_code in [403, 404]
