let lawsData = [];

document.addEventListener('DOMContentLoaded', async function() {
    await fetchLawsData();
    initializeSearch();
    initializeClassifications();
    initializeChatbot();
    setupModal();
    setupScrollAnimations();
    setTimeout(addDemoQuestions, 1000);
});

async function fetchLawsData() {
    try {
        const response = await fetch('laws.json');  
        lawsData = await response.json();
    } catch (e) {
        // fallback in case of error
        lawsData = [];
        alert("Failed to load legal data.");
    }
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const filterTags = document.querySelectorAll('.filter-tag');
    searchInput.addEventListener('input', performSearch);
    filterTags.forEach(tag => {
        tag.addEventListener('click', function() {
            filterTags.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            performSearch();
        });
    });
}

function performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const activeFilter = document.querySelector('.filter-tag.active').dataset.filter;
    let filteredResults = lawsData;
    // Apply category filter
    if (activeFilter !== 'all') {
        filteredResults = filteredResults.filter(law =>
            law.category === activeFilter || law.type === activeFilter
        );
    }
    // Apply search query
    if (query) {
        filteredResults = filteredResults.filter(law =>
            law.title.toLowerCase().includes(query) ||
            law.description.toLowerCase().includes(query) ||
            (law.content && law.content.toLowerCase().includes(query))
        );
    }
    displayResults(filteredResults);
}

// Classification cards functionality
function initializeClassifications() {
    const classificationCards = document.querySelectorAll('.classification-card');
    classificationCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.dataset.category || this.dataset.type;
            if (category) {
                const filteredResults = lawsData.filter(law =>
                    law.category === category || law.type === category
                );
                displayResults(filteredResults);
            }
        });
    });
}

// Modal logic for showing results
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

// Chatbot functionality (unchanged except to remove resultsSection scroll)
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
            // Replace with your actual API endpoint
        const response = await fetch('https://chamber-backend1.vercel.app/api/chat', {
  
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
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

// Smooth scrolling for internal links (if any)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Add subtle animations on scroll
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

// Add some demo legal questions for better UX
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
window.addEventListener('scroll', () => {
  const banner = document.getElementById('chamberAIBanner');
  if (window.scrollY > 50) {
    banner.style.opacity = '0';
  } else {
    banner.style.opacity = '1';
  }
});
