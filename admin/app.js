const numberFormat = new Intl.NumberFormat("fr-FR");
const THEME_STORAGE_KEY = "skaneo_theme";
const charts = {};
let latestSeries = [];
let activeView = "overview";
const detailRanges = { downloads: "7", visits: "7" };

const pageTitles = {
  overview: "Vue d'ensemble",
  downloads: "Téléchargements",
  visits: "Visites",
  users: "Utilisateurs",
  releases: "Versions mobiles",
  settings: "Paramètres",
};

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const button = document.getElementById("adminThemeToggle");
  const isDark = theme === "dark";
  button.setAttribute("aria-pressed", String(isDark));
  button.setAttribute(
    "aria-label",
    isDark ? "Activer le mode clair" : "Activer le mode sombre",
  );
}

function setValue(id, value) {
  document.getElementById(id).textContent = numberFormat.format(value);
}

function destroyCharts() {
  Object.values(charts).forEach((chart) => chart.destroy());
  Object.keys(charts).forEach((key) => delete charts[key]);
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: true, labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: { padding: 10, cornerRadius: 8 },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
      y: { beginAtZero: true, ticks: { precision: 0 }, border: { dash: [4, 4] } },
    },
  };
}

function renderCharts(series) {
  latestSeries = series;
  destroyCharts();

  if (!window.Chart || !series.length) return;

  const range = activeView === "overview" ? "30" : detailRanges[activeView];
  const displayedSeries = range === "today" ? series.slice(-1) : series.slice(-Number(range));
  const labels = displayedSeries.map((item) => item.date.slice(8) + "/" + item.date.slice(5, 7));
  const downloads = displayedSeries.map((item) => item.downloads);
  const visits = displayedSeries.map((item) => item.visits);
  const options = chartOptions();

  if (activeView === "overview") {
    charts.activity = new Chart(document.getElementById("activityChart"), {
      type: "bar",
      data: { labels, datasets: [
        { label: "Téléchargements", data: downloads, backgroundColor: "#ff6b00", borderRadius: 5 },
        { label: "Visites", data: visits, backgroundColor: "#ffbf00", borderRadius: 5 },
      ] },
      options,
    });
  }

  const detailChart = activeView === "downloads" ? "downloadsChart" : activeView === "visits" ? "visitsChart" : null;
  if (detailChart) {
    const isDownloads = activeView === "downloads";
    charts.detail = new Chart(document.getElementById(detailChart), {
      type: "line",
      data: { labels, datasets: [{
        label: isDownloads ? "Téléchargements" : "Visites",
        data: isDownloads ? downloads : visits,
        borderColor: isDownloads ? "#ff6b00" : "#e5a900",
        backgroundColor: isDownloads ? "#ff6b0020" : "#ffbf0028",
        fill: true,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 5,
      }] },
      options,
    });
  }
}

function showView(view) {
  activeView = pageTitles[view] ? view : "overview";
  document.querySelectorAll(".admin-view").forEach((element) => {
    element.hidden = element.dataset.view !== activeView;
  });
  document.querySelectorAll("[data-view-link]").forEach((link) => {
    link.classList.toggle("active", link.dataset.viewLink === activeView);
  });
  const currentPageTitle = document.getElementById("currentPageTitle");
  if (currentPageTitle) currentPageTitle.textContent = pageTitles[activeView];
  renderCharts(latestSeries);
}

function showViewFromHash() {
  showView(window.location.hash.slice(1) || "overview");
}

