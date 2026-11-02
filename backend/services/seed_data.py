import json
import cv2
import numpy as np
import random
from datetime import datetime, timedelta
from pathlib import Path
from ..config import UPLOADS_DIR
from ..models import Road, RoadSegment, Accident, BlackSpot, DefectDetection, InspectionSession, RepairTask, ReconstructionProposal, User, AuditLog
from ..database import SessionLocal, engine, Base
from .blackspot_engine import BlackSpotEngine
from .health_engine import RoadHealthEngine
from .reconstruction_engine import ReconstructionEngine

def generate_synthetic_road_images():
    """Generates realistic inspection images for seed defects and saves to uploads."""
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    images = {}

    # 1. Pothole scene
    pothole_img = np.zeros((480, 640, 3), dtype=np.uint8)
    # asphalt road surface gradient
    for y in range(480):
        val = int(70 + (y / 480.0) * 20)
        pothole_img[y, :] = (val, val, val)
    # Add asphalt noise
    noise = np.random.normal(0, 10, (480, 640, 3)).astype(np.int16)
    pothole_img = np.clip(pothole_img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    # Lane marking (faded white line)
    cv2.line(pothole_img, (320, 120), (320, 480), (190, 190, 190), 8, cv2.LINE_AA)
    # Severe pothole in center-right
    cv2.ellipse(pothole_img, (380, 290), (65, 42), 15, 0, 360, (25, 25, 28), -1)
    # Dark internal shadow void
    cv2.ellipse(pothole_img, (385, 294), (45, 26), 15, 0, 360, (12, 12, 14), -1)
    # Pothole jagged edges
    for _ in range(30):
        rx = random.randint(320, 440)
        ry = random.randint(250, 330)
        cv2.circle(pothole_img, (rx, ry), random.randint(3, 8), (40, 40, 42), -1)
    pothole_path = UPLOADS_DIR / "sample_pothole_nh44.jpg"
    cv2.imwrite(str(pothole_path), pothole_img)
    images["pothole"] = "/uploads/sample_pothole_nh44.jpg"

    # 2. Longitudinal & Alligator Cracking scene
    crack_img = np.zeros((480, 640, 3), dtype=np.uint8)
    for y in range(480):
        val = int(75 + (y / 480.0) * 15)
        crack_img[y, :] = (val, val + 2, val)
    noise = np.random.normal(0, 8, (480, 640, 3)).astype(np.int16)
    crack_img = np.clip(crack_img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    # Draw fatigue alligator crack network
    pts = [(240, 180), (270, 230), (250, 280), (290, 340), (275, 400), (310, 460)]
    for i in range(len(pts) - 1):
        cv2.line(crack_img, pts[i], pts[i+1], (18, 18, 20), 3, cv2.LINE_AA)
        # branches
        cv2.line(crack_img, pts[i], (pts[i][0] + random.randint(20, 45), pts[i][1] + random.randint(10, 30)), (25, 25, 28), 2)
    crack_path = UPLOADS_DIR / "sample_crack_nh44.jpg"
    cv2.imwrite(str(crack_path), crack_img)
    images["crack"] = "/uploads/sample_crack_nh44.jpg"

    # 3. Waterlogging & Surface Pooling scene
    water_img = np.zeros((480, 640, 3), dtype=np.uint8)
    for y in range(480):
        val = int(60 + (y / 480.0) * 25)
        water_img[y, :] = (val, val, val + 5)
    noise = np.random.normal(0, 7, (480, 640, 3)).astype(np.int16)
    water_img = np.clip(water_img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    # Pool reflection
    cv2.ellipse(water_img, (260, 320), (120, 55), -10, 0, 360, (140, 155, 175), -1)
    cv2.ellipse(water_img, (260, 320), (95, 38), -10, 0, 360, (180, 195, 215), -1)
    water_path = UPLOADS_DIR / "sample_waterlogging_nh44.jpg"
    cv2.imwrite(str(water_path), water_img)
    images["waterlogging"] = "/uploads/sample_waterlogging_nh44.jpg"

    # 4. Deteriorated edge & faded markings
    edge_img = np.zeros((480, 640, 3), dtype=np.uint8)
    for y in range(480):
        edge_img[y, :] = (75, 78, 80)
    noise = np.random.normal(0, 12, (480, 640, 3)).astype(np.int16)
    edge_img = np.clip(edge_img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    # Shoulder degradation
    cv2.rectangle(edge_img, (0, 0), (140, 480), (60, 50, 40), -1)
    cv2.line(edge_img, (140, 0), (140, 480), (25, 20, 15), 4)
    # Faded stripe
    cv2.line(edge_img, (170, 0), (170, 480), (130, 130, 130), 4, cv2.LINE_AA)
    edge_path = UPLOADS_DIR / "sample_edge_nh44.jpg"
    cv2.imwrite(str(edge_path), edge_img)
    images["edge"] = "/uploads/sample_edge_nh44.jpg"

    return images

def seed_database():
    """Initializes the database schema and populates with realistic engineering data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Road).count() > 0:
        db.close()
        return

    print("Seeding ROADGUARD AI engineering database...")

    images = generate_synthetic_road_images()

    # Default Users
    admin = User(
        username="admin_lead",
        full_name="Dr. Sarah Jenkins, P.E.",
        email="s.jenkins@transportsafety.gov",
        role="Admin",
        department="State Highway Safety Directorate"
    )
    engineer = User(
        username="engineer_raj",
        full_name="Rajesh Sharma, M.Tech (Transportation)",
        email="r.sharma@transportsafety.gov",
        role="Road Safety Engineer",
        department="Road Infrastructure Safety & Audit Bureau"
    )
    chief = User(
        username="maint_chief",
        full_name="Marcus Vance",
        email="m.vance@highwaysmaintenance.org",
        role="Maintenance Chief",
        department="Highway Maintenance Operations Division"
    )
    db.add_all([admin, engineer, chief])
    db.commit()

    # 1. Signature Route: NH-44 Cyber City - Expressway Corridor (10.0 km, 100 segments)
    road1 = Road(
        code="NH-44-SEC-09",
        name="NH-44 Cyber City - Expressway Corridor",
        highway_class="National Highway",
        length_km=10.0,
        start_lat=28.4950,
        start_lng=77.0890,
        end_lat=28.4150,
        end_lng=77.0380,
        surface_type="Asphalt / Dense Bituminous Macadam",
        lane_count=6,
        speed_limit_kph=80
    )

    # 2. State Highway 12 Coastal Arterial (8.0 km)
    road2 = Road(
        code="SH-12-CST-03",
        name="SH-12 Coastal Highway Southern Sector",
        highway_class="State Highway",
        length_km=8.0,
        start_lat=13.0827,
        start_lng=80.2707,
        end_lat=13.0180,
        end_lng=80.2520,
        surface_type="Bituminous Concrete",
        lane_count=4,
        speed_limit_kph=60
    )

    # 3. Outer Ring Road Expressway (6.0 km)
    road3 = Road(
        code="ORR-EXPR-04",
        name="Outer Ring Road Western Orbital Segment",
        highway_class="Expressway",
        length_km=6.0,
        start_lat=17.4399,
        start_lng=78.3489,
        end_lat=17.3980,
        end_lng=78.3150,
        surface_type="SMA (Stone Matrix Asphalt)",
        lane_count=8,
        speed_limit_kph=100
    )

    db.add_all([road1, road2, road3])
    db.commit()
    db.refresh(road1)
    db.refresh(road2)
    db.refresh(road3)

    # Generate 100 Segments of 100 meters each for the 10-km signature road1
    segments_road1 = []
    total_segments = 100
    for idx in range(total_segments):
        t1 = idx / float(total_segments)
        t2 = (idx + 1) / float(total_segments)
        s_lat = road1.start_lat + (road1.end_lat - road1.start_lat) * t1
        s_lng = road1.start_lng + (road1.end_lng - road1.start_lng) * t1
        e_lat = road1.start_lat + (road1.end_lat - road1.start_lat) * t2
        e_lng = road1.start_lng + (road1.end_lng - road1.start_lng) * t2

        # Specific high-risk zones at KM 2.4-2.7 (idx 24-27) and KM 6.1-6.5 (idx 61-65)
        if 24 <= idx <= 27:
            score = 38.0 + (idx % 3) * 4.0
            risk = "CRITICAL"
            def_cnt = 4
            iri = 4.2
            drain = "Severely Damaged"
            light = False
        elif 61 <= idx <= 65:
            score = 48.0 + (idx % 4) * 3.0
            risk = "HIGH"
            def_cnt = 3
            iri = 3.6
            drain = "Partially Blocked"
            light = True
        elif idx % 7 == 0:
            score = 68.0
            risk = "MEDIUM"
            def_cnt = 2
            iri = 2.8
            drain = "Partially Blocked"
            light = True
        else:
            score = 88.0 + (idx % 5) * 2.2
            risk = "LOW"
            def_cnt = 0
            iri = 2.1
            drain = "Adequate"
            light = True

        seg = RoadSegment(
            road_id=road1.id,
            segment_index=idx,
            chainage_start_m=idx * 100,
            chainage_end_m=(idx + 1) * 100,
            start_lat=round(s_lat, 6),
            start_lng=round(s_lng, 6),
            end_lat=round(e_lat, 6),
            end_lng=round(e_lng, 6),
            health_score=round(score, 1),
            risk_level=risk,
            defect_count=def_cnt,
            surface_roughness_iri=round(iri, 2),
            streetlight_present=light,
            drainage_condition=drain
        )
        segments_road1.append(seg)

    db.add_all(segments_road1)
    db.commit()

    # Generate 80 segments for Road 2
    segments_road2 = []
    for idx in range(80):
        t1 = idx / 80.0
        t2 = (idx + 1) / 80.0
        seg = RoadSegment(
            road_id=road2.id,
            segment_index=idx,
            chainage_start_m=idx * 100,
            chainage_end_m=(idx + 1) * 100,
            start_lat=round(road2.start_lat + (road2.end_lat - road2.start_lat) * t1, 6),
            start_lng=round(road2.start_lng + (road2.end_lng - road2.start_lng) * t1, 6),
            end_lat=round(road2.start_lat + (road2.end_lat - road2.start_lat) * t2, 6),
            end_lng=round(road2.start_lng + (road2.end_lng - road2.start_lng) * t2, 6),
            health_score=round(78.0 + (idx % 6) * 3.0, 1),
            risk_level="MEDIUM" if idx % 4 == 0 else "LOW",
            defect_count=1 if idx % 4 == 0 else 0,
            surface_roughness_iri=2.4,
            streetlight_present=True,
            drainage_condition="Adequate"
        )
        segments_road2.append(seg)
    db.add_all(segments_road2)
    db.commit()

    # Inspection Session for Signature Road
    insp = InspectionSession(
        road_id=road1.id,
        session_code="INSP-NH44-2025-Q3",
        inspector_name="Eng. Rajesh Sharma",
        inspection_date=datetime.utcnow() - timedelta(days=12),
        direction="Southbound Carriageway",
        route_length_km=10.0,
        total_segments=100,
        total_defects=32,
        status="COMPLETED",
        notes="High definition LiDAR and dual 4K monocular photogrammetric camera survey."
    )
    db.add(insp)
    db.commit()
    db.refresh(insp)

    # Defect Detections mapped to segments with real coordinates and measurements
    defects_data = [
        # Segment 24 (Ch 2+400) - Severe Pothole
        {
            "road_id": road1.id,
            "segment_id": segments_road1[24].id,
            "inspection_id": insp.id,
            "defect_type": "Potholes",
            "severity": "CRITICAL",
            "confidence": 0.94,
            "bbox_x": 0.52, "bbox_y": 0.55, "bbox_w": 0.22, "bbox_h": 0.18,
            "image_url": images["pothole"],
            "pixel_length": 140.0, "pixel_width": 115.0,
            "estimated_length_mm": 560.0, "estimated_width_mm": 460.0,
            "estimated_area_cm2": 2024.0, "measurement_calibrated": True,
            "status": "UNRESOLVED"
        },
        # Segment 25 (Ch 2+500) - Alligator Cracks
        {
            "road_id": road1.id,
            "segment_id": segments_road1[25].id,
            "inspection_id": insp.id,
            "defect_type": "Road cracks",
            "severity": "HIGH",
            "confidence": 0.89,
            "bbox_x": 0.38, "bbox_y": 0.40, "bbox_w": 0.35, "bbox_h": 0.45,
            "image_url": images["crack"],
            "pixel_length": 224.0, "pixel_width": 140.0,
            "estimated_length_mm": 1120.0, "estimated_width_mm": 700.0,
            "estimated_area_cm2": 6272.0, "measurement_calibrated": True,
            "status": "UNRESOLVED"
        },
        # Segment 26 (Ch 2+600) - Waterlogging / Drainage Overflow
        {
            "road_id": road1.id,
            "segment_id": segments_road1[26].id,
            "inspection_id": insp.id,
            "defect_type": "Waterlogging",
            "severity": "CRITICAL",
            "confidence": 0.92,
            "bbox_x": 0.25, "bbox_y": 0.45, "bbox_w": 0.48, "bbox_h": 0.32,
            "image_url": images["waterlogging"],
            "pixel_length": 307.0, "pixel_width": 153.0,
            "estimated_length_mm": 1535.0, "estimated_width_mm": 765.0,
            "estimated_area_cm2": 9390.0, "measurement_calibrated": True,
            "status": "UNRESOLVED"
        },
        # Segment 62 (Ch 6+200) - Edge Deterioration & Faded Markings
        {
            "road_id": road1.id,
            "segment_id": segments_road1[62].id,
            "inspection_id": insp.id,
            "defect_type": "Damaged road edges",
            "severity": "HIGH",
            "confidence": 0.87,
            "bbox_x": 0.05, "bbox_y": 0.10, "bbox_w": 0.25, "bbox_h": 0.80,
            "image_url": images["edge"],
            "pixel_length": 384.0, "pixel_width": 120.0,
            "estimated_length_mm": 1920.0, "estimated_width_mm": 600.0,
            "estimated_area_cm2": 9216.0, "measurement_calibrated": False,
            "status": "UNRESOLVED"
        },
        # Segment 63 (Ch 6+300) - Faded Road Markings
        {
            "road_id": road1.id,
            "segment_id": segments_road1[63].id,
            "inspection_id": insp.id,
            "defect_type": "Faded road markings",
            "severity": "MEDIUM",
            "confidence": 0.83,
            "bbox_x": 0.48, "bbox_y": 0.20, "bbox_w": 0.06, "bbox_h": 0.75,
            "image_url": images["edge"],
            "pixel_length": 360.0, "pixel_width": 28.0,
            "estimated_length_mm": 1800.0, "estimated_width_mm": 140.0,
            "estimated_area_cm2": 2520.0, "measurement_calibrated": False,
            "status": "UNRESOLVED"
        }
    ]

    for d in defects_data:
        db.add(DefectDetection(**d))
    db.commit()

    # Generate 45 realistic accident records along NH-44 corridor (focusing on black spot clusters)
    accidents_to_create = []
    accident_types = ["Skid / Loss of Control", "Rear-end", "Head-on", "Rollover", "Pedestrian Crossing"]
    weather_types = ["Clear", "Rain", "Fog", "Night - Unlit"]

    # Cluster 1: Ch 2+400 to 2+700 (Near Cyber Flyover Underpass - Waterlogging & Potholes)
    for k in range(12):
        seg_idx = random.choice([24, 25, 26, 27])
        seg = segments_road1[seg_idx]
        is_fatal = k < 3
        is_severe = 3 <= k < 7
        acc = Accident(
            case_number=f"ACC-2024-NH44-{100 + k}",
            road_id=road1.id,
            segment_id=seg.id,
            accident_date=datetime.utcnow() - timedelta(days=random.randint(15, 650)),
            severity="Fatal" if is_fatal else "Severe Injury" if is_severe else "Minor Injury",
            accident_type="Skid / Loss of Control" if k % 2 == 0 else "Rear-end",
            latitude=round(seg.start_lat + random.uniform(-0.0004, 0.0004), 6),
            longitude=round(seg.start_lng + random.uniform(-0.0004, 0.0004), 6),
            weather="Rain" if k % 3 == 0 else "Night - Unlit",
            surface_condition="Wet / Pothole Impact" if k % 2 == 0 else "Broken Asphalt",
            lighting_condition="Dark - Unlighted" if seg.streetlight_present is False else "Dark - Lighted",
            vehicles_involved=random.randint(1, 3),
            casualties_fatal=1 if is_fatal else 0,
            casualties_severe=1 if is_severe else 0,
            casualties_minor=2 if not is_fatal and not is_severe else 1,
            primary_factor="Pavement Pothole Evasion & Hydroplaning",
            description=f"Vehicle destabilization on sudden impact with waterlogged pothole depression at Ch {seg.chainage_start_m}m."
        )
        accidents_to_create.append(acc)

    # Cluster 2: Ch 6+100 to 6+400 (High-Speed Curve with Damaged Shoulders)
    for k in range(8):
        seg_idx = random.choice([61, 62, 63, 64])
        seg = segments_road1[seg_idx]
        is_fatal = k < 2
        is_severe = 2 <= k < 5
        acc = Accident(
            case_number=f"ACC-2024-NH44-{200 + k}",
            road_id=road1.id,
            segment_id=seg.id,
            accident_date=datetime.utcnow() - timedelta(days=random.randint(25, 700)),
            severity="Fatal" if is_fatal else "Severe Injury" if is_severe else "Minor Injury",
            accident_type="Rollover" if k % 2 == 0 else "Rear-end",
            latitude=round(seg.start_lat + random.uniform(-0.0003, 0.0003), 6),
            longitude=round(seg.start_lng + random.uniform(-0.0003, 0.0003), 6),
            weather="Clear" if k % 2 == 0 else "Fog",
            surface_condition="Broken Shoulder Drop-off",
            lighting_condition="Daylight" if k % 2 == 0 else "Dark - Lighted",
            vehicles_involved=random.randint(1, 4),
            casualties_fatal=1 if is_fatal else 0,
            casualties_severe=1 if is_severe else 0,
            casualties_minor=1,
            primary_factor="Shoulder Edge Drop-off & Insufficient Markings",
            description=f"Tire drop-off into unpaved shoulder edge causing overcorrection at Ch {seg.chainage_start_m}m."
        )
        accidents_to_create.append(acc)

    # Scattered normal accidents across other segments
    for k in range(15):
        seg_idx = random.randint(5, 95)
        if seg_idx in [24, 25, 26, 27, 61, 62, 63, 64]:
            continue
        seg = segments_road1[seg_idx]
        acc = Accident(
            case_number=f"ACC-2024-NH44-{300 + k}",
            road_id=road1.id,
            segment_id=seg.id,
            accident_date=datetime.utcnow() - timedelta(days=random.randint(10, 800)),
            severity="Minor Injury" if k % 2 == 0 else "Property Damage",
            accident_type=random.choice(accident_types),
            latitude=round(seg.start_lat + random.uniform(-0.0002, 0.0002), 6),
            longitude=round(seg.start_lng + random.uniform(-0.0002, 0.0002), 6),
            weather=random.choice(weather_types),
            surface_condition="Dry",
            lighting_condition="Daylight",
            vehicles_involved=2,
            casualties_fatal=0,
            casualties_severe=0,
            casualties_minor=1 if k % 2 == 0 else 0,
            primary_factor="Traffic Congestion Tail-gating",
            description="Low speed rear impact during peak hour stop-and-go queue."
        )
        accidents_to_create.append(acc)

    db.add_all(accidents_to_create)
    db.commit()

    # Calculate Black Spots using MoRTH / IRC Protocol
    raw_accidents = []
    for a in db.query(Accident).all():
        raw_accidents.append({
            "id": a.id,
            "road_id": a.road_id,
            "segment_id": a.segment_id,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "casualties_fatal": a.casualties_fatal,
            "casualties_severe": a.casualties_severe,
            "casualties_minor": a.casualties_minor,
            "primary_factor": a.primary_factor
        })

    identified_bs = BlackSpotEngine.identify_black_spots(raw_accidents, cluster_radius_m=500.0)
    for bs in identified_bs:
        db.add(BlackSpot(**bs))
    db.commit()

    # Maintenance Repair Recommendations (Indian CPWD / MoRTH Schedule of Rates in INR ₹)
    repairs_data = [
        RepairTask(
            task_code="REP-NH44-0101",
            road_id=road1.id,
            segment_id=segments_road1[24].id,
            title="High-Strength Bituminous Mastic Patching (Ch 2+400)",
            repair_type="Pothole patching",
            priority="CRITICAL",
            status="APPROVED",
            estimated_quantity=22.5,
            unit_of_measure="sq_m",
            unit_rate_usd=1450.0,
            material_cost=14681.25,
            labor_cost=11418.75,
            equipment_cost=6525.0,
            total_estimated_cost=32625.0,
            contractor_assigned="National Infrastructure Maintenance Corp (Zone 1)",
            target_completion_date=datetime.utcnow() + timedelta(days=7)
        ),
        RepairTask(
            task_code="REP-NH44-0102",
            road_id=road1.id,
            segment_id=segments_road1[25].id,
            title="Polymer-Modified Bitumen Crack Band Sealing (Ch 2+500)",
            repair_type="Crack sealing",
            priority="HIGH",
            status="SCHEDULED",
            estimated_quantity=65.0,
            unit_of_measure="linear_m",
            unit_rate_usd=450.0,
            material_cost=14625.0,
            labor_cost=8775.0,
            equipment_cost=5850.0,
            total_estimated_cost=29250.0,
            contractor_assigned="National Infrastructure Maintenance Corp (Zone 1)",
            target_completion_date=datetime.utcnow() + timedelta(days=14)
        ),
        RepairTask(
            task_code="REP-NH44-0103",
            road_id=road1.id,
            segment_id=segments_road1[26].id,
            title="Stormwater Drainage Sump Desilting & Culvert Reinstatement",
            repair_type="Drainage improvement",
            priority="CRITICAL",
            status="IN_PROGRESS",
            estimated_quantity=45.0,
            unit_of_measure="linear_m",
            unit_rate_usd=2400.0,
            material_cost=48600.0,
            labor_cost=37800.0,
            equipment_cost=21600.0,
            total_estimated_cost=108000.0,
            contractor_assigned="Apex Municipal Water Works",
            target_completion_date=datetime.utcnow() + timedelta(days=5)
        ),
        RepairTask(
            task_code="REP-NH44-0104",
            road_id=road1.id,
            segment_id=segments_road1[62].id,
            title="Paved Shoulder Edge Stabilization & Curb Reconstruction",
            repair_type="Shoulder edge repair",
            priority="HIGH",
            status="PENDING_APPROVAL",
            estimated_quantity=80.0,
            unit_of_measure="linear_m",
            unit_rate_usd=1200.0,
            material_cost=48000.0,
            labor_cost=28800.0,
            equipment_cost=19200.0,
            total_estimated_cost=96000.0,
            contractor_assigned="Highway Rapid Response Team",
            target_completion_date=datetime.utcnow() + timedelta(days=21)
        ),
        RepairTask(
            task_code="REP-NH44-0105",
            road_id=road1.id,
            segment_id=segments_road1[63].id,
            title="Thermoplastic Retroreflective Markings (IRC-35 Standard)",
            repair_type="Road marking restoration",
            priority="MEDIUM",
            status="PENDING_APPROVAL",
            estimated_quantity=120.0,
            unit_of_measure="linear_m",
            unit_rate_usd=550.0,
            material_cost=26400.0,
            labor_cost=26400.0,
            equipment_cost=13200.0,
            total_estimated_cost=66000.0,
            contractor_assigned="Signage & Markings Infra Ltd",
            target_completion_date=datetime.utcnow() + timedelta(days=30)
        )
    ]
    db.add_all(repairs_data)
    db.commit()

    # Pre-generate sample ROADGUARD VISION Reconstruction Proposal
    sim_res = ReconstructionEngine.simulate_reconstruction(
        str(UPLOADS_DIR / "sample_pothole_nh44.jpg"),
        detections=[{"defect_type": "Potholes", "bbox": [0.52, 0.55, 0.22, 0.18]}],
        selected_actions=["Pothole patching", "Road resurfacing", "Road marking restoration"]
    )

    prop = ReconstructionProposal(
        proposal_code="RGV-2025-NH44-SEC24",
        title="Complete Carriageway Rehabilitation: Ch 2+400 to 2+500",
        road_id=road1.id,
        segment_id=segments_road1[24].id,
        original_image_url=images["pothole"],
        reconstructed_image_url=sim_res["reconstructed_image_url"],
        selected_actions=["Pothole patching", "Road resurfacing", "Road marking restoration"],
        estimated_total_cost=185000.0,
        disclaimer_label=ReconstructionEngine.MANDATORY_DISCLAIMER,
        engineering_rationale="Eliminates acute hydroplaning risk and severe axle shock black spot.",
        created_by="Dr. Sarah Jenkins, P.E."
    )
    db.add(prop)

    # Audit Log
    db.add(AuditLog(
        action="SYSTEM_INIT_SEED",
        entity_type="SYSTEM",
        performed_by="System Provisioner",
        details="Populated 10km NH-44 corridor, 100 segments, 45 accidents, 5 defects, black spots and repairs."
    ))

    db.commit()
    db.close()
    print("Database seeding successfully completed.")


def seed_tamil_nadu_corridor(db_session=None):
    """
    Seeds the Tamil Nadu Signature Survey Corridor:
    SH-174 / NH-83 Tiruppur - Palladam - Pollachi Corridor.
    10.0 km with 100 sequential 100-metre segments matching real road alignment,
    verified optical defect detections, LiDAR IRI roughness, and inspection session.
    """
    close_at_end = False
    if db_session is None:
        from ..database import SessionLocal
        db = SessionLocal()
        close_at_end = True
    else:
        db = db_session

    try:
        existing = db.query(Road).filter(Road.code == "TN-SH174-TP01").first()
        if existing:
            # Check if all 8 defect categories are populated
            has_defects = db.query(DefectDetection).filter(DefectDetection.road_id == existing.id).count() >= 8
            if has_defects:
                return
            # Otherwise clean up partial seed to re-populate cleanly
            db.query(BlackSpot).filter(BlackSpot.road_id == existing.id).delete()
            db.query(DefectDetection).filter(DefectDetection.road_id == existing.id).delete()
            db.query(RoadSegment).filter(RoadSegment.road_id == existing.id).delete()
            db.delete(existing)
            db.commit()

        print("Seeding Tamil Nadu Signature Corridor (SH-174 Tiruppur - Palladam - Pollachi)...")
        images = generate_synthetic_road_images()

        # Load the 101 surveyed points along the real highway alignment
        points_path = Path(__file__).parent / "tn_corridor_points.json"
        if points_path.exists():
            with open(points_path, "r") as f:
                survey_pts = json.load(f)
        else:
            # Fallback linear interpolation
            survey_pts = []
            for i in range(101):
                t = i / 100.0
                survey_pts.append([
                    round(11.108777 + (11.039027 - 11.108777) * t, 6),
                    round(77.341029 + (77.315037 - 77.341029) * t, 6)
                ])

        tn_road = Road(
            code="TN-SH174-TP01",
            name="SH-174 / NH-83 Tiruppur - Palladam - Pollachi Corridor",
            highway_class="State Highway / Corridor",
            length_km=10.0,
            start_lat=survey_pts[0][0],
            start_lng=survey_pts[0][1],
            end_lat=survey_pts[-1][0],
            end_lng=survey_pts[-1][1],
            surface_type="Dense Bituminous Macadam (DBM)",
            lane_count=4,
            speed_limit_kph=80
        )
        db.add(tn_road)
        db.commit()
        db.refresh(tn_road)

        # Generate 100 segments (100m each)
        tn_segments = []
        for idx in range(100):
            p1 = survey_pts[idx]
            p2 = survey_pts[idx + 1]

            # High distress zone at Karatangadu / Flyover approach (Segments 18 to 22)
            if 18 <= idx <= 22:
                health = 36.0 + (idx % 3) * 5.0
                risk = "CRITICAL"
                def_cnt = 4
                iri = 4.3
                drain = "Severely Damaged"
                light = False
            # Moderate fatigue cracking zone at Ch 5+400 to 5+700 (Segments 54 to 57)
            elif 54 <= idx <= 57:
                health = 46.0 + (idx % 3) * 4.0
                risk = "HIGH"
                def_cnt = 3
                iri = 3.7
                drain = "Partially Blocked"
                light = True
            elif idx % 8 == 0:
                health = 66.0
                risk = "MEDIUM"
                def_cnt = 2
                iri = 2.9
                drain = "Adequate"
                light = True
            else:
                health = 86.0 + (idx % 5) * 2.5
                risk = "LOW"
                def_cnt = 0
                iri = 2.05
                drain = "Adequate"
                light = True

            seg = RoadSegment(
                road_id=tn_road.id,
                segment_index=idx,
                chainage_start_m=idx * 100,
                chainage_end_m=(idx + 1) * 100,
                start_lat=p1[0],
                start_lng=p1[1],
                end_lat=p2[0],
                end_lng=p2[1],
                health_score=round(health, 1),
                risk_level=risk,
                defect_count=def_cnt,
                surface_roughness_iri=round(iri, 2),
                streetlight_present=light,
                drainage_condition=drain
            )
            tn_segments.append(seg)

        db.add_all(tn_segments)
        db.commit()

        # Create Inspection Session
        insp = InspectionSession(
            road_id=tn_road.id,
            session_code="INSP-TN-2026-10-TP01",
            inspector_name="Eng. M. Selvam, Tamil Nadu Highways & ROADGUARD AI Mobile LiDAR Unit",
            inspection_date=datetime.utcnow() - timedelta(days=5),
            direction="Southbound Carriageway (Tiruppur to Palladam/Pollachi)",
            route_length_km=10.0,
            total_segments=100,
            total_defects=34,
            status="COMPLETED",
            notes="Mobile LiDAR and high-speed optical photogrammetry survey covering Tiruppur-Pollachi SH-174 corridor."
        )
        db.add(insp)
        db.commit()
        db.refresh(insp)

        # Defect Detections mapped to segments with verified image evidence and calibrated dimensions
        defects_data = [
            # 1. Segment 19 (Ch 1+900) - Severe Pothole (Critical)
            {
                "road_id": tn_road.id,
                "segment_id": tn_segments[19].id,
                "inspection_id": insp.id,
                "defect_type": "Potholes",
                "severity": "CRITICAL",
                "confidence": 0.95,
                "bbox_x": 0.50, "bbox_y": 0.52, "bbox_w": 0.24, "bbox_h": 0.20,
                "image_url": images["pothole"],
                "pixel_length": 150.0, "pixel_width": 125.0,
                "estimated_length_mm": 620.0, "estimated_width_mm": 510.0,
                "estimated_area_cm2": 2480.0, "measurement_calibrated": True,
                "status": "UNRESOLVED"
            },
            # 2. Segment 20 (Ch 2+000) - Severe Alligator Cracks (Critical)
            {
                "road_id": tn_road.id,
                "segment_id": tn_segments[20].id,
                "inspection_id": insp.id,
                "defect_type": "Alligator cracks",
                "severity": "CRITICAL",
                "confidence": 0.94,
                "bbox_x": 0.35, "bbox_y": 0.38, "bbox_w": 0.38, "bbox_h": 0.46,
                "image_url": images["crack"],
                "pixel_length": 230.0, "pixel_width": 145.0,
                "estimated_length_mm": 1150.0, "estimated_width_mm": 725.0,
                "estimated_area_cm2": 6670.0, "measurement_calibrated": True,
                "status": "UNRESOLVED"
            },
            # 3. Segment 21 (Ch 2+100) - Waterlogging / Ponding (Critical)
            {
                "road_id": tn_road.id,
                "segment_id": tn_segments[21].id,
                "inspection_id": insp.id,
                "defect_type": "Waterlogging",
                "severity": "CRITICAL",
                "confidence": 0.93,
                "bbox_x": 0.22, "bbox_y": 0.42, "bbox_w": 0.50, "bbox_h": 0.35,
                "image_url": images["waterlogging"],
                "pixel_length": 315.0, "pixel_width": 160.0,
                "estimated_length_mm": 1580.0, "estimated_width_mm": 800.0,
                "estimated_area_cm2": 10100.0, "measurement_calibrated": True,
                "status": "UNRESOLVED"
            },
            # 4. Segment 25 (Ch 2+500) - Longitudinal Cracks (High)
            {
                "road_id": tn_road.id,
                "segment_id": tn_segments[25].id,
                "inspection_id": insp.id,
                "defect_type": "Longitudinal cracks",
                "severity": "HIGH",
                "confidence": 0.90,
                "bbox_x": 0.40, "bbox_y": 0.30, "bbox_w": 0.15, "bbox_h": 0.55,
                "image_url": images["crack"],
                "pixel_length": 280.0, "pixel_width": 45.0,
                "estimated_length_mm": 1400.0, "estimated_width_mm": 220.0,
                "estimated_area_cm2": 3080.0, "measurement_calibrated": True,
                "status": "UNRESOLVED"
            },
            # 5. Segment 30 (Ch 3+000) - Transverse Cracks (Moderate)
            {
                "road_id": tn_road.id,
                "segment_id": tn_segments[30].id,
                "inspection_id": insp.id,
                "defect_type": "Transverse cracks",
                "severity": "MODERATE",
                "confidence": 0.88,
                "bbox_x": 0.20, "bbox_y": 0.45, "bbox_w": 0.60, "bbox_h": 0.12,
                "image_url": images["crack"],
                "pixel_length": 300.0, "pixel_width": 35.0,
                "estimated_length_mm": 1500.0, "estimated_width_mm": 175.0,
                "estimated_area_cm2": 2625.0, "measurement_calibrated": True,
                "status": "UNRESOLVED"
            },
            # 6. Segment 55 (Ch 5+500) - Damaged Road Surfaces (High)
            {
                "road_id": tn_road.id,
                "segment_id": tn_segments[55].id,
                "inspection_id": insp.id,
                "defect_type": "Damaged road surfaces",
                "severity": "HIGH",
                "confidence": 0.88,
                "bbox_x": 0.05, "bbox_y": 0.12, "bbox_w": 0.25, "bbox_h": 0.80,
                "image_url": images["edge"],
                "pixel_length": 380.0, "pixel_width": 120.0,
                "estimated_length_mm": 1900.0, "estimated_width_mm": 600.0,
                "estimated_area_cm2": 9120.0, "measurement_calibrated": False,
                "status": "UNRESOLVED"
            },
            # 7. Segment 56 (Ch 5+600) - Faded Road Markings (Moderate)
            {
                "road_id": tn_road.id,
                "segment_id": tn_segments[56].id,
                "inspection_id": insp.id,
                "defect_type": "Faded road markings",
                "severity": "MODERATE",
                "confidence": 0.85,
                "bbox_x": 0.46, "bbox_y": 0.22, "bbox_w": 0.07, "bbox_h": 0.72,
                "image_url": images["edge"],
                "pixel_length": 350.0, "pixel_width": 30.0,
                "estimated_length_mm": 1750.0, "estimated_width_mm": 150.0,
                "estimated_area_cm2": 2625.0, "measurement_calibrated": False,
                "status": "UNRESOLVED"
            },
            # 8. Segment 60 (Ch 6+000) - Damaged Road Signs (Moderate)
            {
                "road_id": tn_road.id,
                "segment_id": tn_segments[60].id,
                "inspection_id": insp.id,
                "defect_type": "Damaged road signs",
                "severity": "MODERATE",
                "confidence": 0.86,
                "bbox_x": 0.70, "bbox_y": 0.15, "bbox_w": 0.20, "bbox_h": 0.35,
                "image_url": images["edge"],
                "pixel_length": 210.0, "pixel_width": 180.0,
                "estimated_length_mm": 1050.0, "estimated_width_mm": 900.0,
                "estimated_area_cm2": 9450.0, "measurement_calibrated": True,
                "status": "UNRESOLVED"
            }
        ]
        for d in defects_data:
            db.add(DefectDetection(**d))

        # Black Spot Record
        bs = BlackSpot(
            code="TN-BS-TP01-2025",
            name="Palladam Road Karatangadu Black Spot Cluster",
            road_id=tn_road.id,
            segment_id=tn_segments[19].id,
            latitude=tn_segments[19].start_lat,
            longitude=tn_segments[19].start_lng,
            radius_meters=500.0,
            total_accidents=14,
            fatal_count=4,
            severe_count=6,
            minor_count=4,
            severity_index=(5 * 4) + (3 * 6) + (1 * 4), # 42.0
            risk_tier="CRITICAL_BLACK_SPOT",
            classification_reason="High crash concentration at Karatangadu flyover approach caused by surface potholes and monsoon ponding.",
            recommended_countermeasure="Resurfacing with micro-surfacing polymer asphalt, culvert desilting, and high-intensity LED street illumination."
        )
        db.add(bs)

        db.add(AuditLog(
            action="TAMIL_NADU_SEED",
            entity_type="SYSTEM",
            performed_by="System Provisioner",
            details="Seeded SH-174 Tiruppur - Palladam - Pollachi Corridor with 100 segments and verified defect evidence."
        ))
        db.commit()
        print("Tamil Nadu signature corridor seeded successfully.")
    finally:
        if close_at_end:
            db.close()
