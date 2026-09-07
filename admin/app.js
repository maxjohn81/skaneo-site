const numberFormat = new Intl.NumberFormat("fr-FR");

function setValue(id, value) {
    document.getElementById(id).textContent = numberFormat.format(value);
}

function renderChart(series) {
    const chart = document.getElementById("chart");
    const max = Math.max(1, ...series.flatMap((item) => [item.downloads, item.visits]));
    chart.innerHTML = series.map((item) => {
        const label = item.date.slice(8) + "/" + item.date.slice(5, 7);
        return `<div class="chart-day" title="${label}: ${item.downloads} téléchargements, ${item.visits} visites">
            <div class="bars"><i class="bar-downloads" style="height:${(item.downloads / max) * 100}%"></i><i class="bar-visits" style="height:${(item.visits / max) * 100}%"></i></div>
            <small>${label}</small>
        </div>`;
    }).join("");
}

async function loadStats() {
    const downloadsEl = document.getElementById("downloads");
    const visitsEl = document.getElementById("visits");
    const btn = document.getElementById("refreshBtn");
    const updatedEl = document.getElementById("lastUpdated");

    btn?.classList.add("loading");
    btn?.setAttribute("disabled", "true");

    try {
        const response = await fetch("/api/admin/stats");

        if (response.status === 401) {
            document.getElementById("dashboardPanel").hidden = true;
            document.getElementById("loginPanel").hidden = false;
            return;
        }
        if (!response.ok) {
            throw new Error(`Erreur serveur (${response.status})`);
        }

        const data = await response.json();
        const nf = new Intl.NumberFormat("fr-FR");

        downloadsEl.textContent = nf.format(data.totals.downloads);
        visitsEl.textContent = nf.format(data.totals.visits);
        setValue("todayDownloads", data.today.downloads);
        setValue("todayVisits", data.today.visits);
        setValue("weekDownloads", data.last7Days.downloads);
        setValue("weekVisits", data.last7Days.visits);
        setValue("monthDownloads", data.last30Days.downloads);
        setValue("monthVisits", data.last30Days.visits);
        renderChart(data.series);
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

async function login(event) {
    event.preventDefault();
    const errorEl = document.getElementById("loginError");
    const password = document.getElementById("password").value;
    errorEl.textContent = "";

    try {
        const response = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        });
        if (!response.ok) throw new Error("Mot de passe incorrect");
        document.getElementById("password").value = "";
        document.getElementById("loginPanel").hidden = true;
        document.getElementById("dashboardPanel").hidden = false;
        await loadStats();
    } catch (error) {
        errorEl.textContent = error.message;
    }
}

async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    document.getElementById("dashboardPanel").hidden = true;
    document.getElementById("loginPanel").hidden = false;
}

document.getElementById("loginForm").addEventListener("submit", login);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("refreshBtn").addEventListener("click", loadStats);
loadStats();