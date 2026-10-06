import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { obtenerLugarPorQr } from '@/src/servicios/lugares';
import { registrarVisita } from '@/src/servicios/visitas';
import { useSesion } from '@/src/contexto/SesionContext';
import { useTema } from '@/src/contexto/TemaContext';
import { GlassSurface } from '@/src/componentes/GlassSurface';
import { Reveal } from '@/src/componentes/Reveal';
import { ScreenTopBar } from '@/src/componentes/ScreenTopBar';

export default function Escanear(){
  const{usuario}=useSesion();
  const{colores}=useTema();
  const[permiso,pedirPermiso]=useCameraPermissions();
  const[procesando,setProcesando]=useState(false);
  const scan=useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    const loop=Animated.loop(
      Animated.sequence([
        Animated.timing(scan,{toValue:1,duration:1750,useNativeDriver:true}),
        Animated.timing(scan,{toValue:0,duration:1750,useNativeDriver:true}),
      ]),
    );
    loop.start();
    return()=>loop.stop();
  },[scan]);

  if(!usuario)return <View style={[s.center,{backgroundColor:colores.fondo}]}>
    <Reveal style={s.centerBlock}>
      <View style={[s.permissionIcon,{backgroundColor:colores.primarioSuave}]}>
        <Ionicons name="lock-closed-outline" size={34} color={colores.primario}/>
      </View>
      <Text style={[s.title,{color:colores.tinta}]}>Ingresá para registrar visitas</Text>
      <Text style={[s.text,{color:colores.secundario}]}>Tu recorrido queda asociado a tu cuenta y puede sincronizarse cuando vuelve Internet.</Text>
      <Pressable style={[s.btn,{backgroundColor:colores.primario}]} onPress={()=>router.replace('/(tabs)/cuenta')}>
        <Text style={s.btnText}>Ir a mi cuenta</Text>
      </Pressable>
    </Reveal>
  </View>;

  if(!permiso)return <View style={[s.center,{backgroundColor:colores.fondo}]}>
    <View style={s.loadingDot}/>
    <Text style={{color:colores.secundario,fontWeight:'700'}}>Consultando permiso de cámara…</Text>
  </View>;

  if(!permiso.granted)return <View style={[s.center,{backgroundColor:colores.fondo}]}>
    <Reveal style={s.centerBlock}>
      <View style={[s.permissionIcon,{backgroundColor:colores.primarioSuave}]}>
        <Ionicons name="camera-outline" size={37} color={colores.primario}/>
      </View>
      <Text style={[s.title,{color:colores.tinta}]}>Necesitamos la cámara</Text>
      <Text style={[s.text,{color:colores.secundario}]}>Se usa solamente para reconocer los QR oficiales de los lugares turísticos.</Text>
      <Pressable style={[s.btn,{backgroundColor:colores.primario}]} onPress={pedirPermiso}>
        <Ionicons name="camera-outline" size={18} color="white"/>
        <Text style={s.btnText}>Permitir cámara</Text>
      </Pressable>
    </Reveal>
  </View>;

  const leer=async(result:BarcodeScanningResult)=>{
    if(procesando)return;
    setProcesando(true);
    const r=await obtenerLugarPorQr(result.data);
    if('error'in r){
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('QR no válido',r.error.mensaje,[{text:'Intentar de nuevo',onPress:()=>setProcesando(false)}]);
      return;
    }
    await registrarVisita(usuario.id,r.datos.id,'qr');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Visita registrada',`Guardamos tu visita a ${r.datos.nombre}.`,[
      {text:'Ver recorrido',onPress:()=>router.replace('/(tabs)/recorrido')},
    ]);
  };

  const lineY=scan.interpolate({inputRange:[0,1],outputRange:[8,236]});

  return <View style={s.root}>
    <ScreenTopBar floating close/>
    <CameraView
      style={StyleSheet.absoluteFill}
      facing="back"
      barcodeScannerSettings={{barcodeTypes:['qr']}}
      onBarcodeScanned={procesando?undefined:leer}
    />
    <View style={s.overlay}>
      <View style={s.topCopy}>
        <Text style={s.kicker}>ESCANEAR VISITA</Text>
        <Text style={s.scanTitle}>Encuadrá el QR</Text>
        <Text style={s.scanDesc}>Mantené el código dentro del marco. La lectura es automática.</Text>
      </View>

      <View style={s.frame}>
        <View style={[s.corner,s.tl]}/>
        <View style={[s.corner,s.tr]}/>
        <View style={[s.corner,s.bl]}/>
        <View style={[s.corner,s.br]}/>
        <Animated.View style={[s.scanLine,{transform:[{translateY:lineY}]}]}/>
        {procesando?<View style={s.processing}>
          <Text style={s.processingText}>Validando…</Text>
        </View>:null}
      </View>

      <GlassSurface style={s.tipCard} intensity={36}>
        <Ionicons name="shield-checkmark-outline" size={18} color="white"/>
        <Text style={s.tip}>Sólo aceptamos códigos con formato COLON.</Text>
      </GlassSurface>
    </View>
  </View>;
}

