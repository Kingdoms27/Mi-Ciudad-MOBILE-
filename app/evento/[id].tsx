import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Evento } from '@/src/tipos';
import { obtenerEventoPorId } from '@/src/servicios/eventos';
import { obtenerLugarPorId } from '@/src/servicios/lugares';
import { estaEventoGuardado, guardarEvento, quitarEvento } from '@/src/servicios/eventosGuardados';
import { useTema } from '@/src/contexto/TemaContext';
import { useSesion } from '@/src/contexto/SesionContext';
import { fechaEvento, pesos } from '@/src/utilidades/formato';
import { EstadoContenido } from '@/src/componentes/EstadoContenido';
import { GlassSurface } from '@/src/componentes/GlassSurface';
import { Reveal } from '@/src/componentes/Reveal';

export default function DetalleEvento(){
  const{id}=useLocalSearchParams<{id:string}>();
  const{colores,esOscuro}=useTema();
  const{usuario}=useSesion();
  const[e,setE]=useState<Evento|null>(null);
  const[lugar,setLugar]=useState<string|null>(null);
  const[guardado,setGuardado]=useState(false);
  const[cargando,setCargando]=useState(true);
  const scrollY=useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    if(!id)return;
    (async()=>{
      const r=await obtenerEventoPorId(id);
      if('datos'in r){
        setE(r.datos);
        if(r.datos.lugarId){
          const l=await obtenerLugarPorId(r.datos.lugarId);
          if('datos'in l)setLugar(l.datos.nombre);
        }
        if(usuario)setGuardado(await estaEventoGuardado(usuario.id,id));
      }
      setCargando(false);
    })();
  },[id,usuario?.id]);

  if(cargando)return <View style={[s.center,{backgroundColor:colores.fondo}]}><EstadoContenido tipo="cargando"/></View>;
  if(!e)return <View style={[s.center,{backgroundColor:colores.fondo}]}><EstadoContenido tipo="error" mensaje="Evento no encontrado."/></View>;

  const toggle=async()=>{
    if(!usuario){
      router.push('/(tabs)/cuenta');
      return;
    }
    if(guardado){
      await quitarEvento(usuario.id,e.id);
      await Haptics.selectionAsync().catch(()=>undefined);
      setGuardado(false);
      return;
    }
    try{
      await guardarEvento(usuario.id,e);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>undefined);
      setGuardado(true);
      Alert.alert('Guardado','Te avisaremos antes de que empiece.');
    }catch(err){
      Alert.alert('No se pudo guardar',err instanceof Error?err.message:'Error');
    }
  };

  const heroScale=scrollY.interpolate({inputRange:[-120,0,220],outputRange:[1.28,1,1],extrapolate:'clamp'});
  const heroTranslate=scrollY.interpolate({inputRange:[0,220],outputRange:[0,55],extrapolate:'clamp'});

  return <View style={[s.root,{backgroundColor:colores.fondo}]}>
    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.scroll}
      onScroll={Animated.event([{nativeEvent:{contentOffset:{y:scrollY}}}],{useNativeDriver:true})}
      scrollEventThrottle={16}
    >
      {e.imagenUrl?<View style={s.heroWrap}>
        <Animated.Image source={{uri:e.imagenUrl}} style={[s.hero,{transform:[{translateY:heroTranslate},{scale:heroScale}]}]} resizeMode="cover"/>
        <View style={s.heroShade}/>
        <View style={s.heroPill}>
          <Ionicons name="calendar-outline" size={14} color="white"/>
          <Text style={s.heroPillText}>{fechaEvento(e.inicio)}</Text>
        </View>
      </View>:<View style={[s.noHero,{backgroundColor:colores.primarioSuave}]}>
        <Ionicons name="calendar-outline" size={48} color={colores.primario}/>
      </View>}

      <Reveal delay={60} style={s.sheetWrap}>
        <GlassSurface style={s.sheet} intensity={esOscuro?52:64}>
          <View style={s.topRow}>
            <View style={{flex:1}}>
              <Text style={[s.kicker,{color:colores.primario}]}>EVENTO</Text>
              <Text style={[s.title,{color:colores.tinta}]}>{e.titulo}</Text>
            </View>
            <View style={[s.statePill,{backgroundColor:e.estado==='programado'?colores.primarioSuave:'rgba(179,68,68,.10)'}]}>
              <Text style={[s.state,{color:e.estado==='programado'?colores.exito:colores.peligro}]}>{e.estado.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={[s.desc,{color:colores.tinta}]}>{e.descripcion}</Text>

          <View style={[s.infoCard,{backgroundColor:esOscuro?'rgba(255,255,255,.04)':'rgba(14,90,75,.045)'}]}>
            <View style={s.infoRow}>
              <View style={[s.infoIcon,{backgroundColor:colores.primarioSuave}]}>
                <Ionicons name="location-outline" size={18} color={colores.primario}/>
              </View>
              <View style={{flex:1}}>
                <Text style={[s.label,{color:colores.secundario}]}>Lugar</Text>
                <Text style={[s.value,{color:colores.tinta}]}>{lugar??e.direccionLibre??'A confirmar'}</Text>
              </View>
            </View>
            <View style={[s.separator,{backgroundColor:colores.borde}]}/>
            <View style={s.infoRow}>
              <View style={[s.infoIcon,{backgroundColor:colores.primarioSuave}]}>
                <Ionicons name="ticket-outline" size={18} color={colores.primario}/>
              </View>
              <View style={{flex:1}}>
                <Text style={[s.label,{color:colores.secundario}]}>Precio</Text>
                <Text style={[s.value,{color:colores.tinta}]}>{pesos(e.precio)}</Text>
              </View>
            </View>
          </View>

          <Pressable onPress={toggle} style={[s.btn,{backgroundColor:guardado?colores.primarioSuave:colores.primario}]}>
            <Ionicons name={guardado?'bookmark':'bookmark-outline'} size={20} color={guardado?colores.primario:'white'}/>
            <Text style={{color:guardado?colores.primario:'white',fontWeight:'900'}}>
              {guardado?'Quitar de guardados':'Guardar y avisarme'}
            </Text>
          </Pressable>

          {e.lugarId?<Pressable
            onPress={()=>{void Haptics.selectionAsync();router.push({pathname:'/lugar/[id]',params:{id:e.lugarId!}})}}
            style={[s.placeLink,{borderColor:colores.borde}]}
          >
            <View>
              <Text style={[s.placeLabel,{color:colores.secundario}]}>LUGAR ASOCIADO</Text>
              <Text style={[s.placeText,{color:colores.tinta}]}>{lugar??'Ver lugar'}</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colores.primario}/>
          </Pressable>:null}
        </GlassSurface>
      </Reveal>
    </Animated.ScrollView>
  </View>;
}

