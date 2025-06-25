let laws = [];

document.addEventListener("DOMContentLoaded", () => {
  const searchBar = document.getElementById("searchBar");
  const resultsDiv = document.getElementById("results");

  // Load laws from JSON file
  fetch("laws.json")
    .then((res) => res.json())
    .then((data) => {
      laws = data;
      displayLaws(laws); // Show all by default
    })
    .catch((err) => {
      resultsDiv.innerHTML = "<p style='color:red;'>⚠️ Failed to load law data.</p>";
    });

  // Search function
  searchBar.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = laws.filter((law) =>
      law.title.toLowerCase().includes(query) ||
      law.description.toLowerCase().includes(query) ||
      (law.id && law.id.toString().includes(query))
    );
    displayLaws(filtered);
  });

  // Display law results
  function displayLaws(list) {
    resultsDiv.innerHTML = "";
    if (list.length === 0) {
      resultsDiv.innerHTML = "<p>No matching law found.</p>";
      return;
    }

    list.forEach((law) => {
      const lawCard = document.createElement("div");
      lawCard.className = "law";
      lawCard.innerHTML = `
        <h2>${law.title}</h2>
        <p>${law.description}</p>
        <a href="${law.pdfUrl}" target="_blank">📄 View Full PDF</a>
      `;
      resultsDiv.appendChild(lawCard);
    });
  }
});
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

sendBtn.addEventListener("click", async () => {
  const question = userInput.value.trim();
  if (!question) return;

  // Display user's message
  const userMsg = document.createElement("div");
  userMsg.textContent = "👤 You: " + question;
  chatMessages.appendChild(userMsg);

  // Clear input
  userInput.value = "";

  // Send to backend (we'll build it next)
  const res = await fetch("https://justicehub-backend.vercel.app/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: question })
  });

  const data = await res.json();

  // Display response
  const botMsg = document.createElement("div");
  botMsg.textContent = "🤖 JusticeBot: " + (data.reply || "Sorry, I couldn't understand that.");
  chatMessages.appendChild(botMsg);

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
// Chamber AI Floating Chat Toggle
document.getElementById("chatbot-icon").addEventListener("click", () => {
  const popup = document.getElementById("chatbot-popup");
  popup.style.display = popup.style.display === "none" ? "flex" : "none";
});

// Chat functionality
document.getElementById("send-btn").addEventListener("click", async () => {
  const input = document.getElementById("user-input");
  const question = input.value.trim();
  if (!question) return;

  const chatBox = document.getElementById("chat-messages");

  const userDiv = document.createElement("div");
  userDiv.textContent = `👤 You: ${question}`;
  chatBox.appendChild(userDiv);
  input.value = "";

  // Call backend API
  const res = await fetch("https://chamber-backend.vercel.app/api/chat", {

, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: question })
  });

  const data = await res.json();

  const botDiv = document.createElement("div");
  botDiv.textContent = `🤖 Chamber AI: ${data.reply || "Sorry, I couldn’t understand that."}`;
  chatBox.appendChild(botDiv);

  chatBox.scrollTop = chatBox.scrollHeight;
});
