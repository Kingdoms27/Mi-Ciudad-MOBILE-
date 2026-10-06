import { useEffect, useState } from 'react';
import { obtenerImagenLugarGuardada, resolverImagenLugar } from '@/src/servicios/imagenes';

export function useImagenLugar(lugarId:string,url:string){
  const[uri,setUri]=useState(url);

  useEffect(()=>{
    let activo=true;
    setUri(url);

    (async()=>{
      const local=await obtenerImagenLugarGuardada(lugarId,url);
      if(local&&activo)setUri(local);

      const resuelta=await resolverImagenLugar(lugarId,url);
      if(activo)setUri(resuelta);
    })().catch(()=>undefined);

    return()=>{activo=false;};
  },[lugarId,url]);

  return uri;
}
