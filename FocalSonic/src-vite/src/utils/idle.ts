const idleTime = 1500; 
let timeout;

function setupIdleDetection() {
    // Add event listeners for various user interactions
    document.addEventListener("mousemove", resetTimer);
    document.addEventListener("mousedown", resetTimer);
    document.addEventListener("keypress", resetTimer);
    document.addEventListener("scroll", resetTimer);
    document.addEventListener("touchstart", resetTimer); // For touch devices

    startTimer(); // Initial start of the timer
}

function startTimer() {
    timeout = setTimeout(goInactive, idleTime);
}

function resetTimer() {
    clearTimeout(timeout); // Clear the existing timeout
    goActive(); // Call a function to handle active state (optional)
    startTimer(); // Restart the timer
}

function goInactive() {
    document.body.classList.add("idle");
}

function goActive() {
    document.body.classList.remove("idle");
}

// Call the setup function to begin monitoring
setupIdleDetection();