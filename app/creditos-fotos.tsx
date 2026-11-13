import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '@/src/contexto/TemaContext';

// Atribución verificable de las fotografías empaquetadas en assets/lugares.
// Fuente detallada: docs/CREDITOS-FOTOS-COMMONS.md
const FOTOS = [
  { lugar: 'Playa Norte (vista general de playa en Colón; sector NO confirmado)', autor: 'Ternava', licencia: 'CC BY-SA 4.0', archivo: 'Playa_en_Colón,_Entre_Ríos.jpg' },
  { lugar: 'Molino Forclaz', autor: 'Dario Alpern', licencia: 'CC BY-SA 4.0', archivo: 'Molino_Forclaz_en_Colón.JPG' },
  { lugar: 'Parque Nacional El Palmar', autor: 'Pablo D. Flores', licencia: 'Dominio público (declarado)', archivo: 'Parque_Nacional_El_Palmar_(3).jpg' },
  { lugar: 'Palacio San José', autor: 'Pablo D. Flores', licencia: 'Dominio público (declarado)', archivo: 'Palacio_San_José_1.jpg' },
  { lugar: 'Puerto Viejo — edificio del antiguo puerto (fotografía 2006)', autor: 'Pablo D. Flores', licencia: 'CC BY-SA 2.5', archivo: 'Puerto_viejo,_Colón_-_1.jpg' },
  { lugar: 'Puerto Viejo (vista del puerto; sector exacto por verificar)', autor: 'Fernando de Gorocica', licencia: 'CC BY-SA 4.0', archivo: 'Puerto_de_Colón_-_Entre_Ríos.jpg' },
  { lugar: 'Costanera Gobernador Quirós', autor: 'Juandrovandi', licencia: 'CC BY-SA 4.0', archivo: 'Costanera_de_Colon,_Entre_Rios.JPG' },
  { lugar: 'Parque Dr. Herminio J. Quirós', autor: 'Pablo D. Flores', licencia: 'CC BY-SA 2.5', archivo: 'Parque_Quirós,_Colón_-_1.jpg' },
  { lugar: 'Mirador del Puente General Artigas (vista del puente)', autor: 'Dario Alpern', licencia: 'CC BY-SA 3.0', archivo: 'Puente_General_Artigas.jpg' },
  { lugar: 'Termas de Colón (toboganes acuáticos, fotografía 2013)', autor: 'Leisuregroup', licencia: 'CC BY-SA 3.0', archivo: 'Toboganes_Acuaticos.JPG' },
  { lugar: 'Parroquia Santos Justo y Pastor', autor: 'Juandrovandi', licencia: 'CC BY-SA 4.0', archivo: 'Iglesia_Santos_Justo_y_Pastor_Colon_Entre_Rios.JPG' },
] as const;

export default function CreditosFotos() {
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  return <View style={[s.root, { backgroundColor: colores.fondo }]}>
    <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 20 }]}>
      <Pressable onPress={()=>router.back()} style={s.back} accessibilityRole="button" accessibilityLabel="Volver a mi cuenta">
        <Ionicons name="arrow-back-outline" color={colores.primario} size={22}/>
        <Text style={{ color: colores.primario, fontWeight: '800' }}>Volver</Text>
      </Pressable>
      <Text style={[s.title,{color:colores.tinta}]}>Créditos fotográficos</Text>
      <Text style={[s.intro,{color:colores.secundario}]}>
        Hay once archivos fotográficos documentados para diez fichas: ocho fotografías del sitio (incluida una histórica) y dos vistas contextuales; la vista anterior del puerto se conserva como alternativa. Si se ejecutó fotos:commons antes de compilar la APK, las fotografías descargadas quedan incluidas para consultar sin conexión; si no, las dos fotos de Termas de Colón y la iglesia pueden necesitar descargarse al abrirlas.
        Las vistas de la playa, del puerto y del puente son referenciales y no certifican el punto exacto. Las imágenes de Wikimedia Commons conservan sus licencias originales; una foto histórica tampoco confirma el estado actual del sitio.
      </Text>
      {FOTOS.map(f=>{
        const url = 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(f.archivo);
        return <Pressable key={f.archivo} onPress={()=>{void Linking.openURL(url)}}
          accessibilityRole="link"
          style={[s.card,{backgroundColor:colores.superficie,borderColor:colores.borde}]}>
          <View style={{flex:1,gap:5}}>
            <Text style={{fontSize:16,fontWeight:'900',color:colores.tinta}}>{f.lugar}</Text>
            <Text style={{color:colores.secundario,fontSize:13}}>Autor: {f.autor}</Text>
            <Text style={{color:colores.primario,fontSize:12,fontWeight:'800'}}>{f.licencia} · Ver archivo y licencia</Text>
          </View>
          <Ionicons name="open-outline" size={19} color={colores.primario}/>
        </Pressable>;
      })}
      <Text style={[s.note,{color:colores.secundario}]}>
        Las demás imágenes de lugares y eventos pueden proceder del backend de la cátedra.
        Cuando incorporemos fotografías adicionales, también registraremos su fuente y licencia aquí.
        Algunas vistas se identifican expresamente como aproximadas y requieren validación antes de publicar.
      </Text>
    </ScrollView>
  </View>;
}

const s=StyleSheet.create({
  root:{flex:1},
  content:{paddingHorizontal:20,paddingBottom:110,gap:14},
  back:{flexDirection:'row',alignItems:'center',gap:7,alignSelf:'flex-start',paddingVertical:8},
  title:{fontSize:30,fontWeight:'900',letterSpacing:-.7},
  intro:{fontSize:14,lineHeight:22,marginBottom:4},
  card:{padding:15,borderWidth:1,borderRadius:18,flexDirection:'row',alignItems:'center',gap:8},
  note:{fontSize:12,lineHeight:20,marginTop:8},
});
