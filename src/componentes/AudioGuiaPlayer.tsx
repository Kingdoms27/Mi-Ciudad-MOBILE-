import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Ionicons from '@react-native-vector-icons/ionicons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useTema } from '@/src/contexto/TemaContext';
import { mmss } from '@/src/utilidades/formato';

export function AudioGuiaPlayer({source,titulo}:{source:string;titulo:string}){
  const{colores,esOscuro}=useTema();
  const player=useAudioPlayer(source,{updateInterval:500});
  const status=useAudioPlayerStatus(player);

  useEffect(()=>{
    setAudioModeAsync({
      playsInSilentMode:true,
      shouldPlayInBackground:true,
      interruptionMode:'doNotMix',
    }).catch(()=>undefined);
  },[]);

  const play=async()=>{
    await Haptics.selectionAsync().catch(()=>undefined);
    player.setActiveForLockScreen(true,{title:titulo,artist:'Mi Ciudad Colón'});
    status.playing?player.pause():player.play();
  };

  const seek=async(delta:number)=>{
    await Haptics.selectionAsync().catch(()=>undefined);
    player.seekTo(Math.max(0,Math.min(status.duration||0,status.currentTime+delta)));
  };

  const pct=status.duration?Math.min(100,(status.currentTime/status.duration)*100):0;
  const restante=Math.max(0,(status.duration||0)-(status.currentTime||0));

  return <View style={[
    s.card,
    {
      backgroundColor:esOscuro?'rgba(255,255,255,.045)':colores.superficie2,
      borderColor:colores.borde,
    },
  ]}>
    <View style={s.top}>
      <Pressable style={[s.play,{backgroundColor:colores.primario}]} onPress={play}>
        <Ionicons name={status.playing?'pause':'play'} size={24} color="white"/>
      </Pressable>
      <View style={{flex:1}}>
        <Text style={[s.eyebrow,{color:colores.primario}]}>AUDIOGUÍA</Text>
        <Text style={[s.title,{color:colores.tinta}]} numberOfLines={1}>{titulo}</Text>
        <Text style={[s.time,{color:colores.secundario}]}>
          {mmss(status.currentTime)} · faltan {mmss(restante)}
        </Text>
      </View>
      <View style={[s.liveDot,{backgroundColor:status.playing?colores.exito:colores.borde}]}/>
    </View>

    <View style={[s.track,{backgroundColor:colores.borde}]}>
      <View style={[s.progress,{width:`${pct}%`,backgroundColor:colores.primario}]}/>
    </View>

    <View style={s.controls}>
      <Pressable onPress={()=>seek(-15)} style={[s.controlBtn,{borderColor:colores.borde}]}>
        <Ionicons name="play-back-outline" size={17} color={colores.primario}/>
        <Text style={[s.control,{color:colores.primario}]}>15 s</Text>
      </Pressable>
      <Text style={[s.duration,{color:colores.secundario}]}>{mmss(status.duration)}</Text>
      <Pressable onPress={()=>seek(15)} style={[s.controlBtn,{borderColor:colores.borde}]}>
        <Text style={[s.control,{color:colores.primario}]}>15 s</Text>
        <Ionicons name="play-forward-outline" size={17} color={colores.primario}/>
      </Pressable>
    </View>
  </View>;
}

const s=StyleSheet.create({
  card:{padding:16,borderRadius:20,borderWidth:1,gap:14},
  top:{flexDirection:'row',alignItems:'center',gap:12},
  play:{width:52,height:52,borderRadius:18,alignItems:'center',justifyContent:'center'},
  eyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.15},
  title:{fontSize:15,fontWeight:'900',marginTop:2},
  time:{fontSize:11,marginTop:3,fontWeight:'700'},
  liveDot:{width:8,height:8,borderRadius:4},
  track:{height:6,borderRadius:999,overflow:'hidden'},
  progress:{height:'100%',borderRadius:999},
  controls:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8},
  controlBtn:{minWidth:74,borderWidth:1,borderRadius:12,paddingVertical:8,paddingHorizontal:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4},
  control:{fontWeight:'900',fontSize:12},
  duration:{fontSize:11,fontWeight:'800'},
});
