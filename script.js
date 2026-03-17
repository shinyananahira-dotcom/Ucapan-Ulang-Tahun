const $ = (sel) => document.querySelector(sel);

const els = {
  chat: $("#chat"),
  quick: $("#quick"),
  btnCopy: $("#btnCopy"),
  btnConfetti: $("#btnConfetti"),
  btnBack: $("#btnBack"),
  btnPhoto: $("#btnPhoto"),
  inputFrom: $("#inputFrom"),
  inputPhoto: $("#inputPhoto"),
  chatName: $("#chatName"),
  chatStatus: $("#chatStatus"),
  confetti: $("#confetti"),
  photo: $("#photo"),
};

const TEXT_FULL = `Selamat ulang tahun yang ke-16, Mio! 🎉🎂

Hari ini adalah momen spesial untukmu—semoga di usia yang ke-16 ini, kamu semakin dewasa, semakin kuat menghadapi segala tantangan, dan semakin dekat dengan semua impianmu.

Semoga setiap langkahmu dipenuhi kebahagiaan, kesehatan, dan keberuntungan. Jangan pernah ragu untuk bermimpi besar ya, karena masa depanmu masih panjang dan penuh peluang luar biasa!

Tetap jadi pribadi yang baik, ceria, dan menginspirasi orang-orang di sekitarmu. Selamat menikmati hari istimewamu, Mio! 💖✨`;

const FLOW = [
  { who: "them", text: "Hai Kamu" },
  { who: "them", text: "Cieee…" },
  { who: "them", text: "Yang hari ini ulang tahun" },
  {
    choice: true,
    options: ["Hehe iya", "Kok tau?", "Bukan aku kok"],
  },
  { who: "them", text: "Selamat ulang tahun yang ke-16, Mio! 🎉🎂" },
  { who: "them", text: "Semoga panjang umur dan sehat selalu ya." },
  {
    choice: true,
    options: ["Aamiin", "Makasih ya", "Doain yang baik-baik"],
  },
  {
    who: "them",
    text: "Hari ini momen spesial—semoga kamu makin dewasa, makin kuat, dan makin dekat sama impianmu.",
  },
  {
    who: "them",
    text: "Jangan ragu bermimpi besar. Masa depanmu masih panjang dan penuh peluang luar biasa!",
  },
  {
    choice: true,
    options: ["Aku terharu", "Semangat!", "Kamu baik banget"],
  },
  {
    who: "them",
    text: "Tetap jadi pribadi yang baik, ceria, dan menginspirasi orang-orang di sekitarmu.",
  },
  { who: "them", text: "Mio, enjoy your day. 💖✨" },
  { done: true },
];

const state = {
  step: 0,
  running: false,
  copiedFlash: false,
  fromName: "Seseorang yang peduli",
};

init();

function init() {
  hydrateFromName();
  wireComposer();
  wireCopy();
  wireBack();
  wireConfetti();
  wirePhoto();

  ConfettiEngine.mount(els.confetti);
  startFlow();
}

function hydrateFromName() {
  const saved = localStorage.getItem("fromName");
  if (saved && typeof saved === "string") {
    state.fromName = saved;
    if (els.inputFrom) els.inputFrom.value = saved === "Seseorang yang peduli" ? "" : saved;
  }
}

function wireComposer() {
  if (!els.inputFrom) return;
  els.inputFrom.addEventListener("input", () => {
    const v = els.inputFrom.value.trim();
    state.fromName = v.length ? v : "Seseorang yang peduli";
    localStorage.setItem("fromName", state.fromName);
  });
}

function wireCopy() {
  if (!els.btnCopy) return;
  els.btnCopy.addEventListener("click", async () => {
    const payload = `${TEXT_FULL}\n\n— ${state.fromName}`;
    await copyToClipboard(payload);
    flashButton(els.btnCopy, "Tersalin!");
  });
}

function wireBack() {
  if (!els.btnBack) return;
  els.btnBack.addEventListener("click", () => {
    resetChat();
    startFlow();
  });
}

function wireConfetti() {
  if (!els.btnConfetti) return;
  els.btnConfetti.addEventListener("click", () => {
    ConfettiEngine.burst(120);
  });
}

function wirePhoto() {
  if (!els.btnPhoto || !els.inputPhoto || !els.photo) return;

  const saved = localStorage.getItem("photoDataUrl");
  if (saved && typeof saved === "string" && saved.startsWith("data:image/")) {
    els.photo.src = saved;
  }

  els.btnPhoto.addEventListener("click", () => {
    els.inputPhoto.click();
  });

  els.inputPhoto.addEventListener("change", async () => {
    const file = els.inputPhoto.files && els.inputPhoto.files[0];
    if (!file) return;
    if (!file.type || !file.type.startsWith("image/")) return;

    const dataUrl = await readFileAsDataUrl(file);
    els.photo.src = dataUrl;
    localStorage.setItem("photoDataUrl", dataUrl);
    flashButton(els.btnPhoto, "Oke!");
  });
}

