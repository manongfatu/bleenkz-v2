// Bleenkz - Space Blink Counter App with MediaPipe
class BlinkCounter {
  constructor() {
    this.blinkCount = 0;
    this.blinksPerSecond = 0;
    this.lastBlinkTime = 0;
    this.blinkTimes = [];
    this.isBlinking = false;
    this.eyeClosedThreshold = 0.2;
    this.eyeOpenThreshold = 0.28;
    this.baselineEAR = 0.3; // Baseline eye aspect ratio when eyes are open
    this.earHistory = []; // Store recent EAR values for dynamic adjustment
    this.faceMesh = null;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.camera = null;
    this.sessionStartTime = Date.now();
    this.detectionConfidence = 0;
    this.isDetecting = false;

    // Crypto token system
    this.tokenAmount = 0.00001;
    this.bitcoinPrice = 0;
    this.previousBitcoinPrice = 0;
    this.priceChangePercent = 0;
    this.lastPriceUpdate = null;

    // Achievement milestones
    this.achievements = [
      { count: 50, title: "First Flight", description: "You've taken your first steps into the cosmos!", icon: "🚀" },
      { count: 100, title: "Orbit Breaker", description: "Breaking through the atmosphere!", icon: "🌌" },
      { count: 200, title: "Star Seeker", description: "Navigating through the stellar void!", icon: "⭐" },
      { count: 500, title: "Galaxy Rider", description: "Riding the cosmic waves!", icon: "🌠" },
      { count: 1000, title: "Master of the Cosmos", description: "You are one with the universe!", icon: "👑" },
    ];

    this.achievedMilestones = new Set();

    // Funny elements
    this.funnyMessages = [
      { icon: "😄", text: "Keep blinking, space cadet!" },
      { icon: "👁️", text: "Your eyes are working overtime!" },
      { icon: "🚀", text: "Blinking at light speed!" },
      { icon: "⭐", text: "You're a blinking superstar!" },
      { icon: "🌌", text: "Navigating the blinkiverse!" },
      { icon: "🤖", text: "AI detected: Human blinking pattern!" },
      { icon: "👽", text: "Are you from another planet?" },
      { icon: "🎯", text: "Bullseye! Perfect blink detected!" },
      { icon: "⚡", text: "Lightning fast blinks!" },
      { icon: "🎪", text: "Welcome to the blink circus!" },
      { icon: "🎭", text: "The blinking performance of a lifetime!" },
      { icon: "🎨", text: "You're painting with blinks!" },
      { icon: "🎵", text: "Blinking to the rhythm of space!" },
      { icon: "🎮", text: "Level up! Blink master!" },
      { icon: "🏆", text: "Champion blinker detected!" },
    ];

    this.lastFunnyMessage = 0;
    this.funnyMessageCooldown = 3000; // 3 seconds

    // Blink pattern tracking
    this.recentBlinkTimes = [];
    this.patternMessages = {
      fast: [
        { icon: "⚡", text: "Lightning blinks! Slow down there, speed demon!" },
        { icon: "🏃", text: "Running a blink marathon?" },
        { icon: "🎯", text: "Rapid fire blinking detected!" },
      ],
      slow: [
        { icon: "🐌", text: "Taking your time with those blinks!" },
        { icon: "🧘", text: "Meditative blinking mode activated!" },
        { icon: "😴", text: "Getting sleepy there?" },
      ],
      pattern: [
        { icon: "🎵", text: "Blinking to the beat!" },
        { icon: "🎪", text: "The rhythm of the blink circus!" },
        { icon: "🎭", text: "A blinking performance!" },
      ],
    };

    this.init();
  }

  async init() {
    this.setupElements();
    await this.setupCamera();
    await this.setupMediaPipe();
    this.setupSpeedometer();
    this.setupControls();
    this.startSessionTimer();
    this.setupCryptoSystem();
    this.updateStatus("Camera ready! Start blinking to begin your cosmic journey.");
  }

  setupElements() {
    this.video = document.getElementById("video");
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");

    // Set canvas size to match video
    this.canvas.width = 640;
    this.canvas.height = 480;
  }

