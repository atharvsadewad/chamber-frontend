let laws = [];

// Load laws.json
fetch('laws.json')
  .then(response => response.json())
  .then(data => {
    laws = data;
  })
  .catch(error => console.error('Error loading laws.json:', error));

// Search functionality
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

// Display results in modal
function displayResults(results) {
  const modal = document.getElementById('resultsModal');
  const modalResults = document.getElementById('modalResults');

  if (results.length > 0) {
    modal.style.display = 'flex';
    modalResults.innerHTML = results.map(law => `
      <div class="result-item">
        <div class="result-title" data-id="${law.id}">${law.title}</div>
        <div class="result-description">${law.description}</div>
        <div class="result-tags">
          <span class="result-tag">${law.category}</span>
          <span class="result-tag">${law.type}</span>
        </div>
      </div>
    `).join('');
  } else {
    modal.style.display = 'none';
  }

  // Add click event to open full content
  document.querySelectorAll('.result-title').forEach(title => {
    title.addEventListener('click', () => {
      const id = parseInt(title.dataset.id);
      const law = laws.find(l => l.id === id);
      if (law) {
        modalResults.innerHTML = `
          <h2>${law.title}</h2>
          <p><strong>Category:</strong> ${law.category}</p>
          <p>${law.description}</p>
          <pre>${law.content}</pre>
        `;
      }
    });
  });
}

// Setup classification card clicks
function initializeClassifications() {
  const classificationCards = document.querySelectorAll('.classification-card');
  classificationCards.forEach(card => {
    card.addEventListener('click', function () {
      const category = this.dataset.category || this.dataset.type;
      if (category) {
        const filteredResults = laws.filter(law =>
          law.category === category || law.type === category
        );
        displayResults(filteredResults);
      }
    });
  });
}

// Modal close logic
function setupModal() {
  const modal = document.getElementById('resultsModal');
  const closeBtn = document.getElementById('modalClose');

  closeBtn.onclick = function () {
    modal.style.display = 'none';
  };

  window.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}

// Chatbot functionality
function initializeChatbot() {
  const chatbotToggle = document.getElementById('chatbotToggle');
  const chatbotWindow = document.getElementById('chatbotWindow');
  const chatbotInput = document.getElementById('chatbotInput');
  const chatbotSend = document.getElementById('chatbotSend');
  const chatbotMessages = document.getElementById('chatbotMessages');

  chatbotToggle.addEventListener('click', function () {
    const isVisible = chatbotWindow.style.display === 'flex';
    chatbotWindow.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
      chatbotInput.focus();
    }
  });

  chatbotSend.addEventListener('click', sendMessage);
  chatbotInput.addEventListener('keypress', function (e) {
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
      addMessage(data.response || 'I encountered an error. Please try again.', 'bot');
    } catch (error) {
      typingIndicator.remove();
      addMessage('I am having trouble connecting. Please try again later.', 'bot');
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

// Smooth scrolling for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Scroll animations
function setupScrollAnimations() {
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const observer = new IntersectionObserver(function (entries) {
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

// Demo questions in chatbot
const demoQuestions = [
  "What is Article 21 of the Indian Constitution?",
  "Explain the difference between IPC and CrPC",
  "What are the essential elements of a valid contract?"
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

// Initialize all features
document.addEventListener('DOMContentLoaded', function () {
  initializeClassifications();
  setupModal();
  setupScrollAnimations();
  initializeChatbot();
  addDemoQuestions();
});
