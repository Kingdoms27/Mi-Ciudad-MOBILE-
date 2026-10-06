import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { obtenerLugares } from '@/src/servicios/lugares';
import { registrarVisita, validarCercania } from '@/src/servicios/visitas';
import { Lugar, OrigenVisita } from '@/src/tipos';
import { useSesion } from '@/src/contexto/SesionContext';
import { useTema } from '@/src/contexto/TemaContext';
import { GlassSurface } from '@/src/componentes/GlassSurface';
import { Reveal } from '@/src/componentes/Reveal';
import { ScreenTopBar } from '@/src/componentes/ScreenTopBar';

export default function RegistrarVisita(){
  const params=useLocalSearchParams<{lugarId?:string;origen?:string}>();
  const{usuario}=useSesion();
  const{colores,esOscuro}=useTema();
  const[lugares,setLugares]=useState<Lugar[]>([]);
  const[seleccion,setSeleccion]=useState<string|null>(params.lugarId??null);
  const[nota,setNota]=useState('');
  const[foto,setFoto]=useState<string|null>(null);
  const[guardando,setGuardando]=useState(false);
  const origen:OrigenVisita=params.origen==='gps'?'gps':'manual';

  useEffect(()=>{
    obtenerLugares().then(r=>{'datos'in r&&setLugares(r.datos)});
  },[]);

  if(!usuario)return <View style={[s.center,{backgroundColor:colores.fondo}]}>
    <Reveal style={{alignItems:'center'}}>
      <View style={[s.heroIcon,{backgroundColor:colores.primarioSuave}]}>
        <Ionicons name="lock-closed-outline" size={33} color={colores.primario}/>
      </View>
      <Text style={[s.h1,{color:colores.tinta,textAlign:'center'}]}>Ingresá para registrar visitas</Text>
      <Text style={[s.text,{color:colores.secundario,textAlign:'center'}]}>Tu recorrido queda guardado en tu cuenta.</Text>
      <Pressable style={[s.btn,{backgroundColor:colores.primario}]} onPress={()=>router.replace('/(tabs)/cuenta')}>
        <Text style={s.btnText}>Ir a mi cuenta</Text>
      </Pressable>
    </Reveal>
  </View>;

  const elegir=async(id:string)=>{
    await Haptics.selectionAsync().catch(()=>undefined);
    setSeleccion(id);
  };

  const camara=async()=>{
    await Haptics.selectionAsync().catch(()=>undefined);
    const p=await ImagePicker.requestCameraPermissionsAsync();
    if(!p.granted){
      Alert.alert('Cámara desactivada','Podés continuar sin foto o habilitar el permiso desde Ajustes.');
      return;
    }
    const r=await ImagePicker.launchCameraAsync({mediaTypes:['images'],allowsEditing:true,quality:.86});
    if(!r.canceled)setFoto(r.assets[0].uri);
  };

  const galeria=async()=>{
    await Haptics.selectionAsync().catch(()=>undefined);
    const r=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,quality:.86});
    if(!r.canceled)setFoto(r.assets[0].uri);
  };

  const guardar=async()=>{
    if(!seleccion){
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(()=>undefined);
      Alert.alert('Elegí un lugar');
      return;
    }
    setGuardando(true);
    try{
      if(origen==='gps'){
        const v=await validarCercania(seleccion);
        if(!v.ok){
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(()=>undefined);
          Alert.alert('No pudimos validar cercanía',v.mensaje);
          setGuardando(false);
          return;
        }
      }
      await registrarVisita(usuario.id,seleccion,origen,nota,foto);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/recorrido');
    }catch(e){
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(()=>undefined);
      Alert.alert('No se pudo guardar',e instanceof Error?e.message:'Error inesperado');
    }finally{
      setGuardando(false);
    }
  };

  return <View style={[s.root,{backgroundColor:colores.fondo}]}>
    <ScreenTopBar title="Registrar visita"/>
    <View style={[s.glow,{backgroundColor:esOscuro?'rgba(111,208,178,.07)':'rgba(14,90,75,.07)'}]}/>
    <ScrollView
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Reveal>
        <View style={s.headerRow}>
          <View style={{flex:1}}>
            <Text style={[s.kicker,{color:colores.primario}]}>{origen==='gps'?'VALIDACIÓN GPS':'REGISTRO MANUAL'}</Text>
            <Text style={[s.h1,{color:colores.tinta}]}>{origen==='gps'?'Confirmá tu visita.':'Guardá este momento.'}</Text>
            <Text style={[s.text,{color:colores.secundario}]}>
              {origen==='gps'
                ?'Al guardar comprobaremos que estés cerca del lugar. Si no hay permiso de ubicación, podés usar el registro manual.'
                :'Elegí el lugar, sumá una foto y escribí una nota breve si querés.'}
            </Text>
          </View>
          <View style={[s.heroIcon,{backgroundColor:colores.primarioSuave}]}>
            <Ionicons name={origen==='gps'?'location-outline':'camera-outline'} size={27} color={colores.primario}/>
          </View>
        </View>
      </Reveal>

      <Reveal delay={90}>
        <Text style={[s.sectionTitle,{color:colores.tinta}]}>1 · Elegí el lugar</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.placeRow}>
          {lugares.map(l=>{
            const activo=seleccion===l.id;
            return <Pressable
              key={l.id}
              onPress={()=>elegir(l.id)}
              style={[
                s.placeChip,
                {
                  backgroundColor:activo?colores.primario:esOscuro?'rgba(255,255,255,.05)':'rgba(255,255,255,.72)',
                  borderColor:activo?colores.primario:colores.borde,
                },
              ]}
            >
              <Ionicons name={activo?'checkmark-circle':'location-outline'} size={17} color={activo?'white':colores.primario}/>
              <Text style={[s.placeText,{color:activo?'white':colores.tinta}]} numberOfLines={1}>{l.nombre}</Text>
            </Pressable>;
          })}
        </ScrollView>
      </Reveal>

      <Reveal delay={150}>
        <Text style={[s.sectionTitle,{color:colores.tinta}]}>2 · Sumá una foto</Text>
        <GlassSurface style={s.photoCard} intensity={46}>
          {foto?<View>
            <Image source={{uri:foto}} style={s.photo}/>
            <View style={s.photoOverlay}>
              <Pressable onPress={()=>setFoto(null)} style={s.remove}>
                <Ionicons name="trash-outline" size={17} color="white"/>
                <Text style={s.removeText}>Quitar</Text>
              </Pressable>
            </View>
          </View>:<View style={s.emptyPhoto}>
            <View style={[s.photoIcon,{backgroundColor:colores.primarioSuave}]}>
              <Ionicons name="images-outline" size={30} color={colores.primario}/>
            </View>
            <Text style={[s.emptyTitle,{color:colores.tinta}]}>Tu foto es opcional</Text>
            <Text style={[s.emptyDesc,{color:colores.secundario}]}>Podés sacarla ahora o elegir una desde la galería.</Text>
          </View>}

          <View style={s.photoActions}>
            <Pressable onPress={camara} style={[s.photoBtn,{borderColor:colores.borde,backgroundColor:'rgba(255,255,255,.06)'}]}>
              <Ionicons name="camera-outline" size={20} color={colores.primario}/>
              <Text style={{color:colores.tinta,fontWeight:'900'}}>Cámara</Text>
            </Pressable>
            <Pressable onPress={galeria} style={[s.photoBtn,{borderColor:colores.borde,backgroundColor:'rgba(255,255,255,.06)'}]}>
              <Ionicons name="images-outline" size={20} color={colores.primario}/>
              <Text style={{color:colores.tinta,fontWeight:'900'}}>Galería</Text>
            </Pressable>
          </View>
        </GlassSurface>
      </Reveal>

      <Reveal delay={210}>
        <Text style={[s.sectionTitle,{color:colores.tinta}]}>3 · Nota del viaje</Text>
        <GlassSurface style={s.noteCard} intensity={42}>
          <TextInput
            style={[s.input,{color:colores.tinta}]}
            value={nota}
            onChangeText={setNota}
            placeholder="Algo que quieras recordar de esta visita…"
            placeholderTextColor={colores.secundario}
            multiline
            maxLength={240}
          />
          <Text style={[s.counter,{color:colores.secundario}]}>{nota.length}/240</Text>
        </GlassSurface>
      </Reveal>

      <Reveal delay={260}>
        <Pressable
          disabled={guardando}
          style={[s.saveBtn,{backgroundColor:colores.primario,opacity:guardando?.72:1}]}
          onPress={guardar}
        >
          {guardando?<ActivityIndicator color="white"/>:<>
            <Ionicons name="checkmark-circle-outline" size={21} color="white"/>
            <Text style={s.btnText}>{origen==='gps'?'Validar y guardar':'Guardar visita'}</Text>
          </>}
        </Pressable>
        <View style={s.safeRow}>
          <Ionicons name="cloud-offline-outline" size={15} color={colores.primario}/>
          <Text style={[s.safeText,{color:colores.secundario}]}>Si no hay Internet, la visita queda guardada en el teléfono y se sincroniza después.</Text>
        </View>
      </Reveal>
    </ScrollView>
  </View>;
}

