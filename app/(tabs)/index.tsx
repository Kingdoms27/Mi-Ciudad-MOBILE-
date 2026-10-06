import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
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
import { useImagenLugar } from '@/src/hooks/useImagenLugar';

const HERO_URL='https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Costanera_de_Col%C3%B3n%2C_Entre_R%C3%ADos.jpg/1280px-Costanera_de_Col%C3%B3n%2C_Entre_R%C3%ADos.jpg';

function Destacado({lugar}:{lugar:Lugar}){
  const{colores}=useTema();
  const imagen=useImagenLugar(`destacado-${lugar.id}`,lugar.imagenes[0]);

  return <Pressable
    style={s.featureCard}
    onPress={()=>{void Haptics.selectionAsync();router.push({pathname:'/lugar/[id]',params:{id:lugar.id}})}}
  >
    <Image source={{uri:imagen}} style={StyleSheet.absoluteFill} resizeMode="cover"/>
    <View style={s.featureShade}/>
    <View style={s.featureTop}>
      <View style={s.featureBadge}><Text style={s.featureBadgeText}>DESTACADO</Text></View>
    </View>
    <View style={s.featureBottom}>
      <Text style={s.featureName} numberOfLines={2}>{lugar.nombre}</Text>
      <Text style={s.featureDesc} numberOfLines={1}>{lugar.descripcionCorta}</Text>
      <View style={[s.featureArrow,{backgroundColor:colores.primario}]}>
        <Ionicons name="arrow-forward" size={17} color="white"/>
      </View>
    </View>
  </Pressable>;
}

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
  const heroImage=useImagenLugar('hero-colon',HERO_URL);

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

  const destacados=useMemo(()=>{
    const ids=['lug-002','lug-004','lug-003'];
    return ids.map(id=>lugares.find(l=>l.id===id)).filter(Boolean) as Lugar[];
  },[lugares]);

  const heroScale=scrollY.interpolate({inputRange:[-160,0,260],outputRange:[1.22,1,1],extrapolate:'clamp'});
  const heroTranslate=scrollY.interpolate({inputRange:[0,260],outputRange:[0,58],extrapolate:'clamp'});
  const heroOpacity=scrollY.interpolate({inputRange:[0,250],outputRange:[1,.86],extrapolate:'clamp'});

  return <View style={[s.root,{backgroundColor:colores.fondo}]}>
    <NetworkBanner/>
    <Animated.ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.scrollContent}
      onScroll={Animated.event([{nativeEvent:{contentOffset:{y:scrollY}}}],{useNativeDriver:true})}
      scrollEventThrottle={16}
    >
      <View style={s.hero}>
        <Animated.Image
          source={{uri:heroImage}}
          style={[s.heroImage,{opacity:heroOpacity,transform:[{translateY:heroTranslate},{scale:heroScale}]}]}
          resizeMode="cover"
        />
        <View style={s.heroShade}/>
        <View style={s.heroTop}>
          <View style={s.brandPill}>
            <Ionicons name="location" size={14} color="white"/>
            <Text style={s.brandPillText}>COLÓN · ENTRE RÍOS</Text>
          </View>
          <View style={s.weatherLike}>
            <Ionicons name="sparkles-outline" size={16} color="white"/>
          </View>
        </View>
        <View style={s.heroCopy}>
          <Text style={s.heroKicker}>MI CIUDAD</Text>
          <Text style={s.heroTitle}>Descubrí Colón{String.fromCharCode(10)}a tu ritmo.</Text>
          <Text style={s.heroDesc}>Río, patrimonio, naturaleza y experiencias para guardar en tu recorrido.</Text>
        </View>
      </View>

      <View style={s.body}>
        <Reveal delay={70} style={s.searchFloat}>
          <GlassSurface style={s.searchWrap} intensity={62}>
            <Ionicons name="search-outline" size={21} color={colores.secundario}/>
            <TextInput
              value={buscar}
              onChangeText={setBuscar}
              placeholder="¿Qué querés conocer?"
              placeholderTextColor={colores.secundario}
              style={[s.search,{color:colores.tinta}]}
              accessibilityLabel="Buscar lugar"
            />
            {buscar?<Pressable onPress={()=>setBuscar('')} hitSlop={10}>
              <Ionicons name="close-circle" size={19} color={colores.secundario}/>
            </Pressable>:null}
          </GlassSurface>
        </Reveal>

        <Reveal delay={120}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
            <Pressable
              onPress={()=>{void Haptics.selectionAsync();setCategoria('todas')}}
              style={[s.chip,{backgroundColor:categoria==='todas'?colores.primario:colores.superficie,borderColor:categoria==='todas'?colores.primario:colores.borde}]}
            >
              <Ionicons name="grid-outline" size={14} color={categoria==='todas'?'white':colores.tinta}/>
              <Text style={{fontWeight:'900',color:categoria==='todas'?'white':colores.tinta}}>Todos</Text>
            </Pressable>
            {categorias.map(c=><Pressable
              key={c.id}
              onPress={()=>{void Haptics.selectionAsync();setCategoria(c.id)}}
              style={[s.chip,{backgroundColor:categoria===c.id?colores.primario:colores.superficie,borderColor:categoria===c.id?colores.primario:colores.borde}]}
            >
              <Text style={{fontWeight:'900',color:categoria===c.id?'white':colores.tinta}}>{c.nombre}</Text>
            </Pressable>)}
          </ScrollView>
        </Reveal>

        {!buscar&&categoria==='todas'&&destacados.length>0?<Reveal delay={160}>
          <View style={s.sectionHead}>
            <View>
              <Text style={[s.sectionKicker,{color:colores.primario}]}>IMPERDIBLES</Text>
              <Text style={[s.h2,{color:colores.tinta}]}>Para empezar</Text>
            </View>
            <Text style={[s.sectionHint,{color:colores.secundario}]}>Deslizá →</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.featureRow}>
            {destacados.map(l=><Destacado key={l.id} lugar={l}/>)}
          </ScrollView>
        </Reveal>:null}

        <Reveal delay={200}>
          <View style={s.section}>
            <View>
              <Text style={[s.sectionKicker,{color:colores.primario}]}>{ubicacion?'CERCA TUYO':'EXPLORÁ'}</Text>
              <Text style={[s.h2,{color:colores.tinta}]}>{buscar?'Resultados':'Lugares de Colón'}</Text>
              <Text style={[s.sectionSub,{color:colores.secundario}]}>
                {ubicacion?'Ordenados por distancia desde tu ubicación':'Elegí una experiencia y armá tu recorrido'}
              </Text>
            </View>
            <View style={[s.count,{backgroundColor:colores.primarioSuave}]}>
              <Text style={{color:colores.primario,fontSize:11,fontWeight:'900'}}>{visibles.length}</Text>
            </View>
          </View>
        </Reveal>

        {cargando?<SkeletonLista cantidad={3}/>:
         error?<EstadoContenido tipo="error" mensaje={error} onReintentar={cargar}/>:
         visibles.length===0?<EstadoContenido tipo="vacio" mensaje="No encontramos lugares con ese filtro."/>:
         visibles.map((l,i)=><Reveal key={l.id} delay={Math.min(230+i*45,470)}>
           <LugarCard lugar={l} distancia={ubicacion?formatearDistancia(distanciaKm(ubicacion,l.coordenadas)):undefined}/>
         </Reveal>)}
      </View>
    </Animated.ScrollView>
  </View>;
}

