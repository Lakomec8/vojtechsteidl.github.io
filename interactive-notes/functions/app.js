(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const randomItem = (items) => items[Math.floor(Math.random() * items.length)];
  const shuffle = (items) => {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const next = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[next]] = [copy[next], copy[index]];
    }
    return copy;
  };
  const nearlyEqual = (first, second, tolerance = 1e-8) =>
    Math.abs(first - second) <= tolerance;
  const fmt = (value, digits = 2) => {
    if (!Number.isFinite(value)) return "není definováno";
    const rounded = Math.abs(value) < 1e-10 ? 0 : value;
    return new Intl.NumberFormat("cs-CZ", {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0,
    }).format(rounded);
  };
  const currency = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  });
  const setFeedback = (element, message, type = "") => {
    element.textContent = message;
    element.classList.remove("correct", "wrong");
    if (type) element.classList.add(type);
  };

  const STORAGE_KEY = "interactive-functions-progress-v1";
  const trackedSections = [
    "start",
    "domain",
    "graph-lab",
    "transformations",
    "reading",
    "model",
    "final-test",
  ];

  const loadProgress = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        completed: Array.isArray(stored.completed) ? stored.completed : [],
        bestScore: Number(stored.bestScore) || 0,
      };
    } catch (error) {
      console.warn("Průběh lekce se nepodařilo načíst.", error);
      return { completed: [], bestScore: 0 };
    }
  };

  let progressState = loadProgress();

  const saveProgress = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressState));
  };

  const updateProgressUi = () => {
    const completedCount = trackedSections.filter((section) =>
      progressState.completed.includes(section),
    ).length;
    const percentage = Math.round((completedCount / trackedSections.length) * 100);

    $("headerProgressText").textContent = `${percentage} % dokončeno`;
    $("headerProgressBar").style.width = `${percentage}%`;
    $("completionText").textContent = `${completedCount} ze ${trackedSections.length} částí dokončeno`;
    $("completionBar").style.width = `${percentage}%`;
    $("navBestScore").textContent = progressState.bestScore
      ? `${progressState.bestScore} %`
      : "–";

    $$('[data-section-link]').forEach((link) => {
      link.classList.toggle(
        "completed",
        progressState.completed.includes(link.dataset.sectionLink),
      );
    });

    $$("[data-checkpoint]").forEach((checkpoint) => {
      const section = checkpoint.dataset.checkpoint;
      const completed = progressState.completed.includes(section);
      checkpoint.classList.toggle("completed", completed);
      const button = checkpoint.querySelector(".checkpoint-button");
      button.textContent = completed ? "Pochopeno ✓" : "Označit jako pochopené";
    });
  };

  const completeSection = (section) => {
    if (!progressState.completed.includes(section)) {
      progressState.completed.push(section);
      saveProgress();
      updateProgressUi();
    }
  };

  $$("[data-checkpoint]").forEach((checkpoint) => {
    checkpoint.querySelector(".checkpoint-button").addEventListener("click", () => {
      completeSection(checkpoint.dataset.checkpoint);
    });
  });

  $("resetProgress").addEventListener("click", () => {
    const shouldReset = window.confirm(
      "Opravdu chcete smazat uložený průběh a nejlepší výsledek testu?",
    );
    if (!shouldReset) return;
    progressState = { completed: [], bestScore: 0 };
    saveProgress();
    updateProgressUi();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
      if (!visible) return;
      $$('[data-section-link]').forEach((link) => {
        link.classList.toggle(
          "active",
          link.dataset.sectionLink === visible.target.id,
        );
      });
    },
    { rootMargin: "-20% 0px -65% 0px", threshold: [0.05, 0.2, 0.4] },
  );
  $$('[data-track-section]').forEach((section) => sectionObserver.observe(section));

  const machineRules = {
    linear: {
      label: "f(x) = 2x + 3",
      evaluate: (x) => 2 * x + 3,
      steps: (x) => `f(${fmt(x)}) = 2 · ${fmt(x)} + 3 = ${fmt(2 * x + 3)}`,
      excluded: () => false,
    },
    quadratic: {
      label: "f(x) = x² − 1",
      evaluate: (x) => x ** 2 - 1,
      steps: (x) => `f(${fmt(x)}) = (${fmt(x)})² − 1 = ${fmt(x ** 2 - 1)}`,
      excluded: () => false,
    },
    absolute: {
      label: "f(x) = |x|",
      evaluate: (x) => Math.abs(x),
      steps: (x) => `f(${fmt(x)}) = |${fmt(x)}| = ${fmt(Math.abs(x))}`,
      excluded: () => false,
    },
    reciprocal: {
      label: "f(x) = 1 / (x − 1)",
      evaluate: (x) => (nearlyEqual(x, 1) ? NaN : 1 / (x - 1)),
      steps: (x) =>
        nearlyEqual(x, 1)
          ? "Pro x = 1 je jmenovatel nulový, takže funkční hodnota neexistuje."
          : `f(${fmt(x)}) = 1 / (${fmt(x)} − 1) = ${fmt(1 / (x - 1))}`,
      excluded: (x) => nearlyEqual(x, 1),
    },
  };

  let machineQuestion = { x: 4, answer: 11 };

  const createMachineQuestion = () => {
    const rule = machineRules[$("machineRule").value];
    let x = randomItem([-4, -3, -2, -1, 0, 2, 3, 4, 5]);
    while (rule.excluded(x)) x += 1;
    machineQuestion = { x, answer: rule.evaluate(x) };
    $("machineQuestion").textContent = `Kolik je f(${fmt(x)}) pro předpis ${rule.label}?`;
    $("machineAnswer").value = "";
    setFeedback($("machineFeedback"), "");
  };

  const updateMachine = () => {
    const rule = machineRules[$("machineRule").value];
    const input = Number($("machineInput").value);
    const value = rule.evaluate(input);
    $("machineOutput").textContent = Number.isFinite(value) ? fmt(value) : "nedefinováno";
    $("machineSteps").textContent = rule.steps(input);

    const sampleInputs = [-2, -1, 0, 1, 2];
    $("machineTable").innerHTML = sampleInputs
      .map((x) => {
        const output = rule.evaluate(x);
        return `<tr><td>${fmt(x)}</td><td>${Number.isFinite(output) ? fmt(output) : "—"}</td></tr>`;
      })
      .join("");

    createMachineQuestion();
  };

  $("machineRule").addEventListener("change", updateMachine);
  $("machineInput").addEventListener("input", updateMachine);
  $("checkMachine").addEventListener("click", () => {
    const answer = Number($("machineAnswer").value.replace(",", "."));
    if (!Number.isFinite(answer)) {
      setFeedback($("machineFeedback"), "Zadejte číselnou odpověď.", "wrong");
      return;
    }
    if (nearlyEqual(answer, machineQuestion.answer, 0.01)) {
      setFeedback(
        $("machineFeedback"),
        `Správně. Dosazením vyjde ${fmt(machineQuestion.answer)}.`,
        "correct",
      );
    } else {
      setFeedback(
        $("machineFeedback"),
        `Ještě ne. Nejprve dosaďte x = ${fmt(machineQuestion.x)} do zvoleného předpisu.`,
        "wrong",
      );
    }
  });
  $("machineAnswer").addEventListener("keydown", (event) => {
    if (event.key === "Enter") $("checkMachine").click();
  });

  const relationTasks = [
    {
      pairs: [[-2, 4], [-1, 1], [0, 0], [1, 1], [2, 4]],
      isFunction: true,
      explanation: "Každý vstup se objevuje pouze s jedním výstupem. Různé vstupy mohou mít stejný výstup.",
    },
    {
      pairs: [[1, 2], [1, 5], [2, 7], [3, 9]],
      isFunction: false,
      explanation: "Vstup x = 1 má dva různé výstupy 2 a 5, proto nejde o funkci.",
    },
    {
      pairs: [[-3, 0], [-2, 0], [-1, 0], [0, 0]],
      isFunction: true,
      explanation: "Je dovoleno, aby více vstupů mělo stejný výstup. Každý vstup má stále právě jeden.",
    },
    {
      pairs: [[0, -1], [2, 3], [4, 7], [4, 8]],
      isFunction: false,
      explanation: "Vstup x = 4 je přiřazen dvěma různým hodnotám, takže pravidlo porušuje definici funkce.",
    },
    {
      pairs: [[-2, -8], [-1, -1], [0, 0], [1, 1], [2, 8]],
      isFunction: true,
      explanation: "Každému x odpovídá jediná hodnota. Jde o tabulku funkce y = x³.",
    },
    {
      pairs: [[-1, 2], [0, 1], [1, 2], [2, 5]],
      isFunction: true,
      explanation: "Výstup 2 se může opakovat. Rozhodující je, že se stejný vstup neopakuje s jinou hodnotou.",
    },
    {
      pairs: [[2, 4], [3, 9], [2, -4], [4, 16]],
      isFunction: false,
      explanation: "Pro x = 2 jsou uvedeny dva rozdílné výstupy 4 a −4.",
    },
    {
      pairs: [[-4, 2], [-2, 1], [0, 0], [2, -1], [4, -2]],
      isFunction: true,
      explanation: "Všech pět vstupů je různých, a tedy každý má právě jeden výstup.",
    },
  ];

  let relationOrder = shuffle(relationTasks);
  let relationIndex = 0;
  let relationCorrect = 0;
  let relationAnswered = false;

  const renderRelation = () => {
    const task = relationOrder[relationIndex];
    $("relationPairs").innerHTML = task.pairs
      .map(([x, y]) => `<span class="relation-pair">(${fmt(x)}; ${fmt(y)})</span>`)
      .join("");
    $("relationScore").textContent = relationCorrect;
    $("relationTotal").textContent = relationIndex;
    relationAnswered = false;
    setFeedback($("relationFeedback"), "");
    $("nextRelation").disabled = true;
    $$('[data-relation-answer]').forEach((button) => {
      button.disabled = false;
      button.classList.remove("correct", "wrong");
    });
  };

  $$('[data-relation-answer]').forEach((button) => {
    button.addEventListener("click", () => {
      if (relationAnswered) return;
      relationAnswered = true;
      const task = relationOrder[relationIndex];
      const choice = button.dataset.relationAnswer === "true";
      const correct = choice === task.isFunction;
      if (correct) relationCorrect += 1;
      button.classList.add(correct ? "correct" : "wrong");
      document
        .querySelector(`[data-relation-answer="${String(task.isFunction)}"]`)
        .classList.add("correct");
      $$('[data-relation-answer]').forEach((candidate) => {
        candidate.disabled = true;
      });
      $("relationScore").textContent = relationCorrect;
      $("relationTotal").textContent = relationIndex + 1;
      setFeedback(
        $("relationFeedback"),
        `${correct ? "Správně." : "Nesprávně."} ${task.explanation}`,
        correct ? "correct" : "wrong",
      );
      $("nextRelation").disabled = false;
    });
  });

  $("nextRelation").addEventListener("click", () => {
    relationIndex += 1;
    if (relationIndex >= relationOrder.length) {
      relationOrder = shuffle(relationTasks);
      relationIndex = 0;
      relationCorrect = 0;
    }
    renderRelation();
  });

  class GraphRenderer {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.xMin = options.xMin ?? -10;
      this.xMax = options.xMax ?? 10;
      this.yMin = options.yMin ?? -8;
      this.yMax = options.yMax ?? 8;
      this.current = null;
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(canvas.parentElement);
      this.resize();
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const width = Math.max(320, Math.round(rect.width || this.canvas.width));
      const height = Math.max(280, Math.round(rect.height || this.canvas.height));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(width * ratio);
      this.canvas.height = Math.round(height * ratio);
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      this.width = width;
      this.height = height;
      if (this.current) this.draw(this.current);
    }

    toCanvas(x, y) {
      return {
        x: ((x - this.xMin) / (this.xMax - this.xMin)) * this.width,
        y: this.height - ((y - this.yMin) / (this.yMax - this.yMin)) * this.height,
      };
    }

    toGraph(px, py) {
      return {
        x: this.xMin + (px / this.width) * (this.xMax - this.xMin),
        y: this.yMax - (py / this.height) * (this.yMax - this.yMin),
      };
    }

    draw(config) {
      this.current = config;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, this.width, this.height);
      this.drawGrid();

      (config.verticalAsymptotes || []).forEach((x) =>
        this.drawAsymptote("vertical", x),
      );
      (config.horizontalAsymptotes || []).forEach((y) =>
        this.drawAsymptote("horizontal", y),
      );

      if (config.targetEvaluator) {
        this.drawFunction(config.targetEvaluator, {
          color: "#c2410c",
          width: 3,
          dash: [9, 7],
        });
      }

      this.drawFunction(config.evaluator, {
        color: config.color || "#2563eb",
        width: config.lineWidth || 3.2,
        dash: config.dash || [],
      });

      (config.points || []).forEach((point) => this.drawPoint(point));
    }

    drawGrid() {
      const ctx = this.ctx;
      ctx.save();
      ctx.lineWidth = 1;
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      for (let x = Math.ceil(this.xMin); x <= this.xMax; x += 1) {
        const point = this.toCanvas(x, 0);
        ctx.strokeStyle = x === 0 ? "#64748b" : "#e8edf3";
        ctx.lineWidth = x === 0 ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(point.x, 0);
        ctx.lineTo(point.x, this.height);
        ctx.stroke();
        if (x !== 0 && x % 2 === 0) {
          const axisY = clamp(this.toCanvas(0, 0).y + 5, 3, this.height - 16);
          ctx.fillStyle = "#64748b";
          ctx.fillText(String(x), point.x, axisY);
        }
      }

      for (let y = Math.ceil(this.yMin); y <= this.yMax; y += 1) {
        const point = this.toCanvas(0, y);
        ctx.strokeStyle = y === 0 ? "#64748b" : "#e8edf3";
        ctx.lineWidth = y === 0 ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(0, point.y);
        ctx.lineTo(this.width, point.y);
        ctx.stroke();
        if (y !== 0 && y % 2 === 0) {
          const axisX = clamp(this.toCanvas(0, 0).x + 7, 3, this.width - 25);
          ctx.fillStyle = "#64748b";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(String(y), axisX, point.y);
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
        }
      }

      const origin = this.toCanvas(0, 0);
      ctx.fillStyle = "#475569";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("x", this.width - 14, clamp(origin.y + 6, 3, this.height - 15));
      ctx.fillText("y", clamp(origin.x + 8, 3, this.width - 15), 5);
      ctx.restore();
    }

    drawAsymptote(direction, value) {
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      if (direction === "vertical") {
        const point = this.toCanvas(value, 0);
        ctx.moveTo(point.x, 0);
        ctx.lineTo(point.x, this.height);
      } else {
        const point = this.toCanvas(0, value);
        ctx.moveTo(0, point.y);
        ctx.lineTo(this.width, point.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    drawFunction(evaluator, style) {
      const ctx = this.ctx;
      const samples = Math.max(700, Math.round(this.width * 1.4));
      ctx.save();
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.width;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.setLineDash(style.dash);
      ctx.beginPath();

      let drawing = false;
      let previousY = null;
      for (let index = 0; index <= samples; index += 1) {
        const x = this.xMin + (index / samples) * (this.xMax - this.xMin);
        const y = evaluator(x);
        const point = this.toCanvas(x, y);
        const invalid =
          !Number.isFinite(y) ||
          point.y < -this.height * 2 ||
          point.y > this.height * 3 ||
          (previousY !== null && Math.abs(point.y - previousY) > this.height * 0.75);

        if (invalid) {
          drawing = false;
          previousY = null;
          continue;
        }

        if (!drawing) {
          ctx.moveTo(point.x, point.y);
          drawing = true;
        } else {
          ctx.lineTo(point.x, point.y);
        }
        previousY = point.y;
      }
      ctx.stroke();
      ctx.restore();
    }

    drawPoint(point) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
      const position = this.toCanvas(point.x, point.y);
      if (
        position.x < -10 ||
        position.x > this.width + 10 ||
        position.y < -10 ||
        position.y > this.height + 10
      ) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = point.color || "#102a43";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(position.x, position.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (point.label) {
        ctx.fillStyle = "#102a43";
        ctx.font = "700 12px system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(point.label, position.x + 8, position.y - 7);
      }
      ctx.restore();
    }
  }

  const coefficient = (value) => {
    if (nearlyEqual(value, 1)) return "";
    if (nearlyEqual(value, -1)) return "−";
    return fmt(value);
  };
  const addTerm = (value) => {
    if (nearlyEqual(value, 0)) return "";
    return value > 0 ? ` + ${fmt(value)}` : ` − ${fmt(Math.abs(value))}`;
  };
  const shiftInside = (value) => {
    if (nearlyEqual(value, 0)) return "x";
    return value > 0 ? `x − ${fmt(value)}` : `x + ${fmt(Math.abs(value))}`;
  };

  const rootsText = (roots) => {
    const finiteRoots = roots.filter(Number.isFinite);
    const uniqueRoots = finiteRoots.filter(
      (root, index) =>
        finiteRoots.findIndex((candidate) => nearlyEqual(candidate, root, 1e-7)) === index,
    );
    if (!uniqueRoots.length) return "žádný";
    return uniqueRoots.map((root) => fmt(root)).join("; ");
  };

  const functionFamilies = {
    linear: {
      defaults: { a: 1, b: 0 },
      params: [
        { key: "a", label: "Směrnice a", min: -4, max: 4, step: 0.5, help: "Určuje sklon a směr růstu." },
        { key: "b", label: "Průsečík b", min: -6, max: 6, step: 0.5, help: "Hodnota funkce pro x = 0." },
      ],
      presets: [
        { label: "Rostoucí", values: { a: 2, b: -1 } },
        { label: "Klesající", values: { a: -1.5, b: 3 } },
        { label: "Konstantní", values: { a: 0, b: 2 } },
        { label: "Přímá úměrnost", values: { a: 1, b: 0 } },
      ],
      evaluator: ({ a, b }) => (x) => a * x + b,
      formula: ({ a, b }) => `f(x) = ${coefficient(a)}x${addTerm(b)}`,
      properties: ({ a, b }) => {
        const root = !nearlyEqual(a, 0) ? -b / a : NaN;
        return [
          ["Definiční obor", "ℝ"],
          ["Obor hodnot", nearlyEqual(a, 0) ? `{${fmt(b)}}` : "ℝ"],
          ["Nulový bod", nearlyEqual(a, 0) ? (nearlyEqual(b, 0) ? "všechna x" : "žádný") : fmt(root)],
          ["Průsečík s osou y", `[0; ${fmt(b)}]`],
          ["Monotonie", a > 0 ? "rostoucí" : a < 0 ? "klesající" : "konstantní"],
          ["Symetrie", nearlyEqual(b, 0) ? "lichá" : "obecně žádná"],
        ];
      },
      points: ({ a, b }) => {
        const points = [{ x: 0, y: b, label: "Y" }];
        if (!nearlyEqual(a, 0)) points.push({ x: -b / a, y: 0, label: "N" });
        return points;
      },
      insight: ({ a, b }) =>
        nearlyEqual(a, 0)
          ? `Graf je vodorovná přímka y = ${fmt(b)}. Každý vstup má stejný výstup.`
          : `Při zvýšení x o 1 se hodnota funkce změní o ${fmt(a)}. Přímka protíná osu y v bodě [0; ${fmt(b)}].`,
    },
    quadratic: {
      defaults: { a: 1, h: 0, k: 0 },
      params: [
        { key: "a", label: "Koeficient a", min: -3, max: 3, step: 0.5, help: "Znaménko určuje orientaci, velikost šířku." },
        { key: "h", label: "Posun h", min: -5, max: 5, step: 0.5, help: "Vodorovná souřadnice vrcholu." },
        { key: "k", label: "Posun k", min: -5, max: 5, step: 0.5, help: "Svislá souřadnice vrcholu." },
      ],
      presets: [
        { label: "Základní", values: { a: 1, h: 0, k: 0 } },
        { label: "Posunutá", values: { a: 1, h: 3, k: -2 } },
        { label: "Otočená", values: { a: -1, h: -2, k: 3 } },
        { label: "Úzká", values: { a: 2.5, h: 1, k: 0 } },
      ],
      evaluator: ({ a, h, k }) => (x) => a * (x - h) ** 2 + k,
      formula: ({ a, h, k }) => `f(x) = ${coefficient(a)}(${shiftInside(h)})²${addTerm(k)}`,
      properties: ({ a, h, k }) => {
        const roots = [];
        if (!nearlyEqual(a, 0) && -k / a >= 0) {
          const distance = Math.sqrt(-k / a);
          roots.push(h - distance, h + distance);
        }
        return [
          ["Definiční obor", "ℝ"],
          ["Obor hodnot", a > 0 ? `⟨${fmt(k)}; ∞)` : a < 0 ? `(−∞; ${fmt(k)}⟩` : `{${fmt(k)}}`],
          ["Nulové body", nearlyEqual(a, 0) ? (nearlyEqual(k, 0) ? "všechna x" : "žádný") : rootsText(roots)],
          ["Vrchol", `V[${fmt(h)}; ${fmt(k)}]`],
          ["Osa souměrnosti", `x = ${fmt(h)}`],
          ["Orientace", a > 0 ? "otevřená nahoru" : a < 0 ? "otevřená dolů" : "degenerovaná"],
        ];
      },
      points: ({ a, h, k }) => {
        const points = [{ x: h, y: k, label: "V" }];
        if (!nearlyEqual(a, 0) && -k / a >= 0) {
          const distance = Math.sqrt(-k / a);
          points.push({ x: h - distance, y: 0, label: "N₁" });
          if (!nearlyEqual(distance, 0)) points.push({ x: h + distance, y: 0, label: "N₂" });
        }
        return points;
      },
      insight: ({ a, h, k }) =>
        `Vrchol paraboly leží v bodě V[${fmt(h)}; ${fmt(k)}]. ${a > 0 ? "Parabola je otevřená nahoru" : a < 0 ? "Parabola je otevřená dolů" : "Graf se změnil na konstantní funkci"}${!nearlyEqual(a, 0) ? ` a |a| = ${fmt(Math.abs(a))} určuje její šířku.` : "."}`,
    },
    absolute: {
      defaults: { a: 1, h: 0, k: 0 },
      params: [
        { key: "a", label: "Koeficient a", min: -3, max: 3, step: 0.5, help: "Určuje orientaci a rozevření písmene V." },
        { key: "h", label: "Posun h", min: -5, max: 5, step: 0.5, help: "Vodorovná souřadnice vrcholu." },
        { key: "k", label: "Posun k", min: -5, max: 5, step: 0.5, help: "Svislá souřadnice vrcholu." },
      ],
      presets: [
        { label: "Základní", values: { a: 1, h: 0, k: 0 } },
        { label: "Posunutá", values: { a: 1, h: -3, k: 2 } },
        { label: "Otočená", values: { a: -1, h: 2, k: 4 } },
        { label: "Strmá", values: { a: 2.5, h: 0, k: -2 } },
      ],
      evaluator: ({ a, h, k }) => (x) => a * Math.abs(x - h) + k,
      formula: ({ a, h, k }) => `f(x) = ${coefficient(a)}|${shiftInside(h)}|${addTerm(k)}`,
      properties: ({ a, h, k }) => {
        const roots = [];
        if (!nearlyEqual(a, 0) && -k / a >= 0) {
          const distance = -k / a;
          roots.push(h - distance, h + distance);
        }
        return [
          ["Definiční obor", "ℝ"],
          ["Obor hodnot", a > 0 ? `⟨${fmt(k)}; ∞)` : a < 0 ? `(−∞; ${fmt(k)}⟩` : `{${fmt(k)}}`],
          ["Nulové body", nearlyEqual(a, 0) ? (nearlyEqual(k, 0) ? "všechna x" : "žádný") : rootsText(roots)],
          ["Vrchol", `V[${fmt(h)}; ${fmt(k)}]`],
          ["Osa souměrnosti", `x = ${fmt(h)}`],
          ["Tvar", a >= 0 ? "písmeno V" : "obrácené V"],
        ];
      },
      points: ({ h, k }) => [{ x: h, y: k, label: "V" }],
      insight: ({ a, h, k }) =>
        `Bod V[${fmt(h)}; ${fmt(k)}] je zlom grafu. Na každé straně vrcholu je graf tvořen přímkou se směrnicí ±${fmt(Math.abs(a))}.`,
    },
    sqrt: {
      defaults: { a: 1, h: 0, k: 0 },
      params: [
        { key: "a", label: "Koeficient a", min: -3, max: 3, step: 0.5, help: "Určuje orientaci a svislé protažení." },
        { key: "h", label: "Začátek h", min: -5, max: 5, step: 0.5, help: "Nejmenší dovolený vstup." },
        { key: "k", label: "Posun k", min: -5, max: 5, step: 0.5, help: "Svislá poloha počátečního bodu." },
      ],
      presets: [
        { label: "Základní", values: { a: 1, h: 0, k: 0 } },
        { label: "Posunutá", values: { a: 1.5, h: 3, k: -2 } },
        { label: "Klesající", values: { a: -2, h: -1, k: 4 } },
        { label: "Mírná", values: { a: 0.5, h: -4, k: 0 } },
      ],
      evaluator: ({ a, h, k }) => (x) => (x < h ? NaN : a * Math.sqrt(x - h) + k),
      formula: ({ a, h, k }) => `f(x) = ${coefficient(a)}√(${shiftInside(h)})${addTerm(k)}`,
      properties: ({ a, h, k }) => [
        ["Definiční obor", `⟨${fmt(h)}; ∞)`],
        ["Obor hodnot", a > 0 ? `⟨${fmt(k)}; ∞)` : a < 0 ? `(−∞; ${fmt(k)}⟩` : `{${fmt(k)}}`],
        ["Počáteční bod", `[${fmt(h)}; ${fmt(k)}]`],
        ["Monotonie", a > 0 ? "rostoucí" : a < 0 ? "klesající" : "konstantní"],
        ["Nulový bod", nearlyEqual(a, 0) ? (nearlyEqual(k, 0) ? `všechna x ≥ ${fmt(h)}` : "žádný") : -k / a >= 0 ? fmt(h + (-k / a) ** 2) : "žádný"],
        ["Omezení", `x ≥ ${fmt(h)}`],
      ],
      points: ({ h, k }) => [{ x: h, y: k, label: "P" }],
      insight: ({ a, h, k }) =>
        `Graf začíná v bodě [${fmt(h)}; ${fmt(k)}], protože výraz pod odmocninou nesmí být záporný. ${a >= 0 ? "Dále roste" : "Dále klesá"}.`,
    },
    reciprocal: {
      defaults: { a: 2, h: 0, k: 0 },
      params: [
        { key: "a", label: "Koeficient a", min: -5, max: 5, step: 0.5, help: "Určuje větve a vzdálenost od asymptot." },
        { key: "h", label: "Svislá asymptota h", min: -5, max: 5, step: 0.5, help: "Zakázaná hodnota x." },
        { key: "k", label: "Vodorovná asymptota k", min: -5, max: 5, step: 0.5, help: "Hodnota, ke které se graf blíží." },
      ],
      presets: [
        { label: "Základní", values: { a: 2, h: 0, k: 0 } },
        { label: "Posunutá", values: { a: 2, h: 3, k: -2 } },
        { label: "Otočená", values: { a: -3, h: -2, k: 1 } },
        { label: "Blízko os", values: { a: 0.5, h: 0, k: 0 } },
      ],
      evaluator: ({ a, h, k }) => (x) => (nearlyEqual(x, h, 1e-6) ? NaN : a / (x - h) + k),
      formula: ({ a, h, k }) => `f(x) = ${fmt(a)} / (${shiftInside(h)})${addTerm(k)}`,
      properties: ({ a, h, k }) => {
        const root = !nearlyEqual(k, 0) && !nearlyEqual(a, 0) ? h - a / k : NaN;
        return [
          ["Definiční obor", `ℝ ∖ {${fmt(h)}}`],
          ["Obor hodnot", nearlyEqual(a, 0) ? `{${fmt(k)}}` : `ℝ ∖ {${fmt(k)}}`],
          ["Svislá asymptota", nearlyEqual(a, 0) ? "není; x = h je mezera" : `x = ${fmt(h)}`],
          ["Vodorovná asymptota", `y = ${fmt(k)}`],
          ["Nulový bod", Number.isFinite(root) ? fmt(root) : "žádný"],
          ["Střed souměrnosti", `S[${fmt(h)}; ${fmt(k)}]`],
        ];
      },
      points: () => [],
      asymptotes: ({ a, h, k }) => ({ vertical: nearlyEqual(a, 0) ? [] : [h], horizontal: [k] }),
      insight: ({ a, h, k }) =>
        nearlyEqual(a, 0)
          ? `Graf je konstantní y = ${fmt(k)} s vynechaným bodem pro x = ${fmt(h)}. V tomto degenerovaném případě nejde o hyperbolu.`
          : `Graf se nikdy nedotkne přímek x = ${fmt(h)} a y = ${fmt(k)}. Tyto asymptoty určují polohu obou větví. Znaménko a = ${fmt(a)} určuje jejich orientaci.`,
    },
    exponential: {
      defaults: { a: 1, base: 2, h: 0, k: 0 },
      params: [
        { key: "a", label: "Koeficient a", min: -3, max: 3, step: 0.5, help: "Určuje orientaci a svislé protažení." },
        { key: "base", label: "Základ b", min: 0.25, max: 4, step: 0.25, help: "Pro b > 1 funkce roste, pro 0 < b < 1 klesá." },
        { key: "h", label: "Posun h", min: -4, max: 4, step: 0.5, help: "Vodorovný posun grafu." },
        { key: "k", label: "Asymptota k", min: -5, max: 5, step: 0.5, help: "Vodorovná asymptota y = k." },
      ],
      presets: [
        { label: "Růst", values: { a: 1, base: 2, h: 0, k: 0 } },
        { label: "Pokles", values: { a: 1, base: 0.5, h: 0, k: 0 } },
        { label: "Posunutá", values: { a: 2, base: 2, h: 2, k: -3 } },
        { label: "Převrácená", values: { a: -1, base: 2, h: 0, k: 4 } },
      ],
      evaluator: ({ a, base, h, k }) => (x) => a * base ** (x - h) + k,
      formula: ({ a, base, h, k }) => `f(x) = ${coefficient(a)}·${fmt(base)}^(${shiftInside(h)})${addTerm(k)}`,
      properties: ({ a, base, h, k }) => {
        const rootRatio = !nearlyEqual(a, 0) ? -k / a : NaN;
        const root = rootRatio > 0 && !nearlyEqual(base, 1) ? h + Math.log(rootRatio) / Math.log(base) : NaN;
        const direction = nearlyEqual(base, 1) || nearlyEqual(a, 0) ? "konstantní" : (base > 1) === (a > 0) ? "rostoucí" : "klesající";
        return [
          ["Definiční obor", "ℝ"],
          ["Obor hodnot", a > 0 ? `(${fmt(k)}; ∞)` : a < 0 ? `(−∞; ${fmt(k)})` : `{${fmt(k)}}`],
          ["Vodorovná asymptota", `y = ${fmt(k)}`],
          ["Monotonie", direction],
          ["Nulový bod", Number.isFinite(root) ? fmt(root) : "žádný"],
          ["Hodnota v h", `f(${fmt(h)}) = ${fmt(a + k)}`],
        ];
      },
      points: ({ a, h, k }) => [{ x: h, y: a + k, label: "P" }],
      asymptotes: ({ k }) => ({ vertical: [], horizontal: [k] }),
      insight: ({ a, base, k }) =>
        nearlyEqual(a, 0)
          ? `Při a = 0 vzniká konstantní funkce y = ${fmt(k)}.`
          : nearlyEqual(base, 1)
            ? `Při základu b = 1 vzniká konstantní funkce y = ${fmt(a + k)}.`
            : `Základ b = ${fmt(base)} určuje tempo ${base > 1 ? "růstu" : "poklesu"}. Graf se blíží k asymptotě y = ${fmt(k)}, ale nedotkne se jí.`,
    },
  };

  const graphRenderer = new GraphRenderer($("functionCanvas"));
  let graphFamilyKey = $("familySelect").value;
  let graphParams = { ...functionFamilies[graphFamilyKey].defaults };

  const renderPropertyGrid = (properties) => {
    $("propertyGrid").innerHTML = properties
      .map(([label, value]) => `<div class="property-card"><span>${label}</span><strong>${value}</strong></div>`)
      .join("");
  };

  const drawGraphLab = () => {
    const family = functionFamilies[graphFamilyKey];
    const evaluator = family.evaluator(graphParams);
    const asymptotes = family.asymptotes ? family.asymptotes(graphParams) : { vertical: [], horizontal: [] };
    graphRenderer.draw({
      evaluator,
      points: family.points(graphParams),
      verticalAsymptotes: asymptotes.vertical,
      horizontalAsymptotes: asymptotes.horizontal,
    });
    graphRenderer.evaluator = evaluator;
    $("currentFormula").textContent = family.formula(graphParams);
    renderPropertyGrid(family.properties(graphParams));
    $("graphInsight").textContent = family.insight(graphParams);
  };

  const renderParameterControls = () => {
    const family = functionFamilies[graphFamilyKey];
    $("parameterControls").innerHTML = family.params
      .map((param) => `
          <div class="range-control">
            <div class="range-head"><label for="param-${param.key}">${param.label}</label><output id="out-${param.key}">${fmt(graphParams[param.key])}</output></div>
            <input id="param-${param.key}" data-param="${param.key}" type="range" min="${param.min}" max="${param.max}" step="${param.step}" value="${graphParams[param.key]}">
            <span class="range-help">${param.help}</span>
          </div>
        `)
      .join("");

    $$('[data-param]', $("parameterControls")).forEach((input) => {
      input.addEventListener("input", () => {
        graphParams[input.dataset.param] = Number(input.value);
        $(`out-${input.dataset.param}`).textContent = fmt(Number(input.value));
        drawGraphLab();
      });
    });

    $("presetButtons").innerHTML = family.presets
      .map((preset, index) => `<button class="preset-button" data-preset="${index}" type="button">${preset.label}</button>`)
      .join("");
    $$('[data-preset]', $("presetButtons")).forEach((button) => {
      button.addEventListener("click", () => {
        graphParams = { ...family.presets[Number(button.dataset.preset)].values };
        renderParameterControls();
        drawGraphLab();
      });
    });
  };

  $("familySelect").addEventListener("change", () => {
    graphFamilyKey = $("familySelect").value;
    graphParams = { ...functionFamilies[graphFamilyKey].defaults };
    renderParameterControls();
    drawGraphLab();
  });
  $("resetGraph").addEventListener("click", () => {
    graphParams = { ...functionFamilies[graphFamilyKey].defaults };
    renderParameterControls();
    drawGraphLab();
  });
  $("functionCanvas").addEventListener("pointermove", (event) => {
    const rect = $("functionCanvas").getBoundingClientRect();
    const graph = graphRenderer.toGraph(event.clientX - rect.left, event.clientY - rect.top);
    const value = graphRenderer.evaluator ? graphRenderer.evaluator(graph.x) : NaN;
    $("coordinateReadout").textContent = Number.isFinite(value)
      ? `x = ${fmt(graph.x)} · f(x) = ${fmt(value)}`
      : `x = ${fmt(graph.x)} · funkce zde není definována`;
  });

  const transformRenderer = new GraphRenderer($("transformCanvas"), { xMin: -8, xMax: 8, yMin: -7, yMax: 7 });
  const transformTargets = [
    { family: "quadratic", a: 1, h: 3, k: -2 },
    { family: "quadratic", a: -1, h: -2, k: 3 },
    { family: "quadratic", a: 2, h: 1, k: -1 },
    { family: "absolute", a: 1, h: -3, k: 2 },
    { family: "absolute", a: -2, h: 2, k: 4 },
    { family: "absolute", a: 0.5, h: 1, k: -3 },
    { family: "quadratic", a: -0.5, h: 0, k: 4 },
    { family: "absolute", a: 2, h: -1, k: -2 },
  ];
  let transformTarget = randomItem(transformTargets);
  let transformParams = { a: 1, h: 0, k: 0 };
  let transformSolved = 0;
  let lastTransformSignature = "";

  const transformEvaluator = (params, family) =>
    family === "quadratic"
      ? (x) => params.a * (x - params.h) ** 2 + params.k
      : (x) => params.a * Math.abs(x - params.h) + params.k;

  const drawTransform = () => {
    const family = functionFamilies[transformTarget.family];
    $("transformFormula").textContent = family.formula(transformParams);
    transformRenderer.draw({
      evaluator: transformEvaluator(transformParams, transformTarget.family),
      targetEvaluator: transformEvaluator(transformTarget, transformTarget.family),
      points: [{ x: transformParams.h, y: transformParams.k, label: "V" }],
    });
  };

  const renderTransformSliders = () => {
    const controls = [
      { key: "a", label: "Koeficient a", min: -3, max: 3, step: 0.5 },
      { key: "h", label: "Posun h", min: -5, max: 5, step: 0.5 },
      { key: "k", label: "Posun k", min: -5, max: 5, step: 0.5 },
    ];
    $("transformSliders").innerHTML = controls
      .map((control) => `
          <div class="range-control">
            <div class="range-head"><label for="transform-${control.key}">${control.label}</label><output id="transform-out-${control.key}">${fmt(transformParams[control.key])}</output></div>
            <input id="transform-${control.key}" data-transform-param="${control.key}" type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${transformParams[control.key]}">
          </div>
        `)
      .join("");
    $$('[data-transform-param]', $("transformSliders")).forEach((input) => {
      input.addEventListener("input", () => {
        transformParams[input.dataset.transformParam] = Number(input.value);
        $(`transform-out-${input.dataset.transformParam}`).textContent = fmt(Number(input.value));
        setFeedback($("transformFeedback"), "");
        drawTransform();
      });
    });
  };

  const newTransformChallenge = () => {
    let next = randomItem(transformTargets);
    let signature = `${next.family}-${next.a}-${next.h}-${next.k}`;
    while (signature === lastTransformSignature) {
      next = randomItem(transformTargets);
      signature = `${next.family}-${next.a}-${next.h}-${next.k}`;
    }
    lastTransformSignature = signature;
    transformTarget = next;
    transformParams = { a: 1, h: 0, k: 0 };
    const familyName = next.family === "quadratic" ? "parabolu" : "graf absolutní hodnoty";
    $("transformPrompt").textContent = `Nastavte ${familyName} tak, aby se přesně překryla s přerušovaným cílovým grafem.`;
    $("transformRound").textContent = Math.min(transformSolved + 1, 6);
    setFeedback($("transformFeedback"), "");
    renderTransformSliders();
    drawTransform();
  };

  $("checkTransform").addEventListener("click", () => {
    const differences = ["a", "h", "k"].filter((key) => !nearlyEqual(transformParams[key], transformTarget[key], 0.01));
    if (!differences.length) {
      transformSolved = Math.min(transformSolved + 1, 6);
      setFeedback(
        $("transformFeedback"),
        `Přesná shoda. Cílové parametry jsou a = ${fmt(transformTarget.a)}, h = ${fmt(transformTarget.h)}, k = ${fmt(transformTarget.k)}.`,
        "correct",
      );
      if (transformSolved >= 3) completeSection("transformations");
    } else {
      setFeedback(
        $("transformFeedback"),
        `Graf ještě nesedí. Zaměřte se na ${differences.join(", ")}. Nejprve určete vrchol a orientaci, potom šířku.`,
        "wrong",
      );
    }
  });
  $("newTransform").addEventListener("click", newTransformChallenge);

  const readingRenderer = new GraphRenderer($("readingCanvas"), { xMin: -8, xMax: 8, yMin: -7, yMax: 7 });
  let readingTask = null;
  let readingScore = 0;
  let readingStreak = 0;
  let readingAnswered = false;

  const uniqueOptions = (correct, distractors) => {
    const values = [String(correct), ...distractors.map(String)];
    return shuffle(Array.from(new Set(values)).slice(0, 4));
  };

  const readingGenerators = [
    () => {
      const a = randomItem([-3, -2, -1, 1, 2, 3]);
      const root = randomItem([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
      const b = -a * root;
      const x = randomItem([-3, -2, -1, 0, 1, 2, 3]);
      const answer = a * x + b;
      return {
        category: "Funkční hodnota",
        question: `Jaká je hodnota f(${x})?`,
        evaluator: (value) => a * value + b,
        points: [{ x, y: answer, label: "?" }],
        answer: fmt(answer),
        options: uniqueOptions(fmt(answer), [fmt(answer + a), fmt(answer - a), fmt(-answer)]),
        hint: "Najděte x na vodorovné ose, postupujte ke grafu a potom vodorovně k ose y.",
        explanation: `Pro x = ${x} leží na grafu bod [${x}; ${fmt(answer)}], proto f(${x}) = ${fmt(answer)}.`,
      };
    },
    () => {
      const a = randomItem([-3, -2, -1, 1, 2, 3]);
      const root = randomItem([-4, -3, -2, -1, 1, 2, 3, 4]);
      const b = -a * root;
      return {
        category: "Nulový bod",
        question: "Ve kterém bodě graf protíná osu x?",
        evaluator: (x) => a * x + b,
        points: [{ x: root, y: 0, label: "?" }],
        answer: `[${root}; 0]`,
        options: uniqueOptions(`[${root}; 0]`, [`[0; ${b}]`, `[${-root}; 0]`, `[${root}; ${b}]`]),
        hint: "Nulový bod má vždy druhou souřadnici y = 0.",
        explanation: `Graf protíná osu x v bodě [${root}; 0]. V tomto místě je f(${root}) = 0.`,
      };
    },
    () => {
      const h = randomItem([-3, -2, -1, 0, 1, 2, 3]);
      const k = randomItem([-4, -3, -2, -1, 1, 2, 3, 4]);
      const a = randomItem([-2, -1, 1, 2]);
      return {
        category: "Vrchol paraboly",
        question: "Jaké souřadnice má vrchol paraboly?",
        evaluator: (x) => a * (x - h) ** 2 + k,
        points: [{ x: h, y: k, label: "V" }],
        answer: `[${h}; ${k}]`,
        options: uniqueOptions(`[${h}; ${k}]`, [`[${-h}; ${k}]`, `[${k}; ${h}]`, `[${h}; ${-k}]`]),
        hint: "Vrchol je nejnižší nebo nejvyšší bod paraboly a leží na její ose souměrnosti.",
        explanation: `Extrém grafu leží v bodě V[${h}; ${k}].`,
      };
    },
    () => {
      const a = randomItem([-3, -2, -1, 1, 2, 3]);
      const b = randomItem([-4, -2, 0, 2, 4]);
      const direction = a > 0 ? "rostoucí" : "klesající";
      return {
        category: "Monotonie",
        question: "Jaká je tato lineární funkce?",
        evaluator: (x) => a * x + b,
        points: [],
        answer: direction,
        options: shuffle(["rostoucí", "klesající", "konstantní", "není funkcí"]),
        hint: "Sledujte graf zleva doprava. Stoupá, klesá, nebo zůstává ve stejné výšce?",
        explanation: `Při pohybu zleva doprava graf ${a > 0 ? "stoupá" : "klesá"}, proto je funkce ${direction}.`,
      };
    },
    () => {
      const h = randomItem([-3, -2, -1, 0, 1, 2, 3]);
      const k = randomItem([-3, -2, -1, 0, 1, 2, 3]);
      const a = randomItem([1, 2]);
      return {
        category: "Obor hodnot",
        question: "Který obor hodnot odpovídá zobrazené parabole?",
        evaluator: (x) => a * (x - h) ** 2 + k,
        points: [{ x: h, y: k, label: "V" }],
        answer: `⟨${k}; ∞)`,
        options: shuffle([`⟨${k}; ∞)`, `(−∞; ${k}⟩`, "ℝ", `ℝ ∖ {${k}}`]),
        hint: "Najděte nejmenší hodnotu y. Parabola je otevřená nahoru.",
        explanation: `Nejmenší funkční hodnota je ${k} a všechny vyšší hodnoty jsou dosaženy, proto H(f) = ⟨${k}; ∞).`,
      };
    },
    () => {
      const h = randomItem([-3, -2, -1, 0, 1, 2, 3]);
      const k = randomItem([-2, -1, 0, 1, 2]);
      const a = randomItem([1, 2]);
      return {
        category: "Definiční obor",
        question: "Od jaké hodnoty x je odmocninová funkce definována?",
        evaluator: (x) => (x < h ? NaN : a * Math.sqrt(x - h) + k),
        points: [{ x: h, y: k, label: "P" }],
        answer: `x ≥ ${h}`,
        options: uniqueOptions(`x ≥ ${h}`, [`x ≤ ${h}`, `x ≠ ${h}`, `x > ${k}`]),
        hint: "Graf má levý počáteční bod. Dále pokračuje pouze doprava.",
        explanation: `Nejmenší vstup na grafu je x = ${h}, proto D(f) = ⟨${h}; ∞).`,
      };
    },
  ];

  const renderReadingTask = () => {
    readingTask = randomItem(readingGenerators)();
    readingAnswered = false;
    $("readingCategory").textContent = readingTask.category;
    $("readingQuestion").textContent = readingTask.question;
    $("readingHintText").textContent = readingTask.hint;
    $("readingHintText").hidden = true;
    setFeedback($("readingFeedback"), "");
    $("nextReading").disabled = true;
    $("readingOptions").innerHTML = readingTask.options
      .map((option) => `<button class="option-button" type="button" data-reading-option="${option.replaceAll('"', '&quot;')}">${option}</button>`)
      .join("");
    $$('[data-reading-option]', $("readingOptions")).forEach((button) => {
      button.addEventListener("click", () => answerReading(button));
    });
    readingRenderer.draw({ evaluator: readingTask.evaluator, points: readingTask.points });
  };

  const answerReading = (button) => {
    if (readingAnswered) return;
    readingAnswered = true;
    const selected = button.dataset.readingOption;
    const correct = selected === readingTask.answer;
    if (correct) {
      readingScore += 1;
      readingStreak += 1;
    } else {
      readingStreak = 0;
    }
    $("readingScore").textContent = readingScore;
    $("readingStreak").textContent = readingStreak;
    button.classList.add(correct ? "correct" : "wrong");
    $$('[data-reading-option]', $("readingOptions")).forEach((candidate) => {
      candidate.disabled = true;
      if (candidate.dataset.readingOption === readingTask.answer) candidate.classList.add("correct");
    });
    setFeedback(
      $("readingFeedback"),
      `${correct ? "Správně." : "Nesprávně."} ${readingTask.explanation}`,
      correct ? "correct" : "wrong",
    );
    $("nextReading").disabled = false;
    if (readingScore >= 5) completeSection("reading");
  };

  $("readingHint").addEventListener("click", () => {
    $("readingHintText").hidden = false;
  });
  $("nextReading").addEventListener("click", renderReadingTask);

  const updateTaxi = () => {
    const distance = Number($("taxiDistance").value);
    const distanceFare = 45 * distance;
    const total = distanceFare + 80;
    $("taxiDistanceOut").textContent = `${distance} km`;
    $("taxiPriceOut").textContent = currency.format(total);
    $("distanceFareValue").textContent = currency.format(distanceFare);
    const maxTotal = 45 * 30 + 80;
    $("baseFareBar").style.width = `${Math.max(5, (80 / maxTotal) * 100)}%`;
    $("distanceFareBar").style.width = `${Math.max(2, (distanceFare / maxTotal) * 100)}%`;
  };
  $("taxiDistance").addEventListener("input", updateTaxi);
  $("checkModel").addEventListener("click", () => {
    const answer = Number($("modelAnswer").value.replace(",", "."));
    const correct = (800 - 80) / 45;
    if (!Number.isFinite(answer)) {
      setFeedback($("modelFeedback"), "Zadejte počet kilometrů.", "wrong");
      return;
    }
    if (Math.abs(answer - correct) <= 0.15) {
      setFeedback($("modelFeedback"), "Správně. Po odečtení nástupní sazby zbývá 720 Kč, tedy 720 / 45 = 16 km.", "correct");
      completeSection("model");
    } else {
      setFeedback($("modelFeedback"), "Nejprve od rozpočtu odečtěte nástupní sazbu 80 Kč. Teprve zbytek vydělte cenou za kilometr.", "wrong");
    }
  });
  $("modelAnswer").addEventListener("keydown", (event) => {
    if (event.key === "Enter") $("checkModel").click();
  });

  const testBank = [
    { category: "Pojmy", topic: "Definice funkce", question: "Co musí platit, aby přiřazení bylo funkcí?", options: ["Každý vstup má právě jeden výstup.", "Každý výstup má právě jeden vstup.", "Všechny výstupy musí být různé.", "Graf musí být přímka."], correct: 0, explanation: "Definice požaduje právě jeden výstup pro každý dovolený vstup. Jeden výstup se naopak může opakovat." },
    { category: "Výpočet", topic: "Funkční hodnota", question: "Je dána funkce f(x) = 2x + 3. Kolik je f(−1)?", options: ["−5", "−1", "1", "5"], correct: 2, explanation: "Dosadíme x = −1: f(−1) = 2·(−1) + 3 = 1." },
    { category: "Definiční obor", topic: "Odmocninová funkce", question: "Jaký je definiční obor funkce f(x) = √(x − 4)?", options: ["x > 4", "x ≥ 4", "x ≤ 4", "x ≠ 4"], correct: 1, explanation: "Výraz pod odmocninou musí být nezáporný: x − 4 ≥ 0, tedy x ≥ 4." },
    { category: "Definiční obor", topic: "Lomená funkce", question: "Která hodnota nepatří do definičního oboru f(x) = 1/(x + 2)?", options: ["−2", "0", "2", "Všechny patří"], correct: 0, explanation: "Pro x = −2 je jmenovatel nulový, proto tato hodnota není dovolená." },
    { category: "Graf", topic: "Nulový bod", question: "Jaký je nulový bod funkce f(x) = 3x − 6?", options: ["x = −2", "x = 0", "x = 2", "x = 6"], correct: 2, explanation: "Položíme f(x) = 0: 3x − 6 = 0, takže x = 2." },
    { category: "Graf", topic: "Průsečík s osou y", question: "V jakém bodě protíná graf y = −2x + 5 osu y?", options: ["[−2; 0]", "[0; −2]", "[0; 5]", "[5; 0]"], correct: 2, explanation: "Na ose y je x = 0. Po dosazení vyjde y = 5, tedy bod [0; 5]." },
    { category: "Transformace", topic: "Vrchol paraboly", question: "Jaký vrchol má parabola f(x) = (x − 3)² − 4?", options: ["V[−3; −4]", "V[3; −4]", "V[−4; 3]", "V[3; 4]"], correct: 1, explanation: "Ve vrcholovém tvaru a(x−h)²+k je vrchol V[h; k], tedy V[3; −4]." },
    { category: "Transformace", topic: "Vodorovný posun", question: "Jak se oproti y = x² posune graf y = (x + 4)²?", options: ["O 4 doprava", "O 4 doleva", "O 4 nahoru", "O 4 dolů"], correct: 1, explanation: "Výraz x + 4 lze zapsat jako x − (−4), takže vrchol se posune na x = −4, tedy doleva." },
    { category: "Vlastnosti", topic: "Obor hodnot", question: "Jaký je obor hodnot funkce f(x) = (x − 2)² + 1?", options: ["ℝ", "⟨1; ∞)", "(−∞; 1⟩", "ℝ ∖ {1}"], correct: 1, explanation: "Parabola je otevřená nahoru a nejmenší hodnota je ve vrcholu rovna 1." },
    { category: "Vlastnosti", topic: "Exponenciální funkce", question: "Jaká je funkce f(x) = 0,5ˣ?", options: ["Rostoucí", "Klesající", "Konstantní", "Není definována pro záporná x"], correct: 1, explanation: "Exponenciální funkce se základem 0 < b < 1 je klesající a je definována pro všechna reálná x." },
    { category: "Model", topic: "Lineární model", question: "Taxi účtuje 80 Kč nástup a 45 Kč/km. Kolik stojí 6 km?", options: ["270 Kč", "320 Kč", "350 Kč", "480 Kč"], correct: 2, explanation: "Cena je C(6) = 45·6 + 80 = 270 + 80 = 350 Kč." },
    { category: "Výpočet", topic: "Skládání funkcí", question: "Je dáno f(x) = x + 2 a g(x) = 3x. Kolik je g(f(1))?", options: ["5", "6", "7", "9"], correct: 3, explanation: "Nejprve f(1) = 3. Potom g(3) = 9." },
  ];

  let testQuestions = [];
  let testIndex = 0;
  let testPoints = 0;
  let testAnswered = false;
  let testCategoryStats = {};

  const renderTestQuestion = () => {
    const question = testQuestions[testIndex];
    testAnswered = false;
    $("testCounter").textContent = `Otázka ${testIndex + 1} z ${testQuestions.length}`;
    $("testScore").textContent = `${testPoints} ${testPoints === 1 ? "bod" : testPoints >= 2 && testPoints <= 4 ? "body" : "bodů"}`;
    $("testProgressBar").style.width = `${(testIndex / testQuestions.length) * 100}%`;
    $("testTopic").textContent = question.topic;
    $("testQuestion").textContent = question.question;
    $("testOptions").innerHTML = question.options.map((option, index) => `<button class="option-button" type="button" data-test-option="${index}">${option}</button>`).join("");
    setFeedback($("testFeedback"), "");
    $("nextTestQuestion").disabled = true;
    $("nextTestQuestion").textContent = testIndex === testQuestions.length - 1 ? "Zobrazit výsledek" : "Další otázka";
    $$('[data-test-option]', $("testOptions")).forEach((button) => {
      button.addEventListener("click", () => answerTestQuestion(button));
    });
  };

  const startTest = () => {
    testQuestions = shuffle(testBank);
    testIndex = 0;
    testPoints = 0;
    testAnswered = false;
    testCategoryStats = {};
    testQuestions.forEach((question) => {
      if (!testCategoryStats[question.category]) testCategoryStats[question.category] = { correct: 0, total: 0 };
      testCategoryStats[question.category].total += 1;
    });
    $("testQuestionArea").hidden = false;
    $("testResult").hidden = true;
    renderTestQuestion();
  };

  const answerTestQuestion = (button) => {
    if (testAnswered) return;
    testAnswered = true;
    const question = testQuestions[testIndex];
    const selected = Number(button.dataset.testOption);
    const correct = selected === question.correct;
    if (correct) {
      testPoints += 1;
      testCategoryStats[question.category].correct += 1;
    }
    button.classList.add(correct ? "correct" : "wrong");
    $$('[data-test-option]', $("testOptions")).forEach((candidate) => {
      candidate.disabled = true;
      if (Number(candidate.dataset.testOption) === question.correct) candidate.classList.add("correct");
    });
    $("testScore").textContent = `${testPoints} ${testPoints === 1 ? "bod" : testPoints >= 2 && testPoints <= 4 ? "body" : "bodů"}`;
    setFeedback($("testFeedback"), `${correct ? "Správně." : "Nesprávně."} ${question.explanation}`, correct ? "correct" : "wrong");
    $("nextTestQuestion").disabled = false;
  };

  const showTestResult = () => {
    const percentage = Math.round((testPoints / testQuestions.length) * 100);
    progressState.bestScore = Math.max(progressState.bestScore, percentage);
    completeSection("final-test");
    saveProgress();
    updateProgressUi();

    $("testQuestionArea").hidden = true;
    $("testResult").hidden = false;
    $("testProgressBar").style.width = "100%";
    $("resultPercent").textContent = `${percentage} %`;
    $("resultRing").style.setProperty("--score-angle", `${percentage * 3.6}deg`);

    if (percentage >= 90) {
      $("resultTitle").textContent = "Výborné zvládnutí";
      $("resultMessage").textContent = "Funkce umíte propojit mezi předpisem, grafem i praktickým významem. Můžete pokračovat k náročnějším úlohám.";
    } else if (percentage >= 70) {
      $("resultTitle").textContent = "Dobré porozumění";
      $("resultMessage").textContent = "Základ je pevný. Projděte si kategorie s nižším výsledkem a zopakujte test.";
    } else if (percentage >= 50) {
      $("resultTitle").textContent = "Částečné zvládnutí";
      $("resultMessage").textContent = "Některé principy už fungují, ale doporučuji znovu projít grafickou laboratoř a transformace.";
    } else {
      $("resultTitle").textContent = "Je potřeba ještě procvičit";
      $("resultMessage").textContent = "Vraťte se k prvním částem lekce a pracujte s grafy pomalu. Chyby zde ukazují, na co se zaměřit.";
    }

    $("resultBreakdown").innerHTML = Object.entries(testCategoryStats)
      .map(([category, stats]) => `<span>${category}: ${stats.correct}/${stats.total}</span>`)
      .join("");
  };

  $("nextTestQuestion").addEventListener("click", () => {
    if (testIndex >= testQuestions.length - 1) {
      showTestResult();
      return;
    }
    testIndex += 1;
    renderTestQuestion();
  });
  $("restartTest").addEventListener("click", startTest);

  updateProgressUi();
  updateMachine();
  renderRelation();
  renderParameterControls();
  drawGraphLab();
  newTransformChallenge();
  renderReadingTask();
  updateTaxi();
  startTest();
})();
