import * as Location from 'expo-location';
import { marcarVisitaSincronizada, guardarVisitaLocal, listarVisitasLocales, listarVisitasPendientes } from '@/src/servicios/db';
import { persistirFotoVisita } from '@/src/servicios/archivos';
import { obtenerLugarPorId } from '@/src/servicios/lugares';
import { hayConexion } from '@/src/servicios/red';
import { apiConfigurada, apiPost } from '@/src/servicios/api';
import { distanciaKm } from '@/src/utilidades/distancia';
import { OrigenVisita, Visita } from '@/src/tipos';
export async function registrarVisita(usuarioId:string,lugarId:string,origen:OrigenVisita,nota:string|null=null,fotoTemporal:string|null=null){const id=`vis-${Date.now()}`;let fotoUri:string|null=null;if(fotoTemporal)fotoUri=await persistirFotoVisita(fotoTemporal,id);const visita:Visita={id,usuarioId,lugarId,fechaHora:new Date().toISOString(),origen,fotoUri,nota:nota?.trim()||null,sincronizada:false};await guardarVisitaLocal(visita);return visita;}
export async function obtenerRecorrido(usuarioId?:string){return listarVisitasLocales(usuarioId);}
export async function validarCercania(lugarId:string,maxMetros=200){const p=await Location.requestForegroundPermissionsAsync();if(!p.granted)return{ok:false,mensaje:'Necesitamos ubicación para validar que estás cerca. Podés registrar la visita manualmente.'};const r=await obtenerLugarPorId(lugarId);if('error'in r)return{ok:false,mensaje:r.error.mensaje};const u=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});const km=distanciaKm({latitud:u.coords.latitude,longitud:u.coords.longitude},r.datos.coordenadas);return{ok:km*1000<=maxMetros,mensaje:km*1000<=maxMetros?'Ubicación validada.':`Estás a ${Math.round(km*1000)} m. Acercate a menos de ${maxMetros} m o usá el registro manual.`};}
export async function sincronizarVisitasPendientes(){if(!(await hayConexion()))return 0;const pendientes=await listarVisitasPendientes();let sincronizadas=0;for(const v of pendientes){if(apiConfigurada()){const r=await apiPost<Visita>('/visitas',v);if('error'in r)continue;}else{await new Promise(r=>setTimeout(r,80));}await marcarVisitaSincronizada(v.id);sincronizadas++;}return sincronizadas;}
