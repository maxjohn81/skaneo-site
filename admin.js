async function loadStats() {
    const statEl = document.getElementById("downloads");
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
        const formatted = new Intl.NumberFormat("fr-FR").format(data.downloads);

        statEl.textContent = formatted;
        statEl.classList.remove("stat-error");

        if (updatedEl) {
            updatedEl.textContent =
                "Dernière mise à jour à " + new Date().toLocaleTimeString("fr-FR");
        }
    } catch (error) {
        statEl.textContent = "—";
        statEl.classList.add("stat-error");

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