// ________In-memory storage____________________________________________
const store = {
  studentDetails: {},
  checklist: [],
};

// Persist store across pages via sessionStorage
function saveStore() {
  sessionStorage.setItem("visaReadyStore", JSON.stringify(store));
}
function loadStore() {
  const saved = sessionStorage.getItem("visaReadyStore");
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.assign(store, parsed);
  }
}

loadStore();





// ________Questionnaire - questionnaire.html_____________________________________________________________________________________
const totalSteps = 6;
let currentStep = 1;

// Function to update the three elements in the progress bar: the bar fill, the 'step' and the 'percentage' label. 
function updateProgress(step) {
  const pct = Math.round((step / totalSteps) * 100); // e.g. step 3 of 6 is 50%
  const fill = document.getElementById("progressFill");
  const label = document.getElementById("stepLabel");
  const pctLabel = document.getElementById("stepPct");
  if (fill) fill.style.width = pct + "%";  // bar grows
  if (label) label.textContent = `Step ${step} of ${totalSteps}`;
  if (pctLabel) pctLabel.textContent = pct + "%";
}

// Function to control which of the 6 step classes, 'questionnaire-step', in the questionnaire is visible. 
function goToStep(step) {
        // 1. Hides all the steps. 
  document
    .querySelectorAll(".questionnaire-step")
    .forEach((el) => el.classList.remove("active"));

       // 2. Shows only the target step
  const target = document.getElementById("step" + step);
  if (target) {
    target.classList.add("active");
    updateProgress(step);  //updates the progress bar
  }
  currentStep = step; // remembers where we are. 
}

