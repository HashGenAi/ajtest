
(() => {
  /* =========================
     SETTINGS
  ========================= */
  const countdownPage = "/p/download.html";
  const fallbackPoster =
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e";

  /* =========================
     DOMAIN CACHE
  ========================= */
  const domainMap = {};

  function readDomains() {
    document.querySelectorAll('meta[name="video-domain"]').forEach(meta => {
      const id = meta.dataset.id;
      if (id) domainMap[id] = meta.content || "";
    });
  }

  /* =========================
     POSTER SETTER
  ========================= */
  function setPoster(root = document) {
    const meta = document.querySelector('meta[property="og:image"]');
    const poster = meta && meta.content ? meta.content : fallbackPoster;

    root.querySelectorAll?.(".video-poster").forEach(el => {
      el.style.backgroundImage = `url('${poster}')`;
    });
  }

  /* =========================
     VIDEO PLAY
  ========================= */
  window.playVideo = function (el) {
    const wrapper = el.closest(".video-wrapper") || el.parentElement;
    if (!wrapper) return;

    const iframe = wrapper.querySelector(".video-player");
    const poster = wrapper.querySelector(".video-poster");
    if (!iframe) return;

    el.style.display = "none";
    if (poster) poster.style.display = "none";

    const domainId = wrapper.dataset.domainId || "";
    const domain = domainMap[domainId] || "";
    const path = iframe.dataset.src || "";

    if (!iframe.src) {
      iframe.src = path.startsWith("http") ? path : (domain + path);
    }
  };

  /* =========================
     DOWNLOAD REDIRECT
  ========================= */
  function handleDownloadButton(btn) {
    const raw = btn.dataset.url || "";
    if (!raw) return;

    const [path = "", domainKey = ""] = raw.split("|");
    const domain = domainMap[domainKey] || "";

    const finalTarget = path.startsWith("http") ? path : (domain + path);

    const url =
      `${countdownPage}?target=${encodeURIComponent(finalTarget)}&d=${encodeURIComponent(domainKey)}`;

    window.location.href = url;
  }

  /* =========================
     IMAGE POPUP VIEWER
  ========================= */
  let popup = null;
  let popupImg = null;
  let currentImages = [];
  let currentIndex = 0;

  function loadPopupElements() {
    popup = document.getElementById("tmdbPopup");
    popupImg = document.getElementById("tmdbPopupImg");
  }

  function updateImage() {
    if (!popupImg || !currentImages.length) return;
    popupImg.src = currentImages[currentIndex].src;
  }

  function openImage(index) {
    loadPopupElements();
    if (!popup || !popupImg || !currentImages.length) return;

    currentIndex = index;
    updateImage();
    popup.classList.add("active");

    history.pushState({ popupOpen: true }, "", window.location.href);
  }

  function closePopup() {
    if (!popup) loadPopupElements();
    if (popup) popup.classList.remove("active");
  }

  function nextImage() {
    if (!currentImages.length) return;
    currentIndex = (currentIndex + 1) % currentImages.length;
    updateImage();
  }

  function prevImage() {
    if (!currentImages.length) return;
    currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    updateImage();
  }

  function refreshPopupImages() {
    currentImages = Array.from(document.querySelectorAll(".tmdb-extra-images img"));
  }

  /* =========================
     EVENT DELEGATION
  ========================= */
  document.addEventListener("click", e => {
    const downloadBtn = e.target.closest(".button-link");
    if (downloadBtn) {
      e.preventDefault();
      handleDownloadButton(downloadBtn);
      return;
    }

    const overlay = e.target.closest(".video-overlay");
    if (overlay) {
      e.preventDefault();
      window.playVideo(overlay);
      return;
    }

    const thumb = e.target.closest(".tmdb-extra-images img");
    if (thumb) {
      refreshPopupImages();
      const idx = currentImages.indexOf(thumb);
      if (idx !== -1) openImage(idx);
      return;
    }

    if (e.target.classList.contains("tmdb-close") || e.target.closest(".tmdb-close")) {
      e.preventDefault();
      closePopup();
      history.back();
      return;
    }

    if (e.target.classList.contains("tmdb-next") || e.target.closest(".tmdb-next")) {
      e.preventDefault();
      nextImage();
      return;
    }

    if (e.target.classList.contains("tmdb-prev") || e.target.closest(".tmdb-prev")) {
      e.preventDefault();
      prevImage();
      return;
    }

    if (popup && e.target === popup) {
      closePopup();
      history.back();
    }
  });

  document.addEventListener("keydown", e => {
    if (!popup || !popup.classList.contains("active")) return;

    switch (e.key) {
      case "ArrowRight":
        nextImage();
        break;
      case "ArrowLeft":
        prevImage();
        break;
      case "Escape":
        closePopup();
        history.back();
        break;
    }
  });

  window.addEventListener("popstate", () => {
    if (popup && popup.classList.contains("active")) {
      closePopup();
    }
  });

  /* =========================
     AUTO-POSTER FOR DYNAMIC HTML
  ========================= */
  const observer = new MutationObserver(() => {
    setPoster();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  /* =========================
     INIT
  ========================= */
  function init() {
    readDomains();
    loadPopupElements();
    setPoster();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
