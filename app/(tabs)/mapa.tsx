import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { obtenerCategorias, obtenerLugares } from '@/src/servicios/lugares';
import { Categoria, Coordenadas, Lugar } from '@/src/tipos';
import { distanciaKm, formatearDistancia } from '@/src/utilidades/distancia';
import { useTema } from '@/src/contexto/TemaContext';
import { EstadoContenido } from '@/src/componentes/EstadoContenido';
import { NetworkBanner } from '@/src/componentes/NetworkBanner';
import { GlassSurface } from '@/src/componentes/GlassSurface';
import { Reveal } from '@/src/componentes/Reveal';

const COLON={latitude:-32.2231,longitude:-58.1440,latitudeDelta:0.07,longitudeDelta:0.07};

export default function Mapa(){
  const{colores,esOscuro}=useTema();
  const insets=useSafeAreaInsets();
  const mapRef=useRef<MapView|null>(null);

  const[lugares,setLugares]=useState<Lugar[]>([]);
  const[categorias,setCategorias]=useState<Categoria[]>([]);
  const[filtro,setFiltro]=useState('todas');
  const[coord,setCoord]=useState<Coordenadas|null>(null);
  const[permiso,setPermiso]=useState<'cargando'|'ok'|'negado'>('cargando');
  const[cargando,setCargando]=useState(true);
  const[ubicando,setUbicando]=useState(false);
  const[error,setError]=useState('');
  const[seleccion,setSeleccion]=useState<Lugar|null>(null);

  const cargar=async()=>{
    setCargando(true);
    setError('');
    try{
      const[l,c]=await Promise.all([obtenerLugares(),obtenerCategorias()]);
      if('error'in l)throw new Error(l.error.mensaje);
      if('error'in c)throw new Error(c.error.mensaje);
      setLugares(l.datos);
      setCategorias(c.datos);

      const p=await Location.requestForegroundPermissionsAsync();
      if(!p.granted){
        setPermiso('negado');
        return;
      }

      const u=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
      setCoord({latitud:u.coords.latitude,longitud:u.coords.longitude});
      setPermiso('ok');
    }catch(e){
      setError(e instanceof Error?e.message:'No se pudo cargar el mapa.');
    }finally{
      setCargando(false);
    }
  };

  useEffect(()=>{cargar()},[]);

  const visibles=useMemo(
    ()=>lugares.filter(l=>filtro==='todas'||l.categoriaId===filtro),
    [lugares,filtro],
  );

  const cerca=useMemo(
    ()=>coord?[...visibles]
      .sort((a,b)=>distanciaKm(coord,a.coordenadas)-distanciaKm(coord,b.coordenadas))
      .slice(0,4):[],
    [coord,visibles],
  );

  const elegirFiltro=async(id:string)=>{
    await Haptics.selectionAsync().catch(()=>undefined);
    setFiltro(id);
    setSeleccion(null);
  };

  const enfocarLugar=async(l:Lugar)=>{
    await Haptics.selectionAsync().catch(()=>undefined);
    setSeleccion(l);
    mapRef.current?.animateToRegion({
      latitude:l.coordenadas.latitud,
      longitude:l.coordenadas.longitud,
      latitudeDelta:0.018,
      longitudeDelta:0.018,
    },420);
  };

  const enfocarUsuario=async()=>{
    setUbicando(true);
    try{
      let p=await Location.getForegroundPermissionsAsync();
      if(!p.granted)p=await Location.requestForegroundPermissionsAsync();
      if(!p.granted){
        setPermiso('negado');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(()=>undefined);
        return;
      }

      const u=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});
      const actual={latitud:u.coords.latitude,longitud:u.coords.longitude};
      setCoord(actual);
      setPermiso('ok');
      setSeleccion(null);
      mapRef.current?.animateToRegion({
        latitude:actual.latitud,
        longitude:actual.longitud,
        latitudeDelta:0.025,
        longitudeDelta:0.025,
      },480);
      await Haptics.selectionAsync().catch(()=>undefined);
    }finally{
      setUbicando(false);
    }
  };

  const volverColon=async()=>{
    setSeleccion(null);
    mapRef.current?.animateToRegion(COLON,480);
    await Haptics.selectionAsync().catch(()=>undefined);
  };

  if(cargando)return <View style={[s.center,{backgroundColor:colores.fondo}]}><EstadoContenido tipo="cargando"/></View>;
  if(error)return <View style={[s.center,{backgroundColor:colores.fondo}]}><EstadoContenido tipo="error" mensaje={error} onReintentar={cargar}/></View>;

  const top=Math.max(insets.top,12)+12;

  return <View style={s.root}>
    <NetworkBanner/>
    <MapView
      ref={mapRef}
      style={s.map}
      initialRegion={COLON}
      showsUserLocation={permiso==='ok'}
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      mapType={Platform.OS==='android'?'none':'standard'}
      loadingEnabled
      loadingBackgroundColor={colores.fondo}
      mapPadding={{top:165,right:14,bottom:245,left:14}}
      onPress={()=>setSeleccion(null)}
    >
      {Platform.OS==='android'?<UrlTile
        urlTemplate={esOscuro
          ?'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
          :'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'}
        maximumZ={20}
        flipY={false}
      />:null}
      {visibles.map(l=><Marker
        key={l.id}
        coordinate={{latitude:l.coordenadas.latitud,longitude:l.coordenadas.longitud}}
        title={l.nombre}
        description={coord?formatearDistancia(distanciaKm(coord,l.coordenadas)):l.descripcionCorta}
        pinColor={seleccion?.id===l.id?colores.acento:undefined}
        onPress={()=>enfocarLugar(l)}
      />)}
    </MapView>

    <Reveal delay={70} style={[s.filtersPos,{top}]}>
      <GlassSurface style={s.filters} intensity={68}>
        <View style={s.mapTitleRow}>
          <View>
            <Text style={[s.mapKicker,{color:colores.primario}]}>MAPA DE COLÓN</Text>
            <Text style={[s.mapTitle,{color:colores.tinta}]}>
              {visibles.length} {visibles.length===1?'lugar':'lugares'}
            </Text>
          </View>
          <View style={[s.mapIcon,{backgroundColor:colores.primarioSuave}]}>
            <Ionicons name="map-outline" size={18} color={colores.primario}/>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          <Pressable
            onPress={()=>elegirFiltro('todas')}
            style={[s.chip,{backgroundColor:filtro==='todas'?colores.primario:esOscuro?'rgba(255,255,255,.06)':'rgba(255,255,255,.76)'}]}
          >
            <Text style={{color:filtro==='todas'?'white':colores.tinta,fontWeight:'900'}}>Todos</Text>
          </Pressable>

          {categorias.map(c=><Pressable
            key={c.id}
            onPress={()=>elegirFiltro(c.id)}
            style={[s.chip,{backgroundColor:filtro===c.id?colores.primario:esOscuro?'rgba(255,255,255,.06)':'rgba(255,255,255,.76)'}]}
          >
            <Text style={{color:filtro===c.id?'white':colores.tinta,fontWeight:'900'}}>{c.nombre}</Text>
          </Pressable>)}
        </ScrollView>
      </GlassSurface>
    </Reveal>

    <View style={[s.controls,{top:top+142}]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ir a mi ubicación"
        onPress={enfocarUsuario}
        style={s.controlPress}
      >
        <GlassSurface style={s.control} intensity={70}>
          <Ionicons name={ubicando?'locate':'navigate'} size={21} color={colores.primario}/>
        </GlassSurface>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver a Colón"
        onPress={volverColon}
        style={s.controlPress}
      >
        <GlassSurface style={s.control} intensity={70}>
          <Ionicons name="home-outline" size={20} color={colores.primario}/>
        </GlassSurface>
      </Pressable>
    </View>

    {permiso==='negado'?<Reveal delay={130} style={[s.noticePos,{top:top+142}]}>
      <GlassSurface style={s.notice} intensity={60}>
        <Ionicons name="location-outline" size={19} color={colores.primario}/>
        <Text style={[s.noticeText,{color:colores.tinta}]}>
          Ubicación desactivada. El mapa y los lugares siguen disponibles.
        </Text>
      </GlassSurface>
    </Reveal>:null}

    {seleccion?<Reveal delay={90} style={s.bottomPos}>
      <GlassSurface style={s.selectedCard} intensity={70}>
        <View style={s.selectedTop}>
          <View style={{flex:1}}>
            <Text style={[s.selectedKicker,{color:colores.primario}]}>LUGAR SELECCIONADO</Text>
            <Text style={[s.selectedTitle,{color:colores.tinta}]} numberOfLines={1}>{seleccion.nombre}</Text>
            <Text style={[s.selectedDesc,{color:colores.secundario}]} numberOfLines={1}>
              {coord?formatearDistancia(distanciaKm(coord,seleccion.coordenadas)):seleccion.descripcionCorta}
            </Text>
          </View>
          <View style={[s.selectedIcon,{backgroundColor:colores.primarioSuave}]}>
            <Ionicons name="location" size={19} color={colores.primario}/>
          </View>
        </View>

        <Pressable
          style={[s.openButton,{backgroundColor:colores.primario}]}
          onPress={()=>router.push({pathname:'/lugar/[id]',params:{id:seleccion.id}})}
        >
          <Text style={s.openButtonText}>Ver lugar</Text>
          <Ionicons name="arrow-forward" size={18} color="white"/>
        </Pressable>
      </GlassSurface>
    </Reveal>:cerca.length?<Reveal delay={160} style={s.bottomPos}>
      <GlassSurface style={s.near} intensity={68}>
        <View style={s.nearHead}>
          <View>
            <Text style={[s.nearEyebrow,{color:colores.primario}]}>CERCA TUYO</Text>
            <Text style={[s.nearTitle,{color:colores.tinta}]}>Próximas paradas</Text>
          </View>
          <Ionicons name="walk-outline" size={21} color={colores.primario}/>
        </View>
        {cerca.slice(0,3).map(l=><Pressable key={l.id} onPress={()=>enfocarLugar(l)} style={s.nearRow}>
          <Text style={[s.nearName,{color:colores.tinta}]} numberOfLines={1}>{l.nombre}</Text>
          <Text style={{color:colores.primario,fontWeight:'900'}}>{formatearDistancia(distanciaKm(coord!,l.coordenadas))}</Text>
        </Pressable>)}
      </GlassSurface>
    </Reveal>:null}
  </View>;
}