const s=StyleSheet.create({
  root:{flex:1,overflow:'hidden'},
  center:{flex:1,justifyContent:'center',padding:20},
  scroll:{paddingBottom:85},
  heroWrap:{height:270,overflow:'hidden',position:'relative'},
  hero:{width:'100%',height:310},
  heroShade:{position:'absolute',left:0,right:0,bottom:0,height:120,backgroundColor:'rgba(0,0,0,.18)'},
  heroPill:{position:'absolute',left:18,bottom:40,borderRadius:999,paddingHorizontal:12,paddingVertical:8,backgroundColor:'rgba(15,24,22,.66)',flexDirection:'row',alignItems:'center',gap:5},
  heroPillText:{color:'white',fontSize:11,fontWeight:'900',textTransform:'capitalize'},
  noHero:{height:180,alignItems:'center',justifyContent:'center'},
  sheetWrap:{marginTop:-28,paddingHorizontal:12},
  sheet:{borderRadius:30,padding:20},
  topRow:{flexDirection:'row',alignItems:'flex-start',gap:12},
  kicker:{fontSize:9,fontWeight:'900',letterSpacing:1.25},
  title:{fontSize:30,lineHeight:35,fontWeight:'900',letterSpacing:-.7,marginTop:5},
  statePill:{paddingHorizontal:9,paddingVertical:7,borderRadius:999,marginTop:3},
  state:{fontSize:9,fontWeight:'900',letterSpacing:.55},
  desc:{fontSize:16,lineHeight:25,marginTop:16},
  infoCard:{borderRadius:20,padding:14,marginTop:19},
  infoRow:{flexDirection:'row',alignItems:'center',gap:10},
  infoIcon:{width:38,height:38,borderRadius:13,alignItems:'center',justifyContent:'center'},
  label:{fontSize:10,fontWeight:'800'},
  value:{fontSize:15,fontWeight:'900',marginTop:2},
  separator:{height:1,marginVertical:13},
  btn:{marginTop:18,padding:15,borderRadius:16,flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center'},
  placeLink:{marginTop:14,borderWidth:1,borderRadius:16,padding:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
  placeLabel:{fontSize:9,fontWeight:'900',letterSpacing:1.1},
  placeText:{fontSize:15,fontWeight:'900',marginTop:2},
});
