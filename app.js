const {profiles, quizQuestions} = window.APP_DATA;
let currentCategory = 'all';
let currentModalId = null;
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;
let favorites = new Set(JSON.parse(localStorage.getItem('sargozashtFavorites') || '[]'));

const normalizeFa = value => String(value || '').toLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/ۀ/g,'ه').replace(/\u200c/g,' ').replace(/\s+/g,' ').trim();
const faNum = n => Number(n).toLocaleString('fa-IR');

function showToast(message, icon='✨'){
  const toast=document.getElementById('toast');
  document.getElementById('toastMsg').textContent=message;
  document.getElementById('toastIcon').textContent=icon;
  toast.classList.remove('opacity-0','pointer-events-none');
  clearTimeout(showToast.timer);
  showToast.timer=setTimeout(()=>toast.classList.add('opacity-0','pointer-events-none'),2200);
}

function profileCard(p){
  const saved=favorites.has(p.id);
  return `<article class="bg-slate-900 border border-slate-800 rounded-3xl p-3 flex gap-3 items-center hover:border-slate-700 transition-all shadow-lg">
    <img src="${p.image}" alt="${p.name}" loading="lazy" class="w-20 h-20 rounded-2xl object-cover shrink-0 bg-slate-800">
    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-2"><div><h3 class="font-bold text-sm text-white">${p.name}</h3><p class="text-[10px] text-slate-500 mt-0.5">${p.role} • ${p.years}</p></div><button onclick="toggleFavorite('${p.id}')" aria-label="نشان کردن ${p.name}" class="text-lg ${saved?'text-amber-400':'text-slate-600'}">${saved?'★':'☆'}</button></div>
      <p class="text-[11px] text-slate-400 line-clamp-2 leading-5 mt-2">${p.bio}</p>
      <button onclick="openModal('${p.id}')" class="mt-2 text-[10px] font-bold text-amber-400 hover:text-amber-300">مشاهده داستان ←</button>
    </div>
  </article>`;
}

function renderProfiles(){
  const query=normalizeFa(document.getElementById('searchInput').value);
  const list=profiles.filter(p=>{
    const matchesCategory=currentCategory==='all'||p.category===currentCategory;
    const hay=normalizeFa([p.name,p.latinName,p.role,p.categoryLabel,p.bio].join(' '));
    return matchesCategory && (!query || hay.includes(query));
  });
  document.getElementById('profilesContainer').innerHTML=list.length?list.map(profileCard).join(''):`<div class="text-center py-10 text-slate-500 text-xs">چهره‌ای با این مشخصات پیدا نشد.</div>`;
}

function filterCategory(category, button){
  currentCategory=category;
  document.querySelectorAll('.cat-btn').forEach(btn=>btn.className='cat-btn bg-slate-900 text-slate-300 border border-slate-800 px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all');
  button.className='cat-btn bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all shadow-md';
  renderProfiles();
}

function saveFavorites(){ localStorage.setItem('sargozashtFavorites',JSON.stringify([...favorites])); }

function toggleFavorite(id){
  favorites.has(id)?favorites.delete(id):favorites.add(id);
  saveFavorites(); renderProfiles(); renderFavorites();
  if(currentModalId===id) updateModalFavoriteButton();
  showToast(favorites.has(id)?'به نشان‌شده‌ها اضافه شد':'از نشان‌شده‌ها حذف شد',favorites.has(id)?'⭐':'✓');
}

function renderFavorites(){
  const list=profiles.filter(p=>favorites.has(p.id));
  document.getElementById('favCountBadge').textContent=`${faNum(list.length)} مورد`;
  document.getElementById('favoritesContainer').innerHTML=list.length?list.map(profileCard).join(''):`<div class="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center"><div class="text-4xl mb-3">☆</div><p class="text-xs text-slate-400">هنوز چهره‌ای نشان نشده است.</p><button onclick="switchTab('home')" class="mt-4 bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl">مشاهده چهره‌ها</button></div>`;
}

