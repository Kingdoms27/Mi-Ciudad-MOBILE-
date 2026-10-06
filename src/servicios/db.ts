import * as SQLite from 'expo-sqlite';
import { EventoGuardado, Favorito, Visita } from '@/src/tipos';
let dbPromise:ReturnType<typeof SQLite.openDatabaseAsync>|null=null;
const getDb=()=>{dbPromise??=SQLite.openDatabaseAsync('mi-ciudad-colon.db');return dbPromise;};
export async function inicializarDb(){const db=await getDb();await db.execAsync(`
 PRAGMA journal_mode = WAL;
 CREATE TABLE IF NOT EXISTS visitas(id TEXT PRIMARY KEY NOT NULL,usuarioId TEXT NOT NULL,lugarId TEXT NOT NULL,fechaHora TEXT NOT NULL,origen TEXT NOT NULL,fotoUri TEXT,nota TEXT,sincronizada INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS favoritos(id TEXT PRIMARY KEY NOT NULL,usuarioId TEXT NOT NULL,lugarId TEXT NOT NULL,creadoEn TEXT NOT NULL,UNIQUE(usuarioId,lugarId));
 CREATE TABLE IF NOT EXISTS eventos_guardados(id TEXT PRIMARY KEY NOT NULL,usuarioId TEXT NOT NULL,eventoId TEXT NOT NULL,creadoEn TEXT NOT NULL,notificationId TEXT,ultimoEstado TEXT NOT NULL,UNIQUE(usuarioId,eventoId));
 `);}
export async function guardarVisitaLocal(v:Visita){const db=await getDb();await db.runAsync(`INSERT OR REPLACE INTO visitas(id,usuarioId,lugarId,fechaHora,origen,fotoUri,nota,sincronizada) VALUES(?,?,?,?,?,?,?,?)`,v.id,v.usuarioId,v.lugarId,v.fechaHora,v.origen,v.fotoUri,v.nota,v.sincronizada?1:0);}
export async function listarVisitasLocales(usuarioId?:string):Promise<Visita[]>{const db=await getDb();const rows=usuarioId?await db.getAllAsync<any>('SELECT * FROM visitas WHERE usuarioId=? ORDER BY fechaHora DESC',usuarioId):await db.getAllAsync<any>('SELECT * FROM visitas ORDER BY fechaHora DESC');return rows.map(r=>({...r,sincronizada:Boolean(r.sincronizada)}));}
export async function listarVisitasPendientes():Promise<Visita[]>{const db=await getDb();const rows=await db.getAllAsync<any>('SELECT * FROM visitas WHERE sincronizada=0 ORDER BY fechaHora ASC');return rows.map(r=>({...r,sincronizada:false}));}
export async function marcarVisitaSincronizada(id:string){const db=await getDb();await db.runAsync('UPDATE visitas SET sincronizada=1 WHERE id=?',id);}
export async function alternarFavorito(usuarioId:string,lugarId:string){const db=await getDb();const actual=await db.getFirstAsync<any>('SELECT id FROM favoritos WHERE usuarioId=? AND lugarId=?',usuarioId,lugarId);if(actual){await db.runAsync('DELETE FROM favoritos WHERE usuarioId=? AND lugarId=?',usuarioId,lugarId);return false;}const f:Favorito={id:`fav-${Date.now()}`,usuarioId,lugarId,creadoEn:new Date().toISOString()};await db.runAsync('INSERT INTO favoritos(id,usuarioId,lugarId,creadoEn) VALUES(?,?,?,?)',f.id,f.usuarioId,f.lugarId,f.creadoEn);return true;}
export async function esFavorito(usuarioId:string,lugarId:string){const db=await getDb();return Boolean(await db.getFirstAsync('SELECT id FROM favoritos WHERE usuarioId=? AND lugarId=?',usuarioId,lugarId));}
export async function listarFavoritos(usuarioId:string):Promise<Favorito[]>{const db=await getDb();return db.getAllAsync<Favorito>('SELECT * FROM favoritos WHERE usuarioId=? ORDER BY creadoEn DESC',usuarioId);}
export async function guardarEventoLocal(e:EventoGuardado){const db=await getDb();await db.runAsync('INSERT OR REPLACE INTO eventos_guardados(id,usuarioId,eventoId,creadoEn,notificationId,ultimoEstado) VALUES(?,?,?,?,?,?)',e.id,e.usuarioId,e.eventoId,e.creadoEn,e.notificationId,e.ultimoEstado);}
export async function obtenerEventoGuardado(usuarioId:string,eventoId:string){const db=await getDb();return db.getFirstAsync<EventoGuardado>('SELECT * FROM eventos_guardados WHERE usuarioId=? AND eventoId=?',usuarioId,eventoId);}
export async function listarEventosGuardados(usuarioId:string){const db=await getDb();return db.getAllAsync<EventoGuardado>('SELECT * FROM eventos_guardados WHERE usuarioId=? ORDER BY creadoEn DESC',usuarioId);}
export async function eliminarEventoGuardado(usuarioId:string,eventoId:string){const db=await getDb();await db.runAsync('DELETE FROM eventos_guardados WHERE usuarioId=? AND eventoId=?',usuarioId,eventoId);}
