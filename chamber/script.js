const SUPABASE_URL = "https://vabqwsoaqpapxsmemaxw.supabase.co";
const SUPABASE_KEY = "sb_publishable_BpzTnxe-unBnSsdfdKUZ0Q__9L1ZZaJ";

let laws = [];

// 🔥 LOAD LAWS FROM DB
async function loadLaws() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/laws`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    laws = await res.json();
    console.log("✅ Laws loaded:", laws);

  } catch (error) {
    console.error("❌ Error loading laws:", error);
  }
}

// 🔍 SEARCH FUNCTION (DB BASED)
async function performSearch() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const activeFilter = document.querySelector('.filter-tag.active')?.dataset.filter || 'all';

  try {
    let url = `${SUPABASE_URL}/rest/v1/laws?select=*`;

    if (query) {
      url += `&or=(title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%)`;
    }

    if (activeFilter !== 'all') {
      url += `&subject=eq.${activeFilter}`;
    }

    url += `&limit=20`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await res.json();
    displayResults(data);

  } catch (err) {
    console.error("❌ Search error:", err);
  }
}

// 📊 DISPLAY SEARCH RESULTS
function displayResults(results) {
  const modal = document.getElementById('resultsModal');
  const modalResults = document.getElementById('modalResults');

  modal.style.display = 'flex';

  modalResults.innerHTML = results.map(law => `
    <div class="result-item">
      <h3>${law.title}</h3>
      <p>${law.description}</p>
      <p>${law.content.substring(0, 200)}...</p>
      <p><strong>Source:</strong> ${law.source}</p>
    </div>
  `).join('');
}

// 🎯 CLASSIFICATION CLICK
function initializeClassifications() {
  const cards = document.querySelectorAll('.classification-card');

  cards.forEach(card => {
    card.addEventListener('click', function () {
      const category = this.dataset.category || this.dataset.type;

      if (category) {
        const filtered = laws.filter(
          law => law.subject === category || law.instrument_type === category
        );
        displayLawList(filtered, category);
      }
    });
  });
}

// 📜 LAW LIST
function displayLawList(lawList, title) {
  const modal = document.getElementById('resultsModal');
  const modalResults = document.getElementById('modalResults');

  modal.style.display = 'flex';

  modalResults.innerHTML = `
    <h2>${title}</h2>
    ${lawList.map(law => `
      <div>
        <h3 onclick="displaySingleLaw('${law.title}')">${law.title}</h3>
      </div>
    `).join('')}
  `;
}

// 📘 SINGLE LAW VIEW
function displaySingleLaw(title) {
  const law = laws.find(l => l.title === title);

  const modal = document.getElementById('resultsModal');
  const modalResults = document.getElementById('modalResults');

  modal.style.display = 'flex';

  modalResults.innerHTML = `
    <h2>${law.title}</h2>
    <p>${law.description}</p>
    <p>${law.content}</p>
    <p><strong>Source:</strong> ${law.source}</p>
  `;
}

// ❌ CLOSE RESULT MODAL
function setupModal() {
  const modal = document.getElementById('resultsModal');

  document.getElementById('modalClose').onclick = () => {
    modal.style.display = 'none';
  };

  window.addEventListener('click', function (e) {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

// 🤖 CHATBOT
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

// 🧾 DRAFT GENERATOR
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

// 📂 DRAFT MODAL CONTROL
function openDraft() {
  document.getElementById("draftModal").style.display = "flex";
}

function closeDraft() {
  document.getElementById("draftModal").style.display = "none";
}

// close draft modal on outside click
document.addEventListener("click", function(e) {
  const modal = document.getElementById("draftModal");
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// 🚀 INIT
document.addEventListener('DOMContentLoaded', function () {
  loadLaws();
  initializeClassifications();
  setupModal();
  initializeChatbot();
});

