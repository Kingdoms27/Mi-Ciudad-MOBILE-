import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import Storage from 'expo-sqlite/kv-store';

function carpeta(nombre:string){
  if(Platform.OS==='web')return null;
  const raiz=new Directory(Paths.document,'mi-ciudad');
  raiz.create({idempotent:true,intermediates:true});
  const dir=new Directory(raiz,nombre);
  dir.create({idempotent:true,intermediates:true});
  return dir;
}

export async function persistirFotoVisita(uri:string,visitaId:string){
  if(Platform.OS==='web')return uri;
  const dir=carpeta('visitas');
  if(!dir)return uri;
  const origen=new File(uri);
  const ext=origen.extension||'.jpg';
  const destino=new File(dir,`${visitaId}${ext}`);
  await origen.copy(destino,{overwrite:true});
  return destino.uri;
}

export async function descargarAudioguia(lugarId:string,url:string){
  if(Platform.OS==='web'){
    await Storage.setItem(`audio:${lugarId}`,url);
    return url;
  }
  const dir=carpeta('audioguias');
  if(!dir)return url;
  const destino=new File(dir,`${lugarId}.mp3`);
  const archivo=await File.downloadFileAsync(url,destino,{idempotent:true});
  await Storage.setItem(`audio:${lugarId}`,archivo.uri);
  return archivo.uri;
}

export async function obtenerAudioguiaLocal(lugarId:string){
  const uri=await Storage.getItem(`audio:${lugarId}`);
  if(!uri)return null;
  if(Platform.OS==='web')return uri;
  try{
    const f=new File(uri);
    return f.exists?uri:null;
  }catch{
    return null;
  }
}

export async function borrarAudioguiaLocal(lugarId:string){
  const uri=await Storage.getItem(`audio:${lugarId}`);
  if(uri&&Platform.OS!=='web'){
    try{
      const f=new File(uri);
      if(f.exists)f.delete();
    }catch{}
  }
  await Storage.removeItem(`audio:${lugarId}`);
}
