import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { obtenerLugarPorId } from '@/src/servicios/lugares';
import { Lugar } from '@/src/tipos';
import { useTema } from '@/src/contexto/TemaContext';
import { useSesion } from '@/src/contexto/SesionContext';
import { horarioHoy, pesos } from '@/src/utilidades/formato';
import { alternarFavorito, esFavorito } from '@/src/servicios/db';
import { descargarAudioguia, obtenerAudioguiaLocal } from '@/src/servicios/archivos';
import { AudioGuiaPlayer } from '@/src/componentes/AudioGuiaPlayer';
import { EstadoContenido } from '@/src/componentes/EstadoContenido';
import { GlassSurface } from '@/src/componentes/GlassSurface';
import { Reveal } from '@/src/componentes/Reveal';
import { useImagenLugar } from '@/src/hooks/useImagenLugar';

export default function DetalleLugar(){
  const{id}=useLocalSearchParams<{id:string}>();
  const{colores,esOscuro}=useTema();
  const{usuario}=useSesion();
  const[lugar,setLugar]=useState<Lugar|null>(null);
  const[fav,setFav]=useState(false);
  const[audioLocal,setAudioLocal]=useState<string|null>(null);
  const[cargando,setCargando]=useState(true);
  const[descargando,setDescargando]=useState(false);
  const[error,setError]=useState('');
  const scrollY=useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    if(!id)return;
    (async()=>{
      setCargando(true);
      const r=await obtenerLugarPorId(id);
      if('error'in r){
        setError(r.error.mensaje);
        setCargando(false);
        return;
      }
      setLugar(r.datos);
      setAudioLocal(await obtenerAudioguiaLocal(r.datos.id));
      if(usuario)setFav(await esFavorito(usuario.id,r.datos.id));
      setCargando(false);
    })();
  },[id,usuario?.id]);

  if(cargando)return <View style={[s.center,{backgroundColor:colores.fondo}]}><EstadoContenido tipo="cargando"/></View>;
  if(error||!lugar)return <View style={[s.center,{backgroundColor:colores.fondo}]}><EstadoContenido tipo="error" mensaje={error||'Lugar no encontrado.'}/></View>;

  return <ContenidoLugar
    lugar={lugar}
    fav={fav}
    setFav={setFav}
    audioLocal={audioLocal}
    setAudioLocal={setAudioLocal}
    descargando={descargando}
    setDescargando={setDescargando}
    scrollY={scrollY}
    colores={colores}
    esOscuro={esOscuro}
    usuarioId={usuario?.id}
  />;
}

