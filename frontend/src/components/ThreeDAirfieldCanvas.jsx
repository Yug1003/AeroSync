import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './ThreeDAirfieldCanvas.css';

export default function ThreeDAirfieldCanvas({ selectedAirportCode = 'AMD', flights = [] }) {
  const mountRef = useRef(null);
  const [selected3DPlane, setSelected3DPlane] = useState(null);
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 500;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b); // Obsidian dark
    scene.fog = new THREE.FogExp2(0x09090b, 0.008);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 45, 75);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x0ea5e9, 1.2);
    dirLight.position.set(40, 60, 40);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const runwaySpotlight = new THREE.SpotLight(0x10b981, 2);
    runwaySpotlight.position.set(0, 50, 0);
    runwaySpotlight.angle = Math.PI / 4;
    scene.add(runwaySpotlight);

    // 3. Ground Airfield Tarmac Grid Plane
    const tarmacGeo = new THREE.PlaneGeometry(160, 160);
    const tarmacMat = new THREE.MeshStandardMaterial({
      color: 0x121215,
      roughness: 0.8,
      metalness: 0.2,
    });
    const tarmac = new THREE.Mesh(tarmacGeo, tarmacMat);
    tarmac.rotation.x = -Math.PI / 2;
    tarmac.receiveShadow = true;
    scene.add(tarmac);

    // Airfield Runway Lines (Yellow & White Asphalt Stripes)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    for (let i = -60; i <= 60; i += 30) {
      const stripeGeo = new THREE.PlaneGeometry(120, 2);
      const stripe = new THREE.Mesh(stripeGeo, lineMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0.05, i);
      scene.add(stripe);
    }

    // 4. 3D Terminal Concourse Building
    const terminalGeo = new THREE.BoxGeometry(100, 12, 20);
    const terminalMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.3,
      metalness: 0.8,
      wireframe: false,
    });
    const terminalBuilding = new THREE.Mesh(terminalGeo, terminalMat);
    terminalBuilding.position.set(0, 6, -50);
    terminalBuilding.castShadow = true;
    scene.add(terminalBuilding);

    // Glass Facade Glow Ribbon on Terminal
    const glassGeo = new THREE.BoxGeometry(98, 4, 1);
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 });
    const glassFacade = new THREE.Mesh(glassGeo, glassMat);
    glassFacade.position.set(0, 8, -39.4);
    scene.add(glassFacade);

    // 5. Build 3D Aircraft Models at Stand Positions
    const planeGroup = new THREE.Group();
    const planeMeshes = [];

    const positions = [
      { x: -35, z: -25, label: 'GATE 1', flight: '6E 214', color: 0x3b82f6 },
      { x: -15, z: -25, label: 'GATE 2', flight: 'AI 101', color: 0xe11d48 },
      { x: 5, z: -25, label: 'GATE 3', flight: 'QP 1102', color: 0xd97706 },
      { x: 25, z: -25, label: 'GATE 4', flight: 'SQ 505', color: 0x10b981 },
      { x: 45, z: -25, label: 'GATE 5', flight: 'EK 517', color: 0x8b5cf6 },
    ];

    positions.forEach((pos, idx) => {
      const singlePlaneGroup = new THREE.Group();

      // Fuselage (Body)
      const bodyGeo = new THREE.CylinderGeometry(1.6, 1.4, 18, 16);
      const bodyMat = new THREE.MeshStandardMaterial({ color: pos.color, roughness: 0.4, metalness: 0.6 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.z = Math.PI / 2;
      body.position.y = 2.5;
      body.castShadow = true;
      singlePlaneGroup.add(body);

      // Nose Cone
      const noseGeo = new THREE.ConeGeometry(1.6, 4, 16);
      const nose = new THREE.Mesh(noseGeo, bodyMat);
      nose.rotation.z = -Math.PI / 2;
      nose.position.set(11, 2.5, 0);
      singlePlaneGroup.add(nose);

      // Wings (Left & Right)
      const wingGeo = new THREE.BoxGeometry(6, 0.4, 24);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.5 });
      const wings = new THREE.Mesh(wingGeo, wingMat);
      wings.position.set(1, 2.3, 0);
      singlePlaneGroup.add(wings);

      // Tail Fin (Vertical Stabilizer)
      const tailGeo = new THREE.BoxGeometry(3, 5, 0.4);
      const tail = new THREE.Mesh(tailGeo, bodyMat);
      tail.position.set(-7, 5, 0);
      singlePlaneGroup.add(tail);

      // Jet Engines (Turbofans)
      const engineGeo = new THREE.CylinderGeometry(0.8, 0.8, 4, 12);
      const engineMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9 });
      const leftEngine = new THREE.Mesh(engineGeo, engineMat);
      leftEngine.rotation.z = Math.PI / 2;
      leftEngine.position.set(2, 1.2, -6);
      singlePlaneGroup.add(leftEngine);

      const rightEngine = new THREE.Mesh(engineGeo, engineMat);
      rightEngine.rotation.z = Math.PI / 2;
      rightEngine.position.set(2, 1.2, 6);
      singlePlaneGroup.add(rightEngine);

      // 3D GSE Fuel Truck Vehicle alongside plane
      const gseGeo = new THREE.BoxGeometry(4, 2.5, 3);
      const gseMat = new THREE.MeshStandardMaterial({ color: 0xeab308 });
      const gseVehicle = new THREE.Mesh(gseGeo, gseMat);
      gseVehicle.position.set(4, 1.25, 9);
      singlePlaneGroup.add(gseVehicle);

      singlePlaneGroup.position.set(pos.x, 0, pos.z);
      singlePlaneGroup.userData = {
        gate: pos.label,
        flight: flights[idx]?.callsign || pos.flight,
        tail: flights[idx]?.tailNumber || `VT-AI${idx + 1}`,
        status: flights[idx]?.status || 'IN PROGRESS',
        type: flights[idx]?.aircraftType || 'A320neo',
      };

      planeGroup.add(singlePlaneGroup);
      planeMeshes.push(singlePlaneGroup);
    });

    scene.add(planeGroup);

    // 6. Animation Orbit Loop
    let animationFrameId;
    let angle = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isRotating) {
        angle += 0.003;
        camera.position.x = 80 * Math.sin(angle);
        camera.position.z = 80 * Math.cos(angle);
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. Handle Resize
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 500;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [selectedAirportCode, isRotating, flights]);

  return (
    <div className="three-airfield-wrapper">
      <div className="three-header-bar">
        <div className="three-title">
          <h5>🛩️ 3D Interactive WebGL Airfield & Gate Stand Inspector</h5>
          <span className="three-subtitle">{selectedAirportCode} International Airfield Surface & Terminal Concourse</span>
        </div>

        <div className="three-actions">
          <button
            type="button"
            className={`orbit-toggle-btn ${isRotating ? 'active' : ''}`}
            onClick={() => setIsRotating(!isRotating)}
          >
            {isRotating ? '⏸️ Pause Orbit Camera' : '▶️ Auto-Rotate Camera'}
          </button>
          <span className="webgl-badge">THREE.JS WEBGL REALTIME</span>
        </div>
      </div>

      {/* 3D WebGL Mounting Container */}
      <div className="three-canvas-container" ref={mountRef}></div>

      {/* Selected Aircraft Telemetry Inspector Card */}
      {selected3DPlane && (
        <div className="three-inspector-card">
          <div className="three-card-header">
            <strong>✈️ 3D Stand Telemetry — {selected3DPlane.gate}</strong>
            <span className="three-status-badge">{selected3DPlane.status}</span>
          </div>
          <div className="three-card-body">
            <div><span>Flight:</span> <strong>{selected3DPlane.flight}</strong></div>
            <div><span>Tail Reg:</span> <strong>{selected3DPlane.tail}</strong></div>
            <div><span>Aircraft:</span> <strong>{selected3DPlane.type}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
