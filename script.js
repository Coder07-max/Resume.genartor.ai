// =============================
// AI Resume Generator - script.js
// =============================

// Utility selectors
const $ = (id) => document.getElementById(id);

// Sections
const authSection = $("auth-section");
const dashboard = $("dashboard");
const resumeFormSection = $("resume-form-section");
const resumePreviewSection = $("resume-preview-section");

// Demo user
const demoUser = { username: "demo@test.com", password: "demo123" };

// State
let currentUser = null;
let resumes = [];
let editingIndex = null;

// =============================
// Authentication
// =============================
function signup(e) {
  e.preventDefault();
  const username = $("signup-username").value.trim();
  const password = $("signup-password").value.trim();

  if (!username || !password) {
    alert("Please fill all fields.");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "{}");
  if (users[username]) {
    alert("User already exists.");
    return;
  }

  users[username] = { password };
  localStorage.setItem("users", JSON.stringify(users));
  alert("Signup successful. Please login.");
}

function login(e) {
  e.preventDefault();
  const username = $("login-username").value.trim();
  const password = $("login-password").value.trim();

  if (!username || !password) {
    alert("Please fill all fields.");
    return;
  }

  if (username === demoUser.username && password === demoUser.password) {
    currentUser = username;
  } else {
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (!users[username] || users[username].password !== password) {
      alert("Invalid credentials.");
      return;
    }
    currentUser = username;
  }

  loadResumes();
  showDashboard();
}

function logout() {
  currentUser = null;
  resumes = [];
  showAuth();
}

// =============================
// Screen Switching
// =============================
function showAuth() {
  authSection.classList.remove("hidden");
  dashboard.classList.add("hidden");
  resumeFormSection.classList.add("hidden");
  resumePreviewSection.classList.add("hidden");
}

function showDashboard() {
  authSection.classList.add("hidden");
  dashboard.classList.remove("hidden");
  resumeFormSection.classList.add("hidden");
  resumePreviewSection.classList.add("hidden");
  $("user-display").textContent = currentUser;
  renderResumeList();
}

function showForm() {
  dashboard.classList.add("hidden");
  resumeFormSection.classList.remove("hidden");
  resumePreviewSection.classList.add("hidden");
}

function showPreview() {
  resumeFormSection.classList.add("hidden");
  resumePreviewSection.classList.remove("hidden");
}

// =============================
// Resume CRUD
// =============================
function loadResumes() {
  const data = JSON.parse(localStorage.getItem("resumes") || "{}");
  resumes = data[currentUser] || [];
}

function saveResumes() {
  const data = JSON.parse(localStorage.getItem("resumes") || "{}");
  data[currentUser] = resumes;
  localStorage.setItem("resumes", JSON.stringify(data));
}

function renderResumeList() {
  const list = $("resume-list");
  list.innerHTML = "";
  resumes.forEach((resume, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${resume.name}</span>
      <div>
        <button onclick="editResume(${index})">Edit</button>
        <button onclick="deleteResume(${index})">Delete</button>
        <button onclick="previewResume(${index})">Preview</button>
      </div>
    `;
    list.appendChild(li);
  });
}

function saveResume() {
  const resume = {
    name: $("resume-name").value.trim(),
    fullName: $("full-name").value.trim(),
    email: $("email").value.trim(),
    phone: $("phone").value.trim(),
    summary: $("summary").value.trim(),
    work: $("work-experience").innerHTML,
    education: $("education").innerHTML,
    skills: $("skills").innerHTML,
  };

  if (!resume.name || !resume.fullName || !resume.email || !resume.phone || !resume.summary) {
    alert("Please fill all required fields.");
    return;
  }

  if (editingIndex !== null) {
    resumes[editingIndex] = resume;
    editingIndex = null;
  } else {
    resumes.push(resume);
  }
  saveResumes();
  showDashboard();
}

function editResume(index) {
  const resume = resumes[index];
  editingIndex = index;
  $("resume-name").value = resume.name;
  $("full-name").value = resume.fullName;
  $("email").value = resume.email;
  $("phone").value = resume.phone;
  $("summary").value = resume.summary;
  $("work-experience").innerHTML = resume.work;
  $("education").innerHTML = resume.education;
  $("skills").innerHTML = resume.skills;
  showForm();
}

function deleteResume(index) {
  if (confirm("Delete this resume?")) {
    resumes.splice(index, 1);
    saveResumes();
    renderResumeList();
  }
}

function previewResume(index) {
  const resume = resumes[index];
  $("resume-preview").innerHTML = `
    <h2>${resume.fullName}</h2>
    <p><strong>Email:</strong> ${resume.email}</p>
    <p><strong>Phone:</strong> ${resume.phone}</p>
    <h3>Summary</h3>
    <p>${resume.summary}</p>
    <h3>Work Experience</h3>
    ${resume.work}
    <h3>Education</h3>
    ${resume.education}
    <h3>Skills</h3>
    ${resume.skills}
  `;
  showPreview();
}

// =============================
// AI Enhancement (Gemini API)
// =============================
async function generateWithAI() {
  const apiKey = $("api-key").value.trim();
  if (!apiKey) {
    alert("Please enter your Gemini API key.");
    return;
  }

  const summary = $("summary").value.trim();
  if (!summary) {
    alert("Please enter a summary.");
    return;
  }

  try {
    $("generate-ai-btn").disabled = true;
    $("generate-ai-btn").textContent = "Generating...";

    const response = await fetch("https://api.gemini.com/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: `Enhance this professional summary: ${summary}`
      })
    });

    const data = await response.json();
    if (data && data.output) {
      $("summary").value = data.output;
    } else {
      alert("AI generation failed.");
    }
  } catch (err) {
    console.error(err);
    alert("Error connecting to Gemini API.");
  } finally {
    $("generate-ai-btn").disabled = false;
    $("generate-ai-btn").textContent = "Generate with AI";
  }
}

// =============================
// Export & Clipboard
// =============================
function downloadPDF() {
  const element = $("resume-preview");
  html2pdf().from(element).save("resume.pdf");
}

function downloadDocx() {
  const content = $("resume-preview").innerText;
  const blob = new Blob([content], { type: "application/msword" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "resume.docx";
  link.click();
}

function copyToClipboard() {
  const text = $("resume-preview").innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert("Copied to clipboard!");
  }).catch(() => {
    alert("Failed to copy.");
  });
}

// =============================
// Event Listeners
// =============================
$("signup-form").addEventListener("submit", signup);
$("login-form").addEventListener("submit", login);
$("logout-btn").addEventListener("click", logout);
$("new-resume-btn").addEventListener("click", showForm);
$("save-resume-btn").addEventListener("click", saveResume);
$("back-dashboard-btn").addEventListener("click", showDashboard);
$("generate-ai-btn").addEventListener("click", generateWithAI);
$("download-pdf-btn").addEventListener("click", downloadPDF);
$("download-docx-btn").addEventListener("click", downloadDocx);
$("copy-clipboard-btn").addEventListener("click", copyToClipboard);
$("back-edit-btn").addEventListener("click", showForm);

// =============================
// Init
// =============================
showAuth();
