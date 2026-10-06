import { Horario } from '@/src/tipos';
export const pesos=(v:number|null)=>v===null?'Consultar':v===0?'Gratis':`$ ${v.toLocaleString('es-AR')}`;
export const fechaEvento=(iso:string)=>new Intl.DateTimeFormat('es-AR',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
export const fechaCorta=(iso:string)=>new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
export function horarioHoy(h:Horario[]){const dia=new Date().getDay();const item=h.find(x=>x.dia===dia);return item?`${item.abre}–${item.cierra}`:'Cerrado hoy';}
export function estaAbiertoAhora(h:Horario[]){const ahora=new Date();const item=h.find(x=>x.dia===ahora.getDay());if(!item)return false;const hh=String(ahora.getHours()).padStart(2,'0')+':'+String(ahora.getMinutes()).padStart(2,'0');return hh>=item.abre&&hh<=item.cierra;}
export function mmss(seg:number){const s=Math.max(0,Math.floor(seg));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
