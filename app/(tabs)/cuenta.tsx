import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import * as Haptics from 'expo-haptics';
import { useSesion } from '@/src/contexto/SesionContext';
import { useTema } from '@/src/contexto/TemaContext';
import { actualizarPreferencias } from '@/src/servicios/preferencias';
import { GlassSurface } from '@/src/componentes/GlassSurface';
import { Reveal } from '@/src/componentes/Reveal';

export default function Cuenta(){
  const{colores,modo,setModo,esOscuro}=useTema();
  const{usuario,sesionGuardada,bloqueada,cargando,login,registrar,logout,desbloquear,actualizarUsuario}=useSesion();
  const[modoForm,setModoForm]=useState<'login'|'registro'>('login');
  const[nombre,setNombre]=useState('');
  const[email,setEmail]=useState('lucia@mail.com');
  const[password,setPassword]=useState('123456');
  const[procesando,setProcesando]=useState(false);
  const[verPassword,setVerPassword]=useState(false);

  useEffect(()=>{if(usuario&&usuario.preferencias.tema!==modo)setModo(usuario.preferencias.tema)},[usuario?.id]);

  const enviar=async()=>{
    setProcesando(true);
    const r=modoForm==='login'?await login(email,password):await registrar(nombre,email,password);
    setProcesando(false);
    if(!r.ok){
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(()=>undefined);
      Alert.alert('No se pudo ingresar',r.mensaje);
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>undefined);
  };

  const unlock=async()=>{
    const r=await desbloquear();
    if(!r.ok){
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(()=>undefined);
      Alert.alert('Biometría',r.mensaje);
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>undefined);
  };

  const pref=async(cambios:any)=>{
    if(!usuario)return;
    const u=await actualizarPreferencias(usuario,cambios);
    await actualizarUsuario(u);
    if(cambios.tema)await setModo(cambios.tema);
  };

  if(cargando)return <View style={[s.center,{backgroundColor:colores.fondo}]}>
    <ActivityIndicator color={colores.primario}/>
    <Text style={[s.loadingText,{color:colores.secundario}]}>Preparando tu cuenta…</Text>
  </View>;

  if(bloqueada&&sesionGuardada)return <View style={[s.center,{backgroundColor:colores.fondo}]}>
    <View style={[s.glow,s.glowTop,{backgroundColor:colores.primarioSuave}]}/>
    <Reveal style={s.unlockWrap}>
      <GlassSurface style={s.unlockCard} intensity={55}>
        <View style={[s.iconHero,{backgroundColor:colores.primarioSuave}]}>
          <Ionicons name="finger-print" size={42} color={colores.primario}/>
        </View>
        <Text style={[s.big,{color:colores.tinta}]}>Reingreso seguro</Text>
        <Text style={[s.centerText,{color:colores.secundario}]}>Tu sesión sigue guardada. Validá con huella o rostro para abrir tus datos personales.</Text>
        <Pressable style={[s.btn,{backgroundColor:colores.primario}]} onPress={unlock}>
          <Ionicons name="shield-checkmark-outline" size={19} color="white"/>
          <Text style={s.btnText}>Usar biometría</Text>
        </Pressable>
        <Pressable onPress={logout} style={s.altButton}>
          <Text style={{color:colores.secundario,fontWeight:'800'}}>Ingresar con contraseña</Text>
        </Pressable>
      </GlassSurface>
    </Reveal>
  </View>;

  if(!usuario)return <View style={[s.root,{backgroundColor:colores.fondo}]}>
    <View style={[s.glow,s.glowTop,{backgroundColor:esOscuro?'rgba(111,208,178,.13)':'rgba(14,90,75,.10)'}]}/>
    <View style={[s.glow,s.glowBottom,{backgroundColor:esOscuro?'rgba(231,181,117,.08)':'rgba(216,156,85,.12)'}]}/>
    <ScrollView
      contentContainerStyle={s.loginContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Reveal>
        <View style={s.brandRow}>
          <View style={[s.brandMark,{backgroundColor:colores.primario}]}>
            <Ionicons name="location" size={20} color="white"/>
          </View>
          <View>
            <Text style={[s.brandName,{color:colores.tinta}]}>Mi Ciudad</Text>
            <Text style={[s.brandSub,{color:colores.secundario}]}>COLÓN · ENTRE RÍOS</Text>
          </View>
        </View>
      </Reveal>

      <Reveal delay={90}>
        <Text style={[s.loginTitle,{color:colores.tinta}]}>
          {modoForm==='login'?'Volvé a tu viaje.':'Creá tu espacio.'}
        </Text>
        <Text style={[s.loginDesc,{color:colores.secundario}]}>
          {modoForm==='login'
            ?'Tus favoritos, eventos y recorrido quedan organizados en un solo lugar.'
            :'Guardá lugares, visitas y recordatorios para recorrer Colón a tu ritmo.'}
        </Text>
      </Reveal>

      <Reveal delay={170}>
        <GlassSurface style={s.formCard} intensity={50}>
          <View style={[s.segmented,{backgroundColor:esOscuro?'rgba(255,255,255,.05)':'rgba(14,90,75,.06)'}]}>
            <Pressable
              style={[s.segment,modoForm==='login'&&{backgroundColor:colores.superficie}]}
              onPress={()=>{void Haptics.selectionAsync();setModoForm('login')}}
            >
              <Text style={[s.segmentText,{color:modoForm==='login'?colores.primario:colores.secundario}]}>Ingresar</Text>
            </Pressable>
            <Pressable
              style={[s.segment,modoForm==='registro'&&{backgroundColor:colores.superficie}]}
              onPress={()=>{void Haptics.selectionAsync();setModoForm('registro')}}
            >
              <Text style={[s.segmentText,{color:modoForm==='registro'?colores.primario:colores.secundario}]}>Registrarme</Text>
            </Pressable>
          </View>

          {modoForm==='registro'?<View style={[s.field,{borderColor:colores.borde,backgroundColor:esOscuro?'rgba(255,255,255,.035)':'rgba(255,255,255,.62)'}]}>
            <Ionicons name="person-outline" size={19} color={colores.secundario}/>
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre"
              placeholderTextColor={colores.secundario}
              style={[s.input,{color:colores.tinta}]}
              autoComplete="name"
            />
          </View>:null}

          <View style={[s.field,{borderColor:colores.borde,backgroundColor:esOscuro?'rgba(255,255,255,.035)':'rgba(255,255,255,.62)'}]}>
            <Ionicons name="mail-outline" size={19} color={colores.secundario}/>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="Email"
              placeholderTextColor={colores.secundario}
              style={[s.input,{color:colores.tinta}]}
            />
          </View>

          <View style={[s.field,{borderColor:colores.borde,backgroundColor:esOscuro?'rgba(255,255,255,.035)':'rgba(255,255,255,.62)'}]}>
            <Ionicons name="lock-closed-outline" size={19} color={colores.secundario}/>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!verPassword}
              autoComplete={modoForm==='login'?'current-password':'new-password'}
              placeholder="Contraseña"
              placeholderTextColor={colores.secundario}
              style={[s.input,{color:colores.tinta}]}
            />
            <Pressable onPress={()=>setVerPassword(v=>!v)} hitSlop={10}>
              <Ionicons name={verPassword?'eye-off-outline':'eye-outline'} size={20} color={colores.secundario}/>
            </Pressable>
          </View>

          <Pressable
            disabled={procesando}
            style={[s.btn,{backgroundColor:colores.primario,opacity:procesando?.72:1}]}
            onPress={enviar}
          >
            {procesando?<ActivityIndicator color="white"/>:<>
              <Text style={s.btnText}>{modoForm==='login'?'Ingresar':'Crear cuenta'}</Text>
              <Ionicons name="arrow-forward" size={18} color="white"/>
            </>}
          </Pressable>

          <View style={s.safeRow}>
            <Ionicons name="shield-checkmark-outline" size={15} color={colores.primario}/>
            <Text style={[s.safeText,{color:colores.secundario}]}>Sesión protegida con almacenamiento seguro y reingreso biométrico.</Text>
          </View>
        </GlassSurface>
      </Reveal>

      <Reveal delay={250}>
        <Text style={[s.demo,{color:colores.secundario}]}>Demo: lucia@mail.com · 123456</Text>
      </Reveal>
    </ScrollView>
  </View>;

  const p=usuario.preferencias;
  return <ScrollView style={{flex:1,backgroundColor:colores.fondo}} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
    <Reveal>
      <Text style={[s.kicker,{color:colores.primario}]}>TU CUENTA</Text>
      <Text style={[s.h1,{color:colores.tinta}]}>Hola, {usuario.nombre.split(' ')[0]}.</Text>
      <Text style={[s.desc,{color:colores.secundario}]}>{usuario.email}</Text>
    </Reveal>

    <Reveal delay={90}>
      <GlassSurface style={s.profileCard}>
        <Pressable style={s.row} onPress={()=>{void Haptics.selectionAsync();router.push('/favoritos')}}>
          <View style={s.rowLeft}>
            <View style={[s.smallIcon,{backgroundColor:colores.primarioSuave}]}>
              <Ionicons name="star-outline" size={21} color={colores.primario}/>
            </View>
            <View>
              <Text style={[s.rowText,{color:colores.tinta}]}>Mis favoritos</Text>
              <Text style={[s.rowCaption,{color:colores.secundario}]}>Lugares guardados para volver</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colores.secundario}/>
        </Pressable>
      </GlassSurface>
    </Reveal>

    <Reveal delay={140}>
      <Text style={[s.section,{color:colores.tinta}]}>Preferencias</Text>
      <GlassSurface style={s.profileCard}>
        <View style={s.row}>
          <View style={s.rowLeft}>
            <View style={[s.smallIcon,{backgroundColor:colores.primarioSuave}]}>
              <Ionicons name="notifications-outline" size={21} color={colores.primario}/>
            </View>
            <View style={{flex:1}}>
              <Text style={[s.rowText,{color:colores.tinta}]}>Avisos por proximidad</Text>
              <Text style={[s.rowCaption,{color:colores.secundario}]}>Máximo un aviso por lugar y día</Text>
            </View>
          </View>
          <Switch value={p.avisarProximidad} onValueChange={v=>{void Haptics.selectionAsync();pref({avisarProximidad:v})}}/>
        </View>

        <View style={[s.separator,{backgroundColor:colores.borde}]}/>
        <Text style={[s.label,{color:colores.secundario}]}>Radio de aviso</Text>
        <View style={s.options}>
          {([100,250,500] as const).map(v=><Pressable
            key={v}
            onPress={()=>{void Haptics.selectionAsync();pref({radioAvisoMetros:v})}}
            style={[s.option,{backgroundColor:p.radioAvisoMetros===v?colores.primario:colores.superficie2}]}
          >
            <Text style={{color:p.radioAvisoMetros===v?'white':colores.tinta,fontWeight:'900'}}>{v} m</Text>
          </Pressable>)}
        </View>

        <View style={[s.separator,{backgroundColor:colores.borde}]}/>
        <Text style={[s.label,{color:colores.secundario}]}>Apariencia</Text>
        <View style={s.options}>
          {(['claro','oscuro','sistema'] as const).map(v=><Pressable
            key={v}
            onPress={()=>{void Haptics.selectionAsync();pref({tema:v})}}
            style={[s.option,{backgroundColor:p.tema===v?colores.primario:colores.superficie2}]}
          >
            <Text style={{color:p.tema===v?'white':colores.tinta,fontWeight:'900',textTransform:'capitalize'}}>{v}</Text>
          </Pressable>)}
        </View>
      </GlassSurface>
    </Reveal>

    <Pressable onPress={logout} style={[s.logout,{borderColor:colores.peligro}]}>
      <Ionicons name="log-out-outline" size={20} color={colores.peligro}/>
      <Text style={{color:colores.peligro,fontWeight:'900'}}>Cerrar sesión</Text>
    </Pressable>
  </ScrollView>;
}

