import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { EffectComposer } from "jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "jsm/shaders/FXAAShader.js";

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // Default Light mode (white)

const scrollGroup = new THREE.Group();
scene.add(scrollGroup);

const torusGroup = new THREE.Group();
scrollGroup.add(torusGroup);

// Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 7;

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector(".webgl"), antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Post-processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Bloom — start low for light mode (dark torus must not wash out)
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.15, 0.3, 0.85,  // strength 0.15 (subtle), radius, threshold
);
composer.addPass(bloomPass);

const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
composer.addPass(fxaaPass);

// Track current theme for per-frame adjustments
let currentMode = 'light';

// Lights — strong for specular highlights on the dark metallic torus
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 3.0);
dirLight.position.set(3, 4, 5);
scene.add(dirLight);
const fillLight = new THREE.DirectionalLight(0xaabbff, 1.5); // Subtle blue fill for metallic shine
fillLight.position.set(-4, -2, -3);
scene.add(fillLight);
const rimLight = new THREE.DirectionalLight(0xffffff, 2.0); // Rim light for edge highlighting
rimLight.position.set(0, -3, -4);
scene.add(rimLight);

// Shared fragment material ref — jet black, polished metallic for light mode
const fragmentsMaterial = new THREE.MeshStandardMaterial({
  color: 0x080810,       // Very dark, near-black
  roughness: 0.15,       // Smooth/shiny
  metalness: 0.95,       // Highly metallic for reflections
  side: THREE.DoubleSide,
  envMapIntensity: 1.5,
});

