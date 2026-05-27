(() => {

  /* =========================
     SETTINGS
  ========================= */

  const countdownPage = "/download";

  const fallbackPoster =
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e";

  /* =========================
     DOMAIN CACHE
  ========================= */

  const domainMap = {};

  function readDomains(){

    document
      .querySelectorAll('meta[name="video-domain"]')
      .forEach(meta => {

        const id = meta.dataset.id;

        if(id){
          domainMap[id] =
            meta.content || "";
        }
      });
  }

  /* =========================
     VIDEO POSTER
  ========================= */

  function setPoster(root = document){

    root
      .querySelectorAll(".video-wrapper")
      .forEach(wrapper => {

        const posterBox =
          wrapper.querySelector(".video-poster");

        if(!posterBox) return;

        if(posterBox.dataset.ready) return;

        posterBox.dataset.ready = "1";

        let poster =
          wrapper.dataset.poster;

        /* =========================
           TAKE FIRST IMAGE
        ========================= */

        if(!poster){

          const firstPostImage =
            document.querySelector(
              "#detailContent img"
            );

          if(firstPostImage){

            poster =
              firstPostImage.currentSrc
              ||
              firstPostImage.src;
          }
        }

        /* =========================
           BLOGGER LARGE SIZE
        ========================= */

        if(poster){
          poster =
            poster.replace(
              /\/s\d+(-c)?\//,
              "/s1600/"
            );
        }

        /* =========================
           FALLBACK
        ========================= */

        if(!poster){
          poster = fallbackPoster;
        }

        posterBox.innerHTML = `
          <img
            src="${poster}"
            alt=""
            draggable="false"
            loading="eager"
            decoding="async"
            style="
              width:100%;
              height:100%;
              object-fit:cover;
              display:block;
            "
          >
        `;
      });
  }

  /* =========================
     PLAY VIDEO
  ========================= */

  window.playVideo = function(el){

    const wrapper =
      el.closest(".video-wrapper");

    if(!wrapper) return;

    const iframe =
      wrapper.querySelector(".video-player");

    const poster =
      wrapper.querySelector(".video-poster");

    if(!iframe) return;

    el.style.display = "none";

    if(poster){
      poster.style.display = "none";
    }

    if(!iframe.src){

      const domainId =
        wrapper.dataset.domainId || "";

      const domain =
        domainMap[domainId] || "";

      const path =
        iframe.dataset.src || "";

      iframe.src =
        path.startsWith("http")
          ? path
          : domain + path;
    }
  };

  /* =========================
     DOWNLOAD BUTTON
  ========================= */

  function handleDownload(btn){

    const raw =
      btn.dataset.url || "";

    if(!raw) return;

    const [path = "", domainKey = ""] =
      raw.split("|");

    const domain =
      domainMap[domainKey] || "";

    const finalTarget =
      path.startsWith("http")
        ? path
        : domain + path;

    const url =
      `${countdownPage}?target=${encodeURIComponent(finalTarget)}&d=${encodeURIComponent(domainKey)}`;

    window.location.href = url;
  }

  /* =========================
     POPUP
  ========================= */

  let popup = null;
  let popupImg = null;

  let currentImages = [];
  let currentIndex = 0;

  function loadPopup(){

    popup =
      document.getElementById("tmdbPopup");

    popupImg =
      document.getElementById("tmdbPopupImg");
  }

  function refreshGallery(){

    currentImages = Array.from(
      document.querySelectorAll(
        ".tmdb-extra-images img"
      )
    );
  }

  /* =========================
     UPDATE POPUP IMAGE
  ========================= */

  function updatePopupImage(){

    if(
      !popupImg ||
      !currentImages.length
    ) return;

    const img =
      currentImages[currentIndex];

    let src =
      img.getAttribute("data-src")
      ||
      img.getAttribute("data-lazy-src")
      ||
      img.currentSrc
      ||
      img.src
      ||
      img.getAttribute("src")
      ||
      "";

    src = src.replace(
      /\/s\d+(-c)?\//,
      "/s1600/"
    );

    popupImg.style.opacity = "0";

    const preload = new Image();

    preload.onload = () => {

      popupImg.src =
        preload.src;

      requestAnimationFrame(() => {

        popupImg.style.opacity = "1";
      });
    };

    preload.src = src;
  }

  function openPopup(index){

    loadPopup();

    if(
      !popup ||
      !popupImg
    ) return;

    currentIndex = index;

    popup.classList.add("active");

    updatePopupImage();
  }

  function closePopup(){

    if(!popup) return;

    popup.classList.remove("active");
  }

  function nextImage(){

    if(!currentImages.length) return;

    currentIndex =
      (
        currentIndex + 1
      )
      %
      currentImages.length;

    updatePopupImage();
  }

  function prevImage(){

    if(!currentImages.length) return;

    currentIndex =
      (
        currentIndex - 1
        +
        currentImages.length
      )
      %
      currentImages.length;

    updatePopupImage();
  }

  /* =========================
     CLICK EVENTS
  ========================= */

  document.addEventListener("click", e => {

    /* ========= DOWNLOAD ========= */

    const downloadBtn =
      e.target.closest(".button-link");

    if(downloadBtn){

      e.preventDefault();

      handleDownload(downloadBtn);

      return;
    }

    /* ========= VIDEO ========= */

    const overlay =
      e.target.closest(".video-overlay");

    if(overlay){

      e.preventDefault();

      playVideo(overlay);

      return;
    }

    /* ========= GALLERY ========= */

    const galleryImg =
      e.target.closest(
        ".tmdb-extra-images img"
      );

    if(galleryImg){

      refreshGallery();

      const index =
        currentImages.indexOf(galleryImg);

      if(index !== -1){

        setTimeout(() => {

          openPopup(index);

        }, 100);
      }

      return;
    }

    /* ========= CLOSE ========= */

    if(
      e.target.closest(".tmdb-close")
    ){

      closePopup();

      return;
    }

    /* ========= NEXT ========= */

    if(
      e.target.closest(".tmdb-next")
    ){

      nextImage();

      return;
    }

    /* ========= PREV ========= */

    if(
      e.target.closest(".tmdb-prev")
    ){

      prevImage();

      return;
    }

    /* ========= OUTSIDE ========= */

    if(
      popup &&
      e.target === popup
    ){

      closePopup();
    }
  });

  /* =========================
     KEYBOARD
  ========================= */

  document.addEventListener("keydown", e => {

    if(
      !popup ||
      !popup.classList.contains("active")
    ) return;

    switch(e.key){

      case "ArrowRight":
        nextImage();
        break;

      case "ArrowLeft":
        prevImage();
        break;

      case "Escape":
        closePopup();
        break;
    }
  });

  /* =========================
     MOBILE SWIPE
  ========================= */

  let touchStartX = 0;
  let touchEndX = 0;

  document.addEventListener(
    "touchstart",
    e => {

      if(
        !popup ||
        !popup.classList.contains("active")
      ) return;

      touchStartX =
        e.changedTouches[0].screenX;
    },
    { passive:true }
  );

  document.addEventListener(
    "touchend",
    e => {

      if(
        !popup ||
        !popup.classList.contains("active")
      ) return;

      touchEndX =
        e.changedTouches[0].screenX;

      if(
        touchStartX - touchEndX > 50
      ){
        nextImage();
      }

      if(
        touchEndX - touchStartX > 50
      ){
        prevImage();
      }
    },
    { passive:true }
  );

  /* =========================
     OBSERVER
  ========================= */

  const observer =
    new MutationObserver(() => {

      setPoster();
    });

  observer.observe(
    document.body,
    {
      childList:true,
      subtree:true
    }
  );

  /* =========================
     INIT
  ========================= */

  function init(){

    readDomains();

    loadPopup();

    setPoster();
  }

  if(
    document.readyState === "loading"
  ){

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  }else{

    init();
  }

})();
