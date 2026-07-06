const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

const applicationForm = document.querySelector(".apply-form");

if (applicationForm) {
  applicationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const note = applicationForm.querySelector(".form-note");

    if (!applicationForm.checkValidity()) {
      note.textContent = "Please complete the required fields with valid details.";
      note.className = "form-note error";
      applicationForm.reportValidity();
      return;
    }

    applicationForm.reset();
    note.textContent = "Thank you. A coordinator will contact you within 24 hours.";
    note.className = "form-note success";
  });
}

const cyberOrb = document.querySelector("#cyber-orb");

if (cyberOrb) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  import("https://unpkg.com/three@0.160.0/build/three.module.js").then((THREE) => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
      canvas: cyberOrb,
      alpha: true,
      antialias: true
    });

    const group = new THREE.Group();
    scene.add(group);

    const coreGeometry = new THREE.IcosahedronGeometry(1.48, 2);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x101318,
      roughness: 0.38,
      metalness: 0.72,
      emissive: 0x003828,
      emissiveIntensity: 0.22
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.55, 2),
      new THREE.MeshBasicMaterial({
        color: 0x36ffc4,
        wireframe: true,
        transparent: true,
        opacity: 0.62
      })
    );
    group.add(wire);

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x36ffc4,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide
    });

    const ringOne = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.012, 12, 150), ringMaterial);
    ringOne.rotation.x = Math.PI / 2.8;
    group.add(ringOne);

    const ringTwo = new THREE.Mesh(new THREE.TorusGeometry(2.34, 0.01, 12, 150), ringMaterial.clone());
    ringTwo.material.opacity = 0.42;
    ringTwo.rotation.x = Math.PI / 2;
    ringTwo.rotation.y = Math.PI / 5;
    group.add(ringTwo);

    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x36ffc4 });
    const nodeGeometry = new THREE.SphereGeometry(0.055, 18, 18);
    const nodes = [];
    for (let index = 0; index < 12; index += 1) {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      const angle = (index / 12) * Math.PI * 2;
      node.position.set(Math.cos(angle) * 2.05, Math.sin(angle) * 0.42, Math.sin(angle) * 2.05);
      nodes.push(node);
      group.add(node);
    }

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0xffffff, 1.8));

    camera.position.set(0, 0, 6.3);
    group.rotation.set(-0.35, -0.45, 0.18);

    const resize = () => {
      const { clientWidth, clientHeight } = cyberOrb;
      renderer.setSize(clientWidth, clientHeight, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", resize);
    resize();

    const render = () => {
      if (!reduceMotion) {
        group.rotation.y += 0.0038;
        wire.rotation.y -= 0.0025;
        ringOne.rotation.z += 0.0045;
        ringTwo.rotation.z -= 0.003;
      }
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    };

    render();
  }).catch(() => {
    cyberOrb.classList.add("is-fallback");
  });
}
