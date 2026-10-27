(() => {
"use strict";
const $ = id => document.getElementById(id);
let rows = [], headers = [], mapping = {}, filename = "";
const aliases = {
 date:["date","tarih","matchdate","mac tarihi"],
 league:["div","league","lig","competition","turnuva"],
 home:["hometeam","homeside","evsahibi","ev sahibi","ev","home"],
 away:["awayteam","deplasman","deplasman takimi","deplasman takımı","away"],
 h:["b365h","psh","whh","homeodds","ms1","1","ev oran","evorani","ev oranı"],
 d:["b365d","psd","whd","drawodds","msx","x","beraberlik","beraberlikorani"],
 a:["b365a","psa","wha","awayodds","ms2","2","dep oran","deporani","dep oranı"],
 fthg:["fthg","fulltimehomegoals","evgol","ms ev gol","maç sonu ev gol","ft home goals"],
 ftag:["ftag","fulltimeawaygoals","depgol","ms dep gol","maç sonu dep gol","ft away goals"],
 hthg:["hthg","halftimehomegoals","iyevgol","iy ev gol","ilk yari ev gol","ilk yarı ev gol"],
 htag:["htag","halftimeawaygoals","iydepgol","iy dep gol","ilk yari dep gol","ilk yarı dep gol"]
};
const norm = s => String(s ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"");
function parseCSV(text) {
  text = text.replace(/^\uFEFF/,"");
  const out=[]; let row=[], cell="", q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c === '"'){ if(q && text[i+1] === '"'){cell+='"';i++;} else q=!q; }
    else if(c==="," && !q){row.push(cell);cell="";}
    else if((c==="\n"||c==="\r")&&!q){ if(c==="\r"&&text[i+1]==="\n")i++;row.push(cell);if(row.some(v=>v.trim()!==""))out.push(row);row=[];cell="";}
    else cell+=c;
  }
  if(cell.length||row.length){row.push(cell);if(row.some(v=>v.trim()!==""))out.push(row);}
  if(!out.length) return {headers:[],rows:[]};
  const hs=out[0].map(h=>h.trim());
  const data=out.slice(1).map(r=>{const o={};hs.forEach((h,i)=>o[h]=(r[i]??"").trim());return o;});
  return {headers:hs,rows:data};
}
function findHeader(key) {
  const list=aliases[key]||[];
  for(const h of headers){const nh=norm(h);if(list.some(a=>nh===norm(a)))return h;}
  for(const h of headers){const nh=norm(h);if(list.some(a=>nh.includes(norm(a))&&norm(a).length>=4))return h;}
  return "";
}
function detectMapping(){ const m={}; Object.keys(aliases).forEach(k=>m[k]=findHeader(k)); return m; }
function number(v){ if(v===undefined||v===null||String(v).trim()==="")return null; const n=Number(String(v).trim().replace(",", "."));return Number.isFinite(n)?n:null; }
function fmtPct(n,d){return d?((100*n/d).toFixed(1)+"%"):"—";}
function score(r,k1,k2){const a=number(r[mapping[k1]]),b=number(r[mapping[k2]]);return a===null||b===null?"—":`${a}-${b}`;}
function dateSortVal(s){const n=Date.parse(s);return Number.isNaN(n)?0:n;}
function renderMapping(){
  const keys=[["date","Tarih"],["league","Lig"],["home","Ev sahibi"],["away","Deplasman"],["h","MS1 oran sütunu"],["d","MSX oran sütunu"],["a","MS2 oran sütunu"],["fthg","MS ev gol"],["ftag","MS dep gol"],["hthg","İY ev gol"],["htag","İY dep gol"]];
  $("mappingFields").innerHTML="";
  keys.forEach(([k,label])=>{
    const wrap=document.createElement("div");wrap.className="field";
    const l=document.createElement("label");l.textContent=label;
    const s=document.createElement("select");s.dataset.key=k;
    const empty=document.createElement("option");empty.value="";empty.textContent="— Seçilmedi —";s.append(empty);
    headers.forEach(h=>{const o=document.createElement("option");o.value=h;o.textContent=h;if(mapping[k]===h)o.selected=true;s.append(o);});
    s.addEventListener("change",()=>{mapping[k]=s.value;updateLeagueFilter();});
    wrap.append(l,s);$("mappingFields").append(wrap);
  });
  $("mappingCard").classList.remove("hidden");
}
function updateLeagueFilter(){
  const sel=$("leagueFilter"), current=sel.value;
  const leagueKey=mapping.league;
  const leagues=[...new Set(leagueKey?rows.map(r=>r[leagueKey]).filter(v=>v&&v.trim()):[])].sort((a,b)=>a.localeCompare(b));
  sel.innerHTML='<option value="">Tüm ligler</option>';
  leagues.forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;sel.append(o);});
  if(leagues.includes(current))sel.value=current;
}
function setStatus(message,kind=""){
  const el=$("importStatus");el.className="note"+(kind?" "+kind:"");el.textContent=message;
}
function onLoaded(text,name){
  const parsed=parseCSV(text);
  if(parsed.headers.length<2||!parsed.rows.length){setStatus("CSV okunamadı veya dosyada veri satırı yok. Virgülle ayrılmış CSV dosyası seç.", "error");return;}
  headers=parsed.headers;rows=parsed.rows;filename=name;mapping=detectMapping();
  renderMapping();updateLeagueFilter();
  $("analyzeBtn").disabled=false;
  const count=rows.length;
  setStatus(`${name}: ${count.toLocaleString("tr-TR")} veri satırı yüklendi. Otomatik sütun eşleştirmesini kontrol et; sonra oranları gir.`, "success");
}
$("file").addEventListener("change",async e=>{
 const f=e.target.files?.[0];if(!f)return;
 try{onLoaded(await f.text(),f.name);}catch(err){setStatus("Dosya okunamadı: "+err.message,"error");}
});
$("templateBtn").addEventListener("click",()=>{
 const csv="Date,Div,HomeTeam,AwayTeam,B365H,B365D,B365A,FTHG,FTAG,HTHG,HTAG\r\n";
 download("mac_oran_sablonu.csv",csv,"text/csv;charset=utf-8");
});
$("clearBtn").addEventListener("click",()=>{
 rows=[];headers=[];mapping={};filename="";$("file").value="";$("analyzeBtn").disabled=true;
 $("mappingCard").classList.add("hidden");$("results").innerHTML="<h2>Analiz sonuçları</h2><p class='muted'>Veri temizlendi. Yeni CSV dosyası yükleyebilirsin.</p>";
 setStatus("Henüz veri yüklenmedi.");
});
function download(name,content,type){
 const blob=new Blob(["\uFEFF",content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function resultOf(r){
 const hg=number(r[mapping.fthg]),ag=number(r[mapping.ftag]);
 if(hg===null||ag===null)return null;
 return hg>ag?"MS1":hg===ag?"MSX":"MS2";
}
function analyze(){
 const target=[number($("od1").value),number($("odx").value),number($("od2").value)];
 if(target.some(v=>v===null||v<=1)){alert("Lütfen MS1, MSX ve MS2 için 1'den büyük geçerli oranlar gir.");return;}
 const required=["h","d","a"];
 const missing=required.filter(k=>!mapping[k]);
 if(missing.length){alert("Oran sütunları bulunamadı. Sütun eşleştirme bölümünden MS1, MSX ve MS2 sütunlarını seç.");return;}
 const tol=Number($("tolerance").value),league=$("leagueFilter").value;
 const usable=rows.filter(r=>required.every(k=>number(r[mapping[k]])!==null)&&(!league||!mapping.league||r[mapping.league]===league));
 const exact=[],near=[];
 usable.forEach(r=>{
  const odds=required.map(k=>number(r[mapping[k]]));
  const diffs=odds.map((v,i)=>Math.abs(v-target[i]));
  if(diffs.every(d=>d<0.005))exact.push(r);
  else if(diffs.every(d=>d<=tol+1e-9))near.push(r);
 });
 const sorted=a=>a.slice().sort((x,y)=>dateSortVal(y[mapping.date])-dateSortVal(x[mapping.date]));
 renderResults(sorted(exact),sorted(near),usable.length,target,tol,league);
}
function summaryHTML(matches,label){
 const completed=matches.map(r=>({r,out:resultOf(r)})).filter(x=>x.out);
 const n=completed.length, counts={MS1:0,MSX:0,MS2:0};
 completed.forEach(x=>counts[x.out]++);
 const missingScore=matches.length-n;
 const scores=matches.map(r=>({r,ft:score(r,"fthg","ftag"),ht:score(r,"hthg","htag")})).filter(x=>x.ft!=="—");
 const leagues=[...new Set(matches.map(r=>mapping.league?r[mapping.league]:"").filter(Boolean))];
 const bars=Object.entries(counts).map(([k,v])=>`<div class="barrow"><b>${k}</b><div class="track"><div class="fill" style="width:${n?v/n*100:0}%"></div></div><span>${fmtPct(v,n)}</span></div>`).join("");
 return `<section class="card" style="padding:12px;margin-top:12px">
 <h3>${label}</h3><div class="stats">
 <div class="stat"><strong>${matches.length}</strong><span>Eşleşen maç</span></div>
 <div class="stat"><strong>${n}</strong><span>Sonucu hesaplanan</span></div>
 <div class="stat"><strong>${missingScore}</strong><span>Skoru eksik</span></div>
 <div class="stat"><strong>${leagues.length}</strong><span>Temsil edilen lig</span></div>
 </div>
 <div class="bars">${bars}</div>
 <p class="small muted">Yüzdeler yalnızca MS sonucu hesaplanabilen ${n} maç üzerinden hesaplanır. Eksik skor kaydı olan ${missingScore} maç paydaya dahil edilmez.</p>
 ${tableHTML(matches)}
 </section>`;
}
function tableHTML(matches){
 if(!matches.length)return "<p class='muted'>Bu grupta eşleşen maç bulunmadı.</p>";
 const cols=[["date","Tarih"],["league","Lig"],["home","Ev sahibi"],["away","Deplasman"]];
 let html="<div class='tablewrap'><table><thead><tr>";
 html+="<th>Tarih</th><th>Lig</th><th>Ev sahibi</th><th>Deplasman</th><th>MS oranları (1/X/2)</th><th>İY skoru</th><th>MS skoru</th><th>Sonuç</th></tr></thead><tbody>";
 matches.forEach(r=>{
  const odds=["h","d","a"].map(k=>number(r[mapping[k]])?.toFixed(2)??"—").join(" / ");
  const outcome=resultOf(r)||"Skor yok";
  html+=`<tr><td>${esc(mapping.date?r[mapping.date]:"—")}</td><td>${esc(mapping.league?r[mapping.league]:"—")}</td><td>${esc(mapping.home?r[mapping.home]:"—")}</td><td>${esc(mapping.away?r[mapping.away]:"—")}</td><td>${odds}</td><td>${esc(score(r,"hthg","htag"))}</td><td>${esc(score(r,"fthg","ftag"))}</td><td>${outcome}</td></tr>`;
 });
 return html+"</tbody></table></div>";
}
let exportRows=[];
function renderResults(exact,near,usableCount,target,tol,league){
 exportRows=[];
 const result=$("results");
 const exactCompleted=exact.filter(r=>resultOf(r)).length,nearCompleted=near.filter(r=>resultOf(r)).length;
 const total=exact.length+near.length;
 result.innerHTML=`<h2>Analiz sonuçları</h2>
 <div class="note ${total?"success":""}">${usableCount.toLocaleString("tr-TR")} satırda geçerli üçlü oran bulundu. ${total?total+" eşleşme bulundu.":"Girilen oranlarda eşleşme bulunamadı; sonuç uydurulmadı."}
 ${league?" Seçili lig: "+esc(league)+".":" Lig filtresi: tüm ligler."}</div>
 <p class="small muted">Aranan oranlar: ${target.map(v=>v.toFixed(2)).join(" / ")} · Yakın eşleşme toleransı: ±${tol.toFixed(2)} · Dosya: ${esc(filename)}</p>
 <div class="stats" style="margin-top:12px">
 <div class="stat"><strong>${exact.length}</strong><span>Tam eşleşme</span></div>
 <div class="stat"><strong>${near.length}</strong><span>Yakın eşleşme</span></div>
 <div class="stat"><strong>${exactCompleted}</strong><span>Tam eşleşme skor verisi</span></div>
 <div class="stat"><strong>${nearCompleted}</strong><span>Yakın eşleşme skor verisi</span></div>
 </div>
 ${summaryHTML(exact,"Tam eşleşme sonuçları")}
 ${summaryHTML(near,"Yakın eşleşme sonuçları")}
 <div class="actions"><button id="exportBtn">Eşleşmeleri CSV olarak indir</button></div>
 <p class="small muted">Not: Tam eşleşme iki ondalık basamakta karşılaştırılır. Yakın eşleşme, her üç oranın da hedef orana ayrı ayrı tolerans içinde olmasıdır. Yakın eşleşme grubu tam eşleşmeleri tekrar içermez.</p>`;
 exportRows=[...exact.map(r=>({...r,__matchType:"Tam eşleşme"})),...near.map(r=>({...r,__matchType:"Yakın eşleşme"}))];
 $("exportBtn").addEventListener("click",exportCSV);
}
function exportCSV(){
 if(!exportRows.length){alert("Dışa aktarılacak eşleşme yok.");return;}
 const extra=["__matchType"];
 const outHeaders=[...headers.filter(h=>!extra.includes(h)),"Eşleşme türü","Hesaplanan MS sonucu","İY skoru","MS skoru"];
 const lines=[outHeaders.map(csvCell).join(",")];
 exportRows.forEach(r=>{
  const vals=headers.filter(h=>!extra.includes(h)).map(h=>r[h]??"");
  vals.push(r.__matchType,resultOf(r)||"",score(r,"hthg","htag"),score(r,"fthg","ftag"));
  lines.push(vals.map(csvCell).join(","));
 });
 download("mac_oran_analiz_sonuclari.csv",lines.join("\r\n"),"text/csv;charset=utf-8");
}
function csvCell(v){const s=String(v??"");return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
$("analyzeBtn").addEventListener("click",analyze);
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
 window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
})();