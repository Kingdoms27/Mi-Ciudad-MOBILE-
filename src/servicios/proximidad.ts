import * as Location from 'expo-location';
import { Coordenadas, Lugar, Preferencias } from '@/src/tipos';
import { distanciaKm } from '@/src/utilidades/distancia';
import { notificarProximidad } from '@/src/servicios/notificaciones';

export async function revisarProximidadDesdeCoordenadas(
  lugares:Lugar[],
  preferencias:Preferencias,
  actual:Coordenadas,
){
  if(!preferencias.avisarProximidad)return null;
  const cerca=lugares
    .map(l=>({l,metros:distanciaKm(actual,l.coordenadas)*1000}))
    .filter(x=>x.metros<=preferencias.radioAvisoMetros)
    .sort((a,b)=>a.metros-b.metros)[0];
  if(cerca)await notificarProximidad(cerca.l);
  return cerca??null;
}

export async function revisarProximidad(lugares:Lugar[],preferencias:Preferencias){
  if(!preferencias.avisarProximidad)return null;
  const p=await Location.getForegroundPermissionsAsync();
  if(!p.granted)return null;
  const u=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
  return revisarProximidadDesdeCoordenadas(lugares,preferencias,{
    latitud:u.coords.latitude,
    longitud:u.coords.longitude,
  });
}
