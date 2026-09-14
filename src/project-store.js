const PREFIX='mecaflu-project-v1:';
export function saveProject(key,data,storage){
  try{storage=storage||globalThis.localStorage;const raw=JSON.stringify({version:1,savedAt:new Date().toISOString(),data});if(raw.length>500000)throw Error('Projet trop volumineux.');storage.setItem(PREFIX+key,raw);return true;}catch{return false;}
}
export function loadProject(key,fallback,validate,storage){
  try{storage=storage||globalThis.localStorage;const raw=storage.getItem(PREFIX+key);if(!raw||raw.length>500000)return fallback();const x=JSON.parse(raw);if(x.version!==1)throw Error('Version');validate(x.data);return x.data;}catch{return fallback();}
}
export function listProjects(storage){
  try{storage=storage||globalThis.localStorage;return Array.from({length:storage.length},(_,i)=>storage.key(i)).filter(k=>k.startsWith(PREFIX+'studio:')).map(k=>{const x=JSON.parse(storage.getItem(k));return {key:k.slice(PREFIX.length),name:x.data.name,date:x.savedAt};});}catch{return [];}
}
