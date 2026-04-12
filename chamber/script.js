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

// 🔍 UNIVERSAL SEARCH (IMPROVED — relevance scoring + filter support)
async function performSearch() {
  const input = document.getElementById('searchInput').value.trim().toLowerCase();

  if (!input) {
    alert('Please enter a search term.');
    return;
  }

  // Build base URL
  let url = `${SUPABASE_URL}/rest/v1/laws?select=*`;

  // Apply active filter tag (category filter)
  const activeFilter = document.querySelector('.filter-tag.active');
  const filterValue = activeFilter ? activeFilter.dataset.filter : 'all';
  if (filterValue && filterValue !== 'all') {
    url += `&category=eq.${filterValue}`;
  }

  // Apply search terms
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

  // Client-side relevance scoring for best-match ordering
  const scored = data.map(law => {
    let score = 0;
    const t = (law.title || '').toLowerCase();
    const d = (law.description || '').toLowerCase();
    const s = (law.section || '').toLowerCase();
    const c = (law.content || '').toLowerCase();

    if (s === input) score += 100;           // exact section match
    else if (s.startsWith(input)) score += 80;
    if (t === input) score += 90;            // exact title match
    else if (t.includes(input)) score += 60;
    if (d.includes(input)) score += 40;
    if (c.includes(input)) score += 20;

    return { ...law, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);

  displayResults(scored);
}

// 📊 DISPLAY RESULTS (with no-results message)
function displayResults(results) {
  const modal = document.getElementById('resultsModal');
  const modalResults = document.getElementById('modalResults');

  modal.style.display = 'flex';

  if (!results || results.length === 0) {
    modalResults.innerHTML = `
      <div style="text-align:center; padding:2rem; color:#718096;">
        <i class="fas fa-search" style="font-size:2rem; margin-bottom:1rem; display:block;"></i>
        <h3>No results found</h3>
        <p>Try a different search term or category.</p>
      </div>
    `;
    return;
  }

  // If results already have relevance scores, keep that order; otherwise sort numerically
  if (!results[0]._score) {
    results.sort((a, b) => {
      const aNum = parseInt(a.section) || 0;
      const bNum = parseInt(b.section) || 0;
      return aNum - bNum;
    });
  }

  modalResults.innerHTML = results.map((law, index) => `
    <div class="result-item" onclick="displaySingleLaw(${index})">
      <h3 class="result-title">${law.title}</h3>
      <p class="result-description">${law.description}</p>
    </div>
  `).join('');

  window.currentResults = results;
}

// 📘 SINGLE LAW VIEW (BACK FIXED)
function displaySingleLaw(index) {
  const law = window.currentResults[index];

  const modalResults = document.getElementById('modalResults');

  modalResults.innerHTML = `
    <button onclick="displayResults(window.currentResults)" style="margin-bottom:10px;">⬅ Back</button>

    <h2>${law.title}</h2>
    <p>${law.description}</p>

    <div style="margin-top:15px;">
      ${formatContent(law.content)}
    </div>

    <p style="margin-top:15px;"><strong>Source:</strong> ${law.source}</p>
  `;
}

// 🧠 FORMAT CONTENT (NO CHANGE)
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

// 🎯 CLASSIFICATION CLICK (FIXED — filters by category/type)
 function initializeClassifications() {
  const cards = document.querySelectorAll('.classification-card');

  cards.forEach(card => {
    card.addEventListener('click', async function () {

      // ✅ RESET OLD RESULTS
      window.currentResults = [];

      // ✅ GET SUBJECT (IMPORTANT — NOT category confusion)
      const subject = this.dataset.subject;

      let url = `${SUPABASE_URL}/rest/v1/laws?select=*`;

      // ✅ FILTER USING SUBJECT
      if (subject && subject !== "all") {
        url += `&subject=eq.${subject.toLowerCase()}`;
      }

      try {
        const res = await fetch(url, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        });

        const data = await res.json();

        // ✅ SHOW RESULTS
        displayResults(data);

      } catch (err) {
        console.error("Error fetching classification:", err);
      }

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

// 🧾 DRAFT MODAL OPEN/CLOSE
function openDraft() {
  document.getElementById('draftModal').style.display = 'flex';
}

function closeDraft() {
  document.getElementById('draftModal').style.display = 'none';
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

// 🚀 INIT
document.addEventListener('DOMContentLoaded', function () {
  loadLaws();
  initializeClassifications();
  setupModal();
  initializeChatbot();

  // ✅ SEARCH BUTTON + ENTER KEY
  document.getElementById("searchBtn").addEventListener("click", performSearch);

  document.getElementById("searchInput").addEventListener("keypress", function (e) {
    if (e.key === "Enter") performSearch();
  });

  // ✅ FILTER TAG CLICK
  document.querySelectorAll('.filter-tag').forEach(tag => {
    tag.addEventListener('click', function () {
      document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
    });
  });
});
