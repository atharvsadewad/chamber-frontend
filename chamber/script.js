const SUPABASE_URL = "https://vabqwsoaqpapxsmemaxw.supabase.co";
const SUPABASE_KEY = "sb_publishable_BpzTnxe-unBnSsdfdKUZ0Q__9L1ZZaJ";

let laws = [];

// 🔥 LOAD LAWS (FOR CLASSIFICATION ONLY)
async function loadLaws() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/laws?select=*`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  laws = await res.json();
}

// 🔍 SEARCH (FULL FIXED)
async function performSearch() {
  const query = document.getElementById('searchInput').value;

  let url = `${SUPABASE_URL}/rest/v1/laws?select=*`;

  if (query) {
    url += `&or=(title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%,section.ilike.%${query}%)`;
  }

  url += `&order=section.asc`;

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  const data = await res.json();
  displayResults(data);
}

// 📊 DISPLAY RESULTS (CLICKABLE)
function displayResults(results) {
  const modal = document.getElementById('resultsModal');
  const modalResults = document.getElementById('modalResults');

  modal.style.display = 'flex';

  modalResults.innerHTML = results.map((law, index) => `
    <div class="result-item" onclick="displaySingleLaw(${index})">
      <h3 class="result-title">${law.title}</h3>
      <p class="result-description">${law.description}</p>
    </div>
  `).join('');

  // store results temporarily
  window.currentResults = results;
}

// 📘 SINGLE LAW VIEW (FIXED + FORMATTED)
function displaySingleLaw(index) {
  const law = window.currentResults[index];

  const modalResults = document.getElementById('modalResults');

  modalResults.innerHTML = `
    <button onclick="performSearch()" style="margin-bottom:10px;">⬅ Back</button>

    <h2>${law.title}</h2>
    <p>${law.description}</p>

    <div style="margin-top:15px;">
      ${formatContent(law.content)}
    </div>

    <p style="margin-top:15px;"><strong>Source:</strong> ${law.source}</p>
  `;
}

// 🧠 FORMAT LEGAL CONTENT
function formatContent(content) {
  if (!content) return "";

  return content
    .split(/(?=\(\d+\))/) // split (1)(2)(3)
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

// 🎯 CLASSIFICATION (FIXED)
function initializeClassifications() {
  const cards = document.querySelectorAll('.classification-card');

  cards.forEach(card => {
    card.addEventListener('click', async function () {
      const category = this.dataset.category;

      let url = `${SUPABASE_URL}/rest/v1/laws?select=*`;

      if (category) {
        url += `&subject=eq.${category}`;
      }

      url += `&order=section.asc`;

      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });

      const data = await res.json();
      displayResults(data);
    });
  });
}

// ❌ MODAL CLOSE
function setupModal() {
  const modal = document.getElementById('resultsModal');

  document.getElementById('modalClose').onclick = () => {
    modal.style.display = 'none';
  };

  window.onclick = function (e) {
    if (e.target === modal) {
      modal.style.display = 'none';
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

// 🧾 DRAFT
async function generateDraft() {
  const type = document.getElementById("draftType").value;
  const input = document.getElementById("draftInput").value;

  if (!input) return alert("Enter details");

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
  document.getElementById("draftResult").innerText = data.response;
}

// 🚀 INIT
document.addEventListener('DOMContentLoaded', function () {
  loadLaws();
  initializeClassifications();
  setupModal();
  initializeChatbot();
});
