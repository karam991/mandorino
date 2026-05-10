/* Mandorino Widget — Drop-in Floating Button + Overlay-Iframe.
 *
 * Einbindung auf der Kanzlei-Website (vor </body>):
 *
 *   <script src="https://kanzlei-mandorino.example/widget.js"
 *           data-mandorino-base="https://kanzlei-mandorino.example"
 *           data-button-text="Anliegen schildern"
 *           data-button-color="#0F4C81"
 *           defer></script>
 *
 * Optionale data-Attribute:
 *   data-mandorino-base   — Origin der Mandorino-Instanz (default: Origin des Skripts)
 *   data-button-text      — Beschriftung des Floating-Buttons
 *   data-button-color     — Hintergrundfarbe (default: #0F4C81)
 *   data-position         — "br" | "bl" | "tr" | "tl" (default: "br")
 *   data-auto-open        — "1" zum sofortigen Öffnen
 *
 * Funktioniert ohne Build-Tool, ohne Framework, ohne externe Abhängigkeit.
 * Höhe wird per `mandorino:resize`-postMessage automatisch nachjustiert.
 */
(function () {
  if (window.__mandorinoWidgetLoaded) return;
  window.__mandorinoWidgetLoaded = true;

  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName("script");
    return s[s.length - 1];
  })();

  var data = script ? script.dataset : {};
  var base = (data.mandorinoBase || (script && new URL(script.src).origin) || "").replace(/\/$/, "");
  if (!base) {
    console.warn("[Mandorino] Kein data-mandorino-base gesetzt — Widget wird nicht geladen.");
    return;
  }
  var buttonText = data.buttonText || "Rechtliche Anfrage stellen";
  var buttonColor = data.buttonColor || "#0F4C81";
  var position = (data.position || "br").toLowerCase();
  var autoOpen = data.autoOpen === "1" || data.autoOpen === "true";

  var posStyles = {
    br: "right:20px;bottom:20px;",
    bl: "left:20px;bottom:20px;",
    tr: "right:20px;top:20px;",
    tl: "left:20px;top:20px;",
  };
  var posCss = posStyles[position] || posStyles.br;

  // ---------- Floating Button ----------
  var btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", buttonText);
  btn.innerText = buttonText;
  btn.style.cssText =
    "position:fixed;" + posCss +
    "z-index:2147483646;background:" + buttonColor + ";color:#fff;" +
    "border:none;border-radius:999px;padding:14px 22px;font:600 15px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;" +
    "box-shadow:0 8px 24px rgba(0,0,0,.18);cursor:pointer;transition:transform .15s ease;";
  btn.onmouseenter = function () { btn.style.transform = "translateY(-1px)"; };
  btn.onmouseleave = function () { btn.style.transform = ""; };

  // ---------- Overlay + Iframe ----------
  var overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;background:rgba(20,24,40,.55);z-index:2147483647;" +
    "display:none;align-items:center;justify-content:center;padding:16px;";

  var frameWrap = document.createElement("div");
  frameWrap.style.cssText =
    "position:relative;width:100%;max-width:560px;background:#fff;border-radius:14px;" +
    "box-shadow:0 24px 60px rgba(0,0,0,.35);overflow:hidden;max-height:92vh;display:flex;flex-direction:column;";

  var closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Schließen");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.cssText =
    "position:absolute;top:6px;right:8px;z-index:2;background:rgba(255,255,255,.85);" +
    "border:none;color:#222;width:32px;height:32px;border-radius:999px;font:600 22px/1 system-ui;cursor:pointer;";
  closeBtn.onclick = function () { close(); };

  var iframe = document.createElement("iframe");
  iframe.title = "Mandorino — Anfrage";
  iframe.src = base + "/embed";
  iframe.setAttribute("allow", "clipboard-write");
  iframe.style.cssText =
    "border:0;width:100%;height:560px;display:block;background:transparent;flex:1;";

  frameWrap.appendChild(closeBtn);
  frameWrap.appendChild(iframe);
  overlay.appendChild(frameWrap);

  // Schließen per Klick auf Hintergrund
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) close();
  });
  // Schließen per ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.style.display === "flex") close();
  });

  // ---------- Höhe via postMessage anpassen ----------
  var iframeOrigin;
  try { iframeOrigin = new URL(iframe.src).origin; } catch (_) { iframeOrigin = null; }

  window.addEventListener("message", function (e) {
    if (iframeOrigin && e.origin !== iframeOrigin) return;
    var msg = e.data;
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "mandorino:resize" && typeof msg.height === "number") {
      var max = Math.floor(window.innerHeight * 0.92);
      iframe.style.height = Math.min(msg.height + 8, max) + "px";
    } else if (msg.type === "mandorino:submitted") {
      // Kanzlei-Tracking-Hook — eigene Listener auf der Seite können diesen Event abgreifen
      try {
        window.dispatchEvent(new CustomEvent("mandorino:submitted", { detail: msg }));
      } catch (_) { /* IE/alte Browser ignorieren */ }
    }
  });

  function open() {
    overlay.style.display = "flex";
    document.documentElement.style.overflow = "hidden";
  }
  function close() {
    overlay.style.display = "none";
    document.documentElement.style.overflow = "";
  }
  btn.addEventListener("click", open);

  // ---------- Mounten ----------
  function mount() {
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", mount, { once: true });
      return;
    }
    document.body.appendChild(btn);
    document.body.appendChild(overlay);
    if (autoOpen) open();
  }
  mount();
})();
