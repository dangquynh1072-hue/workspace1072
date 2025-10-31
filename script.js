/* -------------------------
   State & persistence
   ------------------------- */
const KEY = 'kuin_dashboard_v1';
const defaultState = {
  theme: 'light',
  todos: [],     // {id, text, link, done}
  ideas: [],     // {id, text}
  music: null,   // {type:'file'|'youtube', url or blobUrl, ytId}
  bg: null,
  pom: { work:25, break:5, remaining:25*60, mode:'work', running:false }
};
let state = Object.assign({}, defaultState, JSON.parse(localStorage.getItem(KEY) || '{}'));

/* helpers */
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function $(id){ return document.getElementById(id); }
function nowTimeStr(){ const d=new Date(); return d.toLocaleTimeString(); }

/* -------------------------
   Clock small
   ------------------------- */
function updateClock(){
  $('clockSmall').textContent = nowTimeStr();
}
setInterval(updateClock, 1000);
updateClock();

/* -------------------------
   Theme
   ------------------------- */
const themeToggle = $('themeToggle');
themeToggle.addEventListener('click', ()=>{
  const cur = document.body.getAttribute('data-theme') || 'light';
  const next = cur === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', next);
  state.theme = next; save();
});
if(state.theme) document.body.setAttribute('data-theme', state.theme);

/* -------------------------
   POPUP toggles: music & bg
   ------------------------- */
const musicToggle = $('musicToggle'), bgToggle = $('bgToggle');
const musicPopup = $('musicPopup'), bgPopup = $('bgPopup');
const closeMusic = $('closeMusic'), closeBg = $('closeBg');

musicToggle.addEventListener('click', ()=> {
  musicPopup.style.display = (musicPopup.style.display === 'block') ? 'none' : 'block';
});
closeMusic.addEventListener('click', ()=> musicPopup.style.display='none');

bgToggle.addEventListener('click', ()=> {
  bgPopup.style.display = (bgPopup.style.display === 'block') ? 'none' : 'block';
});
closeBg.addEventListener('click', ()=> bgPopup.style.display='none');

/* -------------------------
   To-do list (LEFT)
   ------------------------- */
const todoListEl = $('todoList');
function renderTodos(){
  todoListEl.innerHTML = '';
  state.todos.forEach(t=>{
    const row = document.createElement('div'); row.className='todo-item';
    const left = document.createElement('div'); left.className='todo-left';
    const chk = document.createElement('input'); chk.type='checkbox'; chk.checked = !!t.done;
    const txt = document.createElement('div'); txt.className='task-text'; txt.textContent = t.text;
    if(t.done){ txt.style.textDecoration = 'line-through'; txt.style.opacity=0.6; }
    left.appendChild(chk); left.appendChild(txt);

    // link icon
    const extras = document.createElement('div');
    if(t.link){
      const a = document.createElement('a'); a.href = t.link; a.target='_blank'; a.className='task-link'; a.textContent='🔗';
      extras.appendChild(a);
    }

    const btnWrap = document.createElement('div');
    const edit = document.createElement('button'); edit.className='btn'; edit.textContent='Sửa';
    const del = document.createElement('button'); del.className='btn'; del.textContent='Xóa';
    btnWrap.appendChild(edit); btnWrap.appendChild(del);

    row.appendChild(left); row.appendChild(extras); row.appendChild(btnWrap);
    todoListEl.appendChild(row);

    chk.addEventListener('change', ()=>{
      t.done = chk.checked; save(); renderTodos();
    });
    del.addEventListener('click', ()=>{
      state.todos = state.todos.filter(x=>x.id !== t.id); save(); renderTodos();
    });
    edit.addEventListener('click', ()=>{
      const newText = prompt('Chỉnh nội dung nhiệm vụ', t.text);
      if(newText === null) return;
      t.text = newText.trim() || t.text;
      const newLink = prompt('Link (để trống để xóa)', t.link || '');
      if(newLink === null) return;
      t.link = newLink.trim() || null;
      save(); renderTodos();
    });
  });
}
$('addTodoBtn').addEventListener('click', ()=>{
  const txt = $('todoText').value.trim(); if(!txt) return;
  const link = $('todoLink').value.trim() || null;
  state.todos.unshift({ id: Date.now(), text: txt, link, done:false });
  $('todoText').value=''; $('todoLink').value=''; save(); renderTodos();
});
$('exportTodoBtn').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(state.todos, null, 2)], {type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='todos.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),3000);
});
renderTodos();