function openModal(id){
  const p=profiles.find(x=>x.id===id); if(!p)return;
  currentModalId=id;
  document.getElementById('modalContent').innerHTML=`<div class="text-center">
    <img src="${p.image}" alt="${p.name}" class="w-28 h-28 rounded-3xl object-cover mx-auto shadow-xl border border-slate-700">
    <span class="inline-block mt-4 bg-amber-500/15 text-amber-400 border border-amber-500/25 px-3 py-1 rounded-full text-[10px] font-bold">${p.categoryLabel}</span>
    <h2 id="modalTitle" class="text-xl font-black text-white mt-3">${p.name}</h2><p class="text-xs text-slate-500 mt-1">${p.latinName} • ${p.years}</p>
  </div>
  <div class="mt-6 space-y-4">
    <div><h3 class="text-xs font-bold text-amber-400 mb-1">زندگی</h3><p class="text-xs text-slate-300 leading-6">${p.bio}</p></div>
    <div><h3 class="text-xs font-bold text-amber-400 mb-1">دستاورد شاخص</h3><p class="text-xs text-slate-300 leading-6">${p.achievement}</p></div>
    <blockquote class="bg-slate-950/70 border-r-2 border-amber-500 rounded-2xl p-4 text-sm text-slate-200 leading-7">«${p.quote}»<button onclick="speakQuote()" class="block mt-3 text-[10px] text-amber-400 font-bold">🔊 شنیدن نقل‌قول</button></blockquote>
    <div><h3 class="text-xs font-bold text-amber-400 mb-2">نقاط عطف</h3><div class="space-y-2">${p.milestones.map(m=>`<div class="bg-slate-950/60 rounded-xl px-3 py-2 text-[11px] text-slate-300">• ${m}</div>`).join('')}</div></div>
  </div>`;
  updateModalFavoriteButton();
  document.getElementById('detailModal').classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeModal(){document.getElementById('detailModal').classList.add('hidden');document.body.classList.remove('modal-open');currentModalId=null;}
function toggleBookmarkFromModal(){if(currentModalId)toggleFavorite(currentModalId);}
function updateModalFavoriteButton(){const btn=document.getElementById('modalFavBtn');const saved=favorites.has(currentModalId);btn.textContent=saved?'★':'☆';btn.classList.toggle('text-amber-400',saved);}

function openRandomModal(){openModal(profiles[Math.floor(Math.random()*profiles.length)].id);}

function speakQuote(){
  if(!currentModalId || !('speechSynthesis' in window)){showToast('خواندن صوتی در این مرورگر در دسترس نیست','⚠️');return;}
  const p=profiles.find(x=>x.id===currentModalId); speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(p.quote); utterance.lang='fa-IR'; utterance.rate=.9; speechSynthesis.speak(utterance);
}

function switchTab(tab){
  ['home','quiz','favorites','timeline'].forEach(name=>{
    document.getElementById(`view-${name}`).classList.toggle('hidden',name!==tab);
    document.getElementById(`nav-btn-${name}`).classList.toggle('text-amber-500',name===tab);
    document.getElementById(`nav-btn-${name}`).classList.toggle('font-bold',name===tab);
  });
  if(tab==='quiz')renderQuiz();
  if(tab==='favorites')renderFavorites();
  if(tab==='timeline')renderTimeline();
}

function renderQuiz(){
  const card=document.getElementById('quizCard');
  if(quizIndex>=quizQuestions.length){
    card.innerHTML=`<div class="text-center py-5"><div class="text-5xl mb-3">🏆</div><h3 class="font-black text-white text-lg">آزمون تمام شد</h3><p class="text-xs text-slate-400 mt-2">امتیاز شما: ${faNum(quizScore)} از ${faNum(quizQuestions.length)}</p><button onclick="restartQuiz()" class="mt-5 bg-amber-500 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl">شروع دوباره</button></div>`;
    return;
  }
  const q=quizQuestions[quizIndex];
  card.innerHTML=`<div class="flex justify-between text-[10px] text-slate-500 mb-4"><span>سؤال ${faNum(quizIndex+1)} از ${faNum(quizQuestions.length)}</span><span>امتیاز: ${faNum(quizScore)}</span></div><h3 class="font-bold text-white text-sm leading-6 mb-5">${q.q}</h3><div class="space-y-2">${q.options.map((opt,i)=>`<button onclick="answerQuiz(${i})" class="quiz-option w-full text-right bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 hover:border-amber-500 transition-all">${opt}</button>`).join('')}</div>`;
  quizAnswered=false;
}

function answerQuiz(index){
  if(quizAnswered)return; quizAnswered=true;
  const q=quizQuestions[quizIndex]; const buttons=document.querySelectorAll('.quiz-option');
  buttons.forEach((b,i)=>{b.disabled=true;if(i===q.answer)b.classList.add('border-emerald-500','text-emerald-400');else if(i===index)b.classList.add('border-rose-500','text-rose-400');});
  if(index===q.answer){quizScore++;showToast('پاسخ درست بود!','✓');}else showToast('پاسخ درست گزینه دیگری بود.','✕');
  setTimeout(()=>{quizIndex++;renderQuiz();},850);
}
function restartQuiz(){quizIndex=0;quizScore=0;renderQuiz();}

function renderTimeline(){
  document.getElementById('timelineContainer').innerHTML=profiles.map(p=>`<article class="relative bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md"><span class="absolute -right-[25px] top-5 w-3 h-3 rounded-full bg-amber-500 border-4 border-slate-950"></span><div class="text-[10px] text-amber-400 font-bold">${p.years}</div><h3 class="font-bold text-sm text-white mt-1">${p.name}</h3><p class="text-[10px] text-slate-400 mt-1">${p.role}</p><button onclick="openModal('${p.id}')" class="mt-3 text-[10px] text-amber-400 font-bold">جزئیات ←</button></article>`).join('');
}

document.getElementById('searchInput').addEventListener('input',renderProfiles);
document.getElementById('detailModal').addEventListener('click',e=>{if(e.target.id==='detailModal')closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
renderProfiles(); renderFavorites(); renderTimeline();