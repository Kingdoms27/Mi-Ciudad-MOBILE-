import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { obtenerCategorias, obtenerLugares } from '@/src/servicios/lugares';
import { Categoria, Coordenadas, Lugar } from '@/src/tipos';
import { distanciaKm, formatearDistancia } from '@/src/utilidades/distancia';
import { useTema } from '@/src/contexto/TemaContext';
import { EstadoContenido } from '@/src/componentes/EstadoContenido';
import { NetworkBanner } from '@/src/componentes/NetworkBanner';
import { GlassSurface } from '@/src/componentes/GlassSurface';
import { Reveal } from '@/src/componentes/Reveal';

const COLON={latitude:-32.2231,longitude:-58.1440,latitudeDelta:0.09,longitudeDelta:0.09};

export default function Mapa(){
  const{colores,esOscuro}=useTema();
  const[lugares,setLugares]=useState<Lugar[]>([]);
  const[categorias,setCategorias]=useState<Categoria[]>([]);
  const[filtro,setFiltro]=useState('todas');
  const[coord,setCoord]=useState<Coordenadas|null>(null);
  const[permiso,setPermiso]=useState<'cargando'|'ok'|'negado'>('cargando');
  const[cargando,setCargando]=useState(true);
  const[error,setError]=useState('');

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
  const visibles=useMemo(()=>lugares.filter(l=>filtro==='todas'||l.categoriaId===filtro),[lugares,filtro]);
  const cerca=useMemo(()=>coord?[...visibles].sort((a,b)=>distanciaKm(coord,a.coordenadas)-distanciaKm(coord,b.coordenadas)).slice(0,4):[],[coord,visibles]);

  if(cargando)return <View style={[s.center,{backgroundColor:colores.fondo}]}><EstadoContenido tipo="cargando"/></View>;
  if(error)return <View style={[s.center,{backgroundColor:colores.fondo}]}><EstadoContenido tipo="error" mensaje={error} onReintentar={cargar}/></View>;

  return <View style={s.root}>
    <NetworkBanner/>
    <MapView style={s.map} initialRegion={COLON} showsUserLocation={permiso==='ok'}>
      {visibles.map(l=><Marker
        key={l.id}
        coordinate={{latitude:l.coordenadas.latitud,longitude:l.coordenadas.longitud}}
        title={l.nombre}
        description={coord?formatearDistancia(distanciaKm(coord,l.coordenadas)):l.descripcionCorta}
        onCalloutPress={()=>router.push({pathname:'/lugar/[id]',params:{id:l.id}})}
      />)}
    </MapView>

    <Reveal delay={80} style={s.filtersPos}>
      <GlassSurface style={s.filters} intensity={62}>
        <View style={s.mapTitleRow}>
          <View>
            <Text style={[s.mapKicker,{color:colores.primario}]}>MAPA DE COLÓN</Text>
            <Text style={[s.mapTitle,{color:colores.tinta}]}>{visibles.length} lugares</Text>
          </View>
          <View style={[s.mapIcon,{backgroundColor:colores.primarioSuave}]}>
            <Ionicons name="navigate-outline" size={18} color={colores.primario}/>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          <Pressable onPress={()=>setFiltro('todas')} style={[s.chip,{backgroundColor:filtro==='todas'?colores.primario:esOscuro?'rgba(255,255,255,.06)':'rgba(255,255,255,.7)'}]}>
            <Text style={{color:filtro==='todas'?'white':colores.tinta,fontWeight:'800'}}>Todos</Text>
          </Pressable>
          {categorias.map(c=><Pressable key={c.id} onPress={()=>setFiltro(c.id)} style={[s.chip,{backgroundColor:filtro===c.id?colores.primario:esOscuro?'rgba(255,255,255,.06)':'rgba(255,255,255,.7)'}]}>
            <Text style={{color:filtro===c.id?'white':colores.tinta,fontWeight:'800'}}>{c.nombre}</Text>
          </Pressable>)}
        </ScrollView>
      </GlassSurface>
    </Reveal>

    {permiso==='negado'?<Reveal delay={150} style={s.noticePos}>
      <GlassSurface style={s.notice} intensity={55}>
        <Ionicons name="location-outline" size={20} color={colores.primario}/>
        <Text style={[s.noticeText,{color:colores.tinta}]}>Ubicación desactivada. El mapa sigue disponible; sólo ocultamos tu punto y las distancias.</Text>
      </GlassSurface>
    </Reveal>:null}

    {cerca.length?<Reveal delay={180} style={s.nearPos}>
      <GlassSurface style={s.near} intensity={62}>
        <View style={s.nearHead}>
          <View>
            <Text style={[s.nearEyebrow,{color:colores.primario}]}>CERCA TUYO</Text>
            <Text style={[s.nearTitle,{color:colores.tinta}]}>Próximas paradas</Text>
          </View>
          <Ionicons name="walk-outline" size={21} color={colores.primario}/>
        </View>
        {cerca.slice(0,3).map(l=><Pressable key={l.id} onPress={()=>router.push({pathname:'/lugar/[id]',params:{id:l.id}})} style={s.nearRow}>
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
  filtersPos:{position:'absolute',top:50,left:12,right:12},
  filters:{borderRadius:23,padding:12},
  mapTitleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:3},
  mapKicker:{fontSize:9,fontWeight:'900',letterSpacing:1.25},
  mapTitle:{fontSize:17,fontWeight:'900',marginTop:2},
  mapIcon:{width:36,height:36,borderRadius:13,alignItems:'center',justifyContent:'center'},
  chipRow:{gap:7,paddingTop:11,paddingRight:5},
  chip:{paddingHorizontal:13,paddingVertical:9,borderRadius:999},
  noticePos:{position:'absolute',top:184,left:12,right:12},
  notice:{borderRadius:17,padding:12,flexDirection:'row',alignItems:'center',gap:8},
  noticeText:{flex:1,fontSize:12,lineHeight:17,fontWeight:'700'},
  nearPos:{position:'absolute',left:12,right:12,bottom:96},
  near:{borderRadius:23,padding:15},
  nearHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:5},
  nearEyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.15},
  nearTitle:{fontSize:17,fontWeight:'900',marginTop:2},
  nearRow:{flexDirection:'row',justifyContent:'space-between',gap:10,paddingVertical:8},
  nearName:{flex:1,fontWeight:'800'},
});
