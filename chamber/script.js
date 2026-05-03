const SUPABASE_URL = "https://vabqwsoaqpapxsmemaxw.supabase.co";
const SUPABASE_KEY = "sb_publishable_BpzTnxe-unBnSsdfdKUZ0Q__9L1ZZaJ";

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
        "https://chamber-backend1.vercel.app/api/chat",
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
    const res = await fetch("https://chamber-backend1.vercel.app/api/chat", {
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

// 🚀 INIT
document.addEventListener("DOMContentLoaded", function () {
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
