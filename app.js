(() => {
  const TZ = "America/Sao_Paulo";
  const STORAGE_KEY = "rotina-tom-v1";

  const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const DAY_FULL = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  /** @type {Record<number, {morning: TaskDef[], evening: TaskDef[], title: string, hint: string}>} */
  const PLAN = {
    0: {
      title: "Domingo",
      hint: "Batch Fidúcia de manhã (se for semana de lote) ou recuperação.",
      morning: [
        {
          id: "sun-fiducia",
          label: "Fidúcia pesado / batch",
          detail: "Gravar ou editar · 3–4 h se for semana de lote",
          optional: true,
          tag: "YouTube",
        },
        {
          id: "sun-rest",
          label: "Recuperação",
          detail: "Se não for batch: dormir melhor e resetar a semana",
          optional: true,
        },
      ],
      evening: [
        {
          id: "sun-dota-edit",
          label: "Short Dota (se faltou)",
          detail: "Só se ainda não publicou nesta semana · ≤45 min",
          optional: true,
          tag: "Dota",
        },
      ],
    },
    1: {
      title: "Segunda",
      hint: "Treino de manhã · Fidúcia leve à noite.",
      morning: [
        {
          id: "mon-gym",
          label: "Academia",
          detail: "6:15–7:15 · sair de casa 8:00",
          tag: "Corpo",
        },
      ],
      evening: [
        {
          id: "mon-fiducia",
          label: "Fidúcia leve",
          detail: "20:30–21:30 · ideias, títulos ou 1 pedaço de roteiro",
          tag: "YouTube",
        },
      ],
    },
    2: {
      title: "Terça",
      hint: "Húngaro de manhã · Dota + Short à noite.",
      morning: [
        {
          id: "tue-hu",
          label: "Húngaro (30 min)",
          detail: "7:00–7:30 · estudo formal",
          tag: "Idioma",
        },
      ],
      evening: [
        {
          id: "tue-dota-play",
          label: "Dota (jogar + clips)",
          detail: "20:30–22:00 · marcar 2–3 momentos",
          tag: "Dota",
        },
        {
          id: "tue-dota-edit",
          label: "Editar 1 Short",
          detail: "Teto 45–60 min · pode empurrar para quinta",
          tag: "Dota",
        },
      ],
    },
    3: {
      title: "Quarta",
      hint: "Treino de manhã · melhor bloco Fidúcia da semana útil.",
      morning: [
        {
          id: "wed-gym",
          label: "Academia",
          detail: "6:15–7:15 · sair de casa 8:00",
          tag: "Corpo",
        },
      ],
      evening: [
        {
          id: "wed-fiducia",
          label: "Fidúcia foco",
          detail: "20:30–22:00 · roteiro ou edição",
          tag: "YouTube",
        },
      ],
    },
    4: {
      title: "Quinta",
      hint: "Húngaro de manhã · buffer à noite.",
      morning: [
        {
          id: "thu-hu",
          label: "Húngaro (30 min)",
          detail: "7:00–7:30 · estudo formal",
          tag: "Idioma",
        },
      ],
      evening: [
        {
          id: "thu-buffer",
          label: "Buffer / Dota lazer",
          detail: "Terminar Short se faltou, ou jogar sem obrigação",
          optional: true,
        },
      ],
    },
    5: {
      title: "Sexta",
      hint: "Treino de manhã · noite livre de propósito.",
      morning: [
        {
          id: "fri-gym",
          label: "Academia",
          detail: "6:15–7:15 · sair de casa 8:00",
          tag: "Corpo",
        },
      ],
      evening: [
        {
          id: "fri-free",
          label: "Noite livre",
          detail: "Sem meta de conteúdo · protege a semana",
          optional: true,
        },
      ],
    },
    6: {
      title: "Sábado",
      hint: "Aula de húngaro · academia depois · batch Fidúcia 1×/mês.",
      morning: [
        {
          id: "sat-class",
          label: "Aula de húngaro",
          detail: "8:00–10:00",
          tag: "Idioma",
        },
        {
          id: "sat-gym",
          label: "Academia (pós-aula)",
          detail: "~10:30–11:45 · opcional se for sábado de batch",
          optional: true,
          tag: "Corpo",
        },
      ],
      evening: [
        {
          id: "sat-batch",
          label: "Batch Fidúcia (tarde)",
          detail: "Só 1×/mês · roteiros 3–4 h",
          optional: true,
          tag: "YouTube",
        },
        {
          id: "sat-dota",
          label: "Dota lazer",
          detail: "Sem obrigação de editar",
          optional: true,
          tag: "Dota",
        },
      ],
    },
  };

  /**
   * @typedef {{id: string, label: string, detail: string, optional?: boolean, tag?: string}} TaskDef
   */

  let selectedOffset = 0; // 0 = today
  let currentView = "dia";

  function nowInSP() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  }

  function addDays(base, n) {
    const d = new Date(base);
    d.setDate(d.getDate() + n);
    return d;
  }

  function dateKey(d = nowInSP()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function selectedDate() {
    return addDays(nowInSP(), selectedOffset);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { days: {}, streak: 0, lastComplete: null };
      return JSON.parse(raw);
    } catch {
      return { days: {}, streak: 0, lastComplete: null };
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function requiredIds(day) {
    const plan = PLAN[day];
    return [...plan.morning, ...plan.evening]
      .filter((t) => !t.optional)
      .map((t) => t.id);
  }

  function allIds(day) {
    const plan = PLAN[day];
    return [...plan.morning, ...plan.evening].map((t) => t.id);
  }

  function trackIdsFor(dayIndex) {
    const req = requiredIds(dayIndex);
    return req.length ? req : allIds(dayIndex);
  }

  function isDayComplete(state, key, dayIndex) {
    const done = state.days[key] || {};
    const ids = trackIdsFor(dayIndex);
    if (!ids.length) return false;
    return ids.every((id) => done[id]);
  }

  function recomputeStreak(state) {
    let streak = 0;
    const cursor = nowInSP();
    for (let i = 0; i < 60; i++) {
      const key = dateKey(cursor);
      const dayIndex = cursor.getDay();
      const complete = isDayComplete(state, key, dayIndex);
      if (!complete) {
        if (i === 0) {
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        break;
      }
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    state.streak = streak;
    return streak;
  }

  function checkSvg() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderTask(task, done, { interactive = true } = {}) {
    const el = document.createElement(interactive ? "button" : "div");
    if (interactive) el.type = "button";
    el.className = `task${done ? " done" : ""}${task.optional ? " optional" : ""}${
      interactive ? "" : " static"
    }`;
    if (interactive) el.dataset.id = task.id;
    el.innerHTML = `
      <span class="check">${checkSvg()}</span>
      <span class="task-copy">
        <strong>${escapeHtml(task.label)}</strong>
        <span>${escapeHtml(task.detail)}</span>
        ${task.tag ? `<span class="tag">${escapeHtml(task.tag)}</span>` : ""}
      </span>
    `;
    return el;
  }

  function renderList(el, tasks, doneMap) {
    el.innerHTML = "";
    if (!tasks.length) {
      el.innerHTML = `<li class="empty">Nada neste bloco.</li>`;
      return;
    }
    for (const task of tasks) {
      const li = document.createElement("li");
      li.appendChild(renderTask(task, Boolean(doneMap[task.id])));
      el.appendChild(li);
    }
  }

  function setRing(done, total) {
    const circle = document.getElementById("ringValue");
    const c = 2 * Math.PI * 40;
    const pct = total === 0 ? 0 : done / total;
    circle.style.strokeDasharray = String(c);
    circle.style.strokeDashoffset = String(c * (1 - pct));
    document.getElementById("doneCount").textContent = String(done);
    document.getElementById("totalCount").textContent = `/${total}`;
  }

  function weekKeys() {
    const today = nowInSP();
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = addDays(today, mondayOffset);
    const keys = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(monday, i);
      keys.push({ date: d, key: dateKey(d), dayIndex: d.getDay() });
    }
    return keys;
  }

  function upcomingKeys(count = 7) {
    const today = nowInSP();
    const keys = [];
    for (let i = 0; i < count; i++) {
      const d = addDays(today, i);
      keys.push({ date: d, key: dateKey(d), dayIndex: d.getDay(), offset: i });
    }
    return keys;
  }

  function renderDayStrip(state) {
    const strip = document.getElementById("dayStrip");
    strip.innerHTML = "";
    const todayKey = dateKey();
    for (const item of upcomingKeys(7)) {
      const ids = trackIdsFor(item.dayIndex);
      const doneMap = state.days[item.key] || {};
      const done = ids.filter((id) => doneMap[id]).length;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `strip-day${item.offset === selectedOffset ? " active" : ""}${
        item.key === todayKey ? " is-today" : ""
      }${isDayComplete(state, item.key, item.dayIndex) ? " complete" : ""}`;
      btn.dataset.offset = String(item.offset);
      const label =
        item.offset === 0
          ? "Hoje"
          : item.offset === 1
            ? "Amanhã"
            : DAY_NAMES[item.dayIndex];
      btn.innerHTML = `
        <span class="sd-l">${label}</span>
        <span class="sd-n">${item.date.getDate()}</span>
        <span class="sd-p">${done}/${ids.length}</span>
      `;
      strip.appendChild(btn);
    }
  }

  function renderWeek(state) {
    const grid = document.getElementById("weekGrid");
    const todayKey = dateKey();
    const selectedKey = dateKey(selectedDate());
    const todayClean = new Date(todayKey + "T12:00:00");
    grid.innerHTML = "";
    for (const item of weekKeys()) {
      const doneMap = state.days[item.key] || {};
      const ids = trackIdsFor(item.dayIndex);
      const done = ids.filter((id) => doneMap[id]).length;
      const complete = isDayComplete(state, item.key, item.dayIndex);
      const itemClean = new Date(item.key + "T12:00:00");
      const off = Math.round((itemClean - todayClean) / 86400000);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `day-cell${item.key === todayKey ? " today" : ""}${
        item.key === selectedKey ? " selected" : ""
      }${complete ? " complete" : ""}`;
      btn.dataset.offset = String(off);
      btn.innerHTML = `
        <span class="d">${DAY_NAMES[item.dayIndex]}</span>
        <span class="n">${itemClean.getDate()}</span>
        <span class="p">${done}/${ids.length || 0}</span>
      `;
      grid.appendChild(btn);
    }
  }

  function renderAgenda(state) {
    const list = document.getElementById("agendaList");
    list.innerHTML = "";
    for (const item of upcomingKeys(7)) {
      const plan = PLAN[item.dayIndex];
      const doneMap = state.days[item.key] || {};
      const ids = trackIdsFor(item.dayIndex);
      const done = ids.filter((id) => doneMap[id]).length;
      const card = document.createElement("article");
      card.className = `agenda-card${item.offset === 0 ? " today" : ""}`;
      const heading =
        item.offset === 0
          ? "Hoje"
          : item.offset === 1
            ? "Amanhã"
            : DAY_FULL[item.dayIndex];
      const dateStr = item.date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });

      const tasks = [...plan.morning, ...plan.evening];
      const rows = tasks
        .map((t) => {
          const ok = Boolean(doneMap[t.id]);
          return `<li class="agenda-task${ok ? " done" : ""}${
            t.optional ? " optional" : ""
          }">
            <span class="dot"></span>
            <span>
              <strong>${escapeHtml(t.label)}</strong>
              <small>${t.tag ? escapeHtml(t.tag) + " · " : ""}${
                t.optional ? "opcional · " : ""
              }${escapeHtml(
                t.detail.split("·")[0].trim()
              )}</small>
            </span>
          </li>`;
        })
        .join("");

      card.innerHTML = `
        <button type="button" class="agenda-head" data-offset="${item.offset}">
          <div>
            <strong>${heading}</strong>
            <span>${dateStr} · ${plan.hint}</span>
          </div>
          <em>${done}/${ids.length}</em>
        </button>
        <ul class="agenda-tasks">${rows}</ul>
      `;
      list.appendChild(card);
    }
  }

  function renderOverviewByTag() {
    const root = document.getElementById("overviewByTag");
    const tags = ["Corpo", "Idioma", "YouTube", "Dota"];
    const byTag = {};
    for (const tag of tags) byTag[tag] = [];

    for (let day = 0; day < 7; day++) {
      const plan = PLAN[day];
      for (const t of [...plan.morning, ...plan.evening]) {
        const tag = t.tag || "Outros";
        if (!byTag[tag]) byTag[tag] = [];
        byTag[tag].push({
          day,
          label: t.label,
          detail: t.detail,
          optional: Boolean(t.optional),
        });
      }
    }

    root.innerHTML = "";
    for (const [tag, items] of Object.entries(byTag)) {
      if (!items.length) continue;
      const card = document.createElement("article");
      card.className = "tag-card";
      const rows = items
        .map(
          (it) => `<li>
          <strong>${DAY_NAMES[it.day]}</strong>
          <span>${escapeHtml(it.label)}${
            it.optional ? " · opcional" : ""
          }</span>
        </li>`
        )
        .join("");
      card.innerHTML = `
        <header>
          <h4>${escapeHtml(tag)}</h4>
          <span>${items.length} tarefa${items.length > 1 ? "s" : ""}/sem</span>
        </header>
        <ul>${rows}</ul>
      `;
      root.appendChild(card);
    }
  }

  function greetingForHour(h) {
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  }

  function setView(view) {
    currentView = view;
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.toggle("active", t.dataset.view === view));
    document.getElementById("viewDia").classList.toggle("hidden", view !== "dia");
    document
      .getElementById("viewProximos")
      .classList.toggle("hidden", view !== "proximos");
    document
      .getElementById("viewVisao")
      .classList.toggle("hidden", view !== "visao");
  }

  function render() {
    const state = loadState();
    const now = nowInSP();
    const selected = selectedDate();
    const key = dateKey(selected);
    const dayIndex = selected.getDay();
    const plan = PLAN[dayIndex];
    const doneMap = state.days[key] || {};
    const trackIds = trackIdsFor(dayIndex);
    const done = trackIds.filter((id) => doneMap[id]).length;

    const relative =
      selectedOffset === 0
        ? "Hoje"
        : selectedOffset === 1
          ? "Amanhã"
          : selectedOffset === -1
            ? "Ontem"
            : DAY_FULL[dayIndex];

    document.getElementById("dateLabel").textContent = `${relative} · ${selected.toLocaleDateString(
      "pt-BR",
      { weekday: "short", day: "2-digit", month: "short" }
    )} · SP`;
    document.getElementById("greeting").textContent = greetingForHour(
      now.getHours()
    );
    document.getElementById("dayTitle").textContent =
      selectedOffset === 0 ? plan.title : `${relative} · ${plan.title}`;
    document.getElementById("dayHint").textContent = plan.hint;

    const streak = recomputeStreak(state);
    saveState(state);
    document.getElementById("streakLabel").textContent =
      streak > 0
        ? `Sequência: ${streak} dia${streak > 1 ? "s" : ""}`
        : "Sequência: comece hoje";

    setRing(done, trackIds.length);
    renderDayStrip(state);
    renderList(document.getElementById("morningTasks"), plan.morning, doneMap);
    renderList(document.getElementById("eveningTasks"), plan.evening, doneMap);
    renderAgenda(state);
    renderOverviewByTag();
    renderWeek(state);
    setView(currentView);
  }

  function toggleTask(id) {
    const state = loadState();
    const key = dateKey(selectedDate());
    state.days[key] = state.days[key] || {};
    state.days[key][id] = !state.days[key][id];
    if (!state.days[key][id]) delete state.days[key][id];
    recomputeStreak(state);
    saveState(state);
    render();
  }

  document.getElementById("morningTasks").addEventListener("click", (e) => {
    const btn = e.target.closest(".task");
    if (!btn) return;
    toggleTask(btn.dataset.id);
  });

  document.getElementById("eveningTasks").addEventListener("click", (e) => {
    const btn = e.target.closest(".task");
    if (!btn) return;
    toggleTask(btn.dataset.id);
  });

  document.getElementById("dayStrip").addEventListener("click", (e) => {
    const btn = e.target.closest(".strip-day");
    if (!btn) return;
    selectedOffset = Number(btn.dataset.offset);
    render();
  });

  document.getElementById("agendaList").addEventListener("click", (e) => {
    const head = e.target.closest(".agenda-head");
    if (!head) return;
    selectedOffset = Number(head.dataset.offset);
    setView("dia");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.getElementById("weekGrid").addEventListener("click", (e) => {
    const cell = e.target.closest(".day-cell");
    if (!cell) return;
    selectedOffset = Number(cell.dataset.offset);
    setView("dia");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.querySelector(".tabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;
    setView(tab.dataset.view);
  });

  document.getElementById("resetToday").addEventListener("click", () => {
    const label =
      selectedOffset === 0
        ? "hoje"
        : dateKey(selectedDate());
    if (!confirm(`Limpar as marcações de ${label}?`)) return;
    const state = loadState();
    delete state.days[dateKey(selectedDate())];
    recomputeStreak(state);
    saveState(state);
    render();
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  render();
})();