// Function called when user clicks the 'Continue' button. It runs three things in hierarchy
function nextStep(from) {
        // Step 1: Check required fields
  if (!validateStep(from)) return;  // breaks if invalid
        // Step 2: saves the form data 
  collectStep(from);
        // Step 3: Moves to the next set of questions. 
  goToStep(from + 1);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Function that checks whether the required fields in step 1 and 2 are filled.
function validateStep(step) {
  if (step === 1) {
    const name = document.getElementById("fullName")?.value.trim(); // '?.value' gives undefined instead of crashing
    const email = document.getElementById("email")?.value.trim();
    if (!name || !email) {
      showToast("Please fill in your name and email first! ");
      return false; //blocks next step and runs 'showToast()' with above message
    }
  }
  if (step === 2) {
    const visa = document.querySelector('input[name="visaType"]:checked');
    const visaExpiry = document.getElementById("expiryDate")?.value;
    if (!visa || !visaExpiry) {
      showToast("Please select your visa-type and the expiry date.");
      return false;
    }
  }
  return true; // all other steps pass since their fields are optional. 
}

// Function that reads every input in the current step and writes the values into store.studentDetails: line 3.
function collectStep(step) {
  if (step === 1) {
    store.studentDetails.name = document.getElementById("fullName")?.value.trim();
    store.studentDetails.email = document.getElementById("email")?.value.trim();
    store.studentDetails.nationality = document.getElementById("nationality")?.value.trim();
    store.studentDetails.city = document.getElementById("city")?.value;
  }
  if (step === 2) {
          //':checked ' finds the radio button selected by the user. 
    store.studentDetails.visaType = document.querySelector('input[name="visaType"]:checked')?.value;
    store.studentDetails.expiryDate = document.getElementById("expiryDate")?.value;
  }
  if (step === 3) {
    store.studentDetails.studyStatus = document.querySelector('input[name="studyStatus"]:checked')?.value;
    store.studentDetails.university = document.getElementById("university")?.value.trim();
  }
  if (step === 4) {
    store.studentDetails.funding = document.querySelector('input[name="funding"]:checked')?.value;
  }
  if (step === 5) {
    store.studentDetails.insurance = document.querySelector('input[name="insurance"]:checked')?.value;
    store.studentDetails.housing = document.querySelector('input[name="housing"]:checked')?.value;
  }
  if (step === 6) {
          //Collects all checked values in the checkboxes into an array. 
    const selectedExtras = Array.from(document.querySelectorAll('input[name="extras"]:checked'), 
    input => input.value);
    store.studentDetails.extras = selectedExtras;
    store.studentDetails.notes = document.getElementById("notes")?.value.trim();
  }
  saveStore();
}

/* Function that navigates back to the previous step. 
No data collection happens on back because 'store' already has the data. */
function prevStep(from) {
  goToStep(from - 1);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Function called when 'Generate My Checklist ✓' button is clicked. Packages everything and sends user to checklist.html
function submitQuestionnaire() {
        /* Step 6 uses Step 6 uses 'Generate My Checklist ✓' instead of 'Continue', 
          which calls this function directly rather than nextStep(), so step 6 data is collected manually here. */
  collectStep(6); 
  store.checklist = generateChecklist(store.studentDetails); // builds checklist
  saveStore();
  window.location.href = "checklist.html"; // goes to checklist page
}




// ________Checklist Generator__________________________________________________________________________________________________

/* Function that takes the everything collected by collectStep() and returns an array of
checklist items. Each item is an object with 4 properties  */
function generateChecklist(applicant) {
  const items = []; // starts empty

  // every call to items.push() adds one object with four properties. Helps renderChecklist() build UI predictably
  // First section: Identity Documents - required from everyone . 
  items.push({
    section: "Identity Documents",
    title: "Valid Passport",
    desc: "Must be valid for at least 6 months beyond the expiry date of your current residence permit. Include all pages.",
    required: true,
  });
  items.push({
    section: "Identity Documents",
    title: "Biometric Passport Photo",
    desc: "The photo must be recent and be 35mm × 45mm, with plain light background ensuring it contrasts well with the face.",
    required: true,
  });
  items.push({
    section: "Identity Documents",
    title: "Current Residence Permit (Aufenthaltstitel) or Visa (Visum)",
    desc: "Your existing permit MUST be submitted even if it has expired.",
    required: true,
  });
  items.push({
    section: "Identity Documents",
    title: "Completed Application Form (Antrag auf Verlängerung)",
    desc: "Download from your local Ausländerbehörde website.",
    required: true,
  });

  // Second section: University
  items.push({
    section: "Study Documents",
    title: "Enrollment Certificate (Immatrikulationsbescheinigung)",
    desc: "Current semester enrollment confirmation from your university. It must be VALID, so check the expiry date. ",
    required: true,
  });

  if (applicant.studyStatus === "changingUniversity") {
    items.push({
      section: "Study Documents",
      title: "Acceptance Letter from the New University",
      desc: "Official letter confirming your enrollment in the new program.",
      required: true,
    });
    items.push({
      section: "Study Documents",
      title: "Reason for Change Statement",
      desc: "A brief written explanation of your reason for switching programs.",
      required: true,
    });
  }

  if (applicant.studyStatus === "finishing") {
    items.push({
      section: "Study Documents",
      title: "Academic Transcript",
      desc: "Current transcript showing your progress and remaining credits.",
      required: true,
    });
    items.push({
      section: "Study Documents",
      title: "Thesis Supervisor Confirmation (if applicable)",
      desc: "Letter from your supervisor confirming ongoing thesis work.",
      required: false,
    });
  }

  if (applicant.studyStatus === "gap") {
    items.push({
      section: "Study Documents",
      title: "Leave of Absence Confirmation",
      desc: "Official letter from your university confirming your leave and expected return date.",
      required: true,
    });
  }

  // Third section: Financial Proof
  if (applicant.funding === "blocked") {
    items.push({
      section: "Financial Proof",
      title: "Blocked Account Statement (Sperrkonto)",
      desc: "Statement showing balance ≥ €11,904/year, equivalent to €992 per month. Banks: Fintiba, Coracle, Deutsche Bank.",
      required: true,
    });
  }
  if (applicant.funding === "scholarship") {
    items.push({
      section: "Financial Proof",
      title: "Scholarship Award Letter",
      desc: "Official confirmation of your scholarship, including monthly amount and duration.",
      required: true,
    });
  }
  if (applicant.funding === "parents") {
    items.push({
      section: "Financial Proof",
      title:
        "Formal Declaration of Financial Support (Verpflichtungserklärung)",
      desc: "Notarized statement from parents/sponsor + their bank statements (last 3 months).",
      required: true,
    });
  }
  if (applicant.funding === "employment") {
    items.push({
      section: "Financial Proof",
      title: "Employment Contract & Recent Payslips",
      desc: "Contract showing hours worked and last 3 months of payslips. Ensure you stay within 120 full or 240 half days/year.",
      required: true,
    });
  }
  if (applicant.funding === "multiple") {
    items.push({
      section: "Financial Proof",
      title: "Combined Financial Evidence",
      desc: "All sources: blocked account, scholarship letters, payslips — combined to meet the €11,904/year threshold.",
      required: true,
    });
  }

  // Fourth section: Health Insurance
  items.push({
    section: "Health Insurance",
    title: "Health Insurance Certificate",
    desc:
      applicant.insurance === "private"
        ? "Private insurance must explicitly cover Germany for the full permit duration. Public insurance is strongly preferred."
        : "Certificate from your public insurer (TK, AOK, Barmer, etc.) confirming active coverage.",
    required: true,
  });
  if (applicant.insurance === "none") {
    items.push({
      section: "Health Insurance",
      title: "Action Required: Get Health Insurance",
      desc: "You must obtain health insurance before submitting your application. Without it, renewal will be denied.",
      required: true,
    });
  }

  // Fifth section: Housing/Accomodation
  if (applicant.housing === "private" || applicant.housing === "dorm") {
    items.push({
      section: "Accommodation",
      title: "Rental Agreement or Dorm Confirmation",
      desc: "Signed lease or dorm contract showing your current address and rent amount.",
      required: true,
    });
  }
  items.push({
    section: "Accommodation",
    title: "Registration Certificate (Meldebescheinigung)",
    desc: "Confirmation of address registration from your local Einwohnermeldeamt. Must be current.",
    required: true,
  });
  if (applicant.housing === "searching") {
    items.push({
      section: "Accommodation",
      title: "Secure Accommodation Before Applying",
      desc: "You need a registered address before submitting your renewal. Consider student dorms or WG platforms like WG-Gesucht.",
      required: true,
    });
  }

  // Sixth section: Additional Documents
  if (applicant.extras?.includes("partner")) {
    items.push({
      section: "Additional Documents",
      title: "Marriage Certificate (if applicable)",
      desc: "Official certificate with certified German translation if not already in German.",
      required: true,
    });
    items.push({
      section: "Additional Documents",
      title: "Partner Visa Application (Familiennachzug)",
      desc: "Separate application for your partner — they may need their own appointment.",
      required: true,
    });
  }
  if (applicant.extras?.includes("working")) {
    items.push({
      section: "Additional Documents",
      title: "Work Hours Declaration",
      desc: "If working more than 120 full days/year, you may need special approval. Discuss with your Ausländerbehörde.",
      required: false,
    });
  }
  if (applicant.extras?.includes("expired")) {
    items.push({
      section: "Additional Documents",
      title: "Expired Visa — Act Immediately",
      desc: "If your visa has expired, you are in a legal grey area (Fiktionsbescheinigung may apply). Book a lawyer immediately.",
      required: true,
    });
  }
  if (applicant.extras?.includes("name_change")) {
    items.push({
      section: "Additional Documents",
      title: "New Passport + Name Change Documentation",
      desc: "Bring both old and new passport. Include legal name change documents with certified translation if needed.",
      required: true,
    });
  }

  // Application Process: Fees and Appointment. 
  items.push({
    section: "Application Process",
    title: "Application Fee",
    desc: "Typically €100–€110 for a student residence permit extension. Paid at the Ausländerbehörde appointment.",
    required: true,
  });
  items.push({
    section: "Application Process",
    title: "Book Ausländerbehörde Appointment",

        // Used template literal `´ to allow a single quote inside the string without escaping it. 
    desc: `Book online via your city's Ausländerbehörde portal as early as possible — waiting times can be 4–8 weeks.`, 
    required: true,
  });

  return items; // hands the array to submitQuestionnaire().
}


/* Function that reads the store, calculates urgency and builds checklist DOM. 
Called when checklist.html loads via the page router. */
function renderChecklist() {
  const title = document.getElementById("checklistTitle");
  const subtitle = document.getElementById("checklistSubtitle");
  const banner = document.getElementById("urgencyBanner");
  const body = document.getElementById("checklistBody");
  if (!body) return;

  const s = store.studentDetails;
  const items = store.checklist.length ? store.checklist : generateChecklist(s);

  // Urgency Banner in yellow- calclates how many days until the visa expires. 
  if (s.expiryDate) {
    const today = new Date();
    const visaExpiry = new Date(s.expiryDate); // "2025-06-15", Date object

          // Subtracts dates= Milliseconds to days
    const daysLeft = Math.ceil((visaExpiry - today) / (1000 * 60 * 60 * 24)); 
    if (banner) {
      if (daysLeft < 0) {
        banner.className = "urgency-banner urgent";
        banner.innerHTML = `Your visa expired ${Math.abs(daysLeft)} days ago. Book a lawyer immediately.`;
      } else if (daysLeft <= 30) {
        banner.className = "urgency-banner warning";
        banner.innerHTML = ` Your visa expires in ${daysLeft} days. Submit your renewal application as soon as possible.`;
      } else {
        banner.className = "urgency-banner ok";
        banner.innerHTML = `Your visa expires in ${daysLeft} days. You have time — but start now to avoid delays.`;
      }
    }
  } else if (banner) banner.style.display = "none";

  // Personalized Title and subtitle. 
  if (s.name && title) title.textContent = `Renewal Checklist - ${s.name}`;
  if (s.visaType && subtitle)
    subtitle.textContent = `Personalized for your ${s.visaType} visa renewal in Germany.`;

  
  // Group items from generateChecklist() by sections.
  const sections = {};
  items.forEach((item) => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  body.innerHTML = "";
  Object.entries(sections).forEach(([section, sectionItems]) => {
    const div = document.createElement("div");
    div.className = "checklist-section";
    div.innerHTML = `<h3>${section}</h3>`;
    sectionItems.forEach((item, idx) => {
      const id = `item-${section}-${idx}`.replace(/\s/g, "-");
      div.innerHTML += `
        <div class="checklist-item" id="${id}">
          <div class="check-box" onclick="toggleCheck('${id}')"></div>
          <div>
            <div class="item-title">${item.title}</div>
            <div class="item-desc">${item.desc}</div>
          </div>
        </div>`;
    });
    body.appendChild(div);
  });
}

//function that marks the item as done, turning the row green and adding a strikethrough to title.
function toggleCheck(id) {
  const item = document.getElementById(id);
  if (!item) return;
  const box = item.querySelector(".check-box");
  const isDone = item.classList.toggle("done");
  box.classList.toggle("checked", isDone);
  box.innerHTML = isDone ? "✓" : "";
}



// ________Page Router and toast________________________________________________________________________________________________
const page = window.location.pathname.split("/").pop();

if (page === "questionnaire.html") {
  goToStep(1);
}
if (page === "checklist.html") {
  renderChecklist();
}


function showToast(msg, duration = 3000) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), duration);
}



// Option item click-to-select highlight
document.querySelectorAll(".option-item input").forEach((input) => {
  input.addEventListener("change", () => {
    const name = input.getAttribute("name");
    if (name) {
      document.querySelectorAll(`input[name="${name}"]`).forEach((i) => {
        i.closest(".option-item")?.classList.remove("selected");
      });
    }
    input.closest(".option-item")?.classList.add("selected");
  });
});
