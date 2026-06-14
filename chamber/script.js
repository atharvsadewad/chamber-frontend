const SUPABASE_URL = "https://vabqwsoaqpapxsmemaxw.supabase.co";
const SUPABASE_KEY = "sb_publishable_BpzTnxe-unBnSsdfdKUZ0Q__9L1ZZaJ";
const BACKEND_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:3001/api/chat"
  : "https://chamber-backend1.vercel.app/api/chat";

let laws_new = [];
let currentLang = "en";
let savedScrollPosition = 0;

// 🔥 LOAD LAWS
async function loadLaws() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/laws_new?select=*`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  laws_new = await res.json();
}

// 🌐 TRANSLATION
async function translateText(text) {
  if (currentLang === "en") return text;

  try {
    const res = await fetch(
      "https://api.mymemory.translated.net/get?q=" +
        encodeURIComponent(text) +
        "&langpair=en|" +
        currentLang
    );
    const data = await res.json();
    return data.responseData.translatedText;
  } catch {
    return text;
  }
}

// 🔍 UNIVERSAL SEARCH
async function performSearch() {
  const input = document.getElementById("searchInput").value.trim().toLowerCase();

  if (!input) {
    alert("Please enter a search term.");
    return;
  }

  let url = `${SUPABASE_URL}/rest/v1/laws_new?select=*`;

  const activeFilter = document.querySelector(".filter-tag.active");
  const filterValue = activeFilter ? activeFilter.dataset.filter : "all";

  if (filterValue && filterValue !== "all") {
    url += `&subject=eq.${filterValue}`;
  }

  if (!isNaN(input)) {
    url += `&section=ilike.*${input}*`;
  } else {
    const encoded = encodeURIComponent(input);
    url += `&or=(title.ilike.*${encoded}*,description.ilike.*${encoded}*,content.ilike.*${encoded}*,section.ilike.*${encoded}*)`;
  }

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  const data = await res.json();

  const scored = data.map(law => {
    let score = 0;
    const t = (law.title || "").toLowerCase();
    const d = (law.description || "").toLowerCase();
    const s = (law.section || "").toLowerCase();
    const c = (law.content || "").toLowerCase();

    if (s === input) score += 100;
    else if (s.startsWith(input)) score += 80;
    if (t === input) score += 90;
    else if (t.includes(input)) score += 60;
    if (d.includes(input)) score += 40;
    if (c.includes(input)) score += 20;

    return { ...law, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);

  displayResults(scored, "Search Results");
}

// 📊 DISPLAY RESULTS
async function displayResults(results, title = "Results") {
  const modal = document.getElementById("resultsModal");
  const modalResults = document.getElementById("modalResults");

  modal.style.display = "flex";

  if (!results || results.length === 0) {
    modalResults.innerHTML = `
      <h2>${title}</h2>
      <div style="text-align:center; padding:2rem;">
        <h3>No results found</h3>
      </div>
    `;
    return;
  }

  if (!results[0]._score) {
    results.sort((a, b) => {
      const aNum = parseInt(a.section) || 0;
      const bNum = parseInt(b.section) || 0;
      return aNum - bNum;
    });
  }

  let html = `<h2 style="margin-bottom:15px;">${title}</h2>`;

  for (let i = 0; i < results.length; i++) {
    const law = results[i];

    const titleText = await translateText(law.title);
    const descText = await translateText(law.description);

    html += `
      <div class="result-item" onclick="displaySingleLaw(${i})">
        <h3>${titleText}</h3>
        <p>${descText}</p>
        <small style="color:#888;">${law.name || ""}</small>
      </div>
    `;
  }

  modalResults.innerHTML = html;

  window.currentResults = results;
}

// 📘 SINGLE LAW VIEW
async function displaySingleLaw(index) {
  savedScrollPosition = document.getElementById("modalResults").scrollTop;
  const law = window.currentResults[index];
  const modalResults = document.getElementById("modalResults");

  const titleText = await translateText(law.title);
  const descText = await translateText(law.description);

  modalResults.innerHTML = `
    <button onclick="goBackToResults()" style="margin-bottom:10px;">⬅ Back</button>

    <h2>${titleText}</h2>
    <p>${descText}</p>
    <small style="color:#888;">${law.name || ""}</small>

    <div style="margin-top:15px;">
      ${formatContent(law.content)}
    </div>

    <p style="margin-top:15px;"><strong>Source:</strong> ${law.source}</p>
  `;
}

// 🧠 FORMAT CONTENT
function formatContent(content) {
  if (!content) return "";

  return content
    .split(/(?=\(\d+\))/)
    .map(point => {
      const num = point.match(/^\(\d+\)/);
      if (!num) return `<p>${point}</p>`;

      return `
        <div style="margin-bottom:8px;">
          <strong>${num[0]}</strong> ${point.replace(num[0], "").trim()}
        </div>
      `;
    })
    .join("");
}

// 🎯 CLASSIFICATION CLICK
function initializeClassifications() {
  const cards = document.querySelectorAll(".classification-card");

  cards.forEach(card => {
    card.addEventListener("click", async function () {
      window.currentResults = [];

      const subject = this.dataset.subject;

      let url = `${SUPABASE_URL}/rest/v1/laws_new?select=*`;

      if (subject && subject !== "all") {
        url += `&subject=eq.${subject.toLowerCase()}`;
      }

      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });

      const data = await res.json();

      displayResults(data, `${subject.toUpperCase()} Law`);
    });
  });
}

// ❌ MODAL CLOSE
function setupModal() {
  const modal = document.getElementById("resultsModal");

  document.getElementById("modalClose").onclick = () => {
    modal.style.display = "none";
    window.currentResults = [];
  };

  window.onclick = function (e) {
    if (e.target === modal) {
      modal.style.display = "none";
      window.currentResults = [];
    }
  };
}

// 🌐 LANGUAGE UI
function toggleLangMenu() {
  const menu = document.getElementById("langMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function setLanguage(lang) {
  currentLang = lang;

  const labels = {
    en: "English",
    hi: "हिंदी",
    mr: "मराठी"
  };

  document.getElementById("currentLangLabel").innerText = labels[lang];
  document.getElementById("langMenu").style.display = "none";

  alert("⚠️ Demo Translation Enabled (May not be legally accurate)");
}

// 🤖 CHATBOT (UNCHANGED)
function initializeChatbot() {
  const toggle = document.getElementById("chatbotToggle");
  const windowBox = document.getElementById("chatbotWindow");
  const input = document.getElementById("chatbotInput");
  const send = document.getElementById("chatbotSend");
  const messages = document.getElementById("chatbotMessages");

  toggle.addEventListener("click", () => {
    windowBox.style.display =
      windowBox.style.display === "flex" ? "none" : "flex";
  });

  send.addEventListener("click", sendMessage);

  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, "user");
    input.value = "";

    const typing = addMessage("Thinking...", "bot");

    try {
      const res = await fetch(
        BACKEND_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message })
        }
      );

      const data = await res.json();
      typing.remove();
      addMessage(data.response, "bot");
    } catch {
      typing.remove();
      addMessage("Error connecting AI", "bot");
    }
  }

  function addMessage(content, sender) {
    const div = document.createElement("div");
    div.className = `message ${sender}`;
    div.innerHTML = `<div>${content}</div>`;
    messages.appendChild(div);
    return div;
  }
}

// 🧾 DRAFT GENERATION
async function generateDraft() {
  const type = document.getElementById("draftType").value;
  const input = document.getElementById("draftInput").value;

  if (!input) return alert("Enter details");

  const resultDiv = document.getElementById("draftResult");
  resultDiv.innerText = "Generating draft...";

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Generate a ${type} draft for: ${input}`
      })
    });

    const data = await res.json();
    resultDiv.innerText = data.response;
  } catch (err) {
    resultDiv.innerText = "Error generating draft. Please try again.";
  }
}

