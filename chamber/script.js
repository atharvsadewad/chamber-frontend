const SUPABASE_URL = "https://vabqwsoaqpapxsmemaxw.supabase.co";
const SUPABASE_KEY = "sb_publishable_BpzTnxe-unBnSsdfdKUZ0Q__9L1ZZaJ";

let laws = [];

// 🔥 LOAD LAWS
async function loadLaws() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/laws?select=*`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  laws = await res.json();
}

// 🔍 UNIVERSAL SEARCH
async function performSearch() {
  const input = document.getElementById('searchInput').value.trim().toLowerCase();

  if (!input) {
    alert('Please enter a search term.');
    return;
  }

  let url = `${SUPABASE_URL}/rest/v1/laws?select=*`;

  const activeFilter = document.querySelector('.filter-tag.active');
  const filterValue = activeFilter ? activeFilter.dataset.filter : 'all';
  if (filterValue && filterValue !== 'all') {
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
    const t = (law.title || '').toLowerCase();
    const d = (law.description || '').toLowerCase();
    const s = (law.section || '').toLowerCase();
    const c = (law.content || '').toLowerCase();

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
function displayResults(results, title = "Results") {
  const modal = document.getElementById('resultsModal');
  const modalResults = document.getElementById('modalResults');

  modal.style.display = 'flex';

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

  modalResults.innerHTML = `
    <h2 style="margin-bottom:15px;">${title}</h2>
    ${results.map((law, index) => `
      <div class="result-item" onclick="displaySingleLaw(${index})">
        <h3>${law.title}</h3>
        <p>${law.description}</p>
        <small style="color:#888;">${law.name || ""}</small>
      </div>
    `).join('')}
  `;

  window.currentResults = results;
}

// 📘 SINGLE LAW VIEW
function displaySingleLaw(index) {
  const law = window.currentResults[index];

  const modalResults = document.getElementById('modalResults');

  modalResults.innerHTML = `
    <button onclick="displayResults(window.currentResults)" style="margin-bottom:10px;">⬅ Back</button>

    <h2>${law.title}</h2>
    <p>${law.description}</p>
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
    .join('');
}

// 🎯 CLASSIFICATION CLICK (FIXED)
function initializeClassifications() {
  const cards = document.querySelectorAll('.classification-card');

  cards.forEach(card => {
    card.addEventListener('click', async function () {

      window.currentResults = [];

      const subject = this.dataset.subject; // ✅ FIXED

      let url = `${SUPABASE_URL}/rest/v1/laws?select=*`;

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
  const modal = document.getElementById('resultsModal');

  document.getElementById('modalClose').onclick = () => {
    modal.style.display = 'none';
    window.currentResults = []; // ✅ reset
  };

  window.onclick = function (e) {
    if (e.target === modal) {
      modal.style.display = 'none';
      window.currentResults = []; // ✅ reset
    }
  };
}

// 🤖 CHATBOT (UNCHANGED)
function initializeChatbot() {
  const toggle = document.getElementById('chatbotToggle');
  const windowBox = document.getElementById('chatbotWindow');
  const input = document.getElementById('chatbotInput');
  const send = document.getElementById('chatbotSend');
  const messages = document.getElementById('chatbotMessages');

  toggle.addEventListener('click', () => {
    windowBox.style.display =
      windowBox.style.display === 'flex' ? 'none' : 'flex';
  });

  send.addEventListener('click', sendMessage);

  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';

    const typing = addMessage('Thinking...', 'bot');

    try {
      const res = await fetch("https://chamber-backend1.vercel.app/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const data = await res.json();
      typing.remove();
      addMessage(data.response, 'bot');

    } catch {
      typing.remove();
      addMessage("Error connecting AI", 'bot');
    }
  }

  function addMessage(content, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerHTML = `<div>${content}</div>`;
    messages.appendChild(div);
    return div;
  }
}

// 🧾 DRAFT MODAL
function openDraft() {
  document.getElementById('draftModal').style.display = 'flex';
}

function closeDraft() {
  document.getElementById('draftModal').style.display = 'none';
}
let currentLang = "en";

function toggleLangMenu() {
  const menu = document.getElementById("langMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

document.querySelector(".lang-btn").addEventListener("click", toggleLangMenu);

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
// 🚀 INIT
document.addEventListener('DOMContentLoaded', function () {
  loadLaws();
  initializeClassifications();
  setupModal();
  initializeChatbot();

  document.getElementById("searchBtn").addEventListener("click", performSearch);

  document.getElementById("searchInput").addEventListener("keypress", function (e) {
    if (e.key === "Enter") performSearch();
  });

  document.querySelectorAll('.filter-tag').forEach(tag => {
    tag.addEventListener('click', function () {
      document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
    });
  });
});
