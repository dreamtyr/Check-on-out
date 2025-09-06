// ===================== CONFIG: ชี้ไปที่ n8n ของคุณ =====================
const API = {
  LOGIN:        'http://localhost:5678/webhook-test/login',
  EMP_EVENT:    'http://localhost:5678/webhook-test/employee-event',
  MGR_DAILY:    'http://localhost:5678/webhook-test/manager-daily',
  MGR_REMARK:   'http://localhost:5678/webhook-test/manager-remark',
};

// ===================== Helper: วัน/เวลา/เก็บ localStorage =====================
function todayLocal(){
  const now = new Date();
  const tz  = new Date(now.getTime() - now.getTimezoneOffset()*60000);
  const d   = tz.toISOString().slice(0,10);
  const [y,m,dd] = d.split('-');
  return {iso: d, display: `${dd}/${m}/${y}`};
}
function nowISO(){ return new Date().toISOString(); }

function setLS(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)) }catch{} }
function getLS(key, fallback=null){ try{ return JSON.parse(localStorage.getItem(key)||'null') ?? fallback }catch{ return fallback } }

// ===================== USER SESSION =====================
function setCurrentUser(u){ setLS('currentUser', u); }
function getCurrentUser(){ return getLS('currentUser', null); }
function clearCurrentUser(){ localStorage.removeItem('currentUser'); }

function getLockedTribe(empId, dateIso){
  const u = getCurrentUser();
  if(!u || u.id!==empId) return null;
  const map = u.tribeLockedForDay || {};
  return map[dateIso] || null;
}
function lockTribeForToday(empId, dateIso, tribeStr){
  const u = getCurrentUser(); if(!u) return;
  if(u.id!==empId) return;
  const map = u.tribeLockedForDay||{};
  map[dateIso] = tribeStr;
  u.tribeLockedForDay = map;
  setCurrentUser(u);
}

// ===================== Web client helpers =====================
async function postJSON(url, body){
  const r = await fetch(url,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  const data = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data?.message || ('HTTP '+r.status));
  return data;
}
async function getJSON(url){
  const r = await fetch(url);
  const data = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data?.message || ('HTTP '+r.status));
  return data;
}

// ===================== Geo =====================
function getPos(){return new Promise((res,rej)=>{
  if(!navigator.geolocation) return rej(new Error('อุปกรณ์ไม่รองรับ GPS'));
  navigator.geolocation.getCurrentPosition(
    p=>res({lat:p.coords.latitude,lng:p.coords.longitude}),
    rej,{enableHighAccuracy:true,timeout:15000}
  );
});}
