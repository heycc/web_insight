document.addEventListener('DOMContentLoaded', () => {
  console.log("Marked.js loaded:", typeof marked !== 'undefined');
  if (typeof marked !== 'undefined') {
    console.log("Marked.js version:", marked.version || "unknown");
  } else {
    console.error("Marked.js not loaded properly!");
  }
});