const s=StyleSheet.create({
  root:{flex:1},
  map:{position:'absolute',top:0,left:0,right:0,bottom:0},
  center:{flex:1,padding:20,justifyContent:'center'},
  filtersPos:{position:'absolute',left:12,right:12},
  filters:{borderRadius:23,padding:12},
  mapTitleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:3},
  mapKicker:{fontSize:9,fontWeight:'900',letterSpacing:1.25},
  mapTitle:{fontSize:17,fontWeight:'900',marginTop:2},
  mapIcon:{width:36,height:36,borderRadius:13,alignItems:'center',justifyContent:'center'},
  chipRow:{gap:7,paddingTop:11,paddingRight:5},
  chip:{paddingHorizontal:13,paddingVertical:9,borderRadius:999},
  controls:{position:'absolute',right:14,gap:9},
  controlPress:{borderRadius:16,overflow:'hidden'},
  control:{width:46,height:46,borderRadius:16,alignItems:'center',justifyContent:'center'},
  noticePos:{position:'absolute',left:12,right:72},
  notice:{borderRadius:17,padding:12,flexDirection:'row',alignItems:'center',gap:8},
  noticeText:{flex:1,fontSize:11,lineHeight:16,fontWeight:'700'},
  bottomPos:{position:'absolute',left:12,right:12,bottom:96},
  near:{borderRadius:23,padding:15},
  nearHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:5},
  nearEyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.15},
  nearTitle:{fontSize:17,fontWeight:'900',marginTop:2},
  nearRow:{flexDirection:'row',justifyContent:'space-between',gap:10,paddingVertical:8},
  nearName:{flex:1,fontWeight:'800'},
  selectedCard:{borderRadius:24,padding:15},
  selectedTop:{flexDirection:'row',alignItems:'center',gap:10},
  selectedKicker:{fontSize:9,fontWeight:'900',letterSpacing:1.1},
  selectedTitle:{fontSize:18,fontWeight:'900',marginTop:2},
  selectedDesc:{fontSize:11,marginTop:3},
  selectedIcon:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center'},
  openButton:{marginTop:13,minHeight:46,borderRadius:15,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},
  openButtonText:{color:'white',fontWeight:'900'},
});