const s=StyleSheet.create({
  root:{flex:1,overflow:'hidden'},
  glow:{position:'absolute',width:300,height:300,borderRadius:999,top:-170,right:-125},
  content:{padding:20,paddingTop:28,paddingBottom:60},
  center:{flex:1,justifyContent:'center',alignItems:'center',padding:25},
  headerRow:{flexDirection:'row',alignItems:'flex-start',gap:14,marginBottom:8},
  kicker:{fontSize:10,fontWeight:'900',letterSpacing:1.4},
  h1:{fontSize:31,lineHeight:36,fontWeight:'900',letterSpacing:-.7,marginTop:6},
  text:{fontSize:14,lineHeight:21,marginTop:8,maxWidth:370},
  heroIcon:{width:56,height:56,borderRadius:19,alignItems:'center',justifyContent:'center'},
  sectionTitle:{fontSize:17,fontWeight:'900',letterSpacing:-.25,marginTop:18,marginBottom:10},
  placeRow:{gap:8,paddingRight:6},
  placeChip:{maxWidth:220,borderWidth:1,borderRadius:16,paddingHorizontal:13,paddingVertical:11,flexDirection:'row',alignItems:'center',gap:7},
  placeText:{fontSize:13,fontWeight:'900',maxWidth:165},
  photoCard:{borderRadius:24,padding:12},
  photo:{width:'100%',height:230,borderRadius:18},
  photoOverlay:{position:'absolute',left:0,right:0,bottom:10,alignItems:'center'},
  remove:{backgroundColor:'rgba(15,24,22,.72)',borderRadius:999,paddingHorizontal:12,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:5},
  removeText:{color:'white',fontWeight:'900',fontSize:12},
  emptyPhoto:{minHeight:155,alignItems:'center',justifyContent:'center',padding:20},
  photoIcon:{width:60,height:60,borderRadius:20,alignItems:'center',justifyContent:'center'},
  emptyTitle:{fontSize:17,fontWeight:'900',marginTop:11},
  emptyDesc:{fontSize:12,lineHeight:18,textAlign:'center',marginTop:4,maxWidth:260},
  photoActions:{flexDirection:'row',gap:9,marginTop:10},
  photoBtn:{flex:1,borderWidth:1,padding:13,borderRadius:15,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},
  noteCard:{borderRadius:20,padding:4},
  input:{minHeight:112,textAlignVertical:'top',padding:13,fontSize:15,lineHeight:22},
  counter:{fontSize:10,fontWeight:'800',alignSelf:'flex-end',paddingHorizontal:12,paddingBottom:10},
  saveBtn:{marginTop:21,minHeight:56,padding:15,borderRadius:17,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7},
  btn:{marginTop:14,padding:16,borderRadius:16,alignItems:'center'},
  btnText:{color:'white',fontWeight:'900',fontSize:15},
  safeRow:{flexDirection:'row',alignItems:'flex-start',gap:7,marginTop:11,paddingHorizontal:4},
  safeText:{fontSize:11,lineHeight:16,flex:1},
});