  async setupCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
      });

      this.video.srcObject = stream;
      this.video.play();

      this.updateCameraStatus("Camera connected successfully");
    } catch (error) {
      console.error("Camera access denied:", error);
      this.updateCameraStatus("Camera access denied. Please allow camera access to use the app.");
    }
  }

  async setupMediaPipe() {
    try {
      this.updateCameraStatus("Loading MediaPipe model...");

      this.faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.faceMesh.onResults((results) => {
        this.onResults(results);
      });

      this.camera = new Camera(this.video, {
        onFrame: async () => {
          await this.faceMesh.send({ image: this.video });
        },
        width: 640,
        height: 480,
      });

      this.camera.start();
      this.updateStatus("AI Vision Active", "active");
      this.updateAIStatus("Processing", true);
      // Turn on HUD AI/CAM when ready
      try {
        const hudAI = document.querySelector(".hud-ind.status");
        const hudCAM = document.querySelector(".hud-ind.cam");
        if (hudAI) hudAI.classList.add("on", "pulse");
        if (hudCAM) hudCAM.classList.add("on");
      } catch (e) {}
      console.log("MediaPipe FaceMesh loaded successfully");
    } catch (error) {
      console.error("Failed to load MediaPipe:", error);
      this.updateCameraStatus("Failed to load MediaPipe model. Please refresh the page.");
    }
  }

  onResults(results) {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      this.isDetecting = true;
      this.detectionConfidence = Math.min(100, this.detectionConfidence + 2);

      this.updateAIStatus("Face Detected", true);
      try {
        // Notify listeners that a human/face is detected
        window.dispatchEvent(new CustomEvent("bleenkz:face", { detail: { present: true } }));
      } catch (e) {}
      this.updateDetectionMetrics();

      const leftEye = this.getEyeAspectRatio(landmarks, "left");
      const rightEye = this.getEyeAspectRatio(landmarks, "right");
      const avgEAR = (leftEye + rightEye) / 2;

      // Store EAR history for dynamic threshold adjustment
      this.earHistory.push(avgEAR);
      if (this.earHistory.length > 30) {
        this.earHistory.shift(); // Keep only last 30 values
      }

      // Calculate dynamic thresholds based on recent EAR values
      if (this.earHistory.length >= 8) {
        const sortedEAR = [...this.earHistory].sort((a, b) => a - b);
        // Use 75th percentile as open-eye baseline for better sensitivity
        const p75Index = Math.floor(sortedEAR.length * 0.75);
        const p75EAR = sortedEAR[Math.min(p75Index, sortedEAR.length - 1)];
        this.baselineEAR = p75EAR;

        // More sensitive dynamic thresholds with clear hysteresis
        this.eyeClosedThreshold = this.baselineEAR * 0.72;
        this.eyeOpenThreshold = this.baselineEAR * 0.88;
      }

      // Apply slight smoothing to reduce noise
      const recentWindow = Math.min(3, this.earHistory.length);
      const smoothedEAR = recentWindow > 0 ? this.earHistory.slice(-recentWindow).reduce((a, b) => a + b, 0) / recentWindow : avgEAR;

      // Detect blink with dynamic thresholds (using smoothed EAR)
      if (smoothedEAR < this.eyeClosedThreshold && !this.isBlinking) {
        this.isBlinking = true;
        this.registerBlink();
        console.log("BLINK DETECTED! EAR:", smoothedEAR.toFixed(3), "Threshold:", this.eyeClosedThreshold.toFixed(3));
      } else if (smoothedEAR > this.eyeOpenThreshold && this.isBlinking) {
        this.isBlinking = false;
        console.log("Eyes opened again");
      }
    } else {
      this.isDetecting = false;
      this.detectionConfidence = Math.max(0, this.detectionConfidence - 1);
      this.updateAIStatus("Searching for face...", false);
      this.updateDetectionMetrics();
      try {
        // Notify listeners that no human/face is detected
        window.dispatchEvent(new CustomEvent("bleenkz:face", { detail: { present: false } }));
      } catch (e) {}
    }
  }

  getEyeAspectRatio(landmarks, eye) {
    // Eye landmark indices for MediaPipe FaceMesh - using more precise points
    const eyeIndices = {
      left: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
      right: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
    };

    const indices = eyeIndices[eye];

    try {
      // Use more precise calculation with key eye points
      const p1 = landmarks[indices[1]]; // Top eyelid
      const p2 = landmarks[indices[5]]; // Bottom eyelid
      const p3 = landmarks[indices[0]]; // Left corner
      const p4 = landmarks[indices[8]]; // Right corner

      const eyeWidth = Math.abs(p3.x - p4.x);
      const eyeHeight = Math.abs(p1.y - p2.y);

      if (eyeWidth === 0) return 0.3; // Avoid division by zero

      const ear = eyeHeight / eyeWidth;

      // Debug logging for threshold adjustment
      if (this.blinkCount % 50 === 0) {
        console.log(`${eye} eye EAR: ${ear.toFixed(3)}, Width: ${eyeWidth.toFixed(3)}, Height: ${eyeHeight.toFixed(3)}`);
      }

      return ear;
    } catch (error) {
      console.log("Error calculating EAR:", error);
      return 0.3; // Default value on error
    }
  }

  setupSpeedometer() {
    this.speedometerCanvas = document.getElementById("speedometer");
    this.speedometerCtx = this.speedometerCanvas.getContext("2d");
    this.drawSpeedometer(0);
  }

  setupControls() {
    const testButton = document.getElementById("testBlink");
    testButton.addEventListener("click", () => {
      this.registerBlink();
      console.log("Manual blink registered!");
    });

    const testFaceButton = document.getElementById("testFaceDetection");
    testFaceButton.addEventListener("click", () => {
      if (this.faceMesh && this.video) {
        console.log("MediaPipe FaceMesh is ready");
        console.log("Video element:", this.video);
        console.log("Video ready state:", this.video.readyState);
      } else {
        console.log("MediaPipe or video not ready");
      }
    });

    const resetButton = document.getElementById("resetCounter");
    resetButton.addEventListener("click", () => {
      this.resetCounter();
    });

    // Simulate NET status and battery meter slow drift for HUD
    try {
      const hudNET = document.querySelector(".hud-ind.net");
      const hudBatt = document.getElementById("hudBattery");
      if (hudNET) {
        setInterval(() => {
          // Toggle NET on/off occasionally
          if (Math.random() < 0.25) {
            hudNET.classList.toggle("on");
          }
        }, 5000);
      }
      if (hudBatt) {
        let level = 0.75;
        setInterval(() => {
          level += (Math.random() - 0.5) * 0.04; // gentle drift
          level = Math.max(0.15, Math.min(1, level));
          hudBatt.style.width = Math.round(level * 100) + "%";
        }, 6000);
      }
    } catch (e) {}
  }

  startSessionTimer() {
    setInterval(() => {
      const elapsed = Date.now() - this.sessionStartTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      document.getElementById("sessionTime").textContent = timeString;
    }, 1000);
  }

  updateStatus(message, type = "default") {
    const statusText = document.getElementById("statusText");
    const statusDot = document.getElementById("statusDot");

    statusText.textContent = message;

    if (type === "active") {
      statusDot.classList.add("active");
    } else {
      statusDot.classList.remove("active");
    }
  }

  updateAIStatus(message, isActive) {
    const aiText = document.getElementById("aiText");
    const aiPulse = document.getElementById("aiPulse");

    aiText.textContent = message;

    if (isActive) {
      aiPulse.classList.add("active");
      const hudAI = document.querySelector(".hud-ind.status");
      if (hudAI) hudAI.classList.add("on", "pulse");
    } else {
      aiPulse.classList.remove("active");
      const hudAI = document.querySelector(".hud-ind.status");
      if (hudAI) hudAI.classList.remove("pulse");
    }
  }

  updateDetectionMetrics() {
    const detectionBar = document.getElementById("detectionBar");
    const confidenceBar = document.getElementById("confidenceBar");

    const detectionWidth = this.isDetecting ? 100 : 0;
    const confidenceWidth = this.detectionConfidence;

    detectionBar.style.width = `${detectionWidth}%`;
    confidenceBar.style.width = `${confidenceWidth}%`;
  }

  resetCounter() {
    this.blinkCount = 0;
    this.blinkTimes = [];
    this.blinksPerSecond = 0;
    this.sessionStartTime = Date.now();
    this.achievedMilestones.clear();
    this.tokenAmount = 0.00001;

    this.updateCounter();
    this.drawSpeedometer(0);
    this.updateAchievements();
    this.updateCryptoDisplay();

    console.log("Counter reset!");
  }

  updateAchievements() {
    const achievementItems = document.querySelectorAll(".achievement-item");
    achievementItems.forEach((item) => {
      const milestone = parseInt(item.dataset.milestone);
      if (this.achievedMilestones.has(milestone)) {
        item.classList.add("unlocked");
        item.classList.remove("locked");
      } else {
        item.classList.add("locked");
        item.classList.remove("unlocked");
      }
    });
  }

  drawSpeedometer(blinksPerSecond) {
    const canvas = this.speedometerCanvas;
    const ctx = this.speedometerCtx;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 8;
    ctx.stroke();

    // Draw speed segments
    const maxSpeed = 5; // Maximum blinks per second
    const segments = 10;
    const segmentAngle = (Math.PI * 1.5) / segments; // 270 degrees divided by segments

    for (let i = 0; i <= segments; i++) {
      const angle = Math.PI + i * segmentAngle; // Start from left (180 degrees)
      const x1 = centerX + Math.cos(angle) * (radius - 15);
      const y1 = centerY + Math.sin(angle) * (radius - 15);
      const x2 = centerX + Math.cos(angle) * (radius - 5);
      const y2 = centerY + Math.sin(angle) * (radius - 5);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = i <= (blinksPerSecond / maxSpeed) * segments ? "#ffffff" : "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Draw needle
    const needleAngle = Math.PI + (blinksPerSecond / maxSpeed) * (Math.PI * 1.5);
    const needleLength = radius - 20;
    const needleX = centerX + Math.cos(needleAngle) * needleLength;
    const needleY = centerY + Math.sin(needleAngle) * needleLength;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(needleX, needleY);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Update speed text
    document.getElementById("blinksPerSecond").textContent = blinksPerSecond.toFixed(1);
    document.getElementById("speedValue").textContent = blinksPerSecond.toFixed(1);
  }

  registerBlink() {
    const currentTime = Date.now();
    this.blinkCount++;

    // Add to blink times array
    this.blinkTimes.push(currentTime);

    // Keep only last 5 seconds of blinks
    this.blinkTimes = this.blinkTimes.filter((time) => currentTime - time < 5000);

    // Calculate blinks per second
    this.blinksPerSecond = this.blinkTimes.length / 5;

    // Track recent blink times for pattern analysis
    this.recentBlinkTimes.push(currentTime);
    if (this.recentBlinkTimes.length > 10) {
      this.recentBlinkTimes.shift();
    }

    // Update UI
    this.updateCounter();
    this.drawSpeedometer(this.blinksPerSecond);

    // Check for achievements
    this.checkAchievements();

    // Add visual feedback
    this.animateCounter();

    // Update achievements display
    this.updateAchievements();

    // Update crypto token
    this.updateTokenAmount();

    // Show funny messages
    this.showFunnyMessage();
    this.showPatternMessage();

    // Broadcast a blink event for external UI modules
    try {
      window.dispatchEvent(new CustomEvent("bleenkz:blink", { detail: { timestamp: currentTime } }));
    } catch (e) {}
  }

  updateCounter() {
    const counterElement = document.getElementById("blinkCounter");
    counterElement.textContent = this.blinkCount;
  }

  animateCounter() {
    const counterElement = document.getElementById("blinkCounter");
    counterElement.classList.add("blink");

    setTimeout(() => {
      counterElement.classList.remove("blink");
    }, 300);
  }

  checkAchievements() {
    for (const achievement of this.achievements) {
      if (this.blinkCount === achievement.count && !this.achievedMilestones.has(achievement.count)) {
        this.achievedMilestones.add(achievement.count);
        this.showAchievement(achievement);
        break; // Only show one achievement at a time
      }
    }
  }

  showAchievement(achievement) {
    const notification = document.getElementById("achievementNotification");
    const backdrop = document.getElementById("achievementBackdrop");
    const icon = document.getElementById("notificationIcon");
    const title = document.getElementById("notificationTitle");
    const desc = document.getElementById("notificationDesc");

    icon.textContent = achievement.icon;
    title.textContent = achievement.title;
    desc.textContent = achievement.description;

    // Trigger explosion effects
    this.createExplosionEffects();

    // Show backdrop and notification
    backdrop.classList.add("show");
    setTimeout(() => {
      notification.classList.add("show");
    }, 100);

    // Hide after 5 seconds
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        backdrop.classList.remove("show");
      }, 300);
    }, 5000);
  }

  createExplosionEffects() {
    // Screen flash effect
    const flash = document.getElementById("achievementFlash");
    flash.style.animation = "none";
    flash.offsetHeight; // Trigger reflow
    flash.style.animation = "flashEffect 0.8s ease-out";

    // Create explosion particles
    this.createExplosionParticles();

    // Create confetti
    this.createConfetti();
  }

  createExplosionParticles() {
    const container = document.getElementById("explosionContainer");
    container.innerHTML = ""; // Clear previous particles

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "explosion-particle";

      // Random position around center
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = 50 + Math.random() * 100;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      particle.style.left = x + "px";
      particle.style.top = y + "px";
      particle.style.animationDelay = Math.random() * 0.3 + "s";

      container.appendChild(particle);
    }

    // Remove particles after animation
    setTimeout(() => {
      container.innerHTML = "";
    }, 2000);
  }

  createConfetti() {
    const container = document.getElementById("confettiContainer");
    container.innerHTML = ""; // Clear previous confetti

    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";

      // Random horizontal position
      const x = Math.random() * window.innerWidth;
      confetti.style.left = x + "px";
      confetti.style.animationDelay = Math.random() * 2 + "s";

      container.appendChild(confetti);
    }

    // Remove confetti after animation
    setTimeout(() => {
      container.innerHTML = "";
    }, 5000);
  }

  updateCameraStatus(message) {
    this.updateStatus(message);
  }

  setupCryptoSystem() {
    // Initialize crypto display
    this.updateCryptoDisplay();

    // Fetch initial Bitcoin price
    this.fetchBitcoinPrice();

    // Set up periodic price updates (every 5 seconds)
    setInterval(() => {
      this.fetchBitcoinPrice();
    }, 5000);
  }

  async fetchBitcoinPrice() {
    try {
      // Use a CORS proxy to get real Bitcoin price
      const proxyUrl = "https://api.allorigins.win/raw?url=";
      const targetUrl = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true";

      console.log("🔄 Fetching real Bitcoin price...");
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Raw API response:", data);

      if (data.bitcoin && data.bitcoin.usd) {
        const newPrice = data.bitcoin.usd;
        const newChange = data.bitcoin.usd_24h_change || 0;

        // Only update if we got a valid price
        if (newPrice > 0) {
          this.previousBitcoinPrice = this.bitcoinPrice;
          this.bitcoinPrice = newPrice;
          this.priceChangePercent = newChange;
          this.lastPriceUpdate = new Date();

          console.log("✅ REAL Bitcoin price updated:", {
            price: `$${this.bitcoinPrice.toLocaleString()}`,
            change: `${this.priceChangePercent.toFixed(2)}%`,
            timestamp: this.lastPriceUpdate.toLocaleTimeString(),
          });

          this.updateCryptoDisplay();
          // NET indicator ON (network success)
          try {
            const hudNET = document.querySelector(".hud-ind.net");
            if (hudNET) hudNET.classList.add("on");
          } catch (e) {}
          return;
        }
      }

      throw new Error("Invalid price data received");
    } catch (error) {
      console.error("❌ Failed to fetch real Bitcoin price:", error);

      // Try alternative method with different proxy
      try {
        console.log("🔄 Trying alternative API...");
        const altResponse = await fetch("https://cors-anywhere.herokuapp.com/https://api.coinbase.com/v2/exchange-rates?currency=BTC");

        if (altResponse.ok) {
          const altData = await altResponse.json();
          console.log("📊 Alternative API response:", altData);

          if (altData.data && altData.data.rates && altData.data.rates.USD) {
            const price = parseFloat(altData.data.rates.USD);
            if (price > 0) {
              this.bitcoinPrice = price;
              this.priceChangePercent = 0; // Coinbase doesn't provide 24h change
              this.lastPriceUpdate = new Date();

              console.log("✅ REAL Bitcoin price from Coinbase:", `$${this.bitcoinPrice.toLocaleString()}`);
              this.updateCryptoDisplay();
              // NET indicator ON (network success)
              try {
                const hudNET = document.querySelector(".hud-ind.net");
                if (hudNET) hudNET.classList.add("on");
              } catch (e) {}
              return;
            }
          }
        }
      } catch (altError) {
        console.error("❌ Alternative API also failed:", altError);
      }

      // Final fallback with realistic current Bitcoin price
      const currentBitcoinPrice = 95000; // More realistic current price
      const variation = (Math.random() - 0.5) * 1000; // ±$500 variation
      this.bitcoinPrice = Math.round(currentBitcoinPrice + variation);
      this.priceChangePercent = (Math.random() - 0.5) * 8; // Random change between -4% and +4%
      this.lastPriceUpdate = new Date();

      console.log("🔄 Using realistic fallback Bitcoin price:", `$${this.bitcoinPrice.toLocaleString()}`);
      this.updateCryptoDisplay();
      // NET indicator OFF (no live network)
      try {
        const hudNET = document.querySelector(".hud-ind.net");
        if (hudNET) hudNET.classList.remove("on");
      } catch (e) {}
    }
  }

  updateTokenAmount() {
    // Increase token amount by 0.00001 per blink
    this.tokenAmount += 0.00001;
    this.updateCryptoDisplay();
  }

  updateCryptoDisplay() {
    // Update token amount display
    const tokenAmountElement = document.getElementById("tokenAmount");
    if (tokenAmountElement) {
      tokenAmountElement.textContent = this.tokenAmount.toFixed(5);
    }

    // Calculate and display USD value
    const tokenUsdValue = this.tokenAmount * this.bitcoinPrice;
    const tokenUsdElement = document.getElementById("tokenUsdValue");
    if (tokenUsdElement) {
      tokenUsdElement.textContent = `$${tokenUsdValue.toFixed(2)}`;
    }

    // Update Bitcoin price display
    const bitcoinPriceElement = document.getElementById("bitcoinPrice");
    if (bitcoinPriceElement) {
      bitcoinPriceElement.textContent = `$${this.bitcoinPrice.toLocaleString()}`;
    }

    // Update price change display
    const changeArrowElement = document.getElementById("changeArrow");
    const changeValueElement = document.getElementById("changeValue");
    const priceChangeElement = document.getElementById("priceChange");

    if (changeArrowElement && changeValueElement && priceChangeElement) {
      const changePercent = this.priceChangePercent.toFixed(2);
      changeValueElement.textContent = `${changePercent}%`;

      // Remove existing classes
      priceChangeElement.classList.remove("positive", "negative", "neutral");
      changeArrowElement.classList.remove("up", "down", "neutral");

      if (this.priceChangePercent > 0) {
        priceChangeElement.classList.add("positive");
        changeArrowElement.classList.add("up");
        changeArrowElement.textContent = "↗";
      } else if (this.priceChangePercent < 0) {
        priceChangeElement.classList.add("negative");
        changeArrowElement.classList.add("down");
        changeArrowElement.textContent = "↘";
      } else {
        priceChangeElement.classList.add("neutral");
        changeArrowElement.classList.add("neutral");
        changeArrowElement.textContent = "→";
      }
    }

    // Update last update time
    const lastUpdateElement = document.getElementById("lastUpdate");
    if (lastUpdateElement && this.lastPriceUpdate) {
      const timeString = this.lastPriceUpdate.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
      lastUpdateElement.textContent = timeString;
    }
  }

  showFunnyMessage() {
    const currentTime = Date.now();

    // Check cooldown
    if (currentTime - this.lastFunnyMessage < this.funnyMessageCooldown) {
      return;
    }

    // Random chance to show funny message (30% chance)
    if (Math.random() < 0.3) {
      const fallback = this.funnyMessages[Math.floor(Math.random() * this.funnyMessages.length)];
      const funnyMessage = document.getElementById("funnyMessage");
      const messageIcon = document.getElementById("messageIcon");
      const messageText = document.getElementById("messageText");

      messageIcon.textContent = fallback.icon;
      // Try Ollama; if unavailable, keep fallback
      getSmartFunnyMessage(fallback.text)
        .then((line) => {
          messageText.textContent = line;
        })
        .catch(() => {
          messageText.textContent = fallback.text;
        });

      // Show the message
      funnyMessage.classList.add("show");

      // Hide after 2 seconds
      setTimeout(() => {
        funnyMessage.classList.remove("show");
      }, 2000);

      this.lastFunnyMessage = currentTime;
    }
  }

  showPatternMessage() {
    if (this.recentBlinkTimes.length < 5) return;

    const currentTime = Date.now();
    const recentBlinks = this.recentBlinkTimes.filter((time) => currentTime - time < 3000); // Last 3 seconds

    if (recentBlinks.length < 3) return;

    // Calculate average time between blinks
    const intervals = [];
    for (let i = 1; i < recentBlinks.length; i++) {
      intervals.push(recentBlinks[i] - recentBlinks[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Determine pattern
    let patternType = null;
    if (avgInterval < 500) {
      // Very fast blinking
      patternType = "fast";
    } else if (avgInterval > 2000) {
      // Slow blinking
      patternType = "slow";
    } else if (this.detectRhythmicPattern(intervals)) {
      // Rhythmic pattern
      patternType = "pattern";
    }

    // Show pattern-based message (20% chance)
    if (patternType && Math.random() < 0.2) {
      const messages = this.patternMessages[patternType];
      const message = messages[Math.floor(Math.random() * messages.length)];

      const funnyMessage = document.getElementById("funnyMessage");
      const messageIcon = document.getElementById("messageIcon");
      const messageText = document.getElementById("messageText");

      messageIcon.textContent = message.icon;
      messageText.textContent = message.text;

      // Show the message
      funnyMessage.classList.add("show");

      // Hide after 3 seconds
      setTimeout(() => {
        funnyMessage.classList.remove("show");
      }, 3000);
    }
  }

  detectRhythmicPattern(intervals) {
    if (intervals.length < 3) return false;

    // Check if intervals are relatively consistent (within 20% variation)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.every((interval) => Math.abs(interval - avgInterval) / avgInterval < 0.2);

    return variance;
  }

  // Cleanup method
  destroy() {
    if (this.camera) {
      this.camera.stop();
    }
    if (this.video && this.video.srcObject) {
      const tracks = this.video.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
  }
}

// Initialize the app when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const app = new BlinkCounter();

  // Handle page unload
  window.addEventListener("beforeunload", () => {
    app.destroy();
  });

  // HUD time updater
  const hudTimeEl = document.getElementById("hudTime");
  if (hudTimeEl) {
    const updateHudTime = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      hudTimeEl.textContent = `${hh}:${mm}`;
    };
    updateHudTime();
    setInterval(updateHudTime, 15000);
  }
});

