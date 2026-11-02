import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface RoadNetworkCanvasProps {
  className?: string;
  interactive?: boolean;
}

export const RoadNetworkCanvas: React.FC<RoadNetworkCanvasProps> = ({
  className = '',
  interactive = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeBeacon, setActiveBeacon] = useState<{ label: string; coords: string; status: string; pci: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let width = container.clientWidth || 800;
    let height = container.clientHeight || 560;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF5F8FC);
    scene.fog = new THREE.FogExp2(0xF5F8FC, 0.012);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 38, 72);
    camera.lookAt(0, 4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Lighting System (Futuristic Studio Lighting)
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.3);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xFFFFFF, 1.6);
    mainSun.position.set(45, 70, 45);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 1024;
    mainSun.shadow.mapSize.height = 1024;
    scene.add(mainSun);

    const cyanAccentLight = new THREE.PointLight(0x06B6D4, 3.2, 70);
    cyanAccentLight.position.set(-10, 18, 10);
    scene.add(cyanAccentLight);

    const blueAccentLight = new THREE.PointLight(0x2563EB, 2.5, 60);
    blueAccentLight.position.set(20, 15, -10);
    scene.add(blueAccentLight);

    // 3. 3D Contoured Geospatial Terrain Mesh (Subtle Undulation)
    const terrainSize = 160;
    const terrainSegs = 48;
    const terrainGeom = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs);
    terrainGeom.rotateX(-Math.PI / 2);
    const posAttr = terrainGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      // Gentle rolling elevation
      const elevation = Math.sin(vx * 0.04) * Math.cos(vz * 0.04) * 2.2 - (Math.abs(vx) < 18 && Math.abs(vz) < 40 ? 0.8 : 0);
      posAttr.setY(i, elevation - 2.5);
    }
    terrainGeom.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0xEEF4FA,
      roughness: 0.9,
      metalness: 0.05,
      wireframe: false
    });
    const terrainMesh = new THREE.Mesh(terrainGeom, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // Grid wireframe overlay for high-tech GIS look
    const gridHelper = new THREE.GridHelper(150, 36, 0x94A3B8, 0xE2E8F0);
    gridHelper.position.y = -2.4;
    scene.add(gridHelper);

    // 4. Primary Highway Spline (NH-44 Cyber City Corridor)
    const mainCurvePoints = [
      new THREE.Vector3(-52, 0, -32),
      new THREE.Vector3(-30, 2.5, -14),
      new THREE.Vector3(-12, 5.0, 6),
      new THREE.Vector3(12, 3.8, 16),
      new THREE.Vector3(34, 6.2, -4),
      new THREE.Vector3(54, 1.5, -28)
    ];
    const roadCurve = new THREE.CatmullRomCurve3(mainCurvePoints);
    roadCurve.curveType = 'catmullrom';

    // Secondary Feeder Branch Road (Interchange)
    const branchPoints = [
      new THREE.Vector3(-12, 5.0, 6),
      new THREE.Vector3(-6, 3.5, 24),
      new THREE.Vector3(4, 1.2, 42),
      new THREE.Vector3(18, 0.2, 56)
    ];
    const branchCurve = new THREE.CatmullRomCurve3(branchPoints);

    // 5. Build Road Geometry Ribbon
    const buildRoadMesh = (curve: THREE.CatmullRomCurve3, width: number, isMain: boolean) => {
      const pts = curve.getPoints(120);
      const geom = new THREE.BufferGeometry();
      const positions: number[] = [];
      const uvs: number[] = [];

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const tangent = curve.getTangent(i / (pts.length - 1)).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

        positions.push(p.x - normal.x * (width / 2), p.y + 0.1, p.z - normal.z * (width / 2));
        uvs.push(0, i / pts.length);

        positions.push(p.x + normal.x * (width / 2), p.y + 0.1, p.z + normal.z * (width / 2));
        uvs.push(1, i / pts.length);
      }

      const indices: number[] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const v1 = i * 2;
        const v2 = i * 2 + 1;
        const v3 = (i + 1) * 2;
        const v4 = (i + 1) * 2 + 1;
        indices.push(v1, v2, v3);
        indices.push(v2, v4, v3);
      }
      geom.setIndex(indices);
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geom.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: isMain ? 0x1E293B : 0x334155,
        roughness: 0.82,
        metalness: 0.12,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.receiveShadow = true;
      return mesh;
    };

    const mainRoadMesh = buildRoadMesh(roadCurve, 4.4, true);
    scene.add(mainRoadMesh);

    const branchRoadMesh = buildRoadMesh(branchCurve, 3.2, false);
    scene.add(branchRoadMesh);

    // 6. Glowing Centerline Markings (Cyan & White Neon Guidance)
    const dividerTubeGeom = new THREE.TubeGeometry(roadCurve, 140, 0.11, 6, false);
    const dividerMat = new THREE.MeshBasicMaterial({ color: 0x06B6D4 });
    const dividerMesh = new THREE.Mesh(dividerTubeGeom, dividerMat);
    dividerMesh.position.y += 0.18;
    scene.add(dividerMesh);

    // Branch Centerline
    const branchTubeGeom = new THREE.TubeGeometry(branchCurve, 60, 0.08, 6, false);
    const branchTubeMat = new THREE.MeshBasicMaterial({ color: 0x2563EB });
    const branchTubeMesh = new THREE.Mesh(branchTubeGeom, branchTubeMat);
    branchTubeMesh.position.y += 0.18;
    scene.add(branchTubeMesh);

    // 7. Highway Guard Rails & Structural Edge Beams
    const createRail = (curve: THREE.CatmullRomCurve3, offsetSide: number, width: number, color: number) => {
      const railCurve = new THREE.CatmullRomCurve3(
        curve.points.map((p, idx) => {
          const tangent = curve.getTangent(idx / (curve.points.length - 1)).normalize();
          const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
          return new THREE.Vector3(p.x + normal.x * (width / 2 + 0.1) * offsetSide, p.y + 0.45, p.z + normal.z * (width / 2 + 0.1) * offsetSide);
        })
      );
      const railGeom = new THREE.TubeGeometry(railCurve, 90, 0.07, 6, false);
      const railMat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.3 });
      return new THREE.Mesh(railGeom, railMat);
    };

    scene.add(createRail(roadCurve, -1, 4.4, 0x2563EB));
    scene.add(createRail(roadCurve, 1, 4.4, 0x2563EB));

    // 8. Mobile AI Inspection Vehicle Model (Detailed Multi-Part Mesh)
    const vehicleGroup = new THREE.Group();

    // Chassis Base
    const chassisGeom = new THREE.BoxGeometry(1.9, 0.75, 3.4);
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x2563EB, metalness: 0.6, roughness: 0.25 });
    const chassis = new THREE.Mesh(chassisGeom, chassisMat);
    chassis.position.y = 0.6;
    chassis.castShadow = true;
    vehicleGroup.add(chassis);

    // Aerodynamic Upper Cabin & Dark Tinted Windshield
    const cabinGeom = new THREE.BoxGeometry(1.6, 0.7, 2.0);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, metalness: 0.85, roughness: 0.15 });
    const cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.set(0, 1.28, -0.25);
    vehicleGroup.add(cabin);

    // White Protective Equipment Rack
    const rackGeom = new THREE.BoxGeometry(1.7, 0.12, 1.9);
    const rackMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, metalness: 0.3 });
    const rack = new THREE.Mesh(rackGeom, rackMat);
    rack.position.set(0, 1.68, -0.25);
    vehicleGroup.add(rack);

    // Rotating 360° LiDAR Optical Scanner Turret
    const lidarBaseGeom = new THREE.CylinderGeometry(0.32, 0.35, 0.25, 20);
    const lidarMat = new THREE.MeshStandardMaterial({ color: 0x06B6D4, metalness: 0.9, roughness: 0.1 });
    const lidarBase = new THREE.Mesh(lidarBaseGeom, lidarMat);
    lidarBase.position.set(0, 1.85, -0.25);
    vehicleGroup.add(lidarBase);

    // Rotating LiDAR Scanner Head
    const lidarHeadGeom = new THREE.BoxGeometry(0.5, 0.22, 0.3);
    const lidarHead = new THREE.Mesh(lidarHeadGeom, new THREE.MeshBasicMaterial({ color: 0x00F0FF }));
    lidarHead.position.set(0, 2.02, -0.25);
    vehicleGroup.add(lidarHead);

    // Four Rotating Wheels
    const wheelGeom = new THREE.CylinderGeometry(0.36, 0.36, 0.25, 16);
    wheelGeom.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 });

    const wheels: THREE.Mesh[] = [];
    const wheelOffsets = [
      [-0.98, 0.36, 1.05],
      [0.98, 0.36, 1.05],
      [-0.98, 0.36, -1.05],
      [0.98, 0.36, -1.05]
    ];
    wheelOffsets.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.position.set(wx, wy, wz);
      vehicleGroup.add(wheel);
      wheels.push(wheel);
    });

    // Dual High-Intensity Headlights
    const headlightGeom = new THREE.SphereGeometry(0.18, 12, 12);
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const hlLeft = new THREE.Mesh(headlightGeom, headlightMat);
    hlLeft.position.set(-0.62, 0.58, 1.72);
    const hlRight = new THREE.Mesh(headlightGeom, headlightMat);
    hlRight.position.set(0.62, 0.58, 1.72);
    vehicleGroup.add(hlLeft, hlRight);

    // Forward Projecting Light Cones
    const lightConeGeom = new THREE.ConeGeometry(1.6, 7.5, 16, 1, true);
    lightConeGeom.rotateX(-Math.PI / 2);
    const lightConeMat = new THREE.MeshBasicMaterial({
      color: 0xE0F2FE,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide
    });
    const lcLeft = new THREE.Mesh(lightConeGeom, lightConeMat);
    lcLeft.position.set(-0.62, 0.58, 5.4);
    const lcRight = new THREE.Mesh(lightConeGeom, lightConeMat);
    lcRight.position.set(0.62, 0.58, 5.4);
    vehicleGroup.add(lcLeft, lcRight);

    // Downward Projecting Computer Vision Laser Scanning Cone on Pavement
    const scanConeGeom = new THREE.ConeGeometry(2.6, 4.8, 20, 1, true);
    scanConeGeom.rotateX(Math.PI);
    const scanConeMat = new THREE.MeshBasicMaterial({
      color: 0x06B6D4,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide
    });
    const scanCone = new THREE.Mesh(scanConeGeom, scanConeMat);
    scanCone.position.set(0, 1.8, 1.8);
    vehicleGroup.add(scanCone);

    // Laser Ground Scanning Ring Indicator
    const scanRingGeom = new THREE.RingGeometry(1.2, 2.8, 32);
    scanRingGeom.rotateX(-Math.PI / 2);
    const scanRingMat = new THREE.MeshBasicMaterial({
      color: 0x00F0FF,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    const scanRing = new THREE.Mesh(scanRingGeom, scanRingMat);
    scanRing.position.set(0, 0.16, 2.6);
    vehicleGroup.add(scanRing);

    scene.add(vehicleGroup);

    // 9. Floating Geospatial GPS Beacons along Corridor
    const beaconsData = [
      { t: 0.08, label: 'KM 0.0 Gateway', coords: '28.4950° N, 77.0890° E', status: 'Optimal Pavement', pci: 94, color: 0x16A34A },
      { t: 0.44, label: 'Ch 2,400m Black Spot', coords: '28.4754° N, 77.0765° E', status: 'MoRTH Severity SI 14.5 (Critical)', pci: 38, color: 0xDC2626 },
      { t: 0.72, label: 'Ch 6,800m Surface Wear', coords: '28.4520° N, 77.0580° E', status: 'Moderate Roughness IRI 3.4', pci: 68, color: 0xF59E0B },
      { t: 0.94, label: 'KM 10.0 Terminal Post', coords: '28.4310° N, 77.0390° E', status: 'Survey Complete', pci: 88, color: 0x2563EB }
    ];

    const beaconPointers: { mesh: THREE.Mesh; data: any; ring: THREE.Mesh }[] = [];

    beaconsData.forEach((b) => {
      const pos = roadCurve.getPoint(b.t);

      // Slender Structural Beacon Pole
      const poleGeom = new THREE.CylinderGeometry(0.06, 0.06, 5.5, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.7 });
      const pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(pos.x, pos.y + 2.75, pos.z);
      scene.add(pole);

      // Glowing Pulsing Beacon Sphere Head
      const sphereGeom = new THREE.SphereGeometry(0.75, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({ color: b.color });
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.position.set(pos.x, pos.y + 5.6, pos.z);
      scene.add(sphere);

      // Expanding Radar Rings on Pavement
      const ringGeom = new THREE.RingGeometry(0.4, 2.2, 32);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: b.color,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.set(pos.x, pos.y + 0.16, pos.z);
      scene.add(ring);

      beaconPointers.push({ mesh: sphere, data: b, ring });
    });

    // 10. Atmospheric Floating Geospatial Particles
    const particleCount = 220;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 120;
      particlePositions[i + 1] = Math.random() * 32 + 1;
      particlePositions[i + 2] = (Math.random() - 0.5) * 90;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x06B6D4,
      size: 0.6,
      transparent: true,
      opacity: 0.5
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // 11. Mouse & Orbit Drag Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let isMouseDown = false;
    let startX = 0;
    let startY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      if (isMouseDown) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        targetRotY += dx * 0.005;
        targetRotX += dy * 0.005;
        targetRotX = Math.max(-0.35, Math.min(0.45, targetRotX));
        startX = e.clientX;
        startY = e.clientY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Raycaster for clicking 3D beacons
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const handleClickCanvas = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVector.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(mouseVector, camera);

      const meshes = beaconPointers.map((b) => b.mesh);
      const intersects = raycaster.intersectObjects(meshes);
      if (intersects.length > 0) {
        const hit = beaconPointers.find((b) => b.mesh === intersects[0].object);
        if (hit) {
          setActiveBeacon({
            label: hit.data.label,
            coords: hit.data.coords,
            status: hit.data.status,
            pci: hit.data.pci
          });
        }
      }
    };
    container.addEventListener('click', handleClickCanvas);

    // 12. Animation Loop
    let vehicleT = 0.02;
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Vehicle continuous drive along curve
      vehicleT = (vehicleT + delta * 0.042) % 1.0;
      const vehiclePos = roadCurve.getPoint(vehicleT);
      const vehicleTangent = roadCurve.getTangent(vehicleT).normalize();

      vehicleGroup.position.copy(vehiclePos);

      // Orientation alignment
      const lookTarget = vehiclePos.clone().add(vehicleTangent);
      vehicleGroup.lookAt(lookTarget);

      // Rotate LiDAR scanner head & spin wheels
      lidarHead.rotation.y += delta * 9;
      wheels.forEach((w) => {
        w.rotation.x += delta * 12;
      });

      // Holographic scan cone pulse
      scanCone.scale.x = 1 + Math.sin(elapsed * 5) * 0.12;
      scanCone.scale.z = 1 + Math.sin(elapsed * 5) * 0.12;
      scanRing.scale.setScalar(1 + Math.sin(elapsed * 4) * 0.15);

      // Pulsing beacon rings
      beaconPointers.forEach(({ mesh, ring }, idx) => {
        mesh.position.y += Math.sin(elapsed * 3.5 + idx * 1.5) * 0.006;
        const ringScale = (elapsed * 1.5 + idx * 0.5) % 2.0;
        ring.scale.set(1 + ringScale * 0.8, 1 + ringScale * 0.8, 1);
        (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - ringScale * 0.35);
      });

      // Slowly rotate ambient particles
      particles.rotation.y += delta * 0.015;

      // Smooth camera interpolation (inertia + mouse tilt)
      const targetCamX = mouseX * 8 + targetRotY * 16;
      const targetCamY = 38 + mouseY * 5 + targetRotX * 12;
      camera.position.x += (targetCamX - camera.position.x) * 0.045;
      camera.position.y += (targetCamY - camera.position.y) * 0.045;
      camera.lookAt(0, 3.5, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 13. Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 800;
      height = container.clientHeight || 560;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('click', handleClickCanvas);

      renderer.dispose();
      terrainGeom.dispose();
      terrainMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive]);

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Spatial HUD Cards */}
      <div className="absolute top-5 left-5 z-10 pointer-events-none space-y-2.5 font-mono text-xs">
        <div className="glass-panel px-4 py-2.5 rounded-2xl shadow-md pointer-events-auto flex items-center space-x-3 text-slate-800 border border-slate-200">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-cyan-500 animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 relative" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Geospatial Inspection Fleet</div>
            <div className="text-xs font-bold text-[#172B4D] flex items-center space-x-1.5">
              <span>Unit #04 (NH-44 Cyber City)</span>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded border border-blue-200">ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="glass-panel px-3.5 py-2 rounded-xl shadow-xs pointer-events-auto text-[11px] text-slate-600 flex items-center space-x-2 border border-slate-200">
          <span className="text-blue-600 font-bold">WGS-84 FIX:</span>
          <span>28.4950° N, 77.0890° E &bull; ALT: 219m</span>
        </div>
      </div>

      {/* Beacon Selected Tooltip Overlay */}
      {activeBeacon && (
        <div className="absolute bottom-14 left-6 z-20 glass-panel-elevated p-4 rounded-2xl border border-blue-200 max-w-sm pointer-events-auto animate-float">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <span className="font-bold text-xs text-[#172B4D] font-mono">{activeBeacon.label}</span>
            </div>
            <button
              onClick={() => setActiveBeacon(null)}
              className="text-slate-400 hover:text-slate-600 text-xs px-1 font-bold"
            >
              ✕
            </button>
          </div>
          <div className="pt-2.5 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500 text-[11px] font-mono">
              <span>Coordinates:</span>
              <span className="text-slate-800 font-bold">{activeBeacon.coords}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px] font-mono">
              <span>Audit Condition:</span>
              <span className="text-blue-600 font-bold">{activeBeacon.status}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px] font-mono">
              <span>Pavement PCI:</span>
              <span className={`font-bold ${activeBeacon.pci < 50 ? 'text-red-600' : 'text-emerald-600'}`}>{activeBeacon.pci}/100</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Helper Hint */}
      <div className="absolute bottom-4 right-5 z-10 pointer-events-none">
        <div className="glass-panel px-3.5 py-1.5 rounded-full text-[10px] font-mono text-slate-600 border border-slate-200 shadow-sm flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
          <span>Interactive 3D Network &bull; Click beacons &bull; Drag to tilt camera</span>
        </div>
      </div>
    </div>
  );
};
