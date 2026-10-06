import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useTema } from '@/src/contexto/TemaContext';

export function ScreenTopBar({
  title,
  floating=false,
  close=false,
}:{
  title?:string;
  floating?:boolean;
  close?:boolean;
}){
  const insets=useSafeAreaInsets();
  const{colores,esOscuro}=useTema();

  const volver=()=>{
    void Haptics.selectionAsync();
    router.back();
  };

  if(floating){
    return <View pointerEvents="box-none" style={[s.floatWrap,{top:Math.max(insets.top,10)+8}]}>
      <Pressable onPress={volver} style={s.floatButton}>
        <BlurView intensity={54} tint="dark" style={s.floatBlur}>
          <Ionicons name={close?'close':'arrow-back'} size={22} color="white"/>
        </BlurView>
      </Pressable>
      {title?<BlurView intensity={48} tint="dark" style={s.floatTitle}>
        <Text style={s.floatTitleText} numberOfLines={1}>{title}</Text>
      </BlurView>:null}
    </View>;
  }

  return <View style={[
    s.bar,
    {
      paddingTop:Math.max(insets.top,8),
      backgroundColor:esOscuro?'rgba(15,24,22,.97)':'rgba(245,242,234,.98)',
      borderBottomColor:colores.borde,
    },
  ]}>
    <Pressable onPress={volver} style={[s.back,{backgroundColor:colores.superficie2}]}>
      <Ionicons name={close?'close':'arrow-back'} size={21} color={colores.tinta}/>
    </Pressable>
    <Text style={[s.title,{color:colores.tinta}]} numberOfLines={1}>{title??''}</Text>
    <View style={s.spacer}/>
  </View>;
}

const s=StyleSheet.create({
  bar:{
    minHeight:60,
    paddingHorizontal:14,
    paddingBottom:10,
    borderBottomWidth:1,
    flexDirection:'row',
    alignItems:'flex-end',
    justifyContent:'space-between',
    gap:10,
  },
  back:{width:40,height:40,borderRadius:14,alignItems:'center',justifyContent:'center'},
  title:{fontSize:15,fontWeight:'900',flex:1,textAlign:'center'},
  spacer:{width:40},
  floatWrap:{position:'absolute',left:16,right:16,zIndex:30,flexDirection:'row',alignItems:'center',gap:8},
  floatButton:{borderRadius:16,overflow:'hidden'},
  floatBlur:{width:44,height:44,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(6,16,14,.38)',borderWidth:1,borderColor:'rgba(255,255,255,.18)'},
  floatTitle:{maxWidth:'68%',height:44,borderRadius:16,justifyContent:'center',paddingHorizontal:14,backgroundColor:'rgba(6,16,14,.38)',borderWidth:1,borderColor:'rgba(255,255,255,.18)',overflow:'hidden'},
  floatTitleText:{color:'white',fontWeight:'900',fontSize:13},
});
