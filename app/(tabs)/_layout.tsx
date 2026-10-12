import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
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
      left:14,
      right:14,
      bottom:10,
      height:70,
      paddingTop:4,
      paddingBottom:5,
      borderTopWidth:0,
      borderRadius:22,
      backgroundColor:'transparent',
      overflow:'hidden',
      elevation:10,
      shadowColor:'#000',
      shadowOpacity:esOscuro?0.28:0.16,
      shadowRadius:16,
      shadowOffset:{width:0,height:6},
    },
    tabBarBackground:()=>(
      <View
        style={[
          s.surface,
          {
            backgroundColor:esOscuro?'rgba(16,29,25,.98)':'rgba(250,248,242,.98)',
            borderColor:esOscuro?'rgba(255,255,255,.09)':'rgba(23,67,56,.12)',
          },
        ]}
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
  surface:{
    position:'absolute',
    top:0,
    left:0,
    right:0,
    bottom:0,
    borderRadius:22,
    overflow:'hidden',
    borderWidth:1,
  },
});