function ContenidoLugar({
  lugar,fav,setFav,audioLocal,setAudioLocal,descargando,setDescargando,scrollY,colores,esOscuro,usuarioId,
}:{
  lugar:Lugar;
  fav:boolean;
  setFav:(v:boolean)=>void;
  audioLocal:string|null;
  setAudioLocal:(v:string|null)=>void;
  descargando:boolean;
  setDescargando:(v:boolean)=>void;
  scrollY:Animated.Value;
  colores:any;
  esOscuro:boolean;
  usuarioId?:string;
}){
  const imagen=useImagenLugar(lugar.id,lugar.imagenes[0]);

  const toggle=async()=>{
    if(!usuarioId){
      Alert.alert('Necesitás una cuenta','Ingresá para guardar favoritos.',[
        {text:'Cancelar'},
        {text:'Ir a mi cuenta',onPress:()=>router.push('/(tabs)/cuenta')},
      ]);
      return;
    }
    setFav(await alternarFavorito(usuarioId,lugar.id));
  };

  const abrirMapa=()=>Alert.alert('Cómo querés llegar','Elegí el modo de viaje.',[
    {text:'Cancelar',style:'cancel'},
    {text:'A pie',onPress:()=>Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lugar.coordenadas.latitud},${lugar.coordenadas.longitud}&travelmode=walking`)},
    {text:'En auto',onPress:()=>Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lugar.coordenadas.latitud},${lugar.coordenadas.longitud}&travelmode=driving`)},
  ]);

  const descargar=async()=>{
    if(!lugar.audioguia)return;
    setDescargando(true);
    try{
      const uri=await descargarAudioguia(lugar.id,lugar.audioguia.url);
      setAudioLocal(uri);
      Alert.alert('Audioguía guardada','Ya podés escucharla sin conexión.');
    }catch{
      Alert.alert('No se pudo descargar','Revisá tu conexión e intentá nuevamente.');
    }finally{
      setDescargando(false);
    }
  };

  const heroScale=scrollY.interpolate({inputRange:[-160,0,260],outputRange:[1.35,1,1],extrapolate:'clamp'});
  const heroTranslate=scrollY.interpolate({inputRange:[0,260],outputRange:[0,72],extrapolate:'clamp'});

  return <View style={[s.root,{backgroundColor:colores.fondo}]}>
    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.scrollContent}
      onScroll={Animated.event([{nativeEvent:{contentOffset:{y:scrollY}}}],{useNativeDriver:true})}
      scrollEventThrottle={16}
    >
      <View style={s.heroWrap}>
        <Animated.Image
          source={{uri:imagen}}
          style={[s.hero,{transform:[{translateY:heroTranslate},{scale:heroScale}]}]}
          resizeMode="cover"
        />
        <View style={s.heroShade}/>
        <View style={s.heroBadge}>
          <Ionicons name="location-outline" size={15} color="white"/>
          <Text style={s.heroBadgeText}>Colón · Entre Ríos</Text>
        </View>
      </View>

      <Reveal delay={60} style={s.sheetWrap}>
        <GlassSurface style={s.sheet} intensity={esOscuro?52:64}>
          <View style={s.head}>
            <View style={{flex:1}}>
              <Text style={[s.name,{color:colores.tinta}]}>{lugar.nombre}</Text>
              <Text style={[s.status,{color:colores.primario}]}>{horarioHoy(lugar.horarios)} · {pesos(lugar.precioEntrada)}</Text>
            </View>
            <Pressable
              onPress={toggle}
              style={[s.iconBtn,{backgroundColor:fav?colores.primarioSuave:'rgba(255,255,255,.12)',borderColor:colores.borde}]}
            >
              <Ionicons name={fav?'star':'star-outline'} size={24} color={colores.primario}/>
            </Pressable>
          </View>

          <View style={s.addressRow}>
            <Ionicons name="pin-outline" size={18} color={colores.primario}/>
            <Text style={[s.address,{color:colores.secundario}]}>{lugar.direccion}</Text>
          </View>

          <Text style={[s.desc,{color:colores.tinta}]}>{lugar.descripcion}</Text>

          <View style={s.tags}>
            <Text style={[s.tag,{backgroundColor:colores.superficie2,color:colores.tinta}]}>{lugar.accesible?'Accesible':'Accesibilidad limitada'}</Text>
            {lugar.audioguia?<Text style={[s.tag,{backgroundColor:colores.superficie2,color:colores.tinta}]}>Audioguía</Text>:null}
            <Text style={[s.tag,{backgroundColor:colores.primarioSuave,color:colores.primario}]}>Disponible offline</Text>
          </View>

          <View style={s.actions}>
            <Pressable style={[s.primary,{backgroundColor:colores.primario}]} onPress={abrirMapa}>
              <Ionicons name="navigate-outline" size={20} color="white"/>
              <Text style={s.primaryText}>Cómo llegar</Text>
            </Pressable>
            <Pressable
              style={[s.secondary,{backgroundColor:'rgba(255,255,255,.08)',borderColor:colores.borde}]}
              onPress={()=>router.push({pathname:'/orientar/[id]',params:{id:lugar.id}})}
            >
              <Ionicons name="compass-outline" size={20} color={colores.primario}/>
              <Text style={{color:colores.tinta,fontWeight:'900'}}>Flecha</Text>
            </Pressable>
          </View>

          {(lugar.telefono||lugar.sitioWeb)?<View style={[s.contactCard,{backgroundColor:esOscuro?'rgba(255,255,255,.04)':'rgba(14,90,75,.045)'}]}>
            {lugar.telefono?<Pressable onPress={()=>Linking.openURL(`tel:${lugar.telefono}`)} style={s.link}>
              <View style={[s.linkIcon,{backgroundColor:colores.primarioSuave}]}>
                <Ionicons name="call-outline" size={17} color={colores.primario}/>
              </View>
              <Text style={{color:colores.tinta,fontWeight:'800',flex:1}}>{lugar.telefono}</Text>
              <Ionicons name="chevron-forward" size={17} color={colores.secundario}/>
            </Pressable>:null}
            {lugar.sitioWeb?<Pressable onPress={()=>Linking.openURL(lugar.sitioWeb!)} style={s.link}>
              <View style={[s.linkIcon,{backgroundColor:colores.primarioSuave}]}>
                <Ionicons name="globe-outline" size={17} color={colores.primario}/>
              </View>
              <Text style={{color:colores.tinta,fontWeight:'800',flex:1}}>Sitio web oficial</Text>
              <Ionicons name="open-outline" size={17} color={colores.secundario}/>
            </Pressable>:null}
          </View>:null}

          {lugar.audioguia?<View style={s.audioSection}>
            <View style={s.sectionHead}>
              <View>
                <Text style={[s.sectionKicker,{color:colores.primario}]}>AUDIOGUÍA</Text>
                <Text style={[s.section,{color:colores.tinta}]}>Escuchá la historia</Text>
              </View>
              <Ionicons name="headset-outline" size={22} color={colores.primario}/>
            </View>
            <AudioGuiaPlayer source={audioLocal??lugar.audioguia.url} titulo={lugar.nombre}/>
            <Pressable
              disabled={descargando||Boolean(audioLocal)}
              onPress={descargar}
              style={[s.download,{borderColor:colores.borde,opacity:audioLocal?0.62:1}]}
            >
              <Ionicons name={audioLocal?'checkmark-circle-outline':'download-outline'} size={19} color={colores.primario}/>
              <Text style={{color:colores.primario,fontWeight:'900'}}>
                {audioLocal?'Disponible sin conexión':descargando?'Descargando…':'Guardar para escuchar sin señal'}
              </Text>
            </Pressable>
          </View>:null}

          <Pressable
            onPress={()=>router.push({pathname:'/registrar-visita',params:{lugarId:lugar.id,origen:'gps'}})}
            style={[s.visit,{backgroundColor:colores.acento}]}
          >
            <Ionicons name="camera-outline" size={20} color="#1B211E"/>
            <Text style={s.visitText}>Registrar visita</Text>
          </Pressable>
        </GlassSurface>
      </Reveal>
    </Animated.ScrollView>
  </View>;
}

