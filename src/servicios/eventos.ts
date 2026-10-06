import { eventosMock } from '@/src/mocks/eventos';
import { Evento, RespuestaApi } from '@/src/tipos';
import { guardarCache, leerCache } from '@/src/servicios/cache';
import { hayConexion } from '@/src/servicios/red';
import { apiConfigurada, apiGet } from '@/src/servicios/api';
export async function obtenerEventos():Promise<RespuestaApi<Evento[]>>{await new Promise(r=>setTimeout(r,150));const online=await hayConexion().catch(()=>false);if(online&&apiConfigurada()){const remoto=await apiGet<Evento[]>('/eventos');if('datos'in remoto){const ordenados=[...remoto.datos].sort((a,b)=>new Date(a.inicio).getTime()-new Date(b.inicio).getTime());await guardarCache('eventos',ordenados);return{...remoto,datos:ordenados};}}const base=[...eventosMock].sort((a,b)=>new Date(a.inicio).getTime()-new Date(b.inicio).getTime());if(online||!(await leerCache<Evento[]>('eventos')))await guardarCache('eventos',base);const datos=online?base:(await leerCache<Evento[]>('eventos'))??base;return{datos,meta:{total:datos.length,pagina:1,porPagina:20}};}
export async function obtenerEventoPorId(id:string):Promise<RespuestaApi<Evento>>{const r=await obtenerEventos();if('error'in r)return r;const e=r.datos.find(x=>x.id===id);return e?{datos:e}:{error:{codigo:'EVENTO_NO_ENCONTRADO',mensaje:'No existe ese evento.'}};}
