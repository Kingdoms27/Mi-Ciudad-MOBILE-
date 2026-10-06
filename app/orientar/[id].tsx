import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useLocalSearchParams } from 'expo-router';
import { obtenerLugarPorId } from '@/src/servicios/lugares';
import { Coordenadas, Lugar } from '@/src/tipos';
import { distanciaKm, formatearDistancia, rumboGrados } from '@/src/utilidades/distancia';
import { useTema } from '@/src/contexto/TemaContext';
import { GlassSurface } from '@/src/componentes/GlassSurface';
import { Reveal } from '@/src/componentes/Reveal';
import { ScreenTopBar } from '@/src/componentes/ScreenTopBar';

export default function Orientar(){
  const{id}=useLocalSearchParams<{id:string}>();
  const{colores,esOscuro}=useTema();
  const[lugar,setLugar]=useState<Lugar|null>(null);
  const[pos,setPos]=useState<Coordenadas|null>(null);
  const[heading,setHeading]=useState(0);
  const[error,setError]=useState('');

  useEffect(()=>{
    if(id)obtenerLugarPorId(id).then(r=>{'datos'in r&&setLugar(r.datos)});
    (async()=>{
      const p=await Location.requestForegroundPermissionsAsync();
      if(!p.granted){
        setError('Sin ubicación no podemos calcular la dirección. El resto de la app sigue funcionando.');
        return;
      }
      const u=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
      setPos({latitud:u.coords.latitude,longitud:u.coords.longitude});
    })();

    Magnetometer.setUpdateInterval(220);
    const sub=Magnetometer.addListener(({x,y})=>{
      let h=Math.atan2(y,x)*180/Math.PI;
      h=(h+360)%360;
      setHeading(h);
    });
    return()=>sub.remove();
  },[id]);

  const rumbo=useMemo(()=>pos&&lugar?rumboGrados(pos,lugar.coordenadas):0,[pos,lugar]);
  const rot=(rumbo-heading+360)%360;

  if(error)return <View style={[s.center,{backgroundColor:colores.fondo}]}>
    <Reveal style={{width:'100%'}}>
      <GlassSurface style={s.errorCard} intensity={50}>
        <View style={[s.iconBox,{backgroundColor:colores.primarioSuave}]}>
          <Ionicons name="location-outline" size={34} color={colores.primario}/>
        </View>
        <Text style={[s.title,{color:colores.tinta}]}>Ubicación desactivada</Text>
        <Text style={[s.text,{color:colores.secundario}]}>{error}</Text>
      </GlassSurface>
    </Reveal>
  </View>;

  return <View style={[s.root,{backgroundColor:colores.fondo}]}>
    <ScreenTopBar title="Orientación"/>
    <View style={[s.glow,{backgroundColor:esOscuro?'rgba(111,208,178,.08)':'rgba(14,90,75,.08)'}]}/>
    <Reveal style={s.content}>
      <Text style={[s.kicker,{color:colores.primario}]}>ORIENTACIÓN</Text>
      <Text style={[s.title,{color:colores.tinta}]}>{lugar?.nombre??'Cargando…'}</Text>
      <Text style={[s.subtitle,{color:colores.secundario}]}>Seguí la flecha para acercarte al destino.</Text>

      <GlassSurface style={s.compassCard} intensity={48}>
        <View style={s.compass}>
          <Text style={[s.north,{color:colores.secundario}]}>N</Text>
          <View style={[s.ring,{borderColor:colores.borde}]}>
            <View style={{transform:[{rotate:`${rot}deg`}],alignItems:'center'}}>
              <Ionicons name="navigate" size={108} color={colores.primario}/>
            </View>
          </View>
          <View style={[s.centerDot,{backgroundColor:colores.primario}]}/>
        </View>

        {pos&&lugar?<View style={s.distanceRow}>
          <View style={[s.distanceIcon,{backgroundColor:colores.primarioSuave}]}>
            <Ionicons name="walk-outline" size={20} color={colores.primario}/>
          </View>
          <View>
            <Text style={[s.distanceLabel,{color:colores.secundario}]}>DISTANCIA APROXIMADA</Text>
            <Text style={[s.distance,{color:colores.tinta}]}>{formatearDistancia(distanciaKm(pos,lugar.coordenadas))}</Text>
          </View>
        </View>:null}
      </GlassSurface>

      <View style={s.tipRow}>
        <Ionicons name="information-circle-outline" size={18} color={colores.primario}/>
        <Text style={[s.tip,{color:colores.secundario}]}>Mové el teléfono en forma de “8” si la brújula necesita calibración.</Text>
      </View>
    </Reveal>
  </View>;
}

const s=StyleSheet.create({
  root:{flex:1,overflow:'hidden'},
  glow:{position:'absolute',width:310,height:310,borderRadius:999,top:-180,right:-120},
  content:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:24,paddingBottom:28},
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:24},
  kicker:{fontSize:10,fontWeight:'900',letterSpacing:1.4},
  title:{fontSize:28,lineHeight:34,fontWeight:'900',textAlign:'center',letterSpacing:-.6,marginTop:6},
  subtitle:{fontSize:13,lineHeight:19,textAlign:'center',marginTop:6},
  compassCard:{width:'100%',borderRadius:30,padding:20,marginTop:24},
  compass:{height:270,alignItems:'center',justifyContent:'center'},
  ring:{width:225,height:225,borderRadius:999,borderWidth:1,alignItems:'center',justifyContent:'center'},
  north:{position:'absolute',top:10,fontWeight:'900',fontSize:12,letterSpacing:1.2},
  centerDot:{position:'absolute',width:10,height:10,borderRadius:5},
  distanceRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,marginTop:4},
  distanceIcon:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center'},
  distanceLabel:{fontSize:9,fontWeight:'900',letterSpacing:1.05},
  distance:{fontSize:20,fontWeight:'900',marginTop:1},
  tipRow:{flexDirection:'row',alignItems:'flex-start',gap:7,marginTop:15,maxWidth:340},
  tip:{fontSize:11,lineHeight:17,flex:1},
  errorCard:{borderRadius:28,padding:24,alignItems:'center'},
  iconBox:{width:68,height:68,borderRadius:22,alignItems:'center',justifyContent:'center'},
  text:{textAlign:'center',lineHeight:21,marginTop:10},
});
