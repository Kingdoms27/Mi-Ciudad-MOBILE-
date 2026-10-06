import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Network from 'expo-network';
import * as Location from 'expo-location';
import { TemaProvider, useTema } from '@/src/contexto/TemaContext';
import { SesionProvider, useSesion } from '@/src/contexto/SesionContext';
import { inicializarDb } from '@/src/servicios/db';
import { sincronizarVisitasPendientes } from '@/src/servicios/visitas';
import { sincronizarEstadoEventos } from '@/src/servicios/eventosGuardados';
import { obtenerLugares } from '@/src/servicios/lugares';
import { revisarProximidad, revisarProximidadDesdeCoordenadas } from '@/src/servicios/proximidad';

function Efectos(){
  const{usuario}=useSesion();

  useEffect(()=>{
    inicializarDb().catch(console.error);
    const sub=Network.addNetworkStateListener(s=>{
      if(s.isConnected&&s.isInternetReachable!==false){
        sincronizarVisitasPendientes().catch(()=>undefined);
        if(usuario)sincronizarEstadoEventos(usuario.id).catch(()=>undefined);
      }
    });
    return()=>sub.remove();
  },[usuario?.id]);

  useEffect(()=>{
    if(!usuario||!usuario.preferencias.avisarProximidad)return;
    let cancelado=false;
    let watcher:Location.LocationSubscription|undefined;
    (async()=>{
      const r=await obtenerLugares();
      if('error'in r||cancelado)return;
      await revisarProximidad(r.datos,usuario.preferencias).catch(()=>undefined);
      const permiso=await Location.getForegroundPermissionsAsync();
      if(!permiso.granted||cancelado)return;
      watcher=await Location.watchPositionAsync(
        {accuracy:Location.Accuracy.Balanced,distanceInterval:50,timeInterval:30000},
        pos=>{
          revisarProximidadDesdeCoordenadas(r.datos,usuario.preferencias,{
            latitud:pos.coords.latitude,
            longitud:pos.coords.longitude,
          }).catch(()=>undefined);
        },
      );
    })().catch(()=>undefined);
    return()=>{cancelado=true;watcher?.remove();};
  },[
    usuario?.id,
    usuario?.preferencias.avisarProximidad,
    usuario?.preferencias.radioAvisoMetros,
  ]);

  return null;
}

function Navegacion(){
  const{esOscuro}=useTema();
  return <>
    <Efectos/>
    <StatusBar style={esOscuro?'light':'dark'}/>
    <Stack screenOptions={{headerShadowVisible:false}}>
      <Stack.Screen name="(tabs)" options={{headerShown:false}}/>
      <Stack.Screen name="lugar/[id]" options={{title:'Lugar',headerBackTitle:'Atrás'}}/>
      <Stack.Screen name="evento/[id]" options={{title:'Evento',headerBackTitle:'Atrás'}}/>
      <Stack.Screen name="favoritos" options={{title:'Favoritos'}}/>
      <Stack.Screen name="escanear" options={{title:'Escanear QR',presentation:'modal'}}/>
      <Stack.Screen name="registrar-visita" options={{title:'Registrar visita'}}/>
      <Stack.Screen name="orientar/[id]" options={{title:'Orientación'}}/>
    </Stack>
  </>;
}

export default function RootLayout(){
  return <TemaProvider><SesionProvider><Navegacion/></SesionProvider></TemaProvider>;
}
