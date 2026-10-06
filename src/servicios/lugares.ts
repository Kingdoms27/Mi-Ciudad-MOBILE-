import { categoriasMock } from '@/src/mocks/categorias';
import { lugaresMock } from '@/src/mocks/lugares';
import { Categoria, Lugar, RespuestaApi } from '@/src/tipos';
import { guardarCache, leerCache } from '@/src/servicios/cache';
import { hayConexion } from '@/src/servicios/red';
import { apiConfigurada, apiGet } from '@/src/servicios/api';

const esperar=(ms=180)=>new Promise(r=>setTimeout(r,ms));
const CACHE_LUGARES='lugares:v3';
const CACHE_CATEGORIAS='categorias:v2';

export async function obtenerCategorias():Promise<RespuestaApi<Categoria[]>>{
  await esperar();
  if(apiConfigurada()&&await hayConexion().catch(()=>false)){
    const remoto=await apiGet<Categoria[]>('/categorias');
    if('datos'in remoto){
      await guardarCache(CACHE_CATEGORIAS,remoto.datos);
      return remoto;
    }
  }
  const datos=[...categoriasMock].sort((a,b)=>a.orden-b.orden);
  await guardarCache(CACHE_CATEGORIAS,datos);
  return{datos,meta:{total:datos.length,pagina:1,porPagina:50}};
}

export async function obtenerLugares():Promise<RespuestaApi<Lugar[]>>{
  await esperar();
  const online=await hayConexion().catch(()=>false);
  const mock=lugaresMock.filter(l=>l.activo);

  if(online&&apiConfigurada()){
    const remoto=await apiGet<Lugar[]>('/lugares');
    if('datos'in remoto){
      await guardarCache(CACHE_LUGARES,remoto.datos);
      return remoto;
    }
  }

  if(online){
    await guardarCache(CACHE_LUGARES,mock);
    return{datos:mock,meta:{total:mock.length,pagina:1,porPagina:20}};
  }

  const cache=await leerCache<Lugar[]>(CACHE_LUGARES);
  const salida=cache??mock;
  return{datos:salida,meta:{total:salida.length,pagina:1,porPagina:20}};
}

export async function obtenerLugarPorId(id:string):Promise<RespuestaApi<Lugar>>{
  await esperar(100);
  const online=await hayConexion().catch(()=>false);

  if(online&&!apiConfigurada()){
    const l=lugaresMock.find(x=>x.id===id&&x.activo);
    return l?{datos:l}:{error:{codigo:'LUGAR_NO_ENCONTRADO',mensaje:'No existe ese lugar.'}};
  }

  const lista=(await leerCache<Lugar[]>(CACHE_LUGARES))??lugaresMock;
  const l=lista.find(x=>x.id===id&&x.activo);
  return l?{datos:l}:{error:{codigo:'LUGAR_NO_ENCONTRADO',mensaje:'No existe ese lugar.'}};
}

export async function obtenerLugarPorQr(codigoQr:string):Promise<RespuestaApi<Lugar>>{
  await esperar(80);
  const l=lugaresMock.find(x=>x.codigoQr===codigoQr&&x.activo);
  return l?{datos:l}:{error:{codigo:'QR_INVALIDO',mensaje:'El código QR no pertenece a Mi Ciudad.'}};
}
