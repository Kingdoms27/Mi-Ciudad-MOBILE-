import { StyleSheet, Text, View } from 'react-native';
import { useEstadoRed } from '@/src/hooks/useEstadoRed';
import { useTema } from '@/src/contexto/TemaContext';
export function NetworkBanner(){const{online}=useEstadoRed();const{colores}=useTema();if(online)return null;return <View style={[s.box,{backgroundColor:colores.advertencia}]}><Text style={s.text}>Sin conexión · mostrando contenido guardado</Text></View>}
const s=StyleSheet.create({box:{paddingVertical:7,paddingHorizontal:12,alignItems:'center'},text:{color:'#1C1C1C',fontSize:12,fontWeight:'800'}});
