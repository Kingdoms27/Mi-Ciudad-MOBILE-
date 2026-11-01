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

  let respaldoGuardado='';
  if(raw){
    try{
      const registro=JSON.parse(raw) as RegistroImagen;
      if(candidatas.includes(registro.url)){
        const existente=new File(registro.uri);
        if(existente.exists && existente.size){
          // Si cambió la foto principal, intentar descargarla. Una ilustración
          // guardada de la API no debe bloquear una foto turística recién añadida.
          if(registro.url===candidatas[0])return registro.uri;
          respaldoGuardado=registro.uri;
        }
      }
    }catch{}
  }

  const dir=carpetaImagenes();
  if(!dir)return candidatas[0];

  for(const url of candidatas){
    try{
      const destino=new File(dir,`${lugarId}-${Math.abs(hash(url))}${extension(url)}`);
      const archivo=await File.downloadFileAsync(url,destino,{idempotent:true});
      // No registrar descargas vacías o incompletas como si fueran fotos válidas.
      if(!archivo.exists || !archivo.size){
        if(archivo.exists)archivo.delete();
        continue;
      }
      await Storage.setItem(key,JSON.stringify({url,uri:archivo.uri} satisfies RegistroImagen));
      return archivo.uri;
    }catch{}
  }

  // Si el teléfono quedó offline durante el cambio de foto, mantener la
  // copia anterior válida hasta que se pueda descargar la principal.
  return respaldoGuardado;
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


/** Una imagen corrupta no debe sobrevivir entre aperturas de pantalla.
 * Sólo descarta el registro si todavía corresponde a la URI que falló.
 */
export async function descartarImagenLugarFallida(lugarId:string,uriFallida:string){
  if(Platform.OS==='web'||!uriFallida)return;
  const key=`imagen-lugar:${lugarId}`;
  try{
    const raw=await Storage.getItem(key);
    if(!raw)return;
    const registro=JSON.parse(raw) as RegistroImagen;
    if(registro.uri!==uriFallida && registro.url!==uriFallida)return;
    await Storage.removeItem(key);
    if(registro.uri.startsWith('file://')){
      const f=new File(registro.uri);
      if(f.exists)f.delete();
    }
  }catch{}
}

function hash(valor:string){
  let h=0;
  for(let i=0;i<valor.length;i++)h=((h<<5)-h)+valor.charCodeAt(i)|0;
  return h;
}
