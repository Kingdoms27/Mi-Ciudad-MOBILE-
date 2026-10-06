import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Network from 'expo-network';
import { TemaProvider, useTema } from '@/src/contexto/TemaContext';
import { SesionProvider, useSesion } from '@/src/contexto/SesionContext';
import { inicializarDb } from '@/src/servicios/db';
import { sincronizarVisitasPendientes } from '@/src/servicios/visitas';
import { sincronizarEstadoEventos } from '@/src/servicios/eventosGuardados';
import { obtenerLugares } from '@/src/servicios/lugares';
import { revisarProximidad } from '@/src/servicios/proximidad';

Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:false,shouldSetBadge:false})});
function Efectos(){const{usuario}=useSesion();useEffect(()=>{inicializarDb().catch(console.error);const sub=Network.addNetworkStateListener(s=>{if(s.isConnected&&s.isInternetReachable!==false){sincronizarVisitasPendientes().catch(()=>undefined);if(usuario)sincronizarEstadoEventos(usuario.id).catch(()=>undefined);}});return()=>sub.remove();},[usuario]);useEffect(()=>{if(!usuario)return;(async()=>{const r=await obtenerLugares();if('datos'in r)await revisarProximidad(r.datos,usuario.preferencias);})().catch(()=>undefined);},[usuario]);return null;}
function Navegacion(){const{esOscuro}=useTema();return <><Efectos/><StatusBar style={esOscuro?'light':'dark'}/><Stack screenOptions={{headerShadowVisible:false}}><Stack.Screen name="(tabs)" options={{headerShown:false}}/><Stack.Screen name="lugar/[id]" options={{title:'Lugar',headerBackTitle:'Atrás'}}/><Stack.Screen name="evento/[id]" options={{title:'Evento',headerBackTitle:'Atrás'}}/><Stack.Screen name="favoritos" options={{title:'Favoritos'}}/><Stack.Screen name="escanear" options={{title:'Escanear QR',presentation:'modal'}}/><Stack.Screen name="registrar-visita" options={{title:'Registrar visita'}}/><Stack.Screen name="orientar/[id]" options={{title:'Orientación'}}/></Stack></>}
export default function RootLayout(){return <TemaProvider><SesionProvider><Navegacion/></SesionProvider></TemaProvider>}
