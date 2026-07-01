const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const modelSelect = document.getElementById("model"); // Dropdown reference

// 🔹 Load models from backend automatically
async function loadModels() {
  try {
    const res = await fetch("/api/models");
    const data = await res.json();

    if (data.models && Array.isArray(data.models)) {
      data.models.forEach((model) => {
        const option = document.createElement("option");
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
      }); 
    }
  } catch (err) {
    console.error("Failed to load models:", err);
  }
}

// Handle sending a message
async function sendMessage() {
  const message = userInput.value.trim();
  const selectedModel = modelSelect.value;

  if (!message) return;

  // NEW: Disable button during processing
  sendBtn.disabled = true;
  
  appendMessage(message, "user");
  userInput.value = "";

  //NEW: Show typing indicator instead of "..."
  showTypingIndicator();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: message,
        model: selectedModel,
      }),
    });

    // NEW: Hide typing indicator before showing response
    hideTypingIndicator();

    if (!response.ok) {
      const errorText = await response.text();
      appendMessage(` Error: ${errorText}`, "bot");
      return;
    }

    const data = await response.json();

    if (data.error) {
      appendMessage(` ${data.error}`, "bot");
    } else {
      appendMessage(data.response || "(No response from model)", "bot");
    }

  } catch (err) {
    hideTypingIndicator();
    appendMessage("Cannot reach Ollama backend. Make sure it's running.", "bot");
    console.error("Fetch error:", err);
  } finally {
    // NEW: Re-enable button
    sendBtn.disabled = false;
  }
}

// Append a message bubble
function appendMessage(text, sender) {
  //NEW: Create wrapper for better styling
  const wrapper = document.createElement("div");
  wrapper.classList.add("message-wrapper", sender);

  const messageEl = document.createElement("div");
  messageEl.classList.add("message", sender);
  messageEl.innerText = text;

  // NEW: Add timestamp
  const timestamp = document.createElement("div");
  timestamp.classList.add("message-timestamp");
  timestamp.innerText = getCurrentTime();

  wrapper.appendChild(messageEl);
  wrapper.appendChild(timestamp);
  
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// NEW: Show typing indicator
function showTypingIndicator() {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message-wrapper", "bot");
  wrapper.id = "typing-indicator-wrapper";

  const indicator = document.createElement("div");
  indicator.classList.add("typing-indicator");
  indicator.innerHTML = '<span></span><span></span><span></span>';

  wrapper.appendChild(indicator);
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// NEW: Hide typing indicator
function hideTypingIndicator() {
  const indicator = document.getElementById("typing-indicator-wrapper");
  if (indicator) indicator.remove();
}

// NEW: Get current time
function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

//  Update last bot message
function updateLastBotMessage(text) {
  let last = chatBox.querySelector(".message.bot:last-child");
  if (!last) {
    last = document.createElement("div");
    last.classList.add("message", "bot");
    chatBox.appendChild(last);
  }
  last.innerText = text;
  chatBox.scrollTop = chatBox.scrollHeight;
}

//  Event listeners
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

//  Load models on page start
loadModels();
