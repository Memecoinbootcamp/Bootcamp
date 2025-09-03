// Memecoin Bootcamp • Quiz runtime
// - Bulletproof scoring (marks the correct button via data attribute)
// - Supports large option images via JSON "class" (e.g., "rug-option")
// - Centers labels; allows unselecting before submit

(function () {
  const params = new URLSearchParams(location.search);
  const difficulty = (params.get("difficulty") || "easy").toLowerCase();

  const packMap = {
    easy: "content/easy.json",
    medium: "content/medium.json",
    hard: "content/hard.json",
  };
  const file = packMap[difficulty] || packMap.easy;

  // UI elements
  const crumbsEl = document.getElementById("crumbs");
  const stageEl = document.getElementById("stage");
  const progressEl = document.getElementById("progress");
  const diffPill = document.getElementById("difficultyPill");
  const tweetImg = document.getElementById("tweetImg");
  const tweetText = document.getElementById("tweetText");
  const optsEl = document.getElementById("options");
  const lessonEl = document.getElementById("lesson");
  const submitBtn = document.getElementById("submitBtn");
  const nextBtn = document.getElementById("nextBtn");

  const resultEl = document.getElementById("result");
  const medalEl = document.getElementById("medal");
  const scorelineEl = document.getElementById("scoreline");
  const sloganEl = document.getElementById("slogan");
  const retryLink = document.getElementById("retryLink");

  // State
  let questions = [];
  let idx = 0;
  let total = 10;
  let score = 0;
  let selectedBtn = null; // DOM button picked by user
  let locked = false;
  let currentQ = null;

  const medalRules = [
    { min: 9, icon: "🏆", slogan: "Meme General. Untouchable." },
    { min: 7, icon: "🥇", slogan: "Certified Meme Sniper." },
    { min: 4, icon: "🥈", slogan: "Break-even Cadet." },
    { min: 0, icon: "🥉", slogan: "Rugged Recruit." },
  ];

  const setCrumbs = (t) => (crumbsEl && (crumbsEl.textContent = t));
  const setSubmitEnabled = (on) =>
    submitBtn && submitBtn.setAttribute("aria-disabled", on ? "false" : "true");

  function updateProgress() {
    if (progressEl) progressEl.textContent = `Question ${Math.min(idx + 1, total)}/${total}`;
    if (diffPill) diffPill.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }

  function renderQuestion() {
    currentQ = questions[idx];
    if (!currentQ) return showResult();

    // reset state
    locked = false;
    selectedBtn = null;
    setSubmitEnabled(false);
    if (submitBtn) submitBtn.hidden = false;
    if (nextBtn) nextBtn.hidden = true;
    if (lessonEl) lessonEl.hidden = true;

    updateProgress();

    // tweet (image + text)
    if (currentQ.tweetImage) {
      if (tweetImg) {
        tweetImg.src = currentQ.tweetImage;
        tweetImg.hidden = false;
        tweetImg.className = "quiz-image"; // ensure correct class for sizing
      }
    } else {
      if (tweetImg) {
        tweetImg.hidden = true;
        tweetImg.removeAttribute("src");
      }
    }
    if (tweetText) tweetText.textContent = currentQ.tweetText || "";

    // options
    if (optsEl) optsEl.innerHTML = "";
    const correctId = (currentQ.correctId ?? "").toString().trim().toLowerCase();

    (currentQ.options || []).forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "opt";
      btn.type = "button";

      // Attach any custom class for styling (e.g., "rug-option")
      if (opt.class) {
        opt.class
          .toString()
          .split(/\s+/)
          .forEach((c) => c && btn.classList.add(c));
      }

      // mark the correct choice (invisible to user, used for grading)
      const thisId = (opt.id ?? "").toString().trim().toLowerCase();
      if (thisId === correctId) btn.dataset.correct = "true";

      // optional image
      if (opt.image) {
        const img = document.createElement("img");
        img.src = opt.image;
        img.alt = opt.label || opt.id || "option";
        img.className = "option-image"; // used by CSS to size options
        btn.appendChild(img);
      }

      // visible label
      const span = document.createElement("span");
      span.textContent = opt.label || opt.id;
      btn.appendChild(span);

      // selection behavior: toggle select/unselect before submit
      btn.addEventListener("click", () => {
        if (locked) return;

        if (selectedBtn === btn) {
          // unselect
          btn.classList.remove("picked");
          selectedBtn = null;
          setSubmitEnabled(false);
        } else {
          // select this, unselect others
          Array.from(optsEl.children).forEach((b) => b.classList.remove("picked"));
          btn.classList.add("picked");
          selectedBtn = btn;
          setSubmitEnabled(true);
        }
      });

      optsEl.appendChild(btn);
    });
  }

  function gradeCurrent() {
    if (locked || !selectedBtn) return;
    locked = true;

    const buttons = Array.from(optsEl.querySelectorAll(".opt"));
    buttons.forEach((b) => (b.disabled = true));

    const chosenCorrect = selectedBtn.dataset.correct === "true";
    const correctBtn = buttons.find((b) => b.dataset.correct === "true");

    if (chosenCorrect) {
      score++;
      selectedBtn.classList.add("correct");
    } else {
      selectedBtn.classList.add("wrong");
      if (correctBtn) correctBtn.classList.add("correct");
    }

    if (currentQ.lesson && lessonEl) {
      lessonEl.textContent = currentQ.lesson;
      lessonEl.hidden = false;
    }

    if (submitBtn) submitBtn.hidden = true;
    if (nextBtn) nextBtn.hidden = false;
  }

  function showResult() {
    if (stageEl) stageEl.hidden = true;
    if (resultEl) resultEl.hidden = false;

    if (scorelineEl) scorelineEl.textContent = `You scored ${score}/${total}`;

    const rule =
      medalRules.find((r) => score >= r.min) || medalRules[medalRules.length - 1];

    if (medalEl) medalEl.textContent = rule.icon;
    if (sloganEl) sloganEl.textContent = rule.slogan;
    if (retryLink) retryLink.href = `quiz.html?difficulty=${difficulty}`;
  }

  // events
  if (submitBtn) {
    submitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (submitBtn.getAttribute("aria-disabled") === "true") return;
      gradeCurrent();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      idx++;
      if (idx >= total) showResult();
      else renderQuestion();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // init
  (async function init() {
    setCrumbs(`Loading ${difficulty} pack…`);
    try {
      const res = await fetch(file, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${file}`);
      const pack = await res.json();
      questions = (pack.questions || pack || []).slice(0, 10);
      total = questions.length;
      if (total === 0) throw new Error("No questions found.");

      setCrumbs(`Memecoin Bootcamp • ${difficulty.toUpperCase()} • ${total} Questions`);
      if (stageEl) stageEl.hidden = false;
      renderQuestion();
    } catch (e) {
      setCrumbs(`Error: ${e.message}`);
    }
  })();
})();