// 🧾 OPEN MODAL
function openDraft() {
  document.getElementById("draftModal").style.display = "flex";
}

// ❌ CLOSE MODAL
function closeDraft() {
  document.getElementById("draftModal").style.display = "none";
}

async function goBackToResults() {
  await displayResults(window.currentResults);

  const container = document.getElementById("modalResults");

  // 🔥 force restore AFTER render
  setTimeout(() => {
    container.scrollTo({
      top: savedScrollPosition,
      behavior: "auto"
    });
  }, 0);
}

// 🌗 THEME SWITCHER
function initializeTheme() {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;

  const icon = themeToggle.querySelector("i");

  // Check saved theme
  const savedTheme = localStorage.getItem("theme") || "dark";
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    if (icon) {
      icon.className = "fas fa-sun";
    }
  } else {
    document.body.classList.remove("light-theme");
    if (icon) {
      icon.className = "fas fa-moon";
    }
  }

  themeToggle.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light-theme");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    if (icon) {
      icon.className = isLight ? "fas fa-sun" : "fas fa-moon";
    }
  });
}

// 🚀 INIT
document.addEventListener("DOMContentLoaded", function () {
  initializeTheme();
  loadLaws();
  initializeClassifications();
  setupModal();
  initializeChatbot();

  // 🔥 FIXED DROPDOWN EVENT
  const langBtn = document.querySelector(".lang-btn");
  if (langBtn) langBtn.addEventListener("click", toggleLangMenu);

  document.getElementById("searchBtn").addEventListener("click", performSearch);

  document
    .getElementById("searchInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") performSearch();
    });

  document.querySelectorAll(".filter-tag").forEach(tag => {
    tag.addEventListener("click", function () {
      document
        .querySelectorAll(".filter-tag")
        .forEach(t => t.classList.remove("active"));
      this.classList.add("active");
    });
  });
});