function resetChat() {
  state.step = 0;
  state.running = false;
  if (els.chat) els.chat.innerHTML = "";
  clearQuick();
}

async function startFlow() {
  if (!els.chat) return;
  state.running = true;
  els.chatName.textContent = "Hai Kamu";
  els.chatStatus.textContent = "online";

  while (state.step < FLOW.length) {
    const node = FLOW[state.step];

    if (node.choice) {
      renderChoices(node.options);
      state.running = false;
      return;
    }

    if (node.done) {
      clearQuick();
      els.chatStatus.textContent = "sedang merayakan…";
      ConfettiEngine.burst(180);
      await sleep(250);
      appendBubble("them", "Kalau mau, klik tombol Salin ya.");
      els.chatStatus.textContent = "online";
      state.step += 1;
      return;
    }

    appendBubble(node.who, node.text);
    state.step += 1;

    scrollChatToBottom();
    await sleep(node.who === "them" ? 520 : 260);
  }
}

function appendBubble(who, text) {
  const bubble = document.createElement("div");
  bubble.className = `bubble bubble--${who}`;
  bubble.textContent = text;
  els.chat.appendChild(bubble);
}

function renderChoices(options) {
  clearQuick();
  options.forEach((label) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quickBtn";
    btn.textContent = label;
    btn.addEventListener("click", async () => {
      clearQuick();
      appendBubble("me", label);
      scrollChatToBottom();
      state.step += 1; // consume choice node
      await sleep(380);
      state.running = true;
      await startFlow();
    });
    els.quick.appendChild(btn);
  });
}

function clearQuick() {
  if (els.quick) els.quick.innerHTML = "";
}

function scrollChatToBottom() {
  if (!els.chat) return;
  els.chat.scrollTo({ top: els.chat.scrollHeight, behavior: "smooth" });
}

function flashButton(btn, text, ms = 900) {
  const prev = btn.textContent;
  btn.textContent = text;
  btn.disabled = true;
  window.setTimeout(() => {
    btn.textContent = prev;
    btn.disabled = false;
  }, ms);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

function sleep(ms) {
  return new Promise((r) => window.setTimeout(r, ms));
}

// Lightweight confetti (canvas)
const ConfettiEngine = (() => {
  let canvas = null;
  let ctx = null;
  let w = 0;
  let h = 0;
  let raf = 0;
  let last = performance.now();

  const pieces = [];
  const colors = ["#34D7FF", "#FF4AA9", "#7C5CFF", "#FFD36E", "#38FFA4"];

  const resize = () => {
    if (!canvas) return;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = Math.floor(canvas.clientWidth * dpr);
    h = Math.floor(canvas.clientHeight * dpr);
    canvas.width = w;
    canvas.height = h;
    if (ctx) ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  const spawn = (n) => {
    for (let i = 0; i < n; i += 1) {
      const size = rand(7, 14);
      pieces.push({
        x: w * 0.5 + rand(-w * 0.22, w * 0.22),
        y: h * 0.15 + rand(-h * 0.12, h * 0.12),
        vx: rand(-260, 260),
        vy: rand(-320, -110),
        rot: rand(0, Math.PI * 2),
        vr: rand(-7, 7),
        size,
        col: colors[(Math.random() * colors.length) | 0],
        life: rand(0.9, 1.8),
        t: 0,
      });
    }
  };

  const drawPiece = (p) => {
    const a = 1 - p.t / p.life;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.fillStyle = p.col;
    ctx.fillRect(-p.size / 2, -p.size * 0.28, p.size * 1.1, p.size * 0.56);
    ctx.restore();
  };

  const step = (t) => {
    raf = requestAnimationFrame(step);
    if (!ctx) return;
    const dt = Math.min(0.032, (t - last) / 1000);
    last = t;
    ctx.clearRect(0, 0, w, h);

    const g = 560;
    for (let i = pieces.length - 1; i >= 0; i -= 1) {
      const p = pieces[i];
      p.t += dt;
      if (p.t > p.life) {
        pieces.splice(i, 1);
        continue;
      }
      p.vy += g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      drawPiece(p);
    }
  };

  const mount = (el) => {
    canvas = el;
    if (!canvas) return;
    ctx = canvas.getContext("2d", { alpha: true });
    resize();
    window.addEventListener("resize", resize, { passive: true });
    if (!raf) raf = requestAnimationFrame(step);
  };

  const burst = (n = 140) => {
    if (!canvas) return;
    resize();
    spawn(n);
  };

  return { mount, burst };
})();

function rand(min, max) {
  return min + Math.random() * (max - min);
}

