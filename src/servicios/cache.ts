import Storage from 'expo-sqlite/kv-store';

export async function guardarCache<T>(clave:string,valor:T){await Storage.setItem(`cache:${clave}`,JSON.stringify({guardadoEn:new Date().toISOString(),valor}));}
export async function leerCache<T>(clave:string):Promise<T|null>{const raw=await Storage.getItem(`cache:${clave}`);if(!raw)return null;try{return JSON.parse(raw).valor as T}catch{return null}}
export async function borrarCache(clave:string){await Storage.removeItem(`cache:${clave}`);}