async function loadStats() {
  const downloadsEl = document.getElementById("downloads");
  const visitsEl = document.getElementById("visits");
  const btn = document.getElementById("refreshBtn");
  const updatedEl = document.getElementById("lastUpdated");

  btn?.classList.add("loading");
  btn?.setAttribute("disabled", "true");

  try {
    const response = await fetch("/api/admin/stats", {
      credentials: "same-origin",
    });

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
    setValue("downloadsPageTotal", data.totals.downloads);
    setValue("monthDownloadsPage", data.last30Days.downloads);
    setValue("visitsPageTotal", data.totals.visits);
    setValue("monthVisitsPage", data.last30Days.visits);
    renderCharts(data.series);
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

function nextVersion(version) {
    const parts = version.split(".").map(Number);
    if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return "—";
    parts[2] += 1;
    if (parts[2] > 9) {
      parts[2] = 0;
      parts[1] += 1;
    }
    if (parts[1] > 9) {
      parts[1] = 0;
      parts[0] += 1;
    }
    return parts.join(".");
}

function formatFileSize(bytes) {
    if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function updateApkPreview(file) {
    const preview = document.getElementById("apkPreview");
    const dropzone = document.getElementById("apkDropzone");
    if (!file) {
      preview.hidden = true;
      dropzone.classList.remove("has-file");
      return;
    }
    document.getElementById("apkFileName").textContent = file.name;
    document.getElementById("apkFileSize").textContent = formatFileSize(file.size);
    preview.hidden = false;
    dropzone.classList.add("has-file");
}

function setupReleaseForm() {
    const fileInput = document.getElementById("apkFile");
    const dropzone = document.getElementById("apkDropzone");
    const notes = document.getElementById("releaseNotes");
    const preview = document.getElementById("apkPreview");
    const remove = document.getElementById("apkRemove");
    const updateFile = (file) => {
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".apk")) {
        document.getElementById("releaseError").textContent = "Sélectionne un fichier APK.";
        fileInput.value = "";
        return;
      }
      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInput.files = transfer.files;
      updateApkPreview(file);
      document.getElementById("releaseError").textContent = "";
    };
    fileInput.addEventListener("change", () => updateFile(fileInput.files[0]));
    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.add("is-dragging");
      });
    });
    ["dragleave", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.remove("is-dragging");
      });
    });
    dropzone.addEventListener("drop", (event) => updateFile(event.dataTransfer.files[0]));
    remove.addEventListener("click", () => {
      fileInput.value = "";
      updateApkPreview(null);
    });
    notes.addEventListener("input", () => {
      document.getElementById("releaseNotesCount").textContent = `${notes.value.length} / 500`;
    });
    preview.addEventListener("click", (event) => event.stopPropagation());
}

async function loadRelease() {
  const response = await fetch("/api/admin/release", { credentials: "same-origin" });
  if (response.status === 401) return;
  if (!response.ok) throw new Error("Impossible de charger la version publiée");
  const data = await response.json();
  const release = data.latest || data;
  document.getElementById("releaseVersion").textContent = release?.version || "—";
  document.getElementById("releaseFilename").textContent = release?.filename || "Aucune publication";
  document.getElementById("releaseStatus").textContent = release?.publishedAt
    ? "Publiée le " + new Date(release.publishedAt).toLocaleString("fr-FR")
    : "Aucune version publiée";
  const link = document.getElementById("releaseDownload");
  link.href = release?.url || "#";
  document.getElementById("releaseNextVersion").textContent =
    release?.version ? nextVersion(release.version) : "1.0.4";
  const history = document.getElementById("releaseHistory");
  history.replaceChildren();
  if (!data.history?.length) {
    const empty = document.createElement("li");
    empty.textContent = "Aucune publication dynamique.";
    history.append(empty);
    return;
  }
  data.history.forEach((item) => {
    const entry = document.createElement("li");
    entry.textContent = `${item.version} — ${new Date(item.publishedAt).toLocaleString("fr-FR")}`;
    history.append(entry);
  });
}

