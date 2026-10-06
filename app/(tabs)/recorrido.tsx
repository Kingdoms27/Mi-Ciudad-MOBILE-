import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import * as Haptics from 'expo-haptics';
import { useSesion } from '@/src/contexto/SesionContext';
import { useTema } from '@/src/contexto/TemaContext';
import { obtenerRecorrido, sincronizarVisitasPendientes } from '@/src/servicios/visitas';
import { obtenerLugares } from '@/src/servicios/lugares';
import { Lugar, Visita } from '@/src/tipos';
import { fechaCorta } from '@/src/utilidades/formato';
import { EstadoContenido } from '@/src/componentes/EstadoContenido';
import { NetworkBanner } from '@/src/componentes/NetworkBanner';
import { GlassSurface } from '@/src/componentes/GlassSurface';
import { Reveal } from '@/src/componentes/Reveal';
import { SkeletonLista } from '@/src/componentes/SkeletonLugar';

export default function Recorrido(){
  const{colores,esOscuro}=useTema();
  const{usuario,bloqueada,sesionGuardada}=useSesion();
  const[visitas,setVisitas]=useState<Visita[]>([]);
  const[lugares,setLugares]=useState<Lugar[]>([]);
  const[cargando,setCargando]=useState(true);
  const[sinc,setSinc]=useState(false);

  const cargar=async()=>{
    if(!usuario){setCargando(false);return;}
    setCargando(true);
    const[v,l]=await Promise.all([obtenerRecorrido(usuario.id),obtenerLugares()]);
    setVisitas(v);
    if('datos'in l)setLugares(l.datos);
    setCargando(false);
  };

  useFocusEffect(useCallback(()=>{cargar()},[usuario?.id]));
  const nombre=(id:string)=>lugares.find(l=>l.id===id)?.nombre??id;
  const sync=async()=>{
    setSinc(true);
    await sincronizarVisitasPendientes();
    await cargar();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>undefined);
    setSinc(false);
  };

  if(!usuario)return <View style={[s.auth,{backgroundColor:colores.fondo}]}>
    <View style={[s.glow,{backgroundColor:esOscuro?'rgba(111,208,178,.09)':'rgba(14,90,75,.09)'}]}/>
    <Reveal style={{width:'100%'}}>
      <GlassSurface style={s.authCard} intensity={55}>
        <View style={[s.authIcon,{backgroundColor:colores.primarioSuave}]}>
          <Ionicons name={bloqueada&&sesionGuardada?'finger-print':'lock-closed-outline'} size={34} color={colores.primario}/>
        </View>
        <Text style={[s.authTitle,{color:colores.tinta}]}>{bloqueada&&sesionGuardada?'Desbloqueá tu cuenta':'Ingresá para guardar tu recorrido'}</Text>
        <Text style={[s.authText,{color:colores.secundario}]}>El mapa y los lugares son públicos. Tu cuenta conserva visitas, fotos y favoritos.</Text>
        <Pressable style={[s.primary,{backgroundColor:colores.primario}]} onPress={()=>router.push('/(tabs)/cuenta')}>
          <Text style={s.primaryText}>Ir a mi cuenta</Text>
          <Ionicons name="arrow-forward" size={18} color="white"/>
        </Pressable>
      </GlassSurface>
    </Reveal>
  </View>;

  return <View style={[s.root,{backgroundColor:colores.fondo}]}>
    <View style={[s.glow,s.glowPage,{backgroundColor:esOscuro?'rgba(111,208,178,.07)':'rgba(14,90,75,.07)'}]}/>
    <NetworkBanner/>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Reveal>
        <Text style={[s.kicker,{color:colores.primario}]}>MI RECORRIDO</Text>
        <Text style={[s.h1,{color:colores.tinta}]}>Tu viaje, guardado.</Text>
        <Text style={[s.bajada,{color:colores.secundario}]}>Registrá visitas por QR, cercanía GPS o manualmente. Todo queda disponible incluso sin conexión.</Text>
      </Reveal>

      <Reveal delay={100}>
        <View style={s.actions}>
          <Pressable style={[s.action,{backgroundColor:colores.primario}]} onPress={()=>{void Haptics.selectionAsync();router.push('/escanear')}}>
            <Ionicons name="qr-code-outline" size={23} color="white"/>
            <Text style={s.primaryText}>QR</Text>
          </Pressable>
          <Pressable style={[s.actionGlass,{borderColor:colores.borde,backgroundColor:esOscuro?'rgba(255,255,255,.05)':'rgba(255,255,255,.72)'}]} onPress={()=>{void Haptics.selectionAsync();router.push({pathname:'/registrar-visita',params:{origen:'gps'}})}}>
            <Ionicons name="location-outline" size={23} color={colores.primario}/>
            <Text style={{color:colores.tinta,fontWeight:'900'}}>GPS</Text>
          </Pressable>
          <Pressable style={[s.actionGlass,{borderColor:colores.borde,backgroundColor:esOscuro?'rgba(255,255,255,.05)':'rgba(255,255,255,.72)'}]} onPress={()=>{void Haptics.selectionAsync();router.push({pathname:'/registrar-visita',params:{origen:'manual'}})}}>
            <Ionicons name="create-outline" size={23} color={colores.primario}/>
            <Text style={{color:colores.tinta,fontWeight:'900'}}>Manual</Text>
          </Pressable>
        </View>
        <Pressable disabled={sinc} onPress={sync} style={s.syncButton}>
          <Ionicons name="sync-outline" size={18} color={colores.primario}/>
          <Text style={{color:colores.primario,fontWeight:'900'}}>{sinc?'Sincronizando…':'Sincronizar pendientes'}</Text>
        </Pressable>
      </Reveal>

      {cargando?<SkeletonLista cantidad={2}/>:
       visitas.length===0?<EstadoContenido tipo="vacio" mensaje="Todavía no registraste visitas."/>:
       visitas.map((v,i)=><Reveal key={v.id} delay={Math.min(130+i*55,430)}>
         <GlassSurface style={s.card} intensity={40}>
           {v.fotoUri?<Image source={{uri:v.fotoUri}} style={s.photo}/>:null}
           <View style={s.cardBody}>
             <View style={s.top}>
               <Text style={[s.title,{color:colores.tinta}]}>{nombre(v.lugarId)}</Text>
               <View style={[s.syncState,{backgroundColor:v.sincronizada?colores.primarioSuave:colores.superficie2}]}>
                 <Ionicons name={v.sincronizada?'cloud-done-outline':'cloud-offline-outline'} size={17} color={v.sincronizada?colores.exito:colores.advertencia}/>
               </View>
             </View>
             <Text style={[s.meta,{color:colores.secundario}]}>{fechaCorta(v.fechaHora)} · {v.origen.toUpperCase()}</Text>
             {v.nota?<Text style={[s.note,{color:colores.tinta}]}>{v.nota}</Text>:null}
             <Text style={{fontSize:11,color:v.sincronizada?colores.exito:colores.advertencia,fontWeight:'800',marginTop:8}}>
               {v.sincronizada?'Sincronizada':'Guardada en el teléfono'}
             </Text>
           </View>
         </GlassSurface>
       </Reveal>)}
    </ScrollView>
  </View>;
}

