/**
 * Skaneo — script.js
 * Vanilla JS only. No dependencies. Progressive enhancement:
 * the page is fully usable if JS fails to load.
 */
(function () {
  "use strict";

  /* -------------------------------------------------------
   * 1. Sticky header shadow on scroll
   * ----------------------------------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 6);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ------------------------------------------------------------

  async function loadDownloads() {
    try {
      const response = await fetch("/api/stats");
      const data = await response.json();

      document.getElementById("downloads").textContent = data.downloads;
    } catch (error) {
      console.error(error);
    }
  }

  loadDownloads();

  /* -------------------------------------------------------
   * 2. Mobile nav toggle
   * ----------------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      toggle.classList.toggle("active", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.classList.remove("active");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* -------------------------------------------------------
   * 3. Scroll-reveal animations (IntersectionObserver)
   * ----------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, i) {
          if (entry.isIntersecting) {
            setTimeout(function () {
              entry.target.classList.add("in-view");
            }, (i % 6) * 70);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* -------------------------------------------------------
   * 4. FAQ accordion
   * ----------------------------------------------------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var question = item.querySelector(".faq-question");
    var answer = item.querySelector(".faq-answer");
    if (!question || !answer) return;

    question.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");

      // Close all other items (single-open accordion)
      document.querySelectorAll(".faq-item.open").forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove("open");
          openItem.querySelector(".faq-answer").style.maxHeight = null;
          openItem.querySelector(".faq-question").setAttribute("aria-expanded", "false");
        }
      });

      if (isOpen) {
        item.classList.remove("open");
        answer.style.maxHeight = null;
        question.setAttribute("aria-expanded", "false");
      } else {
        item.classList.add("open");
        answer.style.maxHeight = answer.scrollHeight + "px";
        question.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* -------------------------------------------------------
   * 5. Ripple effect on primary buttons
   * ----------------------------------------------------- */
  document.querySelectorAll(".btn-primary").forEach(function (btn) {
    btn.style.position = btn.style.position || "relative";
    btn.style.overflow = "hidden";
    btn.addEventListener("click", function (e) {
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var circle = document.createElement("span");
      circle.className = "ripple";
      circle.style.width = circle.style.height = size + "px";
      circle.style.left = (e.clientX - rect.left - size / 2) + "px";
      circle.style.top = (e.clientY - rect.top - size / 2) + "px";
      btn.appendChild(circle);
      setTimeout(function () { circle.remove(); }, 650);
    });
  });

  /* -------------------------------------------------------
   * 6. Toast helper (used to confirm download start)
   * ----------------------------------------------------- */
  var toastEl = document.querySelector(".toast");
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 2800);
  }

  document.querySelectorAll('a[data-download]').forEach(function (link) {
    link.addEventListener("click", function () {
      showToast("Téléchargement de Skaneo lancé…");
    });
  });

  /* -------------------------------------------------------
   * 7. Smooth-scroll for in-page anchors (with header offset)
   * ----------------------------------------------------- */
  var headerHeight = header ? header.offsetHeight : 0;
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
        window.scrollTo({ top: top, behavior: "smooth" });
      }
    });
  });

  /* -------------------------------------------------------
   * 8. Current year in footer
   * ----------------------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();






  /* -------------------------------------------------------
     * 10. Connexion Google optionnelle (Supabase Auth)
     * ----------------------------------------------------- */
  var SUPABASE_URL = "https://nngfkvzupvskphydhxyg.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_ZK5KDZSt5OgJHMxofw9rcw_2zquNzMX";

  if (window.supabase) {
    var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    var loginBtn = document.getElementById("login-btn");
    var loginLabel = document.getElementById("login-label");

    function updateLoginUI(session) {
      if (session && session.user) {
        var name = session.user.user_metadata.full_name || session.user.email;
        loginLabel.textContent = name.split(" ")[0];
      } else {
        loginLabel.textContent = "Se connecter";
      }
    }

    sb.auth.getSession().then(function (res) {
      updateLoginUI(res.data.session);
    });

    sb.auth.onAuthStateChange(function (_event, session) {
      updateLoginUI(session);
    });

    if (loginBtn) {
      loginBtn.addEventListener("click", async function () {
        var { data } = await sb.auth.getSession();
        if (data.session) {
          await sb.auth.signOut();
        } else {
          await sb.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.origin }
          });
        }
      });
    }
  }

})();
