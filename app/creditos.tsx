import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { useTema } from '@/src/contexto/TemaContext';

const CREDITOS = [
  { sitio:'Molino Forclaz', autor:'Dario Alpern', licencia:'CC BY-SA 4.0', url:'https://commons.wikimedia.org/wiki/File:Molino_Forclaz_en_Col%C3%B3n.JPG' },
  { sitio:'Parque Nacional El Palmar', autor:'Pablo D. Flores', licencia:'Dominio público declarado', url:'https://commons.wikimedia.org/wiki/File:Parque_Nacional_El_Palmar_(3).jpg' },
  { sitio:'Palacio San José', autor:'Pablo D. Flores', licencia:'Dominio público declarado', url:'https://commons.wikimedia.org/wiki/File:Palacio_San_Jos%C3%A9_1.jpg' },
  { sitio:'Puerto de Colón (imagen de referencia)', autor:'Fernando de Gorocica', licencia:'CC BY-SA 4.0', url:'https://commons.wikimedia.org/wiki/File:Puerto_de_Col%C3%B3n_-_Entre_R%C3%ADos.jpg' },
  { sitio:'Costanera Gobernador Quirós', autor:'Juandrovandi', licencia:'CC BY-SA 4.0', url:'https://commons.wikimedia.org/wiki/File:Costanera_de_Colon,_Entre_Rios.JPG' },
  { sitio:'Parque Dr. Herminio J. Quirós', autor:'Pablo D. Flores', licencia:'CC BY-SA 2.5', url:'https://commons.wikimedia.org/wiki/File:Parque_Quir%C3%B3s,_Col%C3%B3n_-_1.jpg' },
  { sitio:'Puente General Artigas (imagen de referencia)', autor:'Dario Alpern', licencia:'CC BY-SA 3.0', url:'https://commons.wikimedia.org/wiki/File:Puente_General_Artigas.jpg' },
  { sitio:'Termas de Colón (sector de toboganes, foto de 2013)', autor:'Leisuregroup', licencia:'CC BY-SA 3.0', url:'https://commons.wikimedia.org/wiki/File:Toboganes_Acuaticos.JPG' },
  { sitio:'Iglesia Santos Justo y Pastor (Plaza San Martín)', autor:'Juandrovandi', licencia:'CC BY-SA 4.0', url:'https://commons.wikimedia.org/wiki/File:Iglesia_Santos_Justo_y_Pastor_Colon_Entre_Rios.JPG' },
];

export default function CreditosFotos() {
  const { colores } = useTema();
  return <ScrollView style={{flex:1,backgroundColor:colores.fondo}} contentContainerStyle={s.content}>
    <Pressable style={s.volver} onPress={()=>router.back()} accessibilityRole="button">
      <Ionicons name="arrow-back" size={20} color={colores.primario}/>
      <Text style={{color:colores.primario,fontWeight:'800'}}>Volver</Text>
    </Pressable>
    <Text style={[s.h1,{color:colores.tinta}]}>Créditos de fotografías</Text>
    <Text style={[s.intro,{color:colores.secundario}]}>
      Fotografías de Wikimedia Commons utilizadas en esta demostración académica.
      Cada imagen conserva los derechos y la licencia establecidos por su autor.
      Tocá una fuente para ver los permisos y las condiciones de reutilización.
    </Text>
    {CREDITOS.map(foto=><Pressable
      key={foto.sitio}
      onPress={()=>{void Linking.openURL(foto.url)}}
      accessibilityRole="link"
      style={[s.item,{backgroundColor:colores.superficie,borderColor:colores.borde}]}
    >
      <Text style={[s.nombre,{color:colores.tinta}]}>{foto.sitio}</Text>
      <Text style={[s.detalle,{color:colores.secundario}]}>Foto: {foto.autor}</Text>
      <Text style={[s.detalle,{color:colores.primario}]}>{foto.licencia} · Ver fuente y licencia</Text>
    </Pressable>)}
    <Text style={[s.nota,{color:colores.secundario}]}>
      Las fotografías se encuadran automáticamente para adaptarse a las tarjetas.
      Las fotos históricas no garantizan el estado actual de las instalaciones.
      Algunas fichas muestran medios demostrativos de la API de la cátedra o un
      respaldo cuando no hay fotografía específica disponible.
    </Text>
    <Text style={[s.nota,{color:colores.secundario}]}>
      Licencias Creative Commons: creativecommons.org/licenses/by-sa/4.0/,
      creativecommons.org/licenses/by-sa/3.0/ y
      creativecommons.org/licenses/by-sa/2.5/.
    </Text>
  </ScrollView>;
}

const s=StyleSheet.create({
  content:{padding:20,paddingTop:48,paddingBottom:100,gap:12},
  volver:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12},
  h1:{fontSize:30,lineHeight:36,fontWeight:'900'},
  intro:{fontSize:14,lineHeight:21,marginBottom:10},
  item:{padding:16,borderWidth:1,borderRadius:18,gap:5},
  nombre:{fontSize:16,fontWeight:'900'},
  detalle:{fontSize:13,lineHeight:19},
  nota:{fontSize:12,lineHeight:19,marginTop:10},
});