const s=StyleSheet.create({
  root:{flex:1},
  scrollContent:{paddingBottom:112},
  hero:{height:390,overflow:'hidden',position:'relative',backgroundColor:'#17342E'},
  heroImage:{position:'absolute',left:0,right:0,top:-12,height:430,width:'100%'},
  heroShade:{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'rgba(8,22,18,.42)'},
  heroTop:{position:'absolute',top:50,left:20,right:20,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  brandPill:{backgroundColor:'rgba(10,26,22,.52)',borderWidth:1,borderColor:'rgba(255,255,255,.2)',borderRadius:999,paddingHorizontal:11,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:5},
  brandPillText:{color:'white',fontSize:9,fontWeight:'900',letterSpacing:1.1},
  weatherLike:{width:38,height:38,borderRadius:14,backgroundColor:'rgba(10,26,22,.52)',borderWidth:1,borderColor:'rgba(255,255,255,.2)',alignItems:'center',justifyContent:'center'},
  heroCopy:{position:'absolute',left:20,right:20,bottom:56},
  heroKicker:{color:'#A9E8D4',fontSize:10,fontWeight:'900',letterSpacing:1.5},
  heroTitle:{color:'white',fontSize:42,lineHeight:44,fontWeight:'900',letterSpacing:-1.45,marginTop:7},
  heroDesc:{color:'rgba(255,255,255,.84)',fontSize:14,lineHeight:21,maxWidth:350,marginTop:10},
  body:{paddingHorizontal:20},
  searchFloat:{marginTop:-29,zIndex:3},
  searchWrap:{height:60,borderRadius:21,flexDirection:'row',alignItems:'center',paddingHorizontal:16,gap:9},
  search:{flex:1,fontSize:15,fontWeight:'700'},
  chips:{gap:8,paddingTop:20,paddingBottom:22,paddingRight:8},
  chip:{paddingHorizontal:14,paddingVertical:10,borderRadius:999,borderWidth:1,flexDirection:'row',alignItems:'center',gap:5},
  sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',marginBottom:12},
  sectionKicker:{fontSize:9,fontWeight:'900',letterSpacing:1.25},
  sectionHint:{fontSize:10,fontWeight:'800'},
  featureRow:{gap:12,paddingRight:10,paddingBottom:24},
  featureCard:{width:250,height:188,borderRadius:24,overflow:'hidden',backgroundColor:'#203A33'},
  featureShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(7,18,15,.30)'},
  featureTop:{position:'absolute',top:12,left:12},
  featureBadge:{backgroundColor:'rgba(8,20,17,.62)',borderRadius:999,paddingHorizontal:9,paddingVertical:6},
  featureBadgeText:{color:'white',fontSize:8,fontWeight:'900',letterSpacing:1},
  featureBottom:{position:'absolute',left:14,right:14,bottom:13},
  featureName:{color:'white',fontSize:20,fontWeight:'900',letterSpacing:-.35,paddingRight:38},
  featureDesc:{color:'rgba(255,255,255,.78)',fontSize:11,marginTop:3,paddingRight:30},
  featureArrow:{position:'absolute',right:0,bottom:0,width:34,height:34,borderRadius:13,alignItems:'center',justifyContent:'center'},
  section:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:14},
  h2:{fontSize:24,fontWeight:'900',letterSpacing:-.55,marginTop:2},
  sectionSub:{fontSize:11,marginTop:4,fontWeight:'700',maxWidth:285},
  count:{minWidth:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center',paddingHorizontal:8},
});
