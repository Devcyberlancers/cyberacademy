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