// Wireframe inner torus material
const wireMaterial = new THREE.ShaderMaterial({
  uniforms: {
    color1: { value: new THREE.Color(0x050508) }, // Very dark base
    color2: { value: new THREE.Color(0x2a2a4e) }  // Slightly brighter wireframe lines for contrast
  },
  vertexShader: /* glsl */ `
    attribute vec3 barycentric;
    varying vec3 vBary;
    void main() {
      vBary = barycentric;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 color1;
    uniform vec3 color2;
    varying vec3 vBary;
    float wireMask(vec3 b, float t) {
      vec3 d = fwidth(b);
      vec3 a = smoothstep(vec3(0.0), d * t, b);
      return 1.0 - min(a.x, min(a.y, a.z));
    }
    void main() {
      float wf = wireMask(vBary, 1.6);
      vec3 col = mix(color1, color2, wf);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  side: THREE.DoubleSide,
  extensions: { derivatives: true },
});

// Helper for barycentric coordinates
function addBarycentricCoords(geo) {
  const g = geo.toNonIndexed();
  const count = g.attributes.position.count;
  const bary = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 3) {
    bary[i * 3] = 1; bary[i * 3 + 1] = 0; bary[i * 3 + 2] = 0;
    bary[(i + 1) * 3] = 0; bary[(i + 1) * 3 + 1] = 1; bary[(i + 1) * 3 + 2] = 0;
    bary[(i + 2) * 3] = 0; bary[(i + 2) * 3 + 1] = 0; bary[(i + 2) * 3 + 2] = 1;
  }
  g.setAttribute("barycentric", new THREE.BufferAttribute(bary, 3));
  return g;
}

torusGroup.add(new THREE.Mesh(
  addBarycentricCoords(new THREE.TorusGeometry(2, 0.4, 80, 80)),
  wireMaterial,
));

// Voronoi decomposition parameters
const FRAG_SCALE = 50;
const TORUS_R = 2, TORUS_r = 0.4;

function hash2(px, py) {
  const a = Math.sin(px * 127.1 + py * 311.7) * 43758.5453;
  const b = Math.sin(px * 269.5 + py * 183.3) * 43758.5453;
  return [a - Math.floor(a), b - Math.floor(b)];
}

function cellSeed(u, v) {
  const n = [Math.floor(u * FRAG_SCALE), Math.floor(v * FRAG_SCALE)];
  const f = [u * FRAG_SCALE - n[0], v * FRAG_SCALE - n[1]];
  let md = Infinity, best = [...n];
  for (let j = -2; j <= 2; j++) {
    for (let i = -2; i <= 2; i++) {
      const o = hash2(n[0] + i, n[1] + j);
      const r = [i + o[0] - f[0], j + o[1] - f[1]];
      const d = r[0] * r[0] + r[1] * r[1];
      if (d < md) { md = d; best = [n[0] + i + o[0], n[1] + j + o[1]]; }
    }
  }
  return [best[0] / FRAG_SCALE, best[1] / FRAG_SCALE];
}

// Generate fragments
const fragments = (() => {
  const baseGeo = new THREE.TorusGeometry(TORUS_R, TORUS_r, 100, 100);
  const nonIndexed = baseGeo.toNonIndexed();
  baseGeo.dispose();
  const pos = nonIndexed.attributes.position.array;
  const nrm = nonIndexed.attributes.normal.array;
  const uvData = nonIndexed.attributes.uv.array;
  const tris = pos.length / 9;

  const cellMap = new Map();
  for (let t = 0; t < tris; t++) {
    const uc = (uvData[t * 6] + uvData[t * 6 + 2] + uvData[t * 6 + 4]) / 3;
    const vc = (uvData[t * 6 + 1] + uvData[t * 6 + 3] + uvData[t * 6 + 5]) / 3;
    const s = cellSeed(uc, vc);
    const k = `${s[0].toFixed(9)}_${s[1].toFixed(9)}`;
    if (!cellMap.has(k)) cellMap.set(k, { s, t: [] });
    cellMap.get(k).t.push(t);
  }

  const list = [];
  const TWO_PI = Math.PI * 2;

  for (const { s: seed, t: triList } of cellMap.values()) {
    if (!triList.length) continue;
    const vc = triList.length * 3;
    const pArr = new Float32Array(vc * 3), nArr = new Float32Array(vc * 3), uvArr = new Float32Array(vc * 2);
    let vi = 0;
    for (const tri of triList) {
      for (let v = 0; v < 3; v++) {
        const sv = tri * 3 + v;
        pArr[vi * 3] = pos[sv * 3]; pArr[vi * 3 + 1] = pos[sv * 3 + 1]; pArr[vi * 3 + 2] = pos[sv * 3 + 2];
        nArr[vi * 3] = nrm[sv * 3]; nArr[vi * 3 + 1] = nrm[sv * 3 + 1]; nArr[vi * 3 + 2] = nrm[sv * 3 + 2];
        uvArr[vi * 2] = uvData[sv * 2]; uvArr[vi * 2 + 1] = uvData[sv * 2 + 1];
        vi++;
      }
    }

    const phi = seed[0] * TWO_PI, theta = seed[1] * TWO_PI;
    const cx = (TORUS_R + TORUS_r * Math.cos(theta)) * Math.cos(phi);
    const cy = (TORUS_R + TORUS_r * Math.cos(theta)) * Math.sin(phi);
    const cz = TORUS_r * Math.sin(theta);
    const cellCenter = new THREE.Vector3(cx, cy, cz);
    const majorPt = new THREE.Vector3(TORUS_R * Math.cos(phi), TORUS_R * Math.sin(phi), 0);
    const cellNormal = cellCenter.clone().sub(majorPt).normalize();

    const SHRINK = 0.95;
    for (let i = 0; i < pArr.length; i += 3) {
      pArr[i] = (pArr[i] - cx) * SHRINK;
      pArr[i + 1] = (pArr[i + 1] - cy) * SHRINK;
      pArr[i + 2] = (pArr[i + 2] - cz) * SHRINK;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pArr, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(nArr, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uvArr, 2));

    const rnd = hash2(seed[0] * 137.53, seed[1] * 137.53);
    const up = Math.abs(cellNormal.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    const tang = new THREE.Vector3().crossVectors(cellNormal, up).normalize();
    const bitang = new THREE.Vector3().crossVectors(cellNormal, tang);
    const aa = rnd[0] * TWO_PI;
    const rotAxis = tang.clone().multiplyScalar(Math.cos(aa)).addScaledVector(bitang, Math.sin(aa)).normalize();

    const mesh = new THREE.Mesh(geo, fragmentsMaterial);
    mesh.position.copy(cellCenter).addScaledVector(cellNormal, 0.015);
    mesh.userData = { cellCenter, cellNormal, rotAxis, maxAngle: 0.7 + rnd[1] * 0.9, lift: 0 };
    torusGroup.add(mesh);
    list.push(mesh);
  }

  nonIndexed.dispose();
  return list;
})();

// Theme Switcher Controller
document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = themeToggleBtn.querySelector('.material-symbols-outlined');
  const logoImg = document.querySelector('.logo');
  
  // Default values
  document.documentElement.setAttribute('data-theme', 'light');

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    
    if (newTheme === 'dark') {
      currentMode = 'dark';
      themeIcon.textContent = 'light_mode';
      scene.background.set(0x050505);
      
      // Dark mode: black bg, orange wireframe, subtle bloom glow
      wireMaterial.uniforms.color1.value.set(0x070100);
      wireMaterial.uniforms.color2.value.set(0xff4d00);
      fragmentsMaterial.color.set(0x111111);
      fragmentsMaterial.roughness = 0.9;
      fragmentsMaterial.metalness = 0.1;
      bloomPass.strength = 0.6;
      bloomPass.threshold = 0.7;
      ambientLight.intensity = 0.6;
      dirLight.color.set(0xfff4e0);
      dirLight.intensity = 2.5;
      fillLight.color.set(0xff4d00);
      fillLight.intensity = 1.0;
      rimLight.intensity = 0.5;
    } else {
      currentMode = 'light';
      themeIcon.textContent = 'dark_mode';
      scene.background.set(0xffffff);
      
      // Light mode: white bg, dark shiny metallic torus, minimal bloom
      wireMaterial.uniforms.color1.value.set(0x050508);
      wireMaterial.uniforms.color2.value.set(0x2a2a4e);
      fragmentsMaterial.color.set(0x080810);
      fragmentsMaterial.roughness = 0.15;
      fragmentsMaterial.metalness = 0.95;
      bloomPass.strength = 0.15;
      bloomPass.threshold = 0.85;
      ambientLight.intensity = 0.8;
      dirLight.color.set(0xffffff);
      dirLight.intensity = 3.0;
      fillLight.color.set(0xaabbff);
      fillLight.intensity = 1.5;
      rimLight.intensity = 2.0;
    }
  });

  const revealElements = document.querySelectorAll('.scroll-reveal');

  const checkReveal = () => {
    const triggerBottom = window.innerHeight * 0.85;

    revealElements.forEach(el => {
      const elementTop = el.getBoundingClientRect().top;

      if (elementTop < triggerBottom) {
        el.classList.add('reveal-active');
      }
    });
  };

  checkReveal();
  window.addEventListener('scroll', checkReveal);
});

// Invisible raycaster mesh
const rcMesh = new THREE.Mesh(
  new THREE.TorusGeometry(TORUS_R, TORUS_r, 80, 80),
  new THREE.MeshBasicMaterial({ visible: false }),
);
torusGroup.add(rcMesh);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-999, -999);
window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

const fragParams = { hoverRadius: 0.75, liftDist: 0.28, liftSpeedUp: 0.15, liftSpeedDown: 0.06 };
let lastTime = 0;
const hover = { point: new THREE.Vector3(), active: 0 };
const _localHover = new THREE.Vector3();

function smoothstep(min, max, v) {
  const t = Math.max(0, Math.min(1, (v - min) / (max - min)));
  return t * t * (3 - 2 * t);
}

// ==============================================
// INTRO ANIMATION STATE
// ==============================================
let introActive = true;
let introProgress = 0; // 0 → 1
const introOverlay = document.getElementById('introOverlay');
const scrollHint = document.getElementById('scrollHint');
const introTitle = document.getElementById('introTitle');

// Body already has 'intro-active' class set in HTML

// Force scroll to top on load so the intro always plays on refresh
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Camera start & end positions for the zoom-through
const CAM_START_Z = 7;
const CAM_END_Z = -4;   // behind the torus (through the hole)

// Tick Loop
const tick = () => {
  const time = performance.now() * 0.001;
  const delta = time - lastTime;
  lastTime = time;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(rcMesh);
  if (hits.length > 0) {
    torusGroup.worldToLocal(_localHover.copy(hits[0].point));
    hover.point.copy(_localHover);
    hover.active = Math.min(hover.active + delta * 5, 1);
  } else {
    hover.active = Math.max(hover.active - delta * 2.5, 0);
  }

  for (const frag of fragments) {
    const { cellCenter, cellNormal, rotAxis, maxAngle } = frag.userData;
    let target = 0;
    if (hover.active > 0.01) {
      const dist = cellCenter.distanceTo(hover.point);
      target = (1 - smoothstep(0.4, fragParams.hoverRadius, dist)) * hover.active;
    }
    const speed = target > frag.userData.lift ? fragParams.liftSpeedUp : fragParams.liftSpeedDown;
    frag.userData.lift = THREE.MathUtils.lerp(frag.userData.lift, target, speed);
    const lift = frag.userData.lift;
    frag.position.copy(cellCenter).addScaledVector(cellNormal, 0.015 + lift * fragParams.liftDist);
    frag.quaternion.setFromAxisAngle(rotAxis, lift * maxAngle);
  }

  if (introActive) {
    // --- INTRO: scroll-driven camera animation ---
    const p = introProgress;

    // Phase 1 (0–0.4): Rotate torus to face camera head-on
    // Phase 2 (0.4–1.0): Zoom camera through the hole
    const rotateP = smoothstep(0, 0.4, p);
    const zoomP = smoothstep(0.35, 1.0, p);

    // Torus rotation: start angled, end face-on
    torusGroup.rotation.y = (1 - rotateP) * 0.6 + time * 0.05 * (1 - rotateP);
    torusGroup.rotation.x = (1 - rotateP) * 0.3;

    // Camera Z: lerp from start to end (through the hole)
    camera.position.z = THREE.MathUtils.lerp(CAM_START_Z, CAM_END_Z, zoomP);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.lookAt(0, 0, 0);

    // Keep scrollGroup neutral during intro
    scrollGroup.position.x = 0;
    scrollGroup.rotation.y = 0;

    // --- TITLE ANIMATION ---
    // Timeline:
    //   p 0.15–0.35: text rises from below to center (translateY: 100vh → 0)
    //   p 0.35–0.55: text holds at center, fully visible
    //   p 0.55–0.80: text zooms past the viewer (scale up + fade out)
    if (introTitle) {
      const riseP = smoothstep(0.15, 0.35, p);   // 0→1: rise into view
      const holdEnd = 0.55;
      const zoomOutP = smoothstep(holdEnd, 0.80, p); // 0→1: zoom away

      // Y position: starts at +60vh, rises to center (-50%), then stays
      const translateY = (1 - riseP) * 60; // vh units

      // Scale: 1 during hold, ramps up to 8 during zoom-out
      const scale = 1 + zoomOutP * 7;

      // Opacity: fade in during rise, full during hold, fade out during zoom
      let opacity;
      if (p < 0.15) {
        opacity = 0;
      } else if (p < 0.35) {
        opacity = riseP;
      } else if (p < holdEnd) {
        opacity = 1;
      } else {
        opacity = 1 - zoomOutP;
      }

      introTitle.style.transform = `translate(-50%, calc(-50% + ${translateY}vh)) scale(${scale})`;
      introTitle.style.opacity = opacity;
    }

    // Show/hide scroll hint based on scroll position (reversible)
    if (scrollHint) {
      if (p > 0.05) {
        scrollHint.classList.add('hidden');
      } else {
        scrollHint.classList.remove('hidden');
      }
    }

  } else {
    // Normal post-intro rotation
    torusGroup.rotation.y = time * 0.15;
    torusGroup.rotation.x = Math.sin(time * 0.1) * 0.2;
  }

  composer.render();
  requestAnimationFrame(tick);
};
tick();

// ==============================================
// INTRO SCROLL HANDLER
// ==============================================
function handleIntroScroll() {
  if (!introActive) return;

  const introHeight = introOverlay.offsetHeight - window.innerHeight;
  const scrollY = window.scrollY;
  introProgress = Math.min(1, Math.max(0, scrollY / introHeight));

  // Animation complete — only finish when fully scrolled past
  if (introProgress >= 1) {
    finishIntro();
  }
}

function finishIntro() {
  if (!introActive) return;
  introActive = false;

  // Reset camera to default position for normal page viewing
  camera.position.set(0, 0, CAM_START_Z);
  camera.lookAt(0, 0, 0);

  // Collapse the intro overlay
  introOverlay.classList.add('done');

  // Show page content
  document.body.classList.remove('intro-active');

  // Hide the scroll hint
  if (scrollHint) scrollHint.classList.add('hidden');
  if (introTitle) introTitle.style.opacity = 0;

  // Scroll to top of actual content
  window.scrollTo(0, 0);
}

window.addEventListener('scroll', handleIntroScroll);

// WebGL scroll sync (only when intro is done)
window.addEventListener("scroll", () => {
  if (introActive) return;
  const scrollRatio = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
  scrollGroup.position.x = -scrollRatio * 1.5;
  scrollGroup.rotation.y = scrollRatio * Math.PI * 0.5;
});

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(window.innerWidth, window.innerHeight);
  fxaaPass.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
});

// Fullscreen Video Modal Controllers
window.openVideo = function(youtubeId) {
  const modal = document.getElementById('videoModal');
  const iframe = document.getElementById('modalIframe');
  
  if (modal && iframe) {
    // Set YouTube Embed Src with Autoplay
    iframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;
    
    // Show modal
    modal.classList.add('is-active');
  }
}

window.closeVideo = function() {
  const modal = document.getElementById('videoModal');
  const iframe = document.getElementById('modalIframe');
  
  if (modal && iframe) {
    modal.classList.remove('is-active');
    iframe.src = ""; // Clear src to stop video audio
  }
}