// Static cosmic background - no animations needed

// --- Ollama integration helpers ---
async function generateAIMessage(prompt, model = "llama3.1") {
  try {
    const res = await fetch("/api/ollama", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model }),
    });
    if (!res.ok) {
      try {
        const hudNET = document.querySelector(".hud-ind.net");
        if (hudNET) hudNET.classList.remove("on");
      } catch (e) {}
      throw new Error("Bad response");
    }
    const data = await res.json();
    // NET indicator ON (Ollama success)
    try {
      const hudNET = document.querySelector(".hud-ind.net");
      if (hudNET) hudNET.classList.add("on");
    } catch (e) {}
    if (data && data.response) {
      return String(data.response).trim();
    }
    throw new Error("No response field from Ollama");
  } catch (e) {
    // Fallback generic line
    try {
      const hudNET = document.querySelector(".hud-ind.net");
      if (hudNET) hudNET.classList.remove("on");
    } catch (err) {}
    return null;
  }
}

// Example: enhance funny message generation using Ollama
async function getSmartFunnyMessage(defaultMessage) {
  const prompt = `You are a playful assistant for a blink counter app called Bleenkz.
Generate a very short, fun, positive one-liner (max 10 words) to motivate the user.
Avoid emojis. Keep it family-friendly.`;
  const response = await generateAIMessage(prompt);
  return response || defaultMessage;
}
