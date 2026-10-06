import { Coordenadas } from '@/src/tipos';
const R=6371; const rad=(v:number)=>v*Math.PI/180;
export function distanciaKm(a:Coordenadas,b:Coordenadas){const dLat=rad(b.latitud-a.latitud);const dLon=rad(b.longitud-a.longitud);const h=Math.sin(dLat/2)**2+Math.cos(rad(a.latitud))*Math.cos(rad(b.latitud))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(h));}
export function formatearDistancia(km:number){return km<1?`${Math.round(km*1000)} m`:`${km.toFixed(1).replace('.',',')} km`;}
export function rumboGrados(a:Coordenadas,b:Coordenadas){const lat1=rad(a.latitud),lat2=rad(b.latitud),dLon=rad(b.longitud-a.longitud);const y=Math.sin(dLon)*Math.cos(lat2);const x=Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);return (Math.atan2(y,x)*180/Math.PI+360)%360;}
