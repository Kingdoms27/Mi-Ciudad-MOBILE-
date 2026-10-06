import { useEffect, useMemo } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
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
  const{esOscuro,colores}=useTema();

  const navTheme=useMemo(()=>{
    const base=esOscuro?DarkTheme:DefaultTheme;
    return {
      ...base,
      colors:{
        ...base.colors,
        primary:colores.primario,
        background:colores.fondo,
        card:colores.fondo,
        text:colores.tinta,
        border:'transparent',
        notification:colores.acento,
      },
    };
  },[esOscuro,colores]);

  return <NavigationThemeProvider value={navTheme}>
    <Efectos/>
    <StatusBar style={esOscuro?'light':'dark'}/>
    <Stack screenOptions={{
      headerShown:false,
      animation:'fade_from_bottom',
      animationDuration:240,
      gestureEnabled:true,
      fullScreenGestureEnabled:true,
      contentStyle:{backgroundColor:colores.fondo},
    }}>
      <Stack.Screen name="(tabs)"/>
      <Stack.Screen name="lugar/[id]"/>
      <Stack.Screen name="evento/[id]"/>
      <Stack.Screen name="favoritos"/>
      <Stack.Screen name="escanear" options={{presentation:'modal',animation:'slide_from_bottom'}}/>
      <Stack.Screen name="registrar-visita"/>
      <Stack.Screen name="orientar/[id]"/>
    </Stack>
  </NavigationThemeProvider>;
}

export default function RootLayout(){
  return <TemaProvider><SesionProvider><Navegacion/></SesionProvider></TemaProvider>;
}
