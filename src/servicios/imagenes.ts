import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import Storage from 'expo-sqlite/kv-store';

type RegistroImagen={url:string;uri:string};

function normalizar(urls:string|string[]){
  return (Array.isArray(urls)?urls:[urls]).filter(Boolean);
}

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

export async function resolverImagenLugar(lugarId:string,urls:string|string[]){
  const candidatas=normalizar(urls);
  if(!candidatas.length)return '';
  if(Platform.OS==='web')return candidatas[0];

  const key=`imagen-lugar:${lugarId}`;
  const raw=await Storage.getItem(key);

  if(raw){
    try{
      const registro=JSON.parse(raw) as RegistroImagen;
      if(candidatas.includes(registro.url)){
        const existente=new File(registro.uri);
        if(existente.exists)return registro.uri;
      }
    }catch{}
  }

  const dir=carpetaImagenes();
  if(!dir)return candidatas[0];

  for(const url of candidatas){
    try{
      const destino=new File(dir,`${lugarId}-${Math.abs(hash(url))}${extension(url)}`);
      const archivo=await File.downloadFileAsync(url,destino,{idempotent:true});
      await Storage.setItem(key,JSON.stringify({url,uri:archivo.uri} satisfies RegistroImagen));
      return archivo.uri;
    }catch{}
  }

  return candidatas[0];
}

export async function obtenerImagenLugarGuardada(lugarId:string,urls:string|string[]){
  if(Platform.OS==='web')return null;
  const candidatas=normalizar(urls);
  const raw=await Storage.getItem(`imagen-lugar:${lugarId}`);
  if(!raw)return null;

  try{
    const registro=JSON.parse(raw) as RegistroImagen;
    if(!candidatas.includes(registro.url))return null;
    const f=new File(registro.uri);
    return f.exists?registro.uri:null;
  }catch{
    return null;
  }
}

function hash(valor:string){
  let h=0;
  for(let i=0;i<valor.length;i++)h=((h<<5)-h)+valor.charCodeAt(i)|0;
  return h;
}
