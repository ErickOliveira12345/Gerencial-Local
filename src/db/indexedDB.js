const NAME = 'gerencial-local';
export const STORES = ['clientes', 'servicos', 'ordens', 'lancamentos', 'orcamentos', 'agenda', 'materiais', 'movimentosEstoque', 'planilhas', 'lixeira'];
export function openDB() { return new Promise((resolve,reject)=>{const req=indexedDB.open(NAME,3);req.onupgradeneeded=()=>{for(const name of STORES) if(!req.result.objectStoreNames.contains(name))req.result.createObjectStore(name,{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);}); }
export async function all(store){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly');const req=tx.objectStore(store).getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();});}
export async function save(store,item){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(item);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);});}
export async function remove(store,id){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(id);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);});}
export async function exportBackup(){const data={version:3,exportadoEm:new Date().toISOString(),stores:{}};for(const store of STORES)data.stores[store]=await all(store);return data;}
export async function importBackup(data){
// Aceita tanto o backup da versão React quanto o JSON da versão HTML ampliada.
let incoming;
if(data?.app==='gerencial-local' && data?.dados){incoming={...data.dados,lancamentos:(data.dados.financeiro||[]).map(x=>({...x,origemLegacy:true}))};}
else if(data?.stores && typeof data.stores==='object'){incoming=data.stores;}
else throw Error('Formato de backup desconhecido');
if(!['clientes','servicos','ordens','lancamentos'].every(s=>Array.isArray(incoming[s])))throw Error('Backup incompleto ou inválido');
const valid=Object.fromEntries(STORES.map(k=>[k,Array.isArray(incoming[k])?incoming[k]:[]]));
const existing=await exportBackup();
const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORES,'readwrite');for(const store of STORES){const os=tx.objectStore(store);os.clear();for(const row of valid[store]){if(!row||typeof row.id!=='string') {tx.abort();return;}os.put(row);}}tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(Error('Importação cancelada'));};});}