/* -------------------------
   Ideas (center-left)
   ------------------------- */
const ideaListEl = $('ideaList');
function renderIdeas(){
  ideaListEl.innerHTML='';
  state.ideas.forEach(it=>{
    const r = document.createElement('div'); r.className='idea-row';
    const txt = document.createElement('div'); txt.className='text'; txt.textContent = it.text;
    const actions = document.createElement('div'); actions.style.display='flex'; actions.style.gap='8px';
    const edit = document.createElement('button'); edit.className='btn'; edit.textContent='Sửa';
    const del = document.createElement('button'); del.className='btn'; del.textContent='X';
    actions.appendChild(edit); actions.appendChild(del);
    r.appendChild(txt); r.appendChild(actions);
    ideaListEl.appendChild(r);

    edit.addEventListener('click', ()=>{
      const newText = prompt('Chỉnh ý tưởng', it.text);
      if(newText === null) return;
      it.text = newText.trim() || it.text; save(); renderIdeas();
    });
    del.addEventListener('click', ()=>{
      state.ideas = state.ideas.filter(x=>x.id !== it.id); save(); renderIdeas();
    });
  });
}
$('addIdeaBtn').addEventListener('click', ()=>{
  const t = $('ideaInput').value.trim(); if(!t) return;
  state.ideas.unshift({ id: Date.now(), text: t }); $('ideaInput').value=''; save(); renderIdeas();
});
renderIdeas();

/* -------------------------
   Music: upload file OR embed YouTube iframe
   ------------------------- */
const musicUpload = $('musicUpload'), musicYouTube = $('musicYouTube'), loadYT = $('loadYT'), audioContainer = $('audioContainer');
function clearAudioContainer(){ audioContainer.innerHTML = ''; state.music = null; save(); }

musicUpload.addEventListener('change', (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const url = URL.createObjectURL(f);
  clearAudioContainer();
  const audio = document.createElement('audio'); audio.controls = true; audio.src = url; audioContainer.appendChild(audio);
  state.music = { type:'file', url }; save();
});

loadYT.addEventListener('click', ()=>{
  const link = musicYouTube.value.trim(); if(!link) return;
  const id = getYouTubeID(link);
  if(!id){ alert('Không nhận diện YouTube ID. Hãy dán link đầy đủ.'); return; }
  clearAudioContainer();
  const iframe = document.createElement('iframe');
  iframe.width = '100%'; iframe.height = '180'; iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.src = `https://www.youtube.com/embed/${id}?rel=0&autoplay=1`;
  audioContainer.appendChild(iframe);
  state.music = { type:'youtube', ytId: id }; save();
});

