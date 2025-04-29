// DOM Elements
const newChatBtn = document.querySelector(".new-chat-btn");
const messageInput = document.querySelector(".message-input");
const sendBtn = document.querySelector(".send-btn");
const chatMessages = document.querySelector(".chat-messages");
const threadsList = document.querySelector(".threads-list");
const tabs = document.querySelectorAll(".tab");
const tabPanes = document.querySelectorAll(".tab-pane");
const contentPanes = document.querySelectorAll(".content-pane");

// Video Generation Elements
const uploadArea = document.querySelector(".upload-area");
const quantityInput = document.querySelector(".quantity-input input");
const quantityBtns = document.querySelectorAll(".quantity-btn");
const modelOptions = document.querySelectorAll(".model-option");

// Model Selector Elements
const modelSelector = document.querySelector(".model-selector-container");
const modelSelectBtn = document.querySelector(".model-select-btn");
const modelDropdown = document.querySelector(".model-dropdown");

// User Menu Elements
const userMenuContainer = document.querySelector(".user-menu-container");
const userMenuBtn = document.querySelector(".user-menu-btn");
const userDropdown = document.querySelector(".user-dropdown");
const userDropdownItems = document.querySelectorAll(".user-dropdown-item");

// State
let currentThread = null;
let threads = [];
let currentModel = "gpt4";

// Initialize
function init() {
  loadThreads();
  setupEventListeners();
  setupTabListeners();
  setupVideoGenerationListeners();
  setupModelSelector();
  setupUserMenu();
}

// Tab Management
function setupTabListeners() {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs, tab panes, and content panes
      tabs.forEach((t) => t.classList.remove("active"));
      tabPanes.forEach((pane) => pane.classList.remove("active"));
      contentPanes.forEach((pane) => pane.classList.remove("active"));

      // Add active class to clicked tab and corresponding panes
      tab.classList.add("active");
      const tabId = tab.getAttribute("data-tab");
      document.getElementById(`${tabId}-tab`).classList.add("active");
      document.getElementById(`${tabId}-content`).classList.add("active");

      // Hide all content panes first
      contentPanes.forEach((pane) => {
        pane.style.display = "none";
      });

      // Show only the active content pane
      const activeContent = document.getElementById(`${tabId}-content`);
      if (activeContent) {
        activeContent.style.display = "flex";
      }
    });
  });
}