const s=StyleSheet.create({
  root:{flex:1,backgroundColor:'black'},
  overlay:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(5,13,11,.34)',paddingHorizontal:22},
  topCopy:{position:'absolute',top:72,left:24,right:24,alignItems:'center'},
  kicker:{color:'#9FE5CF',fontSize:10,fontWeight:'900',letterSpacing:1.5},
  scanTitle:{color:'white',fontSize:29,fontWeight:'900',letterSpacing:-.7,marginTop:6},
  scanDesc:{color:'rgba(255,255,255,.76)',fontSize:13,lineHeight:19,textAlign:'center',marginTop:6,maxWidth:310},
  frame:{width:270,height:270,borderRadius:30,backgroundColor:'rgba(0,0,0,.08)',overflow:'hidden'},
  corner:{position:'absolute',width:38,height:38,borderColor:'#9FE5CF'},
  tl:{left:0,top:0,borderLeftWidth:4,borderTopWidth:4,borderTopLeftRadius:24},
  tr:{right:0,top:0,borderRightWidth:4,borderTopWidth:4,borderTopRightRadius:24},
  bl:{left:0,bottom:0,borderLeftWidth:4,borderBottomWidth:4,borderBottomLeftRadius:24},
  br:{right:0,bottom:0,borderRightWidth:4,borderBottomWidth:4,borderBottomRightRadius:24},
  scanLine:{position:'absolute',left:15,right:15,top:0,height:2,borderRadius:2,backgroundColor:'#9FE5CF',shadowColor:'#9FE5CF',shadowOpacity:.8,shadowRadius:10},
  processing:{position:'absolute',left:0,right:0,top:0,bottom:0,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(6,18,15,.58)'},
  processingText:{color:'white',fontWeight:'900',fontSize:15},
  tipCard:{position:'absolute',bottom:44,left:22,right:22,borderRadius:18,paddingHorizontal:14,paddingVertical:13,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,backgroundColor:'rgba(7,20,17,.58)'},
  tip:{color:'white',fontWeight:'800',fontSize:12},
  center:{flex:1,justifyContent:'center',alignItems:'center',padding:28},
  centerBlock:{alignItems:'center',width:'100%'},
  permissionIcon:{width:70,height:70,borderRadius:24,alignItems:'center',justifyContent:'center'},
  title:{fontSize:25,fontWeight:'900',textAlign:'center',marginTop:14,letterSpacing:-.45},
  text:{textAlign:'center',marginVertical:10,lineHeight:21,maxWidth:330},
  btn:{paddingHorizontal:18,paddingVertical:14,borderRadius:16,marginTop:10,flexDirection:'row',alignItems:'center',gap:7},
  btnText:{color:'white',fontWeight:'900'},
  loadingDot:{width:9,height:9,borderRadius:5,backgroundColor:'#6FD0B2',marginBottom:12},
});
