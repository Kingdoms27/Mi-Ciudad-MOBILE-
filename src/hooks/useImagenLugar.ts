import { useEffect, useMemo, useState } from 'react';
import { obtenerImagenLugarGuardada, resolverImagenLugar } from '@/src/servicios/imagenes';

export function useImagenLugar(lugarId:string,urls:string|string[]){
  const clave=useMemo(
    ()=>(Array.isArray(urls)?urls:[urls]).filter(Boolean).join('|'),
    [urls],
  );
  const lista=useMemo(()=>clave.split('|').filter(Boolean),[clave]);
  const[uri,setUri]=useState(lista[0]??'');

  useEffect(()=>{
    let activo=true;
    setUri(lista[0]??'');

    (async()=>{
      const local=await obtenerImagenLugarGuardada(lugarId,lista);
      if(local&&activo)setUri(local);

      const resuelta=await resolverImagenLugar(lugarId,lista);
      if(activo&&resuelta)setUri(resuelta);
    })().catch(()=>undefined);

    return()=>{activo=false;};
  },[lugarId,clave]);

  return uri;
}
