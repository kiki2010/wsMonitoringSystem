const toggles = document.querySelectorAll(".toggle-details");

toggles.forEach(btn => {
    btn.addEventListener("click", () => {
        const details = btn.closest(".weatherStation").querySelector(".station-details");
        details.style.display = details.style.display === "block" ? "none" : "block";
        btn.textContent = details.style.display === "block" ? "Detalles ▴" : "Detalles ▾";
    });
});