async function publishRelease(event) {
  event.preventDefault();
  const form = document.getElementById("releaseForm");
  const submit = document.getElementById("releaseSubmit");
  const error = document.getElementById("releaseError");
  const success = document.getElementById("releaseSuccess");
  error.textContent = "";
  success.textContent = "";
  submit.disabled = true;
  submit.classList.add("loading");

  try {
    const file = document.getElementById("apkFile").files[0];
    if (!file) throw new Error("Sélectionne un fichier APK.");

    const currentVersion = document.getElementById("releaseVersion").textContent;
    const version = nextVersion(currentVersion);
    const filename = `Skaneo-v${version}.apk`;
    const { upload } = await import("https://cdn.jsdelivr.net/npm/@vercel/blob@2.8.0/client/+esm");
    const uploadResult = await upload(`releases/${filename}`, file, {
      access: "public",
      handleUploadUrl: "/api/admin/blob-upload",
      multipart: false,
      onUploadProgress: (progress) => {
        submit.querySelector("span").textContent = `Upload ${Math.round(progress.percentage)} %`;
      },
    });

    const response = await fetch("/api/admin/release", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blobUrl: uploadResult.url,
        filename,
        notes: document.getElementById("releaseNotes").value,
        size: file.size,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Publication impossible");
    form.reset();
    updateApkPreview(null);
    document.getElementById("releaseNotesCount").textContent = "0 / 500";
    success.textContent = `Version ${data.version} publiée avec succès.`;
    await loadRelease();
  } catch (publishError) {
    error.textContent = publishError.message;
  } finally {
    submit.disabled = false;
    submit.querySelector("span").textContent = "Publier la mise à jour";
    submit.classList.remove("loading");
  }
}

async function login(event) {
  event.preventDefault();
  const errorEl = document.getElementById("loginError");
  const password = document.getElementById("password").value;
  const submitButton = document.getElementById("loginSubmit");
  errorEl.textContent = "";
  submitButton.classList.add("is-loading");
  submitButton.setAttribute("disabled", "true");

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const data = await response.json().catch(function () {
        return {};
      });
      throw new Error(data.error || "Connexion impossible");
    }
    document.getElementById("password").value = "";
    document.getElementById("loginPanel").hidden = true;
    document.getElementById("dashboardPanel").hidden = false;
    await loadStats();
    await loadRelease();
  } catch (error) {
    errorEl.textContent = error.message;
  } finally {
    submitButton.classList.remove("is-loading");
    submitButton.removeAttribute("disabled");
  }
}

async function logout() {
  await fetch("/api/admin/logout", {
    method: "POST",
    credentials: "same-origin",
  });
  document.getElementById("dashboardPanel").hidden = true;
  document.getElementById("loginPanel").hidden = false;
}

const adminMenuToggle = document.getElementById("adminMenuToggle");
const adminSidebar = document.getElementById("adminSidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const adminMenuClose = document.getElementById("adminMenuClose");

function setAdminMenu(open) {
  adminSidebar.classList.toggle("is-open", open);
  sidebarBackdrop.classList.toggle("is-visible", open);
  adminMenuToggle.setAttribute("aria-expanded", String(open));
  adminMenuToggle.setAttribute(
    "aria-label",
    open ? "Fermer le menu de navigation" : "Ouvrir le menu de navigation",
  );
  document.body.classList.toggle("admin-menu-open", open);
}

adminMenuToggle.addEventListener("click", function () {
  setAdminMenu(!adminSidebar.classList.contains("is-open"));
});
sidebarBackdrop.addEventListener("click", function () {
  setAdminMenu(false);
});
adminMenuClose.addEventListener("click", function () {
  setAdminMenu(false);
});
document.querySelectorAll("[data-view-link]").forEach((link) => {
  link.addEventListener("click", function () {
    setAdminMenu(false);
  });
});
window.addEventListener("keydown", function (event) {
  if (event.key === "Escape") setAdminMenu(false);
});
window.addEventListener("resize", function () {
  if (window.innerWidth > 560) setAdminMenu(false);
});

document.getElementById("loginForm").addEventListener("submit", login);
document.getElementById("releaseForm").addEventListener("submit", publishRelease);
setupReleaseForm();
document.getElementById("adminThemeToggle").addEventListener("click", function () {
  const nextTheme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  setTheme(nextTheme);
});
setTheme(localStorage.getItem(THEME_STORAGE_KEY) || "light");
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("refreshBtn").addEventListener("click", loadStats);
document.querySelectorAll("[data-refresh]").forEach((button) => {
  button.addEventListener("click", loadStats);
});
document.querySelectorAll("[data-chart-range]").forEach((select) => {
  select.addEventListener("change", function () {
    detailRanges[select.dataset.chartRange] = select.value;
    renderCharts(latestSeries);
  });
});
window.addEventListener("hashchange", showViewFromHash);
showViewFromHash();
loadStats();
loadRelease().catch((error) => console.error("Erreur de chargement de la release :", error));
