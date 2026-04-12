const SUPABASE_URL = "https://vabqwsoaqpapxsmemaxw.supabase.co";
const SUPABASE_KEY = "sb_publishable_BpzTnxe-unBnSsdfdKUZ0Q__9L1ZZaJ";

let laws = [];

// 🔥 LOAD LAWS FROM SUPABASE
async function loadLaws() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/laws`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await res.json();
    laws = data;
    console.log("✅ Laws loaded:", laws);

  } catch (error) {
    console.error("❌ Error loading laws:", error);
  }
}

// 🔍 SEARCH FUNCTION
async function performSearch() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const activeFilter = document.querySelector('.filter-tag.active').dataset.filter;

  try {
    let url = `${SUPABASE_URL}/rest/v1/laws?select=*`;

    // 🔍 search condition
    if (query) {
      url += `&or=(title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%)`;
    }

    // 🎯 filter condition
    if (activeFilter !== 'all') {
      url += `&subject=eq.${activeFilter}`;
    }

  // ⚡ LIMIT (ADD HERE)
    url += `&limit=20`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await res.json();

    console.log("🔍 Search Results:", data);

    displayResults(data);

  } catch (err) {
    console.error("❌ Search error:", err);
  }
}

// 🎯 CLASSIFICATION CLICK
function initializeClassifications() {
  const classificationCards = document.querySelectorAll('.classification-card');

  classificationCards.forEach(card => {
    card.addEventListener('click', function () {
      const category = this.dataset.category || this.dataset.type;

      if (category) {
        const subcategories = [
          ...new Set(
            laws
              .filter(law => law.subject === category)
              .map(law => law.subcategory)
          )
        ];

        if (subcategories.length > 0) {
          displaySubcategoryList(subcategories, category);
        } else {
          const filteredResults = laws.filter(
            law => law.subject === category || law.instrument_type === category
          );
          displayLawList(filteredResults, category);
        }
      }
    });
  });
}

// 📂 SUBCATEGORY LIST
function displaySubcategoryList(subcategories, category) {
  const modal = document.getElementById('resultsModal');
  const modalResults = document.getElementById('modalResults');

  modal.style.display = 'flex';

  modalResults.innerHTML = `
    <h2>${category} Laws</h2>
    <ul style="list-style:none;">
      ${subcategories.map(subcat => `
        <li onclick="displayLawsForSubcategory('${subcat}', '${category}')">
          ${subcat}
        </li>
      `).join('')}
    </ul>
  `;
}

// 📄 LAWS BY SUBCATEGORY
function displayLawsForSubcategory(subcategory, category) {
  const filteredResults = laws.filter(
    law => law.subcategory === subcategory && law.subject === category
  );

  displayLawList(filteredResults, subcategory);
}

// 📜 LAW LIST
function displayLawList(lawList, headerTitle) {
  const modal = document.getElementById('resultsModal');
  const modalResults = document.getElementById('modalResults');

  modal.style.display = 'flex';

  modalResults.innerHTML = `
    <h2>${headerTitle}</h2>
    ${lawList.map(law => `
      <div>
        <h3 onclick="displaySingleLaw('${law.title}')">${law.title}</h3>
      </div>
    `).join('')}
  `;
}

// 📘 SINGLE LAW
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

// ❌ MODAL CLOSE
function setupModal() {
  const modal = document.getElementById('resultsModal');

  document.getElementById('modalClose').onclick = () => {
    modal.style.display = 'none';
  };

  window.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}

// 📊 DISPLAY RESULTS
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

// 🤖 CHATBOT (UNCHANGED)
function initializeChatbot() {
  const chatbotToggle = document.getElementById('chatbotToggle');
  const chatbotWindow = document.getElementById('chatbotWindow');
  const chatbotInput = document.getElementById('chatbotInput');
  const chatbotSend = document.getElementById('chatbotSend');
  const chatbotMessages = document.getElementById('chatbotMessages');

  chatbotToggle.addEventListener('click', () => {
    chatbotWindow.style.display =
      chatbotWindow.style.display === 'flex' ? 'none' : 'flex';
  });

  chatbotSend.addEventListener('click', sendMessage);

  async function sendMessage() {
    const message = chatbotInput.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    chatbotInput.value = '';

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
    chatbotMessages.appendChild(div);
    return div;
  }
}

// 🚀 INIT
document.addEventListener('DOMContentLoaded', function () {
  loadLaws(); // 🔥 important
  initializeClassifications();
  setupModal();
  initializeChatbot();
});
