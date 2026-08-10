async function loadStats() {
    const downloadsEl = document.getElementById("downloads");
    const visitsEl = document.getElementById("visits");
    const btn = document.getElementById("refreshBtn");
    const updatedEl = document.getElementById("lastUpdated");

    btn?.classList.add("loading");
    btn?.setAttribute("disabled", "true");

    try {
        const response = await fetch("/api/stats");

        if (!response.ok) {
            throw new Error(`Erreur serveur (${response.status})`);
        }

        const data = await response.json();
        const nf = new Intl.NumberFormat("fr-FR");

        downloadsEl.textContent = nf.format(data.downloads);
        visitsEl.textContent = nf.format(data.visits);
        downloadsEl.classList.remove("stat-error");
        visitsEl.classList.remove("stat-error");

        if (updatedEl) {
            updatedEl.textContent =
                "Dernière mise à jour à " + new Date().toLocaleTimeString("fr-FR");
        }
    } catch (error) {
        downloadsEl.textContent = "—";
        visitsEl.textContent = "—";
        downloadsEl.classList.add("stat-error");
        visitsEl.classList.add("stat-error");

        if (updatedEl) {
            updatedEl.textContent = "Erreur de chargement";
        }

        console.error("Erreur lors du chargement des stats :", error);
    } finally {
        btn?.classList.remove("loading");
        btn?.removeAttribute("disabled");
    }
}

loadStats();

// Actualise toutes les 5 secondes
setInterval(loadStats, 5000);