function getYouTubeID(url){
  try {
    const u = new URL(url);
    if(u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if(u.hostname.includes('youtube.com')) return u.searchParams.get('v');
  } catch(e){}
  return null;
}

/* -------------------------
   Background apply
   ------------------------- */
const bgUpload = $('bgUpload'), bgUrl = $('bgUrl'), applyBgBtn = $('applyBgBtn');
bgUpload.addEventListener('change', e=>{
  const f = e.target.files[0]; if(!f) return;
  const url = URL.createObjectURL(f);
  applyBackground(url); state.bg = { type:'file', url }; save();
});
applyBgBtn.addEventListener('click', ()=>{
  const u = bgUrl.value.trim(); if(!u) return;
  applyBackground(u); state.bg = { type:'url', url: u }; save();
});
$('closeBg').addEventListener('click', ()=> bgPopup.style.display='none');

function applyBackground(u){
  document.body.style.backgroundImage = `url('${u}')`;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center';
}
if(state.bg && state.bg.url) applyBackground(state.bg.url);

/* -------------------------
   Pomodoro (customizable)
   ------------------------- */
const pomTimerEl = $('pomTimer'), workMinutesEl = $('workMinutes'), breakMinutesEl = $('breakMinutes');
const startPomBtn = $('startPom'), pausePomBtn = $('pausePom'), resetPomBtn = $('resetPom');
const pomStateEl = $('pomState'), ding = $('ding');

// initialize from state
if(state.pom){
  workMinutesEl.value = state.pom.work || 25;
  breakMinutesEl.value = state.pom.break || 5;
  if(!state.pom.remaining) state.pom.remaining = (state.pom.mode === 'work' ? state.pom.work : state.pom.break) * 60;
}
function formatTime(s){
  const m = String(Math.floor(s/60)).padStart(2,'0');
  const sec = String(s%60).padStart(2,'0');
  return `${m}:${sec}`;
}
function updatePomDisplay(){
  pomTimerEl.textContent = formatTime(state.pom.remaining || 0);
  pomStateEl.textContent = `Mode: ${state.pom.mode === 'work' ? 'Làm việc' : 'Nghỉ'}`;
}
updatePomDisplay();

workMinutesEl.addEventListener('change', ()=>{
  const v = Math.max(1, Math.floor(+workMinutesEl.value || 25));
  state.pom.work = v; if(state.pom.mode==='work') state.pom.remaining = v*60; save(); updatePomDisplay();
});
breakMinutesEl.addEventListener('change', ()=>{
  const v = Math.max(1, Math.floor(+breakMinutesEl.value || 5));
  state.pom.break = v; if(state.pom.mode==='break') state.pom.remaining = v*60; save(); updatePomDisplay();
});

let pomInterval = null;
startPomBtn.addEventListener('click', ()=>{
  if(pomInterval) return;
  state.pom.running = true;
  if(!state.pom.remaining || state.pom.remaining <=0) state.pom.remaining = (state.pom.mode === 'work' ? state.pom.work : state.pom.break) * 60;
  pomInterval = setInterval(()=>{
    state.pom.remaining--;
    if(state.pom.remaining <= 0){
      // ding
      try{ ding.play(); }catch(e){}
      // switch
      if(state.pom.mode === 'work'){
        state.pom.mode = 'break';
        state.pom.remaining = (state.pom.break || 5) * 60;
        alert('Kết thúc phiên làm việc — nghỉ ngơi!');
      } else {
        state.pom.mode = 'work';
        state.pom.remaining = (state.pom.work || 25) * 60;
        alert('Hết nghỉ — tiếp tục làm!');
      }
    }
    updatePomDisplay(); save();
  }, 1000);
  save();
});

pausePomBtn.addEventListener('click', ()=>{
  if(pomInterval) clearInterval(pomInterval); pomInterval = null; state.pom.running = false; save();
});

resetPomBtn.addEventListener('click', ()=>{
  if(pomInterval) clearInterval(pomInterval); pomInterval = null;
  state.pom.mode = 'work';
  state.pom.remaining = (state.pom.work || 25) * 60;
  state.pom.running = false;
  updatePomDisplay(); save();
});

/* -------------------------
   initial render for music if exist
   ------------------------- */
if(state.music){
  if(state.music.type === 'file' && state.music.url){
    const audio = document.createElement('audio'); audio.controls = true; audio.src = state.music.url; audioContainer.appendChild(audio);
  } else if(state.music.type === 'youtube' && state.music.ytId){
    const iframe = document.createElement('iframe'); iframe.width='100%'; iframe.height='180';
    iframe.src = `https://www.youtube.com/embed/${state.music.ytId}?rel=0`;
    audioContainer.appendChild(iframe);
  }
}

/* -------------------------
   Final saves / start
   ------------------------- */
save();
renderIdeas();
renderTodos();
updatePomDisplay();