// Event Listeners
function setupEventListeners() {
  newChatBtn.addEventListener("click", createNewThread);
  sendBtn.addEventListener("click", sendMessage);

  // Handle Enter key and auto-resize
  messageInput.addEventListener("input", autoResize);
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// Auto-resize textarea
function autoResize() {
  const textarea = messageInput;
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

// Thread Management
function createNewThread() {
  const thread = {
    id: Date.now(),
    title: "New Chat",
    messages: [],
    timestamp: new Date(),
  };

  threads.unshift(thread); // Add new thread to the beginning
  currentThread = thread;
  saveThreads();
  renderThreads();
  renderMessages();
  messageInput.focus();
}

function loadThreads() {
  const savedThreads = localStorage.getItem("chatThreads");
  if (savedThreads) {
    threads = JSON.parse(savedThreads);
    if (threads.length > 0) {
      currentThread = threads[0];
    }
  }
  renderThreads();
  renderMessages();
}

function saveThreads() {
  localStorage.setItem("chatThreads", JSON.stringify(threads));
}

// Rendering
function renderThreads() {
  threadsList.innerHTML = "";
  threads.forEach((thread) => {
    const threadElement = document.createElement("div");
    threadElement.className = `thread-item ${
      thread.id === currentThread?.id ? "active" : ""
    }`;

    // Create thread content
    const icon = document.createElement("span");
    icon.className = "thread-icon";
    icon.textContent = "💭";

    const title = document.createElement("span");
    title.className = "thread-title";
    title.contentEditable = true;
    title.textContent =
      thread.messages.length > 0
        ? thread.messages[0].content.slice(0, 30) +
          (thread.messages[0].content.length > 30 ? "..." : "")
        : "New Chat";

    // Add event listeners for title editing
    title.addEventListener("focus", () => {
      threadElement.classList.add("editing");
    });

    title.addEventListener("blur", () => {
      threadElement.classList.remove("editing");
      const newTitle = title.textContent.trim();
      if (newTitle && newTitle !== thread.title) {
        thread.title = newTitle;
        saveThreads();
      }
    });

    title.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        title.blur();
      }
    });

    const actionsContainer = document.createElement("div");
    actionsContainer.className = "thread-actions";

    const actionBtn = document.createElement("button");
    actionBtn.className = "thread-action-btn";
    actionBtn.textContent = "...";

    const dropdown = document.createElement("div");
    dropdown.className = "thread-dropdown";

    const renameOption = document.createElement("div");
    renameOption.className = "thread-dropdown-item rename";
    renameOption.innerHTML =
      '<span class="item-icon">✏️</span><span class="item-text">Rename</span>';
    renameOption.addEventListener("click", (e) => {
      e.stopPropagation();
      title.focus();
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(title);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });

    const deleteOption = document.createElement("div");
    deleteOption.className = "thread-dropdown-item delete";
    deleteOption.innerHTML =
      '<span class="item-icon">🗑️</span><span class="item-text">Delete</span>';
    deleteOption.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteThread(thread.id);
    });

    dropdown.appendChild(renameOption);
    dropdown.appendChild(deleteOption);
    actionsContainer.appendChild(actionBtn);
    actionsContainer.appendChild(dropdown);

    // Add click event for thread selection
    threadElement.addEventListener("click", (e) => {
      if (
        !e.target.closest(".thread-actions") &&
        !e.target.closest(".thread-title")
      ) {
        currentThread = thread;
        renderThreads();
        renderMessages();
      }
    });

    // Add click event for action button
    actionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Close other dropdowns
      document.querySelectorAll(".thread-actions").forEach((container) => {
        if (container !== actionsContainer) {
          container.classList.remove("active");
        }
      });
      actionsContainer.classList.toggle("active");

      // Position the dropdown based on available space
      const dropdown = actionsContainer.querySelector(".thread-dropdown");
      const buttonRect = actionBtn.getBoundingClientRect();
      const dropdownRect = dropdown.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Check if there's enough space below the button
      const spaceBelow = windowHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      if (
        spaceBelow < dropdownRect.height &&
        spaceAbove > dropdownRect.height
      ) {
        // Not enough space below, but enough space above
        dropdown.style.top = "auto";
        dropdown.style.bottom = "100%";
        dropdown.style.marginTop = "0";
        dropdown.style.marginBottom = "0.25rem";
      } else {
        // Default position (below the button)
        dropdown.style.top = "100%";
        dropdown.style.bottom = "auto";
        dropdown.style.marginTop = "0.25rem";
        dropdown.style.marginBottom = "0";
      }
    });

    threadElement.appendChild(icon);
    threadElement.appendChild(title);
    threadElement.appendChild(actionsContainer);

    threadsList.appendChild(threadElement);
  });
}

// Close dropdowns when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".thread-actions")) {
    document.querySelectorAll(".thread-actions").forEach((container) => {
      container.classList.remove("active");
    });
  }
});

function deleteThread(threadId) {
  threads = threads.filter((thread) => thread.id !== threadId);
  if (currentThread?.id === threadId) {
    currentThread = threads[0] || null;
  }
  saveThreads();
  renderThreads();
  renderMessages();
}

