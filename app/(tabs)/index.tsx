import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Ionicons from '@react-native-vector-icons/ionicons';
import { LugarCard } from '@/src/componentes/LugarCard';
import { NetworkBanner } from '@/src/componentes/NetworkBanner';
import { EstadoContenido } from '@/src/componentes/EstadoContenido';
import { GlassSurface } from '@/src/componentes/GlassSurface';
import { Reveal } from '@/src/componentes/Reveal';
import { SkeletonLista } from '@/src/componentes/SkeletonLugar';
import { obtenerCategorias, obtenerLugares } from '@/src/servicios/lugares';
import { Categoria, Coordenadas, Lugar } from '@/src/tipos';
import { distanciaKm, formatearDistancia } from '@/src/utilidades/distancia';
import { useTema } from '@/src/contexto/TemaContext';

export default function Inicio(){
  const{colores,esOscuro}=useTema();
  const[lugares,setLugares]=useState<Lugar[]>([]);
  const[categorias,setCategorias]=useState<Categoria[]>([]);
  const[categoria,setCategoria]=useState('todas');
  const[buscar,setBuscar]=useState('');
  const[ubicacion,setUbicacion]=useState<Coordenadas|null>(null);
  const[cargando,setCargando]=useState(true);
  const[error,setError]=useState('');
  const scrollY=useRef(new Animated.Value(0)).current;

  const cargar=async()=>{
    setCargando(true);
    setError('');
    try{
      const[l,c]=await Promise.all([obtenerLugares(),obtenerCategorias()]);
      if('error'in l)throw new Error(l.error.mensaje);
      if('error'in c)throw new Error(c.error.mensaje);
      setLugares(l.datos);
      setCategorias(c.datos);
      const p=await Location.requestForegroundPermissionsAsync();
      if(p.granted){
        const u=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
        setUbicacion({latitud:u.coords.latitude,longitud:u.coords.longitude});
      }
    }catch(e){
      setError(e instanceof Error?e.message:'No se pudo cargar.');
    }finally{
      setCargando(false);
    }
  };

  useEffect(()=>{cargar()},[]);

  const visibles=useMemo(
    ()=>lugares
      .filter(l=>(categoria==='todas'||l.categoriaId===categoria)&&(l.nombre+' '+l.descripcionCorta).toLowerCase().includes(buscar.trim().toLowerCase()))
      .sort((a,b)=>ubicacion?distanciaKm(ubicacion,a.coordenadas)-distanciaKm(ubicacion,b.coordenadas):a.nombre.localeCompare(b.nombre)),
    [lugares,categoria,buscar,ubicacion],
  );

  const heroTranslate=scrollY.interpolate({inputRange:[0,120],outputRange:[0,-20],extrapolate:'clamp'});
  const heroOpacity=scrollY.interpolate({inputRange:[0,150],outputRange:[1,.72],extrapolate:'clamp'});

  return <View style={[s.root,{backgroundColor:colores.fondo}]}>
    <View style={[s.glow,s.glowOne,{backgroundColor:esOscuro?'rgba(111,208,178,.08)':'rgba(14,90,75,.08)'}]}/>
    <View style={[s.glow,s.glowTwo,{backgroundColor:esOscuro?'rgba(231,181,117,.05)':'rgba(216,156,85,.09)'}]}/>
    <NetworkBanner/>
    <Animated.ScrollView
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event([{nativeEvent:{contentOffset:{y:scrollY}}}],{useNativeDriver:true})}
      scrollEventThrottle={16}
    >
      <Animated.View style={{transform:[{translateY:heroTranslate}],opacity:heroOpacity}}>
        <Reveal>
          <View style={s.topRow}>
            <View>
              <Text style={[s.kicker,{color:colores.primario}]}>GUÍA TURÍSTICA · COLÓN</Text>
              <Text style={[s.eyebrow,{color:colores.secundario}]}>Entre Ríos · Argentina</Text>
            </View>
            <View style={[s.locationDot,{backgroundColor:colores.primarioSuave}]}>
              <Ionicons name="location" size={19} color={colores.primario}/>
            </View>
          </View>
          <Text style={[s.h1,{color:colores.tinta}]}>Descubrí Colón{'\n'}a tu ritmo.</Text>
          <Text style={[s.bajada,{color:colores.secundario}]}>Patrimonio, naturaleza, río y experiencias para recorrer la ciudad con una guía simple y cercana.</Text>
        </Reveal>

        <Reveal delay={100}>
          <GlassSurface style={s.searchWrap} intensity={48}>
            <Ionicons name="search-outline" size={20} color={colores.secundario}/>
            <TextInput
              value={buscar}
              onChangeText={setBuscar}
              placeholder="Buscar lugares y experiencias"
              placeholderTextColor={colores.secundario}
              style={[s.search,{color:colores.tinta}]}
              accessibilityLabel="Buscar lugar"
            />
            {buscar?<Pressable onPress={()=>setBuscar('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colores.secundario}/>
            </Pressable>:null}
          </GlassSurface>
        </Reveal>
      </Animated.View>

      <Reveal delay={150}>
        <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          <Pressable
            onPress={()=>{void Haptics.selectionAsync();setCategoria('todas')}}
            style={[s.chip,{backgroundColor:categoria==='todas'?colores.primario:esOscuro?'rgba(255,255,255,.05)':'rgba(255,255,255,.68)',borderColor:categoria==='todas'?colores.primario:colores.borde}]}
          >
            <Ionicons name="grid-outline" size={14} color={categoria==='todas'?'white':colores.tinta}/>
            <Text style={{fontWeight:'900',color:categoria==='todas'?'white':colores.tinta}}>Todos</Text>
          </Pressable>
          {categorias.map(c=><Pressable
            key={c.id}
            onPress={()=>{void Haptics.selectionAsync();setCategoria(c.id)}}
            style={[s.chip,{backgroundColor:categoria===c.id?colores.primario:esOscuro?'rgba(255,255,255,.05)':'rgba(255,255,255,.68)',borderColor:categoria===c.id?colores.primario:colores.borde}]}
          >
            <Text style={{fontWeight:'900',color:categoria===c.id?'white':colores.tinta}}>{c.nombre}</Text>
          </Pressable>)}
        </Animated.ScrollView>
      </Reveal>

      <Reveal delay={210}>
        <View style={s.section}>
          <View>
            <Text style={[s.h2,{color:colores.tinta}]}>{ubicacion?'Cerca tuyo':'Lugares para explorar'}</Text>
            <Text style={[s.sectionSub,{color:colores.secundario}]}>{ubicacion?'Ordenados por distancia':'Selección para empezar tu recorrido'}</Text>
          </View>
          <View style={[s.count,{backgroundColor:colores.primarioSuave}]}>
            <Text style={{color:colores.primario,fontSize:11,fontWeight:'900'}}>{visibles.length}</Text>
          </View>
        </View>
      </Reveal>

      {cargando?<SkeletonLista cantidad={3}/>:
       error?<EstadoContenido tipo="error" mensaje={error} onReintentar={cargar}/>:
       visibles.length===0?<EstadoContenido tipo="vacio" mensaje="No encontramos lugares con ese filtro."/>:
       visibles.map((l,i)=><Reveal key={l.id} delay={Math.min(250+i*55,520)}>
         <LugarCard lugar={l} distancia={ubicacion?formatearDistancia(distanciaKm(ubicacion,l.coordenadas)):undefined}/>
       </Reveal>)}
    </Animated.ScrollView>
  </View>;
}

const s=StyleSheet.create({
  root:{flex:1,overflow:'hidden'},
  content:{paddingHorizontal:20,paddingTop:58,paddingBottom:118},
  glow:{position:'absolute',borderRadius:999},
  glowOne:{width:300,height:300,top:-155,right:-125},
  glowTwo:{width:220,height:220,top:330,left:-145},
  topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  kicker:{fontSize:11,letterSpacing:1.45,fontWeight:'900'},
  eyebrow:{fontSize:10,fontWeight:'700',marginTop:3},
  locationDot:{width:43,height:43,borderRadius:15,alignItems:'center',justifyContent:'center'},
  h1:{fontSize:40,lineHeight:43,fontWeight:'900',letterSpacing:-1.25,marginTop:22},
  bajada:{fontSize:15,lineHeight:22,marginTop:12,marginBottom:20,maxWidth:390},
  searchWrap:{height:58,borderRadius:20,flexDirection:'row',alignItems:'center',paddingHorizontal:15,gap:9},
  search:{flex:1,fontSize:15},
  chips:{gap:8,paddingVertical:18,paddingRight:8},
  chip:{paddingHorizontal:14,paddingVertical:10,borderRadius:999,borderWidth:1,flexDirection:'row',alignItems:'center',gap:5},
  section:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:5,marginBottom:14},
  h2:{fontSize:23,fontWeight:'900',letterSpacing:-.45},
  sectionSub:{fontSize:11,marginTop:3,fontWeight:'700'},
  count:{minWidth:31,height:31,borderRadius:16,alignItems:'center',justifyContent:'center',paddingHorizontal:8},
});
