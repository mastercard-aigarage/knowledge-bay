import * as THREE from 'three';

type BeaconPinOptions = {
  stemColorHex?: string;
  stemHeight?: number;
  stemRadius?: number;
  capRadius?: number;
  glowRadius?: number;
  stemOpacity?: number;
  glowOpacity?: number;
};

export function createBeaconPin(colorHex: string, options: BeaconPinOptions = {}): THREE.Object3D {
  const {
    stemColorHex = '#645e5e',
    stemHeight = 3,
    stemRadius = 0.3,
    capRadius = 1.5,
    glowRadius = 2,
    stemOpacity = 0.78,
    glowOpacity = 0.35
  } = options;

  const color = new THREE.Color(colorHex);
  const stemColor = new THREE.Color(stemColorHex);
  const group = new THREE.Group();
  
  // Offset the model so the stem starts slightly *inside* the globe surface,
  // making the pin feel physically inserted.
  group.position.y = -stemHeight * 0.42;
  const stemGeometry = new THREE.CylinderGeometry(stemRadius, stemRadius, stemHeight, 12, 1, true);
  const stemMaterial = new THREE.MeshStandardMaterial({
    color: stemColor,
    metalness: 0.9,
    roughness: 0.35,
    transparent: true,
    opacity: stemOpacity,
    depthWrite: false
  });
  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.y = stemHeight / 2;
  group.add(stem);

  // Slight overlap so the stem tip sits inside the head.
  const headCenterY = stemHeight + capRadius * 0.15;

  const capGeometry = new THREE.SphereGeometry(capRadius, 16, 12);
  const capMaterial = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.25,
    metalness: 0.15,
    roughness: 0.35
  });
  const cap = new THREE.Mesh(capGeometry, capMaterial);
  cap.position.y = headCenterY;
  group.add(cap);

  const glowGeometry = new THREE.SphereGeometry(glowRadius, 16, 12);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: glowOpacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.y = headCenterY;
  glow.name = 'beacon-pin-glow';
  glow.userData.beaconPinGlow = true;
  glow.userData.baseOpacity = glowOpacity;
  glow.userData.baseScale = 1;
  glow.userData.pulsePhase = Math.random() * Math.PI * 2;
  group.add(glow);

  return group;
}
