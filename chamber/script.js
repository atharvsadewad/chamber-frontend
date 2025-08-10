let laws = [];

// Load laws.json when the page loads
fetch('laws.json')
  .then(response => response.json())
  .then(data => {
    laws = data;
  })
  .catch(error => console.error('Error loading laws.json:', error));

// Search function
function searchLaw() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  const filtered = laws.filter(law =>
    law.title.toLowerCase().includes(query) ||
    law.description.toLowerCase().includes(query) ||
    (law.content && law.content.toLowerCase().includes(query))
  );

  if (filtered.length === 0) {
    resultsDiv.innerHTML = '<p>No results found</p>';
    return;
  }

  filtered.forEach(law => {
    const lawDiv = document.createElement('div');
    lawDiv.classList.add('law-item');
    lawDiv.innerHTML = `
      <h3>${law.title}</h3>
      <p><strong>Category:</strong> ${law.category}</p>
      <p>${law.description}</p>
      <details>
        <summary>Read more</summary>
        <p>${law.content}</p>
      </details>
    `;
    resultsDiv.appendChild(lawDiv);
  });
}

function performSearch() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const activeFilter = document.querySelector('.filter-tag.active').dataset.filter;
  let filteredResults = laws;

  if (activeFilter !== 'all') {
    filteredResults = filteredResults.filter(law =>
      law.category === activeFilter || law.type === activeFilter
    );
  }
  if (query) {
    filteredResults = filteredResults.filter(law =>
      law.title.toLowerCase().includes(query) ||
      law.description.toLowerCase().includes(query) ||
      (law.content && law.content.toLowerCase().includes(query))
    );
  }
  displayResults(filteredResults);
}

// Classification cards → show list of laws in that category
function initializeClassifications() {
  const classificationCards = document.querySelectorAll('.classification-card');
  classificationCards.forEach(card => {
    card.addEventListener('click', function() {
      const category = this.dataset.category || this.dataset.type;
      if (category) {
        const filteredResults = laws.filter(law =>
          law.category === category || law.type === category
        );
        displayLawList(filteredResults, category);
      }
    });
  });
}

// Show list of laws for a category
function displayLawList(lawList, category) {
  const modal = document.getElementById('resultsModal');
  const modalResults = document.getElementById('modalResults');

  if (lawList.length > 0) {
    modal.style.display = 'flex';
    modalResults.innerHTML = `
      <h2>${category} Laws</h2>
      <ul style="list-style:none; padding:0;">
        ${lawList.map(law => `
          <li style="padding:8px; cursor:pointer; border-bottom:1px solid #ddd;"
              onclick="displaySingleLaw('${law.title.replace(/'/g, "\\'")}')">
              ${law.title}
          </li>
        `).join('')}
      </ul>
    `;
  } else {
    modal.style.display = 'flex';
    modalResults.innerHTML = `<p>No laws found for ${category}</p>`;
  }
}

// Show single law detail
function displaySingleLaw(title) {
  const law = laws.find(l => l.title === title);
  if (!law) return;

  const modal = document.getElementById('resultsModal');
  const modalResults = document.getElementById('modalResults');
  modal.style.display = 'flex';
  modalResults.innerHTML = `
    <h2>${law.title}</h2>
    <p><strong>Category:</strong> ${law.category}</p>
    <p>${law.description}</p>
    <div>${law.content || ''}</div>
    <button onclick="initializeClassifications()">Back to Categories</button>
  `;
}

// Modal logic
function setupModal() {
  const modal = document.getElementById('resultsModal');
  document.getElementById('modalClose').onclick = function() {
    modal.style.display = 'none';
  };
  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}

function displayResults(results) {
  const modal = document.getElementById('resultsModal');
  const modalResults = document.getElementById('modalResults');
  if (results.length > 0) {
    modal.style.display = 'flex';
    modalResults.innerHTML = results.map(law => `
      <div class="result-item">
        <div class="result-title">${law.title}</div>
        <div class="result-description">${law.description}</div>
        ${law.content ? `<div class="result-content">${law.content.substring(0, 500)}${law.content.length > 500 ? '...' : ''}</div>` : ''}
        <div class="result-tags">
          <span class="result-tag">${law.category}</span>
          <span class="result-tag">${law.type}</span>
        </div>
      </div>
    `).join('');
  } else {
    modal.style.display = 'none';
  }
}

// Chatbot functionality
function initializeChatbot() {
  const chatbotToggle = document.getElementById('chatbotToggle');
  const chatbotWindow = document.getElementById('chatbotWindow');
  const chatbotInput = document.getElementById('chatbotInput');
  const chatbotSend = document.getElementById('chatbotSend');
  const chatbotMessages = document.getElementById('chatbotMessages');

  chatbotToggle.addEventListener('click', function() {
    const isVisible = chatbotWindow.style.display === 'flex';
    chatbotWindow.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
      chatbotInput.focus();
    }
  });

  chatbotSend.addEventListener('click', sendMessage);
  chatbotInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  async function sendMessage() {
    const message = chatbotInput.value.trim();
    if (!message) return;
    addMessage(message, 'user');
    chatbotInput.value = '';
    const typingIndicator = addMessage('Thinking...', 'bot');
    try {
      const response = await fetch('https://chamber-backend1.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message, context: 'legal_research' })
      });
      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();
      typingIndicator.remove();
      addMessage(data.response || 'I apologize, but I encountered an error. Please try again.', 'bot');
    } catch (error) {
      console.error('Chatbot error:', error);
      typingIndicator.remove();
      addMessage('I apologize, but I\'m having trouble connecting right now. Please try again later.', 'bot');
    }
  }

  function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return messageDiv;
  }
}

// Animations on scroll
function setupScrollAnimations() {
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  document.querySelectorAll('.classification-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
  });
}

// Demo questions
const demoQuestions = [
  "What is Article 21 of the Indian Constitution?",
  "Explain the difference between IPC and CrPC",
  "What are the essential elements of a valid contract?",
  "What is the procedure for filing an FIR?",
  "Explain the concept of anticipatory bail"
];

function addDemoQuestions() {
  const chatbotMessages = document.getElementById('chatbotMessages');
  const demoDiv = document.createElement('div');
  demoDiv.className = 'message bot';
  demoDiv.innerHTML = `
    <div class="message-content">
      <div style="margin-bottom: 0.5rem;">Here are some questions you can ask:</div>
      ${demoQuestions.map(q => `
        <div style="margin: 0.3rem 0; padding: 0.3rem 0.6rem; background: #f1f5f9; border-radius: 10px; font-size: 0.8rem; cursor: pointer;" onclick="document.getElementById('chatbotInput').value = '${q}'">
          ${q}
        </div>
      `).join('')}
    </div>
  `;
  chatbotMessages.appendChild(demoDiv);
}

// DOMContentLoaded — Initialize everything safely
document.addEventListener('DOMContentLoaded', function() {
  initializeClassifications();
  setupModal();
  initializeChatbot();
  setupScrollAnimations();
  addDemoQuestions();

  // Search bar enter key
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }
});
