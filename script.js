(function () {
  "use strict";

  const photos = (typeof PHOTOS !== "undefined" ? PHOTOS : []).map((p, i) => ({
    index: i,
    display: p.display || p.src,
    full: p.full || p.src,
    caption: p.caption || "",
  }));

  const linesEl = document.getElementById("lines");
  const counterEl = document.getElementById("counter");
  const toastEl = document.getElementById("toast");

  const ROT_CYCLE = [-5, 3, -2, 6, -4, 2, -6, 4, -3, 5];
  const PER_LINE = 6;

  function showToast(msg, ms = 2600) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => (toastEl.hidden = true), ms);
  }

  // ---------- render ----------
  function render() {
    if (!photos.length) {
      linesEl.innerHTML = '<p class="empty">No photos yet — hang some up first.</p>';
      counterEl.textContent = "";
      return;
    }

    counterEl.textContent = `${photos.length} photo${photos.length === 1 ? "" : "s"}`;

    let html = "";
    for (let i = 0; i < photos.length; i += PER_LINE) {
      const chunk = photos.slice(i, i + PER_LINE);
      html += '<div class="line">';
      for (const p of chunk) {
        const rot = ROT_CYCLE[p.index % ROT_CYCLE.length];
        const dur = (5 + (p.index % 4) * 0.8).toFixed(1);
        const delay = ((p.index % 5) * 0.4).toFixed(1);
        html += `
          <div class="clip" style="--rot:${rot}deg;--sway-dur:${dur}s;--sway-delay:${delay}s;">
            <div class="pin"></div>
            <figure class="polaroid" tabindex="0" role="button"
                    aria-label="Open photo${p.caption ? ": " + escapeAttr(p.caption) : ""}"
                    data-index="${p.index}">
              <img src="${escapeAttr(p.display)}" alt="${escapeAttr(p.caption || "Family photo")}" loading="lazy" />
              ${p.caption ? `<figcaption>${escapeHtml(p.caption)}</figcaption>` : ""}
            </figure>
          </div>`;
      }
      html += "</div>";
    }
    linesEl.innerHTML = html;

    linesEl.querySelectorAll(".polaroid").forEach((el) => {
      el.addEventListener("click", () => openLightbox(Number(el.dataset.index)));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(Number(el.dataset.index));
        }
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ---------- lightbox ----------
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbCaption = document.getElementById("lb-caption");
  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }

  function updateLightbox() {
    const p = photos[currentIndex];
    lbImg.src = p.display;
    lbImg.alt = p.caption || "Family photo";
    lbCaption.textContent = p.caption || "";
  }

  function step(delta) {
    currentIndex = (currentIndex + delta + photos.length) % photos.length;
    updateLightbox();
  }

  document.querySelector(".lb-top-close").addEventListener("click", closeLightbox);
  document.querySelector(".lb-close").addEventListener("click", closeLightbox);
  document.querySelector(".lb-prev").addEventListener("click", () => step(-1));
  document.querySelector(".lb-next").addEventListener("click", () => step(1));
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  // ---------- downloads ----------
  async function downloadSingle(src, suggestedName) {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = suggestedName || src.split("/").pop();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast("Couldn't download that one — try again.");
    }
  }

  document.querySelector(".lb-download").addEventListener("click", () => {
    const p = photos[currentIndex];
    downloadSingle(p.full, (p.caption || `photo-${currentIndex + 1}`).replace(/\s+/g, "-") + "." + p.full.split(".").pop());
  });

  const downloadAllBtn = document.getElementById("downloadAllBtn");
  const downloadAllLabel = document.getElementById("downloadAllLabel");

  downloadAllBtn.addEventListener("click", async () => {
    if (!photos.length) return;
    if (typeof JSZip === "undefined") {
      showToast("Zip helper failed to load — check your connection.");
      return;
    }
    downloadAllBtn.disabled = true;
    const zip = new JSZip();
    let done = 0;

    downloadAllLabel.textContent = `Preparing 0 / ${photos.length}…`;

    await Promise.all(
      photos.map(async (p, i) => {
        try {
          const res = await fetch(p.full);
          const blob = await res.blob();
          const ext = p.full.split(".").pop();
          const name = (p.caption ? p.caption.replace(/[^\w\-]+/g, "-") : `photo-${i + 1}`) + "." + ext;
          zip.file(name, blob);
        } catch (e) {
          /* skip photo that failed to fetch */
        } finally {
          done += 1;
          downloadAllLabel.textContent = `Preparing ${done} / ${photos.length}…`;
        }
      })
    );

    downloadAllLabel.textContent = "Zipping…";
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "family-photos.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    downloadAllLabel.textContent = "Download all photos";
    downloadAllBtn.disabled = false;
    showToast("Downloaded! Check your downloads folder.");
  });

  render();
})();
