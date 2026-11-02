import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_tamil_nadu_location_search_districts():
    """Verify searches across Tamil Nadu districts return accurate results."""
    test_queries = [
        "Tiruppur",
        "Pollachi",
        "Coimbatore",
        "Chennai",
        "Erode",
        "Salem",
        "Madurai",
        "Dindigul",
        "Ooty",
        "Coonoor",
        "Udumalpet",
        "Palani",
        "Palladam"
    ]
    for q in test_queries:
        res = client.get(f"/api/routing/search?query={q}&limit=5")
        assert res.status_code == 200
        data = res.json()
        assert len(data) > 0, f"No search results found for Tamil Nadu query: {q}"
        first = data[0]
        assert "lat" in first and "lng" in first
        assert "name" in first

def test_route_tiruppur_to_pollachi():
    """Verify Tiruppur to Pollachi driving route and segment-level ground inspection."""
    payload = {
        "source": {"lat": 11.1085, "lng": 77.3411, "name": "Tiruppur (Old Bus Stand / Kumaran Road)"},
        "destination": {"lat": 10.6609, "lng": 77.0048, "name": "Pollachi (Central Bus Stand / Coimbatore Road)"},
        "road_name": "SH-174 / NH-83 Tiruppur - Palladam - Pollachi Corridor"
    }
    res = client.post("/api/routing/route", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert "route" in data
    assert "segments" in data
    assert "summary" in data

    # Distance check (~65.8 km)
    dist_km = data["route"]["distance_km"]
    assert 60.0 <= dist_km <= 75.0

    # 100m segments check
    segments = data["segments"]
    assert len(segments) >= 600

    # Surveyed corridor check (First 100 segments along Tiruppur - Palladam road are verified)
    inspected = [s for s in segments if s["inspection_status"] == "INSPECTED"]
    not_inspected = [s for s in segments if s["inspection_status"] == "NOT_INSPECTED"]
    assert len(inspected) >= 90
    assert len(not_inspected) > 400

    # Check defects on surveyed corridor
    summary = data["summary"]
    assert summary["pothole_count"] >= 1
    assert summary["crack_count"] >= 1
    assert summary["waterlogging_count"] >= 1

def test_route_coimbatore_to_chennai():
    """Verify Coimbatore to Chennai driving route across Tamil Nadu."""
    payload = {
        "source": {"lat": 11.0168, "lng": 76.9558, "name": "Coimbatore (Gandhipuram)"},
        "destination": {"lat": 13.0827, "lng": 80.2707, "name": "Chennai Central"},
        "road_name": "NH-544 / NH-48 Coimbatore - Chennai Corridor"
    }
    res = client.post("/api/routing/route", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    dist_km = data["route"]["distance_km"]
    assert 450.0 <= dist_km <= 550.0
    assert len(data["segments"]) > 4000

def test_route_erode_to_salem():
    """Verify Erode to Salem driving route."""
    payload = {
        "source": {"lat": 11.3410, "lng": 77.7172, "name": "Erode"},
        "destination": {"lat": 11.6643, "lng": 78.1460, "name": "Salem"},
        "road_name": "NH-544 Erode - Salem Corridor"
    }
    res = client.post("/api/routing/route", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    dist_km = data["route"]["distance_km"]
    assert 55.0 <= dist_km <= 75.0

def test_route_madurai_to_dindigul():
    """Verify Madurai to Dindigul driving route."""
    payload = {
        "source": {"lat": 9.9252, "lng": 78.1198, "name": "Madurai"},
        "destination": {"lat": 10.3673, "lng": 77.9803, "name": "Dindigul"},
        "road_name": "NH-44 Madurai - Dindigul Corridor"
    }
    res = client.post("/api/routing/route", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    dist_km = data["route"]["distance_km"]
    assert 60.0 <= dist_km <= 85.0

def test_route_ooty_to_coonoor():
    """Verify Ooty to Coonoor Nilgiris mountain driving route."""
    payload = {
        "source": {"lat": 11.4102, "lng": 76.6932, "name": "Ooty"},
        "destination": {"lat": 11.3530, "lng": 76.7959, "name": "Coonoor"},
        "road_name": "NH-181 Nilgiris Mountain Corridor"
    }
    res = client.post("/api/routing/route", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    dist_km = data["route"]["distance_km"]
    assert 15.0 <= dist_km <= 30.0
