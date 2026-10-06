import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Evento } from '@/src/tipos';
import { obtenerEventos } from '@/src/servicios/eventos';
import { estaEventoGuardado, guardarEvento, quitarEvento } from '@/src/servicios/eventosGuardados';
import { useSesion } from '@/src/contexto/SesionContext';
import { useTema } from '@/src/contexto/TemaContext';
import { fechaEvento, pesos } from '@/src/utilidades/formato';
import { EstadoContenido } from '@/src/componentes/EstadoContenido';
import { NetworkBanner } from '@/src/componentes/NetworkBanner';
import { GlassSurface } from '@/src/componentes/GlassSurface';
import { Reveal } from '@/src/componentes/Reveal';

export default function Agenda(){
  const{colores,esOscuro}=useTema();
  const{usuario}=useSesion();
  const[eventos,setEventos]=useState<Evento[]>([]);
  const[guardados,setGuardados]=useState<Record<string,boolean>>({});
  const[cargando,setCargando]=useState(true);
  const[error,setError]=useState('');

  const cargar=async()=>{
    setCargando(true);
    setError('');
    const r=await obtenerEventos();
    if('error'in r){
      setError(r.error.mensaje);
      setCargando(false);
      return;
    }
    setEventos(r.datos);
    if(usuario){
      const pares=await Promise.all(r.datos.map(async e=>[e.id,await estaEventoGuardado(usuario.id,e.id)] as const));
      setGuardados(Object.fromEntries(pares));
    }else setGuardados({});
    setCargando(false);
  };

  useEffect(()=>{cargar()},[usuario?.id]);
  useFocusEffect(useCallback(()=>{if(usuario)cargar();},[usuario?.id]));

  const toggle=async(e:Evento)=>{
    if(!usuario){
      router.push('/(tabs)/cuenta');
      return;
    }
    try{
      if(guardados[e.id]){
        await quitarEvento(usuario.id,e.id);
        setGuardados(x=>({...x,[e.id]:false}));
      }else{
        await guardarEvento(usuario.id,e);
        setGuardados(x=>({...x,[e.id]:true}));
        Alert.alert('Evento guardado','Se programó un recordatorio antes del inicio.');
      }
    }catch(err){
      Alert.alert('No se pudo guardar',err instanceof Error?err.message:'Error inesperado');
    }
  };

  return <View style={[s.root,{backgroundColor:colores.fondo}]}>
    <View style={[s.glow,{backgroundColor:esOscuro?'rgba(111,208,178,.07)':'rgba(14,90,75,.07)'}]}/>
    <NetworkBanner/>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Reveal>
        <View style={s.headerRow}>
          <View style={{flex:1}}>
            <Text style={[s.kicker,{color:colores.primario}]}>AGENDA</Text>
            <Text style={[s.h1,{color:colores.tinta}]}>Qué hacer en Colón</Text>
            <Text style={[s.bajada,{color:colores.secundario}]}>Eventos, cultura y propuestas para organizar cada día.</Text>
          </View>
          <View style={[s.headerIcon,{backgroundColor:colores.primarioSuave}]}>
            <Ionicons name="calendar-outline" size={22} color={colores.primario}/>
          </View>
        </View>
      </Reveal>

      {cargando?<EstadoContenido tipo="cargando"/>:
       error?<EstadoContenido tipo="error" mensaje={error} onReintentar={cargar}/>:
       eventos.length===0?<EstadoContenido tipo="vacio"/>:
       eventos.map((e,i)=><Reveal key={e.id} delay={Math.min(80+i*55,420)}>
         <Pressable onPress={()=>router.push({pathname:'/evento/[id]',params:{id:e.id}})}>
           <GlassSurface style={s.card} intensity={42}>
             {e.imagenUrl?<View style={s.imageWrap}>
               <Image source={{uri:e.imagenUrl}} style={s.image}/>
               <View style={s.imageShade}/>
               <View style={[s.datePill,{backgroundColor:'rgba(13,45,39,.76)'}]}>
                 <Ionicons name="time-outline" size={13} color="white"/>
                 <Text style={s.datePillText}>{fechaEvento(e.inicio)}</Text>
               </View>
             </View>:null}
             <View style={s.cardBody}>
               <View style={s.row}>
                 {!e.imagenUrl?<Text style={[s.fecha,{color:colores.primario}]}>{fechaEvento(e.inicio)}</Text>:<View/>}
                 <Text style={[s.estado,{color:e.estado==='programado'?colores.exito:colores.peligro}]}>{e.estado}</Text>
               </View>
               <Text style={[s.title,{color:colores.tinta}]}>{e.titulo}</Text>
               <Text style={[s.desc,{color:colores.secundario}]} numberOfLines={2}>{e.descripcion}</Text>
               <View style={[s.row,{marginTop:14}]}>
                 <Text style={[s.price,{color:colores.tinta}]}>{pesos(e.precio)}</Text>
                 <Pressable
                   onPress={(ev)=>{ev.stopPropagation();toggle(e)}}
                   style={[s.save,{backgroundColor:guardados[e.id]?colores.primario:colores.primarioSuave}]}
                 >
                   <Ionicons name={guardados[e.id]?'bookmark':'bookmark-outline'} size={17} color={guardados[e.id]?'white':colores.primario}/>
                   <Text style={{color:guardados[e.id]?'white':colores.primario,fontWeight:'900',fontSize:12}}>
                     {guardados[e.id]?'Guardado':'Guardar'}
                   </Text>
                 </Pressable>
               </View>
             </View>
           </GlassSurface>
         </Pressable>
       </Reveal>)}
    </ScrollView>
  </View>;
}

const s=StyleSheet.create({
  root:{flex:1,overflow:'hidden'},
  content:{padding:20,paddingTop:58,paddingBottom:118},
  glow:{position:'absolute',width:280,height:280,borderRadius:999,top:-160,right:-110},
  headerRow:{flexDirection:'row',alignItems:'flex-start',gap:14,marginBottom:22},
  headerIcon:{width:48,height:48,borderRadius:17,alignItems:'center',justifyContent:'center',marginTop:4},
  kicker:{fontSize:11,letterSpacing:1.4,fontWeight:'900'},
  h1:{fontSize:34,lineHeight:39,fontWeight:'900',letterSpacing:-.7,marginTop:8},
  bajada:{fontSize:15,lineHeight:21,marginTop:8},
  card:{borderRadius:25,marginBottom:15},
  imageWrap:{position:'relative'},
  image:{width:'100%',height:162},
  imageShade:{position:'absolute',left:0,right:0,bottom:0,height:65,backgroundColor:'rgba(0,0,0,.14)'},
  datePill:{position:'absolute',left:12,bottom:12,borderRadius:999,paddingHorizontal:10,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:5},
  datePillText:{color:'white',fontSize:11,fontWeight:'900'},
  cardBody:{padding:17},
  row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},
  fecha:{fontWeight:'900',fontSize:13,textTransform:'capitalize'},
  estado:{fontSize:10,fontWeight:'900',textTransform:'uppercase',letterSpacing:.6},
  title:{fontSize:20,fontWeight:'900',letterSpacing:-.25,marginTop:5},
  desc:{lineHeight:21,marginTop:6},
  price:{fontWeight:'900'},
  save:{paddingHorizontal:12,paddingVertical:9,borderRadius:12,flexDirection:'row',alignItems:'center',gap:5},
});
