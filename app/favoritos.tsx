import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { router, useFocusEffect } from 'expo-router';
import { listarFavoritos } from '@/src/servicios/db';
import { obtenerLugares } from '@/src/servicios/lugares';
import { Lugar } from '@/src/tipos';
import { useSesion } from '@/src/contexto/SesionContext';
import { useTema } from '@/src/contexto/TemaContext';
import { LugarCard } from '@/src/componentes/LugarCard';
import { EstadoContenido } from '@/src/componentes/EstadoContenido';
import { SkeletonLista } from '@/src/componentes/SkeletonLugar';
import { Reveal } from '@/src/componentes/Reveal';
import { ScreenTopBar } from '@/src/componentes/ScreenTopBar';

export default function Favoritos(){
  const{usuario}=useSesion();
  const{colores,esOscuro}=useTema();
  const[lugares,setLugares]=useState<Lugar[]>([]);
  const[cargando,setCargando]=useState(true);

  useFocusEffect(useCallback(()=>{
    (async()=>{
      if(!usuario){
        router.replace('/(tabs)/cuenta');
        return;
      }
      setCargando(true);
      const[f,r]=await Promise.all([listarFavoritos(usuario.id),obtenerLugares()]);
      if('datos'in r){
        const ids=new Set(f.map(x=>x.lugarId));
        setLugares(r.datos.filter(l=>ids.has(l.id)));
      }
      setCargando(false);
    })();
  },[usuario?.id]));

  return <View style={[s.root,{backgroundColor:colores.fondo}]}>
    <ScreenTopBar title="Favoritos"/>
    <View style={[s.glow,{backgroundColor:esOscuro?'rgba(111,208,178,.07)':'rgba(14,90,75,.07)'}]}/>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Reveal>
        <View style={s.header}>
          <View style={{flex:1}}>
            <Text style={[s.kicker,{color:colores.primario}]}>GUARDADOS</Text>
            <Text style={[s.h1,{color:colores.tinta}]}>Mis favoritos</Text>
            <Text style={[s.desc,{color:colores.secundario}]}>Tu selección personal para volver a encontrar rápido los lugares que más te interesan.</Text>
          </View>
          <View style={[s.icon,{backgroundColor:colores.primarioSuave}]}>
            <Ionicons name="star" size={22} color={colores.primario}/>
          </View>
        </View>
      </Reveal>

      {cargando?<SkeletonLista cantidad={3}/>:
       lugares.length===0?<EstadoContenido tipo="vacio" mensaje="Todavía no guardaste lugares favoritos."/>:
       lugares.map((l,i)=><Reveal key={l.id} delay={Math.min(70+i*55,360)}>
         <LugarCard lugar={l}/>
       </Reveal>)}
    </ScrollView>
  </View>;
}

const s=StyleSheet.create({
  root:{flex:1,overflow:'hidden'},
  glow:{position:'absolute',width:280,height:280,borderRadius:999,top:-155,right:-120},
  content:{padding:20,paddingTop:28,paddingBottom:44},
  header:{flexDirection:'row',gap:14,alignItems:'flex-start',marginBottom:20},
  kicker:{fontSize:10,fontWeight:'900',letterSpacing:1.35},
  h1:{fontSize:33,fontWeight:'900',letterSpacing:-.7,marginTop:6},
  desc:{fontSize:14,lineHeight:21,marginTop:7,maxWidth:340},
  icon:{width:48,height:48,borderRadius:17,alignItems:'center',justifyContent:'center',marginTop:4},
});
