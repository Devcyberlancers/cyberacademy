(function() {
  // ==========================================
  // CONFIGURATION & INITIALIZATION
  // ==========================================
  
  // Default values
  const defaultModules = [
    {
      title: "System Internals & Assembly",
      desc: "Understand Operating System architecture, Windows/Linux process layouts, PE/ELF file structures, memory space configuration, registers, and basic x86/x64 assembly instructions."
    },
    {
      title: "Offensive Vectors",
      desc: "Exploit vulnerabilities step-by-step. Understand heap management anomalies, format string manipulations, payload customization, payload execution, and Active Directory exploitation."
    },
    {
      title: "Defense & Analysis",
      desc: "Build defensive frameworks. Write custom detection rules for network logs, analyze packet streams, configure threat-hunting setups, and run proctored tactical simulator tasks."
    }
  ];

  const defaultCertificate = {
    name: "John Doe",
    text: "Has successfully completed the 3-Month Trainee Track. Verified ID: CL-294-82X."
  };

  const defaultBrochure = {
    url: "assets/brochure.pdf",
    formspreeUrl: ""
  };

  // Run on page load
  document.addEventListener("DOMContentLoaded", () => {
    initVisitorTracker();
    applyDynamicContent();
    setupBrochureModal();
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

  // ==========================================
  // DYNAMIC CONTENT APPLICATION
  // ==========================================
  function applyDynamicContent() {
    try {
      // 1. Modules
      const modulesStr = localStorage.getItem("cyberacademy_modules");
      const modules = modulesStr ? JSON.parse(modulesStr) : defaultModules;
      
      modules.forEach((mod, idx) => {
        const titleEl = document.getElementById(`module-${idx + 1}-title`);
        const descEl = document.getElementById(`module-${idx + 1}-desc`);
        if (titleEl) titleEl.textContent = mod.title;
        if (descEl) descEl.textContent = mod.desc;
      });

      // 2. Certificate
      const certStr = localStorage.getItem("cyberacademy_certificate");
      const cert = certStr ? JSON.parse(certStr) : defaultCertificate;

      const certNameEl = document.getElementById("cert-name");
      const certTextEl = document.getElementById("cert-text");
      if (certNameEl) certNameEl.textContent = cert.name;
      if (certTextEl) certTextEl.textContent = cert.text;

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
    const brochureUrl = localStorage.getItem("cyberacademy_brochure_url") || defaultBrochure.url;
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

})();
