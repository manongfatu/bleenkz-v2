// UI Module for Blink Reminder and Human Status
// - Listens to custom events emitted by detection logic in script.js
// - Shows a floating "Remember to blink!" reminder if no blink within a timeout
// - Shows a top-right status: "Human detected" or "No human detected"

(function () {
  // --- Configuration ---
  // Blink timeout in milliseconds before showing the reminder.
  // To tweak the reminder duration, change this value.
  const BLINK_TIMEOUT_MS = 10000; // 10 seconds

  // The reminder text. Change this to customize the message.
  const REMINDER_TEXT = "Remember to blink!";

  // --- Internal state ---
  let lastBlinkAt = Date.now();
  let facePresent = false;
  let reminderVisible = false;

  // --- Elements ---
  const reminderEl = createReminder();
  const humanStatusEl = createHumanStatus();

  function createReminder() {
    const el = document.createElement("div");
    el.className = "blink-reminder";
    el.setAttribute("aria-live", "polite");
    el.textContent = REMINDER_TEXT; // To change the text, edit REMINDER_TEXT above
    document.body.appendChild(el);
    return el;
  }

  function createHumanStatus() {
    const container = document.createElement("div");
    container.className = "human-status"; // To change style, edit .human-status in style.css

    const dot = document.createElement("span");
    dot.className = "human-status-dot";

    const text = document.createElement("span");
    text.className = "human-status-text";
    text.textContent = "Initializing...";

    container.appendChild(dot);
    container.appendChild(text);
    document.body.appendChild(container);
    return container;
  }

  // Update the top-right status UI
  function renderHumanStatus() {
    const dot = humanStatusEl.querySelector(".human-status-dot");
    const text = humanStatusEl.querySelector(".human-status-text");
    if (facePresent) {
      humanStatusEl.classList.add("on");
      text.textContent = "Human detected";
    } else {
      humanStatusEl.classList.remove("on");
      text.textContent = "No human detected";
    }
  }

  // Show the reminder with a soft fade-in
  function showReminder() {
    if (reminderVisible) return;
    reminderVisible = true;
    reminderEl.classList.add("show");
  }

  // Hide the reminder immediately on next blink
  function hideReminder() {
    if (!reminderVisible) return;
    reminderVisible = false;
    reminderEl.classList.remove("show");
  }

  // --- Event wiring ---
  window.addEventListener("bleenkz:blink", (ev) => {
    lastBlinkAt = (ev && ev.detail && ev.detail.timestamp) || Date.now();
    hideReminder();
  });

  window.addEventListener("bleenkz:face", (ev) => {
    const present = !!(ev && ev.detail && ev.detail.present);
    facePresent = present;
  });

  // --- Animation loop ---
  function tick() {
    const now = Date.now();
    const elapsed = now - lastBlinkAt;

    // Only remind when a face is present; otherwise, don't nag.
    if (facePresent && elapsed >= BLINK_TIMEOUT_MS) {
      showReminder();
    }

    renderHumanStatus();
    requestAnimationFrame(tick);
  }

  // Kick off loop
  requestAnimationFrame(tick);
})();