function renderMessages() {
  chatMessages.innerHTML = "";
  if (!currentThread) return;

  currentThread.messages.forEach((message) => {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${message.role}-message`;
    messageElement.textContent = message.content;
    chatMessages.appendChild(messageElement);
  });

  // Scroll to bottom with smooth animation
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: "smooth",
  });
}

// Message Handling
function sendMessage() {
  const content = messageInput.value.trim();
  if (!content || !currentThread) return;

  // Add user message
  currentThread.messages.push({
    role: "user",
    content: content,
    model: currentModel,
    timestamp: new Date(),
  });

  // Update thread title if it's the first message
  if (currentThread.messages.length === 1) {
    renderThreads();
  }

  // Clear and reset input
  messageInput.value = "";
  messageInput.style.height = "auto";

  // Save and render
  saveThreads();
  renderMessages();

  // Focus input after sending
  messageInput.focus();

  // Simulate assistant response
  setTimeout(() => {
    currentThread.messages.push({
      role: "assistant",
      content: `[${currentModel.toUpperCase()}] This is a simulated response. In a real implementation, this would be an API call to the selected model.`,
      model: currentModel,
      timestamp: new Date(),
    });
    saveThreads();
    renderMessages();
    renderThreads(); // Update thread title if needed
  }, 1000);
}

// Video Generation Handlers
function setupVideoGenerationListeners() {
  // Model selection
  const modelOptions = document.querySelectorAll(".model-option");
  const referenceUpload = document.querySelector(".reference-upload");
  const promptInput = document.querySelector(".video-prompt-input");

  modelOptions.forEach((option) => {
    option.addEventListener("click", () => {
      // Remove active class from all options
      modelOptions.forEach((opt) => opt.classList.remove("active"));
      // Add active class to clicked option
      option.classList.add("active");

      // Show/hide upload area based on selected model
      if (option.getAttribute("data-model") === "t2v") {
        referenceUpload.classList.add("hidden");
        promptInput.style.height = "100%";
      } else {
        referenceUpload.classList.remove("hidden");
        promptInput.style.height = "auto";
      }
    });
  });

  // Quantity control
  const quantityBtns = document.querySelectorAll(".quantity-btn");
  const quantityInput = document.querySelector(".quantity-input input");

  quantityBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const currentValue = parseInt(quantityInput.value);
      if (btn.classList.contains("minus") && currentValue > 1) {
        quantityInput.value = currentValue - 1;
      } else if (btn.classList.contains("plus") && currentValue < 4) {
        quantityInput.value = currentValue + 1;
      }
    });
  });

  // File upload
  if (uploadArea) {
    uploadArea.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          handleFileUpload(file);
        }
      };
      input.click();
    });

    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "#10a37f";
    });

    uploadArea.addEventListener("dragleave", () => {
      uploadArea.style.borderColor = "#444";
    });

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "#444";
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    });
  }
}

function handleFileUpload(file) {
  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const uploadArea = document.querySelector(".upload-area");
      uploadArea.innerHTML = `<img src="${e.target.result}" alt="Reference" style="max-width: 100%; max-height: 300px; border-radius: 4px;">`;
    };
    reader.readAsDataURL(file);
  } else {
    alert("Please upload an image file");
  }
}

// Model Selector
function setupModelSelector() {
  // Toggle dropdown
  modelSelectBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    modelSelector.classList.toggle("active");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", () => {
    modelSelector.classList.remove("active");
  });

  // Prevent dropdown from closing when clicking inside
  modelDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Model selection
  modelOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const model = option.getAttribute("data-model");
      const modelName = option.querySelector(".model-name").textContent;
      const modelIcon = option.querySelector(".model-icon").textContent;

      currentModel = model;
      modelSelectBtn.querySelector(".selected-model").textContent = modelName;
      modelSelectBtn.querySelector(".model-icon").textContent = modelIcon;
      modelSelector.classList.remove("active");
    });
  });
}

// User Menu
function setupUserMenu() {
  // Toggle dropdown
  userMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    // Close model dropdown if open
    modelSelector.classList.remove("active");
    // Toggle user menu
    userMenuContainer.classList.toggle("active");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", () => {
    userMenuContainer.classList.remove("active");
  });

  // Prevent dropdown from closing when clicking inside
  userDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Handle menu items
  userDropdownItems.forEach((item) => {
    item.addEventListener("click", () => {
      const action = item.querySelector(".item-text").textContent.toLowerCase();
      handleUserMenuAction(action);
      userMenuContainer.classList.remove("active");
    });
  });
}

function handleUserMenuAction(action) {
  switch (action) {
    case "settings":
      console.log("Opening settings...");
      // Add settings functionality here
      break;
    case "log out":
      console.log("Logging out...");
      // Add logout functionality here
      break;
  }
}

// Initialize the app
init();