const s=StyleSheet.create({
  root:{flex:1,overflow:'hidden'},
  content:{padding:20,paddingTop:58,paddingBottom:118},
  auth:{flex:1,justifyContent:'center',alignItems:'center',padding:24,overflow:'hidden'},
  authCard:{borderRadius:28,padding:24,alignItems:'center'},
  authIcon:{width:68,height:68,borderRadius:23,alignItems:'center',justifyContent:'center'},
  authTitle:{fontSize:25,fontWeight:'900',textAlign:'center',letterSpacing:-.5,marginTop:15},
  authText:{fontSize:15,lineHeight:22,textAlign:'center',marginTop:8,marginBottom:20},
  primary:{paddingHorizontal:18,paddingVertical:14,borderRadius:16,flexDirection:'row',alignItems:'center',gap:8},
  primaryText:{color:'white',fontWeight:'900'},
  glow:{position:'absolute',width:280,height:280,borderRadius:999,top:-100,right:-130},
  glowPage:{top:-155},
  kicker:{fontSize:11,letterSpacing:1.4,fontWeight:'900'},
  h1:{fontSize:34,lineHeight:39,fontWeight:'900',letterSpacing:-.7,marginTop:8},
  bajada:{fontSize:15,lineHeight:22,marginTop:8},
  actions:{flexDirection:'row',gap:9,marginTop:20},
  action:{flex:1,paddingVertical:15,borderRadius:18,alignItems:'center',justifyContent:'center',gap:5},
  actionGlass:{flex:1,paddingVertical:15,borderRadius:18,alignItems:'center',justifyContent:'center',gap:5,borderWidth:1},
  syncButton:{flexDirection:'row',alignItems:'center',gap:6,alignSelf:'flex-end',paddingVertical:15},
  card:{borderRadius:23,marginBottom:13},
  photo:{width:'100%',height:175},
  cardBody:{padding:16},
  top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},
  title:{fontSize:18,fontWeight:'900',flex:1},
  syncState:{width:34,height:34,borderRadius:13,alignItems:'center',justifyContent:'center'},
  meta:{fontSize:12,marginTop:4},
  note:{marginTop:9,lineHeight:20},
});