const s=StyleSheet.create({
  root:{flex:1,overflow:'hidden'},
  loginContent:{paddingHorizontal:20,paddingTop:58,paddingBottom:118,minHeight:'100%'},
  content:{padding:20,paddingTop:58,paddingBottom:112},
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,overflow:'hidden'},
  loadingText:{marginTop:10,fontSize:13,fontWeight:'700'},
  glow:{position:'absolute',borderRadius:999},
  glowTop:{width:280,height:280,top:-120,right:-95},
  glowBottom:{width:240,height:240,bottom:40,left:-130},
  brandRow:{flexDirection:'row',alignItems:'center',gap:11},
  brandMark:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center'},
  brandName:{fontSize:17,fontWeight:'900',letterSpacing:-.3},
  brandSub:{fontSize:9,fontWeight:'900',letterSpacing:1.25,marginTop:1},
  loginTitle:{fontSize:38,lineHeight:43,fontWeight:'900',letterSpacing:-1.2,marginTop:36},
  loginDesc:{fontSize:15,lineHeight:22,marginTop:10,marginBottom:22,maxWidth:360},
  formCard:{borderRadius:28,padding:16,gap:11},
  segmented:{flexDirection:'row',padding:4,borderRadius:16,marginBottom:3},
  segment:{flex:1,alignItems:'center',paddingVertical:11,borderRadius:13},
  segmentText:{fontWeight:'900',fontSize:13},
  field:{height:56,borderRadius:17,borderWidth:1,flexDirection:'row',alignItems:'center',paddingHorizontal:14,gap:10},
  input:{flex:1,fontSize:16},
  btn:{minHeight:55,paddingHorizontal:18,paddingVertical:15,borderRadius:17,alignItems:'center',justifyContent:'center',marginTop:3,flexDirection:'row',gap:8},
  btnText:{color:'white',fontWeight:'900',fontSize:15},
  safeRow:{flexDirection:'row',alignItems:'flex-start',gap:7,paddingHorizontal:4,marginTop:4},
  safeText:{fontSize:11,lineHeight:16,flex:1},
  demo:{fontSize:11,lineHeight:17,textAlign:'center',marginTop:14,fontWeight:'700'},
  unlockWrap:{width:'100%'},
  unlockCard:{borderRadius:30,padding:24,alignItems:'center'},
  iconHero:{width:78,height:78,borderRadius:26,alignItems:'center',justifyContent:'center'},
  big:{fontSize:28,fontWeight:'900',marginTop:16,letterSpacing:-.5},
  centerText:{textAlign:'center',fontSize:15,lineHeight:22,marginVertical:10},
  altButton:{paddingVertical:14,paddingHorizontal:12},
  kicker:{fontSize:11,letterSpacing:1.4,fontWeight:'900'},
  h1:{fontSize:34,fontWeight:'900',letterSpacing:-.7,marginTop:8},
  desc:{fontSize:15,lineHeight:22,marginTop:8,marginBottom:20},
  profileCard:{borderRadius:24,padding:16,marginBottom:18},
  row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},
  rowLeft:{flexDirection:'row',alignItems:'center',gap:11,flex:1},
  smallIcon:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center'},
  rowText:{fontSize:15,fontWeight:'900'},
  rowCaption:{fontSize:11,marginTop:2},
  section:{fontSize:19,fontWeight:'900',marginBottom:10},
  separator:{height:1,marginVertical:16},
  label:{fontSize:12,fontWeight:'800',marginBottom:9},
  options:{flexDirection:'row',gap:8,flexWrap:'wrap'},
  option:{paddingHorizontal:13,paddingVertical:9,borderRadius:12},
  logout:{borderWidth:1,borderRadius:17,padding:14,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},
});
