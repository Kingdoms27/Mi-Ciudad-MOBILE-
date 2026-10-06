import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useEstadoRed } from '@/src/hooks/useEstadoRed';
import { useTema } from '@/src/contexto/TemaContext';
import { Reveal } from '@/src/componentes/Reveal';

export function NetworkBanner(){
  const{online}=useEstadoRed();
  const{colores}=useTema();
  if(online)return null;

  return <Reveal distance={-12}>
    <View style={[s.box,{backgroundColor:colores.advertencia}]}>
      <Ionicons name="cloud-offline-outline" size={15} color="#1C1C1C"/>
      <Text style={s.text}>Sin conexión · usando contenido guardado</Text>
    </View>
  </Reveal>;
}

const s=StyleSheet.create({
  box:{paddingVertical:8,paddingHorizontal:12,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},
  text:{color:'#1C1C1C',fontSize:11,fontWeight:'900',letterSpacing:.1},
});
