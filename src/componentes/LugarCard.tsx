import { useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import * as Haptics from 'expo-haptics';
import { Lugar } from '@/src/tipos';
import { useTema } from '@/src/contexto/TemaContext';
import { horarioHoy, pesos } from '@/src/utilidades/formato';
import { useImagenLugar } from '@/src/hooks/useImagenLugar';
import { fotoLocalParaLugar } from '@/src/servicios/fotosLocales';
import { apiConfigurada } from '@/src/servicios/api';

export function LugarCard({lugar,distancia}:{lugar:Lugar;distancia?:string}){
  const{colores}=useTema();
  const fotoLocal=fotoLocalParaLugar(lugar);
  // Con API docente, las fotografías remotas son la fuente principal;
  // la imagen local sólo entra si el archivo falla o todavía no se cargó.
  const apiActiva=apiConfigurada();
  const { imagen, cargando, reportarError }=useImagenLugar(
    lugar.id,apiActiva||!fotoLocal?lugar.imagenes:[],
  );
  const mostrarRemota=Boolean(imagen)&&(apiActiva||!fotoLocal);
  const escala=useRef(new Animated.Value(1)).current;

  const animar=(toValue:number)=>Animated.spring(escala,{
    toValue,
    damping:18,
    stiffness:260,
    mass:0.7,
    useNativeDriver:true,
  }).start();

  return <Animated.View style={{transform:[{scale:escala}]}}>
    <Pressable
      style={[s.card,{backgroundColor:colores.superficie,borderColor:colores.borde,shadowColor:colores.sombra}]}
      onPress={()=>{void Haptics.selectionAsync();router.push({pathname:'/lugar/[id]',params:{id:lugar.id}})}}
      onPressIn={()=>animar(.985)}
      onPressOut={()=>animar(1)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${lugar.nombre}`}
    >
      <View style={s.imageWrap}>
        {mostrarRemota?<Image source={{uri:imagen}} style={s.image} resizeMode="cover" onError={(evento)=>reportarError(evento.nativeEvent.error)}/>:
         apiActiva&&cargando?<View style={[s.image,s.placeholder,{backgroundColor:colores.superficie2}]}>
           <Ionicons name="image-outline" size={27} color={colores.secundario}/>
           <Text style={[s.placeholderText,{color:colores.secundario}]}>CARGANDO IMAGEN DE LA API</Text>
         </View>:
         fotoLocal?<Image source={fotoLocal} style={s.image} resizeMode="cover"/>:
          <View style={s.imageWrap}>
            <Image source={require('../../assets/hero-colon.jpg')} style={s.image} resizeMode="cover"/>
            <View style={s.respaldoFoto}>
              <Text style={s.respaldoFotoTexto}>VISTA GENERAL DE COLÓN</Text>
            </View>
          </View>}
        <View style={s.scrim}/>
        <View style={[s.badge,{backgroundColor:'rgba(13,45,39,.72)'}]}>
          <Ionicons name="location-outline" size={13} color="white"/>
          <Text style={s.badgeText}>{distancia??'Colón'}</Text>
        </View>
      </View>
      <View style={s.info}>
        <View style={s.row}>
          <Text style={[s.title,{color:colores.tinta}]} numberOfLines={1}>{lugar.nombre}</Text>
          <View style={[s.arrow,{backgroundColor:colores.primarioSuave}]}>
            <Ionicons name="arrow-forward" size={16} color={colores.primario}/>
          </View>
        </View>
        <Text style={[s.sub,{color:colores.primario}]}>{horarioHoy(lugar.horarios)}</Text>
        <Text style={[s.desc,{color:colores.secundario}]} numberOfLines={2}>{lugar.descripcionCorta}</Text>
        <Text style={[s.price,{color:colores.tinta}]}>{pesos(lugar.precioEntrada)}</Text>
      </View>
    </Pressable>
  </Animated.View>;
}

const s=StyleSheet.create({
  respaldoFoto:{position:'absolute',top:9,right:9,backgroundColor:'rgba(9,32,29,.75)',paddingHorizontal:9,paddingVertical:5,borderRadius:99},
  respaldoFotoTexto:{color:'white',fontSize:9,fontWeight:'900',letterSpacing:.7},

  card:{
    borderRadius:26,
    overflow:'hidden',
    borderWidth:1,
    marginBottom:16,
    elevation:3,
    shadowOpacity:.12,
    shadowRadius:18,
    shadowOffset:{width:0,height:8},
  },
  imageWrap:{position:'relative'},
  placeholder:{backgroundColor:'#1F5449',alignItems:'center',justifyContent:'center',gap:10},
  placeholderText:{color:'#D9EBE4',fontSize:10,fontWeight:'800',letterSpacing:1.2},
  image:{width:'100%',height:178,backgroundColor:'#d9d9d9'},
  scrim:{position:'absolute',left:0,right:0,bottom:0,height:72,backgroundColor:'rgba(0,0,0,.16)'},
  badge:{position:'absolute',left:12,bottom:12,borderRadius:999,paddingHorizontal:10,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:4},
  badgeText:{color:'white',fontSize:11,fontWeight:'900'},
  info:{padding:17,gap:6},
  row:{flexDirection:'row',alignItems:'center',gap:10},
  title:{fontSize:20,fontWeight:'900',flex:1,letterSpacing:-.3},
  arrow:{width:34,height:34,borderRadius:17,alignItems:'center',justifyContent:'center'},
  sub:{fontSize:13,fontWeight:'800'},
  desc:{fontSize:14,lineHeight:20},
  price:{marginTop:4,fontWeight:'900'},
});
