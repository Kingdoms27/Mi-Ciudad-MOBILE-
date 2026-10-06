import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTema } from '@/src/contexto/TemaContext';

export default function TabLayout(){
  const{colores,esOscuro}=useTema();
  return <Tabs screenOptions={{
    headerShown:false,
    tabBarActiveTintColor:colores.primario,
    tabBarInactiveTintColor:colores.secundario,
    tabBarLabelStyle:{fontSize:11,fontWeight:'800',marginTop:2},
    tabBarItemStyle:{paddingVertical:7},
    tabBarStyle:{
      position:'absolute',
      left:12,
      right:12,
      bottom:12,
      height:72,
      paddingTop:3,
      paddingBottom:5,
      borderTopWidth:0,
      borderRadius:24,
      backgroundColor:'transparent',
      overflow:'hidden',
      elevation:12,
      shadowColor:'#000',
      shadowOpacity:0.12,
      shadowRadius:18,
      shadowOffset:{width:0,height:7},
    },
    tabBarBackground:()=>(
      <BlurView
        intensity={72}
        tint={esOscuro?'dark':'light'}
        style={s.blur}
      />
    ),
  }}>
    <Tabs.Screen name="index" listeners={{tabPress:()=>{void Haptics.selectionAsync();}}} options={{title:'Explorar',tabBarIcon:({color,size,focused})=><Ionicons name={focused?'compass':'compass-outline'} size={focused?size+2:size} color={color}/>}}/>
    <Tabs.Screen name="mapa" listeners={{tabPress:()=>{void Haptics.selectionAsync();}}} options={{title:'Mapa',tabBarIcon:({color,size,focused})=><Ionicons name={focused?'map':'map-outline'} size={focused?size+2:size} color={color}/>}}/>
    <Tabs.Screen name="agenda" listeners={{tabPress:()=>{void Haptics.selectionAsync();}}} options={{title:'Agenda',tabBarIcon:({color,size,focused})=><Ionicons name={focused?'calendar':'calendar-outline'} size={focused?size+2:size} color={color}/>}}/>
    <Tabs.Screen name="recorrido" listeners={{tabPress:()=>{void Haptics.selectionAsync();}}} options={{title:'Recorrido',tabBarIcon:({color,size,focused})=><Ionicons name={focused?'camera':'camera-outline'} size={focused?size+2:size} color={color}/>}}/>
    <Tabs.Screen name="cuenta" listeners={{tabPress:()=>{void Haptics.selectionAsync();}}} options={{title:'Yo',tabBarIcon:({color,size,focused})=><Ionicons name={focused?'person':'person-outline'} size={focused?size+2:size} color={color}/>}}/>
  </Tabs>;
}

const s=StyleSheet.create({
  blur:{
    position:'absolute',
    top:0,
    left:0,
    right:0,
    bottom:0,
    borderRadius:24,
    overflow:'hidden',
    borderWidth:1,
    borderColor:'rgba(255,255,255,.24)',
  },
});
