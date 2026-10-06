import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTema } from '@/src/contexto/TemaContext';

function Pulse({style}:{style:any}){
  const{colores,esOscuro}=useTema();
  const opacity=useRef(new Animated.Value(.42)).current;

  useEffect(()=>{
    const loop=Animated.loop(
      Animated.sequence([
        Animated.timing(opacity,{toValue:.88,duration:760,useNativeDriver:true}),
        Animated.timing(opacity,{toValue:.42,duration:760,useNativeDriver:true}),
      ]),
    );
    loop.start();
    return()=>loop.stop();
  },[opacity]);

  return <Animated.View
    style={[
      s.block,
      {backgroundColor:esOscuro?'rgba(255,255,255,.09)':colores.superficie2,opacity},
      style,
    ]}
  />;
}

export function SkeletonLugar(){
  const{colores}=useTema();
  return <View style={[s.card,{borderColor:colores.borde,backgroundColor:colores.superficie}]}>
    <Pulse style={s.image}/>
    <View style={s.body}>
      <Pulse style={s.title}/>
      <Pulse style={s.meta}/>
      <Pulse style={s.line}/>
      <Pulse style={[s.line,{width:'72%'}]}/>
    </View>
  </View>;
}

export function SkeletonLista({cantidad=3}:{cantidad?:number}){
  return <View>
    {Array.from({length:cantidad}).map((_,i)=><SkeletonLugar key={i}/>)}
  </View>;
}

const s=StyleSheet.create({
  block:{borderRadius:11},
  card:{borderRadius:25,borderWidth:1,overflow:'hidden',marginBottom:15},
  image:{height:164,width:'100%',borderRadius:0},
  body:{padding:17,gap:10},
  title:{height:19,width:'64%'},
  meta:{height:11,width:'34%'},
  line:{height:12,width:'92%'},
});