const s=StyleSheet.create({
  root:{flex:1,overflow:'hidden'},
  center:{flex:1,justifyContent:'center',padding:20},
  scrollContent:{paddingBottom:115},
  heroWrap:{height:318,overflow:'hidden',position:'relative'},
  hero:{width:'100%',height:350,backgroundColor:'#ddd'},
  heroShade:{position:'absolute',left:0,right:0,bottom:0,height:140,backgroundColor:'rgba(0,0,0,.20)'},
  heroBadge:{position:'absolute',left:18,bottom:48,borderRadius:999,paddingHorizontal:12,paddingVertical:8,backgroundColor:'rgba(15,24,22,.62)',flexDirection:'row',alignItems:'center',gap:5},
  heroBadgeText:{color:'white',fontSize:11,fontWeight:'900'},
  sheetWrap:{marginTop:-30,paddingHorizontal:12},
  sheet:{borderRadius:30,padding:20},
  head:{flexDirection:'row',alignItems:'center',gap:12},
  name:{fontSize:30,lineHeight:35,fontWeight:'900',letterSpacing:-.7},
  status:{marginTop:6,fontWeight:'900',fontSize:13},
  iconBtn:{width:48,height:48,borderRadius:16,alignItems:'center',justifyContent:'center',borderWidth:1},
  addressRow:{flexDirection:'row',alignItems:'flex-start',gap:7,marginTop:17},
  address:{fontWeight:'700',flex:1,lineHeight:20},
  desc:{fontSize:16,lineHeight:25,marginTop:15},
  tags:{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:19},
  tag:{paddingVertical:8,paddingHorizontal:11,borderRadius:999,fontWeight:'800',fontSize:12},
  actions:{flexDirection:'row',gap:9},
  primary:{flex:1,padding:14,borderRadius:16,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},
  primaryText:{color:'white',fontWeight:'900'},
  secondary:{paddingHorizontal:16,paddingVertical:14,borderRadius:16,borderWidth:1,flexDirection:'row',gap:6,alignItems:'center'},
  contactCard:{borderRadius:18,paddingHorizontal:13,marginTop:18},
  link:{flexDirection:'row',gap:9,alignItems:'center',paddingVertical:11},
  linkIcon:{width:34,height:34,borderRadius:12,alignItems:'center',justifyContent:'center'},
  audioSection:{marginTop:22,gap:10},
  sectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  sectionKicker:{fontSize:9,fontWeight:'900',letterSpacing:1.25},
  section:{fontSize:19,fontWeight:'900',marginTop:2},
  download:{borderWidth:1,borderRadius:14,padding:12,flexDirection:'row',gap:7,justifyContent:'center',alignItems:'center'},
  visit:{marginTop:22,padding:15,borderRadius:16,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:8},
  visitText:{fontWeight:'900',color:'#1B211E'},
});
