// Les images de fond sont trop lourdes pour localStorage : elles vivent dans IndexedDB,
// le projet JSON ne portant que le calage. Toute indisponibilité est silencieuse.
const DB='mecaflu-basemap',STORE='images';
const open=()=>new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
});
const run=(mode,fn)=>open().then(db=>new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,mode),request=fn(tx.objectStore(STORE));
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
}));
export async function putImage(key,blob){try{if(blob.size>12000000)throw Error('Image trop lourde.');await run('readwrite',store=>store.put(blob,key));return true;}catch{return false;}}
export async function getImage(key){try{const blob=await run('readonly',store=>store.get(key));return blob instanceof Blob?blob:null;}catch{return null;}}
export async function deleteImage(key){try{await run('readwrite',store=>store.delete(key));return true;}catch{return false;}}
