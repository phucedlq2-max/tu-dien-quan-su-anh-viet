const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let dictionary = [];
let favorites = new Set(JSON.parse(localStorage.getItem("milDictFavorites") || "[]"));
let activeView = "lookup";
let searchMode = "auto";
let practiceDeck = [], practiceIndex = 0, quizQuestions = [], quizIndex = 0, score = 0, answered = false;
const normalize = s => (s || "").toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").trim();
const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function saveFavorites(){localStorage.setItem("milDictFavorites",JSON.stringify([...favorites])); updateFavCount();}
function updateFavCount(){$("#favCount").textContent=favorites.size; $("#favSummary").textContent=`${favorites.size} thuật ngữ`;}
function isFavorite(term){return favorites.has(term);}
function cardHTML(w){
 const saved=isFavorite(w.term);
 return `<article class="word-card">
 <div class="word-top"><div><h3 class="term">${escapeHtml(w.term)}</h3><p class="ipa">${escapeHtml(w.ipa || "IPA chưa có trong tài liệu")} ${w.pos?` · ${escapeHtml(w.pos)}`:""}</p></div>
 <div class="word-tools"><button class="tool-btn" title="Nghe phát âm" aria-label="Nghe phát âm" data-speak="${escapeHtml(w.term)}">▶</button><button class="tool-btn ${saved?"saved":""}" title="${saved?"Bỏ yêu thích":"Lưu yêu thích"}" aria-label="Lưu yêu thích" data-fav="${escapeHtml(w.term)}">${saved?"★":"☆"}</button></div></div>
 <p class="meaning">${escapeHtml(w.meaning || "Chưa có bản dịch")}</p>
 ${w.definition?`<p class="part">${escapeHtml(w.definition)}</p>`:""}
 ${w.example_en?`<div class="example"><div class="example-en">${escapeHtml(w.example_en)}</div><div class="example-vi">${escapeHtml(w.example_vi || "")}</div></div>`:""}
 ${w.alternate_meanings?.length?`<div class="example"><strong>Nghĩa khác trong tài liệu:</strong><div class="example-vi">${w.alternate_meanings.map(escapeHtml).join("; ")}</div></div>`:""}
 <div class="tags"><span class="tag">${escapeHtml(w.category || "Từ điển mở rộng")}</span>${w.status?`<span class="tag">${escapeHtml(w.status)}</span>`:""}${(w.tags||[]).slice(0,3).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join("")}${(w.sources||[w.source]).filter(Boolean).slice(0,2).map(s=>`<span class="tag">${escapeHtml(s)}</span>`).join("")}</div>
 </article>`;
}
function renderWords(words,target="#results"){
 const el=$(target); el.innerHTML=words.map(cardHTML).join("");
 el.querySelectorAll("[data-fav]").forEach(b=>b.addEventListener("click",()=>toggleFavorite(b.dataset.fav)));
 el.querySelectorAll("[data-speak]").forEach(b=>b.addEventListener("click",()=>speak(b.dataset.speak)));
}
function toggleFavorite(term){
 if(favorites.has(term)) favorites.delete(term); else favorites.add(term);
 saveFavorites(); if(activeView==="favorites") renderFavorites(); else searchWords();
}
function speak(term){
 if(!("speechSynthesis" in window)){alert("Trình duyệt này chưa hỗ trợ phát âm tự động.");return;}
 speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(term); u.lang="en-GB"; u.rate=.88; speechSynthesis.speak(u);
}
function searchFields(w){
 const english = [w.term, w.original_term, w.example_en, w.ipa, w.pos].filter(Boolean).join(" ");
 const vietnamese = [w.meaning, ...(w.alternate_meanings||[]), w.original_meaning, w.example_vi].filter(Boolean).join(" ");
 const other = [w.definition, w.category, ...(w.tags||[]), ...(w.sources||[]), w.source, w.status].filter(Boolean).join(" ");
 return {english:normalize(english), vietnamese:normalize(vietnamese), other:normalize(other)};
}
function searchScore(w,n){
 if(!n) return 0;
 const f=searchFields(w), term=normalize(w.term), meaning=normalize(w.meaning);
 if(searchMode==="en-vi"){
   if(term===n)return 100; if(term.startsWith(n))return 80; if(f.english.includes(n))return 60; if(f.other.includes(n))return 20; return -1;
 }
 if(searchMode==="vi-en"){
   if(meaning===n)return 100; if(meaning.startsWith(n))return 80; if(f.vietnamese.includes(n))return 60; if(f.other.includes(n))return 20; return -1;
 }
 if(term===n)return 110; if(meaning===n)return 105;
 if(term.startsWith(n))return 90; if(meaning.startsWith(n))return 85;
 if(f.english.includes(n))return 70; if(f.vietnamese.includes(n))return 65;
 if(f.other.includes(n))return 30; return -1;
}
function searchWords(){
 const q=$("#searchInput").value.trim(), n=normalize(q);
 const matches=dictionary.map(w=>({w,score:searchScore(w,n)})).filter(x=>!n||x.score>=0)
 .sort((a,b)=>b.score-a.score||normalize(a.w.term).localeCompare(normalize(b.w.term))).map(x=>x.w);
 renderWords(matches);
 $("#emptyState").classList.toggle("hidden",matches.length!==0);
 $("#statusLine").textContent=q?`Tìm thấy ${matches.length} kết quả ${searchMode==="en-vi"?"khi tra Anh → Việt":searchMode==="vi-en"?"khi tra Việt → Anh":"ở cả hai chiều"}. Tìm kiếm không phân biệt chữ hoa/thường và dấu tiếng Việt.`:`${dictionary.length} thuật ngữ tích hợp · Có thể tra tiếng Anh hoặc tiếng Việt.`;
 const expandBtn=$("#expandSearch");
 if(expandBtn){expandBtn.disabled=searchMode==="vi-en";expandBtn.textContent=searchMode==="vi-en"?"Tra cứu mở rộng hiện chỉ hỗ trợ tiếng Anh":"Tra cứu mở rộng trên Internet";}
}
function renderFavorites(){
 const words=dictionary.filter(w=>favorites.has(w.term));
 renderWords(words,"#favoritesList");
 $("#noFavorites").classList.toggle("hidden",words.length>0);
}
function showView(name){
 activeView=name; $$(".tab").forEach(t=>t.classList.toggle("active",t.dataset.view===name));
 ["lookup","favorites","practice","quiz"].forEach(v=>$("#"+v+"View").classList.toggle("hidden",v!==name));
 if(name==="favorites")renderFavorites(); if(name==="practice" && !practiceDeck.length)preparePractice();
}
function shuffle(arr){return [...arr].sort(()=>Math.random()-.5);}
function preparePractice(){
 const favWords=dictionary.filter(w=>favorites.has(w.term));
 practiceDeck=shuffle(favWords.length?favWords:dictionary).slice(0,Math.min(15,favWords.length?favWords.length:dictionary.length));
 practiceIndex=0; $("#practiceProgress").textContent=`${practiceDeck.length} thẻ`; showFlashcard();
}
function showFlashcard(){
 const w=practiceDeck[practiceIndex];
 if(!w){$("#flashTerm").textContent="Hoàn thành lượt ôn tập!";$("#flashMeaning").classList.add("hidden");$("#revealBtn").classList.add("hidden");$("#againBtn").disabled=true;$("#knownBtn").disabled=true;$("#practiceProgress").textContent="Hoàn thành";return;}
 $("#flashTerm").textContent=w.term; $("#flashMeaning").textContent=w.meaning; $("#flashMeaning").classList.add("hidden");$("#revealBtn").classList.remove("hidden");$("#revealBtn").textContent="Hiện nghĩa";$("#againBtn").disabled=true;$("#knownBtn").disabled=true;$("#practiceProgress").textContent=`Thẻ ${practiceIndex+1}/${practiceDeck.length}`;
}
function nextFlashcard(){practiceIndex++;showFlashcard();}
function startQuiz(){
 quizQuestions=shuffle(dictionary).slice(0,Math.min(10,dictionary.length));quizIndex=0;score=0;answered=false;
 $("#quizScore").textContent="Điểm: 0";showQuestion();
}
function showQuestion(){
 const box=$("#quizBox");
 if(quizIndex>=quizQuestions.length){box.innerHTML=`<div class="eyebrow">KẾT QUẢ</div><h3 class="quiz-question">Bạn đạt ${score}/${quizQuestions.length} câu</h3><p>${score>=8?"Rất tốt! Hãy tiếp tục duy trì việc ôn tập.":score>=5?"Khá tốt. Ôn lại các thuật ngữ chưa chắc chắn nhé.":"Hãy xem lại bộ từ vựng và thử lại."}</p><button id="retryQuiz" class="primary-btn">Làm lại</button>`;$("#retryQuiz").addEventListener("click",startQuiz);return;}
 const q=quizQuestions[quizIndex], wrong=shuffle(dictionary.filter(w=>w.term!==q.term)).slice(0,3);
 const options=shuffle([q,...wrong]);
 box.innerHTML=`<div class="eyebrow">CÂU ${quizIndex+1}/${quizQuestions.length}</div><h3 class="quiz-question">${escapeHtml(q.term)}</h3><p>Chọn nghĩa tiếng Việt chính xác nhất.</p><div class="quiz-options">${options.map(o=>`<button class="quiz-option" data-answer="${escapeHtml(o.term)}">${escapeHtml(o.meaning)}</button>`).join("")}</div><p id="quizFeedback" class="quiz-feedback"></p><button id="nextQuestion" class="primary-btn hidden">${quizIndex===quizQuestions.length-1?"Xem kết quả":"Câu tiếp theo →"}</button>`;
 box.querySelectorAll("[data-answer]").forEach(b=>b.addEventListener("click",()=>{
  if(answered)return;answered=true;const correct=b.dataset.answer===q.term;
  if(correct){score++;b.classList.add("correct");$("#quizFeedback").textContent="Chính xác!";}else{b.classList.add("wrong");box.querySelector(`[data-answer="${CSS.escape(q.term)}"]`).classList.add("correct");$("#quizFeedback").textContent=`Đáp án: ${q.meaning}`;}
  box.querySelectorAll("[data-answer]").forEach(x=>x.disabled=true);$("#quizScore").textContent=`Điểm: ${score}`;$("#nextQuestion").classList.remove("hidden");
 }));
 $("#nextQuestion").addEventListener("click",()=>{quizIndex++;answered=false;showQuestion();});
}
async function expandLookup(){
 const q=$("#searchInput").value.trim(); if(!q)return;
 const btn=$("#expandSearch");btn.disabled=true;btn.textContent="Đang tra cứu…";
 let found=[];
 try{
   const res=await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`);
   if(res.ok){
    const data=await res.json();
    found=data.slice(0,3).map(entry=>{
      const phon=entry.phonetic || entry.phonetics?.find(p=>p.text)?.text || "";
      const aud=entry.phonetics?.find(p=>p.audio)?.audio || "";
      const definition=entry.meanings?.flatMap(m=>m.definitions||[]).map(d=>d.definition).filter(Boolean).slice(0,2).join(" ");
      return {term:entry.word||q,ipa:phon,pos:entry.meanings?.[0]?.partOfSpeech||"",meaning:"Chưa có bản dịch tiếng Việt trong bộ từ điển",definition:definition||"Chưa có định nghĩa",category:"Tra cứu mở rộng",example_en:entry.meanings?.flatMap(m=>m.definitions||[]).find(d=>d.example)?.example||"",example_vi:"",tags:["Dữ liệu tiếng Anh"],source:"DictionaryAPI"};
    });
   }
 }catch(e){console.warn(e);}
 if(found.length){
  const n=normalize(q);const local=dictionary.filter(w=>normalize(w.term)===n);
  renderWords([...local,...found.filter(f=>!local.some(l=>normalize(l.term)===normalize(f.term)))]);
  $("#emptyState").classList.add("hidden");
  $("#statusLine").textContent="Kết quả mở rộng từ DictionaryAPI. Định nghĩa tiếng Anh không thay thế bản dịch chuyên ngành.";
 }else{
  $("#statusLine").textContent="Không lấy được dữ liệu mở rộng. Kiểm tra kết nối mạng hoặc thử một từ tiếng Anh đơn.";
  $("#emptyState").classList.remove("hidden");
 }
 btn.disabled=false;btn.textContent="Tra cứu mở rộng trên Internet";
}
async function init(){
 try{const r=await fetch("vocabulary.json");dictionary=await r.json();}catch(e){$("#statusLine").textContent="Không tải được vocabulary.json. Hãy giữ tệp này cùng thư mục với index.html.";return;}
 updateFavCount();searchWords();
 $("#searchInput").addEventListener("input",searchWords);
 $("#clearSearch").addEventListener("click",()=>{$("#searchInput").value="";searchWords();$("#searchInput").focus();});
 $$(".suggestion").forEach(b=>b.addEventListener("click",()=>{$("#searchInput").value=b.dataset.query;searchWords();}));
 $$(".direction-btn").forEach(b=>b.addEventListener("click",()=>{
   searchMode=b.dataset.mode;
   $$(".direction-btn").forEach(x=>{const active=x===b;x.classList.toggle("active",active);x.setAttribute("aria-pressed",String(active));});
   searchWords();
 }));
 $$(".tab").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
 $("#expandSearch").addEventListener("click",expandLookup);
 $("#revealBtn").addEventListener("click",()=>{$("#flashMeaning").classList.remove("hidden");$("#revealBtn").classList.add("hidden");$("#againBtn").disabled=false;$("#knownBtn").disabled=false;});
 $("#againBtn").addEventListener("click",()=>{practiceDeck.push(practiceDeck[practiceIndex]);nextFlashcard();});
 $("#knownBtn").addEventListener("click",nextFlashcard);
 $("#startPractice").addEventListener("click",preparePractice);
 $("#startQuiz").addEventListener("click",startQuiz);
 $("#themeBtn").addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem("milDictDark",document.body.classList.contains("dark")?"1":"0");});
 if(localStorage.getItem("milDictDark")==="1")document.body.classList.add("dark");
 if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
init();