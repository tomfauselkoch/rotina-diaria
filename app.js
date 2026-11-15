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

  function nowInSP() {
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: TZ })
    );
  }

  function dateKey(d = nowInSP()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
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

  function isDayComplete(state, key, dayIndex) {
    const done = state.days[key] || {};
    const req = requiredIds(dayIndex);
    if (req.length === 0) {
      const any = allIds(dayIndex).some((id) => done[id]);
      return any;
    }
    return req.every((id) => done[id]);
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
          // hoje incompleto não quebra sequência anterior
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

  function renderTask(task, done) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `task${done ? " done" : ""}${task.optional ? " optional" : ""}`;
    btn.dataset.id = task.id;
    btn.innerHTML = `
      <span class="check">${checkSvg()}</span>
      <span class="task-copy">
        <strong>${task.label}</strong>
        <span>${task.detail}</span>
        ${task.tag ? `<span class="tag">${task.tag}</span>` : ""}
      </span>
    `;
    return btn;
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
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const keys = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      keys.push({ date: d, key: dateKey(d), dayIndex: d.getDay() });
    }
    return keys;
  }

  function renderWeek(state) {
    const grid = document.getElementById("weekGrid");
    const todayKey = dateKey();
    grid.innerHTML = "";
    for (const item of weekKeys()) {
      const doneMap = state.days[item.key] || {};
      const req = requiredIds(item.dayIndex);
      const ids = req.length ? req : allIds(item.dayIndex);
      const done = ids.filter((id) => doneMap[id]).length;
      const total = ids.length || 1;
      const complete = isDayComplete(state, item.key, item.dayIndex);
      const cell = document.createElement("div");
      cell.className = `day-cell${item.key === todayKey ? " today" : ""}${
        complete ? " complete" : ""
      }`;
      cell.innerHTML = `
        <span class="d">${DAY_NAMES[item.dayIndex]}</span>
        <span class="n">${item.date.getDate()}</span>
        <span class="p">${done}/${ids.length || 0}</span>
      `;
      grid.appendChild(cell);
    }
  }

  function greetingForHour(h) {
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  }

  function render() {
    const state = loadState();
    const now = nowInSP();
    const key = dateKey(now);
    const dayIndex = now.getDay();
    const plan = PLAN[dayIndex];
    const doneMap = state.days[key] || {};

    const tasks = [...plan.morning, ...plan.evening];
    const trackIds = requiredIds(dayIndex).length
      ? requiredIds(dayIndex)
      : tasks.map((t) => t.id);
    const done = trackIds.filter((id) => doneMap[id]).length;

    document.getElementById("dateLabel").textContent =
      `${DAY_FULL[dayIndex]} · ${now.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })} · SP`;
    document.getElementById("greeting").textContent = greetingForHour(
      now.getHours()
    );
    document.getElementById("dayTitle").textContent = plan.title;
    document.getElementById("dayHint").textContent = plan.hint;

    const streak = recomputeStreak(state);
    saveState(state);
    document.getElementById("streakLabel").textContent =
      streak > 0
        ? `Sequência: ${streak} dia${streak > 1 ? "s" : ""}`
        : "Sequência: comece hoje";

    setRing(done, trackIds.length);
    renderList(document.getElementById("morningTasks"), plan.morning, doneMap);
    renderList(document.getElementById("eveningTasks"), plan.evening, doneMap);
    renderWeek(state);
  }

  function toggleTask(id) {
    const state = loadState();
    const key = dateKey();
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

  document.getElementById("resetToday").addEventListener("click", () => {
    if (!confirm("Limpar as marcações de hoje?")) return;
    const state = loadState();
    delete state.days[dateKey()];
    recomputeStreak(state);
    saveState(state);
    render();
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  render();
})();
