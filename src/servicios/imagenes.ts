import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import Storage from 'expo-sqlite/kv-store';

type RegistroImagen={url:string;uri:string};

function carpetaImagenes(){
  if(Platform.OS==='web')return null;
  const raiz=new Directory(Paths.document,'mi-ciudad');
  raiz.create({idempotent:true,intermediates:true});
  const dir=new Directory(raiz,'imagenes-lugares');
  dir.create({idempotent:true,intermediates:true});
  return dir;
}

function extension(url:string){
  const limpia=url.split('?')[0].toLowerCase();
  if(limpia.endsWith('.png'))return '.png';
  if(limpia.endsWith('.webp'))return '.webp';
  if(limpia.endsWith('.jpeg'))return '.jpeg';
  return '.jpg';
}

export async function resolverImagenLugar(lugarId:string,url:string){
  if(Platform.OS==='web')return url;

  const key=`imagen-lugar:${lugarId}`;
  const raw=await Storage.getItem(key);

  if(raw){
    try{
      const registro=JSON.parse(raw) as RegistroImagen;
      if(registro.url===url){
        const existente=new File(registro.uri);
        if(existente.exists)return registro.uri;
      }
    }catch{}
  }

  try{
    const dir=carpetaImagenes();
    if(!dir)return url;
    const destino=new File(dir,`${lugarId}${extension(url)}`);
    const archivo=await File.downloadFileAsync(url,destino,{idempotent:true});
    await Storage.setItem(key,JSON.stringify({url,uri:archivo.uri} satisfies RegistroImagen));
    return archivo.uri;
  }catch{
    return url;
  }
}

export async function obtenerImagenLugarGuardada(lugarId:string,url:string){
  if(Platform.OS==='web')return null;
  const raw=await Storage.getItem(`imagen-lugar:${lugarId}`);
  if(!raw)return null;
  try{
    const registro=JSON.parse(raw) as RegistroImagen;
    if(registro.url!==url)return null;
    const f=new File(registro.uri);
    return f.exists?registro.uri:null;
  }catch{
    return null;
  }
}
