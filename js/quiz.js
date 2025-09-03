// js/quiz.js
(function(){
  const params = new URLSearchParams(location.search);
  const difficulty = (params.get("difficulty") || "easy").toLowerCase();

  const packMap = {
    easy:   "content/easy.json",
    medium: "content/medium.json",
    hard:   "content/hard.json"
  };
  const file = packMap[difficulty] || packMap.easy;

  const crumbsEl = document.getElementById("crumbs");
  const stageEl  = document.getElementById("stage");
  const progressEl = document.getElementById("progress");
  const diffPill = document.getElementById("difficultyPill");
  const tweetImg = document.getElementById("tweetImg");
  const tweetText = document.getElementById("tweetText");
  const optsEl = document.getElementById("options");
  const lessonEl = document.getElementById("lesson");
  const nextBtn = document.getElementById("nextBtn");

  const resultEl = document.getElementById("result");
  const medalEl = document.getElementById("medal");
  const scorelineEl = document.getElementById("scoreline");
  const sloganEl = document.getElementById("slogan");
  const retryLink = document.getElementById("retryLink");

  let questions = [];
  let idx = 0;
  let score = 0;
  const total = 10;

  const medalRules = [
    { min: 7, icon: "🥇", slogan: "Certified Meme Sniper." },
    { min: 4, icon: "🥈", slogan: "Break-even Cadet." },
    { min: 0, icon: "🥉", slogan: "Rugged Recruit." }
  ];

  function setCrumbs(text){ crumbsEl.textContent = text; }

  function updateProgress(){
    progressEl.textContent = `Question ${Math.min(idx+1, total)}/${total}`;
    diffPill.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }

  function renderQuestion(){
    const q = questions[idx];
    if(!q){ return showResult(); }

    updateProgress();

    // Tweet image & text (both optional in content)
    if(q.tweetImage){
      tweetImg.src = q.tweetImage;
      tweetImg.hidden = false;
    } else {
      tweetImg.hidden = true;
      tweetImg.removeAttribute("src");
    }
    tweetText.textContent = q.tweetText || "";

    // Options
    optsEl.innerHTML = "";
    lessonEl.hidden = true;
    nextBtn.hidden = true;

    q.options.forEach(opt => {
      const a = document.createElement("button");
      a.className = "opt";
      a.setAttribute("type","button");

      if(opt.image){
        const img = document.createElement("img");
        img.src = opt.image;
        img.alt = opt.label || opt.id;
        a.appendChild(img);
      }

      const span = document.createElement("span");
      span.textContent = opt.label || opt.id;
      a.appendChild(span);

      a.addEventListener("click", () => handlePick(opt.id, a, q.correctId, q.lesson));
      optsEl.appendChild(a);
    });
  }

  function handlePick(chosenId, el, correctId, lesson){
    // Lock options
    const buttons = Array.from(optsEl.querySelectorAll(".opt"));
    buttons.forEach(b => b.disabled = true);

    // Mark
    buttons.forEach(b => {
      const label = b.querySelector("span")?.textContent || "";
      // find id from options array by label (fallback)
    });
    if(chosenId === correctId){
      score++;
      el.classList.add("correct");
    } else {
      el.classList.add("wrong");
      // highlight the correct one
      const all = Array.from(optsEl.children);
      const correctBtn = all.find(btn => {
        // We store the id in a dataset for reliability
        return btn.dataset && btn.dataset.optId === correctId;
      });
    }
    // mark correct explicitly
    for(const btn of buttons){
      if((btn.dataset && btn.dataset.optId === correctId) || (btn.textContent || "").includes(correctId)){
        btn.classList.add("correct");
      }
    }

    // Lesson (if provided)
    if(lesson){ lessonEl.textContent = lesson; lessonEl.hidden = false; }

    nextBtn.hidden = false;
  }

  nextBtn.addEventListener("click", (e) => {
    e.preventDefault();
    idx++;
    if(idx >= total){ showResult(); }
    else { renderQuestion(); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  function showResult(){
    stageEl.hidden = true;
    resultEl.hidden = false;

    scorelineEl.textContent = `You scored ${score}/${total}`;
    const rule = medalRules.find(r => score >= r.min) || medalRules[2];
    medalEl.textContent = rule.icon;
    sloganEl.textContent = rule.slogan;

    retryLink.href = `quiz.html?difficulty=${difficulty}`;
  }

  // Patch: store option ids in dataset after render
  function afterRenderAttachIds(){
    const q = questions[idx];
    if(!q) return;
    const btns = Array.from(optsEl.children);
    btns.forEach((btn, i) => {
      const opt = q.options[i];
      if(opt) btn.dataset.optId = opt.id;
    });
  }

  // Load content
  (async function init(){
    setCrumbs(`Loading ${difficulty} pack…`);
    try{
      const res = await fetch(file, { cache: "no-store" });
      if(!res.ok) throw new Error(`Failed to load ${file}`);
      const pack = await res.json();
      questions = (pack.questions || pack).slice(0, total);
      if(questions.length < total){
        console.warn("Less than 10 questions found; repeating some to fill.");
        // duplicate to fill
        while(questions.length < total && pack.length){
          questions.push(pack[questions.length % pack.length]);
        }
      }
      setCrumbs(`Memecoin Bootcamp • ${difficulty.toUpperCase()} • 10 Questions`);
      stageEl.hidden = false;
      renderQuestion();
      // attach ids right after first render
      afterRenderAttachIds();
      // Also attach after each mutation
      const obs = new MutationObserver(afterRenderAttachIds);
      obs.observe(optsEl, { childList: true });
    } catch(e){
      setCrumbs(`Error: ${e.message}`);
    }
  })();

})();