// 🌌 INTERACTIVE PARTICLES SIMULATION (UNIFORM SMALL PARTICLES & SPARKLE TRAIL)
function initParticles() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let particles = [];
  let sparkles = [];
  
  // Google Colors with RGB equivalents for alpha control
  const colors = [
    { hex: "#4285F4", rgb: "66, 133, 244" }, // Google Blue
    { hex: "#EA4335", rgb: "234, 67, 53" }, // Google Red
    { hex: "#FBBC05", rgb: "251, 188, 5" },  // Google Yellow
    { hex: "#34A853", rgb: "52, 168, 83" }   // Google Green
  ];

  const mouse = {
    x: null,
    y: null,
    radius: 160 // Mouse interaction distance
  };

  // 🎇 Sparkle Trail Class
  class Sparkle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 2 + 1; // sparkle size
      this.color = colors[Math.floor(Math.random() * colors.length)].hex;
      this.vx = (Math.random() - 0.5) * 1.5; // horizontal spread
      this.vy = (Math.random() - 0.5) * 1.5 - 0.2; // vertical slow rise/fall
      this.alpha = 1;
      this.decay = Math.random() * 0.04 + 0.03; // fading speed
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.restore();
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
    }
  }

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    
    // Add sparkles on mouse movement!
    for (let i = 0; i < 3; i++) {
      sparkles.push(new Sparkle(e.clientX, e.clientY));
    }
  });

  window.addEventListener("mouseout", () => {
    mouse.x = null;
    mouse.y = null;
  });

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createParticles();
  }

  window.addEventListener("resize", resizeCanvas);

  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 1.2; // Equal, small size for all background particles
      this.colorObj = colors[Math.floor(Math.random() * colors.length)];
      this.vx = (Math.random() - 0.5) * 0.4; // slow drift
      this.vy = (Math.random() - 0.5) * 0.4;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.colorObj.hex;
      ctx.fill();
    }

    update() {
      // Bounce boundaries
      if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
      if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

      this.x += this.vx;
      this.y += this.vy;

      // Mouse attraction
      if (mouse.x !== null && mouse.y !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const distance = Math.hypot(dx, dy);

        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          
          // Gentle drag towards mouse
          this.x -= Math.cos(angle) * force * 0.4;
          this.y -= Math.sin(angle) * force * 0.4;
        }
      }
    }
  }

  function createParticles() {
    particles = [];
    const particleCount = Math.floor((canvas.width * canvas.height) / 14000);
    for (let i = 0; i < Math.min(particleCount, 130); i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      particles.push(new Particle(x, y));
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const isLight = document.body.classList.contains("light-theme");
    const linkColor = isLight ? "0, 0, 0" : "255, 255, 255";

    // 1. Draw connection line from mouse pointer to nearby background particles
    if (mouse.x !== null && mouse.y !== null) {
      for (let i = 0; i < particles.length; i++) {
        const dxMouse = particles[i].x - mouse.x;
        const dyMouse = particles[i].y - mouse.y;
        const distMouse = Math.hypot(dxMouse, dyMouse);

        if (distMouse < mouse.radius) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${particles[i].colorObj.rgb}, ${0.12 * (1 - distMouse / mouse.radius)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    // 2. Draw background particles & constellation connections
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();

      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);

        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${linkColor}, ${0.035 * (1 - dist / 110)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // 3. Update and draw mouse sparkles trail
    for (let i = sparkles.length - 1; i >= 0; i--) {
      sparkles[i].update();
      if (sparkles[i].alpha <= 0) {
        sparkles.splice(i, 1);
      } else {
        sparkles[i].draw();
      }
    }

    requestAnimationFrame(animate);
  }

  resizeCanvas();
  animate();
}

// Initialize particles on window load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initParticles);
} else {
  initParticles();
}
