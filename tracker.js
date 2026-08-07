(function() {
  // ==========================================
  // CONFIGURATION & INITIALIZATION
  // ==========================================
  
  // Default values
  const defaultModules = [
    {
      title: "Cybersecurity & Network Foundations",
      desc: "Cybersecurity Fundamentals, Threats & Awareness | Network Layers, Firewalls, IDS & IPS Overview | Configuring Network components according to topologies | Intro to Linux, architecture, commands, and server guidance."
    },
    {
      title: "Vulnerability Assessment & Penetration Testing",
      desc: "Vulnerability Concepts, Types & Scanning | Network Penetration Testing | Web Application Penetration Testing | IT & OT Security."
    },
    {
      title: "Security Operations Center & Threat Intelligence",
      desc: "Intro to SOC, SIEM Environment, RBAC, Agent Setup | Log Parsing, Rules, Custom Detection | Threat Intel Tools, Compliance, FIM | Attack Simulation, Log Correlation, Incident Response."
    },
    {
      title: "Advanced SOC Operations & Career Readiness",
      desc: "Malware Analysis Lab, Static & Dynamic Analysis | Forensics for Memory, Disk, and Network | SOC Workflow | SOC Automation, Playbook Design & Execution | Capstone Project, Evaluation & Placement."
    }
  ];

  const defaultSpeakers = [
    {
      name: "Hari Prasad",
      title: "Cybersecurity Instructor",
      bio: "Cybersecurity trainer focused on practical labs, Linux foundations, networking, SOC workflows, and hands-on defensive security learning.",
      avatar: "assets/speaker-shreyas-pai-g.png"
    },
    {
      name: "Shreyas Pai G",
      title: "Cybersecurity Instructor",
      bio: "Cybersecurity trainer focused on vulnerability assessment, penetration testing concepts, incident response, and career-ready security skills.",
      avatar: "assets/speaker-hari-prasad.png"
    }
  ];

  const defaultBrochure = {
    url: "https://drive.google.com/uc?export=download&id=1aezd7SHvCBdRJWFEOwxo56yOk76hi2qX",
    formspreeUrl: ""
  };

  // Run on page load
  document.addEventListener("DOMContentLoaded", () => {
    initVisitorTracker();
    applyDynamicContent();
    setupBrochureModal();
    setupRegistrationTracker();
  });

  // ==========================================
  // VISITOR TRACKING LOGIC
  // ==========================================
  function initVisitorTracker() {
    try {
      const page = window.location.pathname.split("/").pop() || "index.html";
      const now = new Date().toISOString();
      const userAgent = navigator.userAgent;
      
      // Get browser name
      let browser = "Unknown Browser";
      if (userAgent.indexOf("Chrome") > -1) browser = "Google Chrome";
      else if (userAgent.indexOf("Safari") > -1) browser = "Apple Safari";
      else if (userAgent.indexOf("Firefox") > -1) browser = "Mozilla Firefox";
      else if (userAgent.indexOf("MSIE") > -1 || !!document.documentMode) browser = "Internet Explorer";
      else if (userAgent.indexOf("Edge") > -1) browser = "Microsoft Edge";

      // Track hit
      let totalVisits = parseInt(localStorage.getItem("cyberacademy_total_visits") || "0");
      localStorage.setItem("cyberacademy_total_visits", (totalVisits + 1).toString());

      // Track unique visitor
      let uniqueVisitors = parseInt(localStorage.getItem("cyberacademy_unique_visitors") || "0");
      const isReturning = localStorage.getItem("cyberacademy_returning_visitor");
      if (!isReturning) {
        localStorage.setItem("cyberacademy_returning_visitor", "true");
        localStorage.setItem("cyberacademy_unique_visitors", (uniqueVisitors + 1).toString());
      }

      // Append to visit logs
      let logs = JSON.parse(localStorage.getItem("cyberacademy_visit_logs") || "[]");
      logs.unshift({
        timestamp: now,
        page: page,
        browser: browser,
        userAgent: userAgent
      });
      // Cap logs at 100
      if (logs.length > 100) {
        logs = logs.slice(0, 100);
      }
      localStorage.setItem("cyberacademy_visit_logs", JSON.stringify(logs));
    } catch (e) {
      console.warn("Failed to track visitor:", e);
    }
  }

  // Helper to escape HTML characters
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ==========================================
  // DYNAMIC CONTENT APPLICATION
  // ==========================================
  function applyDynamicContent() {
    try {
      // 1. Modules
      const modulesStr = localStorage.getItem("cyberacademy_modules");
      const modules = modulesStr ? JSON.parse(modulesStr) : defaultModules;
      
      const container = document.getElementById("modulesContainer");
      if (container) {
        container.innerHTML = "";
        modules.forEach((mod, idx) => {
          const card = document.createElement("div");
          card.className = `roadmap-step scroll-reveal delay-${(idx % 3) + 1}`;
          
          const modNum = String(idx + 1).padStart(2, '0');
          card.innerHTML = `
            <div class="roadmap-number">${modNum}</div>
            <div class="roadmap-body">
              <div class="roadmap-kicker">Module ${modNum}</div>
              <h3>${escapeHtml(mod.title)}</h3>
              <p>${escapeHtml(mod.desc)}</p>
            </div>
          `;
          container.appendChild(card);
        });
      }

      // 2. Speakers / Instructors
      const speakersStr = localStorage.getItem("cyberacademy_speakers");
      let speakers = speakersStr ? JSON.parse(speakersStr) : defaultSpeakers;
      // Load dynamic speakers list
      
      const speakersContainer = document.getElementById("speakersContainer");
      if (speakersContainer) {
        speakersContainer.innerHTML = "";
        speakers.forEach((spk, idx) => {
          const card = document.createElement("div");
          card.className = `card white-card scroll-reveal delay-${(idx % 2) + 1}`;
          card.style.display = "flex";
          card.style.gap = "2rem";
          card.style.alignItems = "center";
          card.style.flexWrap = "wrap";
          card.style.marginBottom = "1.5rem";
          
          card.innerHTML = `
            <div style="width: 100px; height: 100px; border-radius: 50%; overflow: hidden; border: 2px solid var(--accent); flex-shrink: 0; background: var(--bg-subtle);">
              <img src="${escapeHtml(spk.avatar)}" alt="${escapeHtml(spk.name)}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div style="flex: 1; min-width: 250px;">
              <h3 style="font-size: 1.4rem; margin-bottom: 0.3rem;">${escapeHtml(spk.name)}</h3>
              <div style="color: var(--accent); font-weight: 700; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.8rem;">${escapeHtml(spk.title)}</div>
              <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.5; margin: 0;">${escapeHtml(spk.bio)}</p>
            </div>
          `;
          speakersContainer.appendChild(card);
        });
      }

      // 3. Brochure Link
      const brochureUrl = localStorage.getItem("cyberacademy_brochure_url") || defaultBrochure.url;
      const downloadButtons = document.querySelectorAll(".brochure-download-btn");
      downloadButtons.forEach(btn => {
        btn.setAttribute("data-brochure-url", brochureUrl);
      });
    } catch (e) {
      console.warn("Failed to apply dynamic content:", e);
    }
  }

  // ==========================================
  // BROCHURE LEAD GENERATION & MODAL
  // ==========================================
  function setupBrochureModal() {
    const modal = document.getElementById("brochureModal");
    const form = document.getElementById("brochureForm");
    if (!modal || !form) return;

    // Close button event
    const closeBtn = modal.querySelector(".brochure-modal-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeBrochureModal);
    }

    // Click outside to close
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeBrochureModal();
      }
    });

    // Form submission
    form.addEventListener("submit", handleBrochureSubmit);
  }

  window.openBrochureModal = function() {
    const modal = document.getElementById("brochureModal");
    if (modal) {
      modal.classList.add("is-active");
      document.body.style.overflow = "hidden"; // Disable scroll
    }
  };

  window.closeBrochureModal = function() {
    const modal = document.getElementById("brochureModal");
    if (modal) {
      modal.classList.remove("is-active");
      document.body.style.overflow = ""; // Enable scroll
    }
  };

  function handleBrochureSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById("leadName").value.trim();
    const email = document.getElementById("leadEmail").value.trim();
    const phone = document.getElementById("leadPhone").value.trim();
    const timestamp = new Date().toISOString();

    if (!name || !email || !phone) return;

    // 1. Save lead locally
    try {
      let leads = JSON.parse(localStorage.getItem("cyberacademy_leads") || "[]");
      leads.unshift({ name, email, phone, timestamp });
      localStorage.setItem("cyberacademy_leads", JSON.stringify(leads));
    } catch (err) {
      console.error("Failed to save lead locally:", err);
    }

    // 2. Submit to Formspree if configured
    const formspreeUrl = localStorage.getItem("cyberacademy_formspree_url") || defaultBrochure.formspreeUrl;
    if (formspreeUrl) {
      fetch(formspreeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: name,
          email: email,
          phone: phone,
          message: "Downloaded the Cyber Academy Brochure",
          timestamp: timestamp
        })
      })
      .then(res => {
        console.log("Submitted lead to Formspree:", res.status);
      })
      .catch(err => {
        console.warn("Formspree submission failed:", err);
      });
    }

    // 3. Trigger Download
    let brochureUrl = localStorage.getItem("cyberacademy_brochure_url");
    if (!brochureUrl || brochureUrl === "assets/brochure.pdf") {
      brochureUrl = defaultBrochure.url;
    }
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = brochureUrl;
    downloadAnchor.download = brochureUrl.split("/").pop();
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);

    // 4. Close Modal & Reset Form
    closeBrochureModal();
    document.getElementById("brochureForm").reset();
  }

  // ==========================================
  // REGISTRATION TRACKING LOGIC
  // (Registration now handled via Microsoft Forms iframe — this tracker
  //  is preserved for backward compatibility and will gracefully exit
  //  if #registrationForm is not found on the page.)
  // ==========================================
  function setupRegistrationTracker() {
    const regForm = document.getElementById("registrationForm");
    if (!regForm) return;

    regForm.addEventListener("submit", () => {
      try {
        const nameVal = document.getElementById("name")?.value || "";
        const emailVal = document.getElementById("email")?.value || "";
        const phoneVal = document.getElementById("phone")?.value || "";
        const qualificationVal = document.getElementById("degree")?.value || "";
        const trackVal = document.getElementById("program-select")?.value || "";
        const examSlotVal = document.querySelector('input[name="Exam Slot"]:checked')?.value || "Morning Slot";
        const transactionIdVal = document.getElementById("transactionId")?.value || "";
        const timestampVal = new Date().toISOString();

        if (!nameVal || !emailVal || !phoneVal) return;

        const registration = {
          name: nameVal,
          email: emailVal,
          phone: phoneVal,
          qualification: qualificationVal,
          track: trackVal,
          examSlot: examSlotVal,
          transactionId: transactionIdVal,
          timestamp: timestampVal
        };

        let registrations = JSON.parse(localStorage.getItem("cyberacademy_registrations") || "[]");
        registrations.unshift(registration);
        localStorage.setItem("cyberacademy_registrations", JSON.stringify(registrations));
      } catch (err) {
        console.error("Failed to save registration locally:", err);
      }
    });
  }

})();
