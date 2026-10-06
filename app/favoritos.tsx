import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { listarFavoritos } from '@/src/servicios/db';
import { obtenerLugares } from '@/src/servicios/lugares';
import { Lugar } from '@/src/tipos';
import { useSesion } from '@/src/contexto/SesionContext';
import { useTema } from '@/src/contexto/TemaContext';
import { LugarCard } from '@/src/componentes/LugarCard';
import { EstadoContenido } from '@/src/componentes/EstadoContenido';
export default function Favoritos(){const{usuario}=useSesion();const{colores}=useTema();const[lugares,setLugares]=useState<Lugar[]>([]);const[cargando,setCargando]=useState(true);useFocusEffect(useCallback(()=>{(async()=>{if(!usuario){router.replace('/(tabs)/cuenta');return;}setCargando(true);const[f,r]=await Promise.all([listarFavoritos(usuario.id),obtenerLugares()]);if('datos'in r){const ids=new Set(f.map(x=>x.lugarId));setLugares(r.datos.filter(l=>ids.has(l.id)));}setCargando(false)})()},[usuario?.id]));return <ScrollView style={{flex:1,backgroundColor:colores.fondo}} contentContainerStyle={s.content}><Text style={[s.h1,{color:colores.tinta}]}>Mis favoritos</Text><Text style={[s.desc,{color:colores.secundario}]}>Lugares que guardaste para volver a encontrarlos rápido.</Text>{cargando?<EstadoContenido tipo="cargando"/>:lugares.length===0?<EstadoContenido tipo="vacio" mensaje="Todavía no guardaste lugares favoritos."/>:lugares.map(l=><LugarCard key={l.id} lugar={l}/>)}</ScrollView>}
const s=StyleSheet.create({content:{padding:20,paddingBottom:30},h1:{fontSize:30,fontWeight:'900'},desc:{fontSize:15,lineHeight:22,marginTop:7,marginBottom:18}});
