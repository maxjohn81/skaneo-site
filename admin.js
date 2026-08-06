async function loadStats() {
    try {
        const response = await fetch("/api/stats");
        const data = await response.json();

        document.getElementById("downloads").textContent =
            `${data.downloads} téléchargements`;
    } catch (error) {
        document.getElementById("downloads").textContent =
            "Erreur de chargement";
    }
}

loadStats();

// Actualise toutes les 5 secondes
setInterval(loadStats, 5000);