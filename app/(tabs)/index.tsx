import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { fotoLocalParaLugar } from '@/src/servicios/fotosLocales';

const HERO_LOCAL=require('../../assets/hero-colon.jpg');

function Destacado({lugar}:{lugar:Lugar}){
  const{colores}=useTema();
  const fotoLocal=fotoLocalParaLugar(lugar);
  const { imagen, reportarError }=useImagenLugar(lugar.id,fotoLocal?[]:lugar.imagenes);

  return <Pressable
    style={({pressed})=>[s.featureCard,pressed&&s.featurePressed]}
    onPress={()=>{void Haptics.selectionAsync();router.push({pathname:'/lugar/[id]',params:{id:lugar.id}})}}
  >
    {fotoLocal?<Image source={fotoLocal} style={StyleSheet.absoluteFill} resizeMode="cover"/>:
     imagen?<Image source={{uri:imagen}} style={StyleSheet.absoluteFill} resizeMode="cover" onError={(evento)=>reportarError(evento.nativeEvent.error)}/>:
      <Image source={HERO_LOCAL} style={StyleSheet.absoluteFill} resizeMode="cover"/>}
    <View style={s.featureShade}/>
    <View style={s.featureTop}>
      <View style={s.featureBadge}><Ionicons name="star" size={12} color="#F4C66F"/><Text style={s.featureBadgeText}>DESTACADO</Text></View>
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
  // Transicion inicial breve y accesible, sin timers ni bucles continuos.
  const entrada=useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    let activo=true;
    void AccessibilityInfo.isReduceMotionEnabled().then(reducido=>{
      if(!activo)return;
      if(reducido){entrada.setValue(1);return;}
      Animated.timing(entrada,{
        toValue:1,
        duration:800,
        easing:Easing.out(Easing.cubic),
        useNativeDriver:true,
      }).start();
    }).catch(()=>entrada.setValue(1));
    return ()=>{activo=false;entrada.stopAnimation()};
  },[entrada]);

  const cargar=async()=>{
    setCargando(true);
    setError('');
    try{
      const[l,c]=await Promise.all([obtenerLugares(),obtenerCategorias()]);
      if('error'in l)throw new Error(l.error.mensaje);
      setLugares(l.datos);
      // El catalogo no debe desaparecer si las categorias no responden.
      setCategorias('error' in c ? [] : c.datos);

    }catch(e){
      setError(e instanceof Error?e.message:'No se pudo cargar.');
    }finally{
      setCargando(false);
    }
  };

  // La ubicación es opcional: una demora del GPS o un permiso denegado
  // nunca debe bloquear el catálogo ni mostrar un error de carga de lugares.
  const cargarUbicacion=async()=>{
    try{
      const p=await Location.requestForegroundPermissionsAsync();
      if(!p.granted)return;
      const ultima=await Location.getLastKnownPositionAsync();
      if(ultima){
        setUbicacion({latitud:ultima.coords.latitude,longitud:ultima.coords.longitude});
      }
      const u=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
      setUbicacion({latitud:u.coords.latitude,longitud:u.coords.longitude});
    }catch(e){
      if(__DEV__)console.info('[Mi Ciudad] No se pudo obtener GPS; el catálogo sigue disponible',e);
    }
  };

  useEffect(()=>{void cargar();void cargarUbicacion()},[]);

  const visibles=useMemo(
    ()=>lugares
      .filter(l=>(categoria==='todas'||l.categoriaId===categoria)&&(l.nombre+' '+l.descripcionCorta).toLowerCase().includes(buscar.trim().toLowerCase()))
      .sort((a,b)=>ubicacion?distanciaKm(ubicacion,a.coordenadas)-distanciaKm(ubicacion,b.coordenadas):a.nombre.localeCompare(b.nombre)),
    [lugares,categoria,buscar,ubicacion],
  );

  // Los IDs cambian de significado entre mocks y API docente.
  // Elegir destacados por nombre evita mostrar otro atractivo accidentalmente.
  const destacados=useMemo(()=>{
    const clave=(nombre:string)=>nombre.normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('es');
    const indice=new Map(lugares.map(lugar=>[clave(lugar.nombre),lugar]));
    const preferidos=['Playa Norte','Molino Forclaz','Parque Nacional El Palmar',
      'Termas de Colón','Puerto Viejo'];
    return preferidos.map(nombre=>indice.get(clave(nombre)))
      .filter((lugar):lugar is Lugar=>Boolean(lugar)).slice(0,3);
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
          source={HERO_LOCAL}
          style={[s.heroImage,{opacity:heroOpacity,transform:[{translateY:heroTranslate},{scale:heroScale}]}]}
          resizeMode="cover"
        />
        <View style={s.heroPhotoShade}/>
        <View style={s.heroBase}/>
        <View style={s.heroBlend}/>
        <View pointerEvents="none" style={s.heroWave}/>
        <View style={s.heroTop}>
          <View style={s.brandPill}>
            <Ionicons name="location" size={14} color="white"/>
            <Text style={s.brandPillText}>COLÓN · ENTRE RÍOS</Text>
          </View>
          <View style={s.weatherLike}>
            <Ionicons name="sparkles-outline" size={16} color="white"/>
          </View>
        </View>
        <Animated.View style={[s.heroCopy,{
          opacity:entrada,
          transform:[{translateY:entrada.interpolate({inputRange:[0,1],outputRange:[22,0]})}],
        }]}>

          <Text style={s.heroTitle}>Descubrí Colón{String.fromCharCode(10)}<Text style={s.heroTitleAccent}>a tu ritmo.</Text></Text>
          <Text style={s.heroDesc}>Río, patrimonio, naturaleza y experiencias para guardar en tu recorrido.</Text>
        </Animated.View>
      </View>

      <View style={s.body}>
        <Reveal delay={70} style={s.searchFloat}>
          <GlassSurface style={s.searchWrap} intensity={74}>
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
                      <Pressable
              accessibilityRole="button" accessibilityLabel="Limpiar búsqueda y filtros"
              onPress={()=>{setBuscar('');setCategoria('todas');void Haptics.selectionAsync();}}
              style={s.searchFilterButton}
            >
              <Ionicons name="options-outline" size={20} color="#116B57"/>
            </Pressable>
</GlassSurface>
        </Reveal>

                <Reveal delay={108}>
          <View style={s.shortcuts}>
            <Pressable accessibilityRole="button" accessibilityLabel="Abrir mapa de Colón"
              onPress={()=>{void Haptics.selectionAsync();router.push('/(tabs)/mapa')}}
              style={({pressed})=>[s.shortcut,{backgroundColor:colores.superficie,borderColor:colores.borde},pressed&&s.shortcutPressed]}>
              <Ionicons name="map-outline" size={24} color={colores.primario}/>
              <Text style={[s.shortTitle,{color:colores.tinta}]}>Mapa</Text>
              <Text style={[s.shortDesc,{color:colores.secundario}]} numberOfLines={1}>Explorá Colón</Text>
              <Image source={require('../../assets/lugares/costanera-gobernador-quiros.jpg')} style={s.shortPhoto} resizeMode="cover"/>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Abrir agenda de eventos"
              onPress={()=>{void Haptics.selectionAsync();router.push('/(tabs)/agenda')}}
              style={({pressed})=>[s.shortcut,{backgroundColor:colores.superficie,borderColor:colores.borde},pressed&&s.shortcutPressed]}>
              <Ionicons name="calendar-outline" size={24} color={colores.primario}/>
              <Text style={[s.shortTitle,{color:colores.tinta}]}>Agenda</Text>
              <Text style={[s.shortDesc,{color:colores.secundario}]} numberOfLines={1}>Eventos</Text>
              <Image source={require('../../assets/lugares/parque-dr-herminio-j-quiros.jpg')} style={s.shortPhoto} resizeMode="cover"/>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Abrir mi recorrido"
              onPress={()=>{void Haptics.selectionAsync();router.push('/(tabs)/recorrido')}}
              style={({pressed})=>[s.shortcut,{backgroundColor:colores.superficie,borderColor:colores.borde},pressed&&s.shortcutPressed]}>
              <Ionicons name="footsteps-outline" size={24} color={colores.primario}/>
              <Text style={[s.shortTitle,{color:colores.tinta}]}>Recorrido</Text>
              <Text style={[s.shortDesc,{color:colores.secundario}]} numberOfLines={1}>Tus visitas</Text>
              <Image source={require('../../assets/lugares/parque-nacional-el-palmar.jpg')} style={s.shortPhoto} resizeMode="cover"/>
            </Pressable>
          </View>
        </Reveal>

        <Reveal delay={140}>
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
  // INICIO_GLASS_FINAL_2026 — estilos visuales sin cambio de lógica
  heroWave:{position:'absolute',top:252,left:'-10%',width:'120%',height:42,backgroundColor:'#083C32',borderTopLeftRadius:90,borderTopRightRadius:75,transform:[{rotate:'-1.5deg'}]},
  heroTitleAccent:{color:'#F2C76F',fontStyle:'italic'},
  searchFilterButton:{width:39,height:39,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(225,242,234,.92)'},
  shortcutPressed:{opacity:.85,transform:[{scale:.975}]},
  shortTitle:{fontSize:15,fontWeight:'900',letterSpacing:-.3},
  shortDesc:{fontSize:9,fontWeight:'700',paddingHorizontal:4,textAlign:'center'},
  shortPhoto:{position:'absolute',bottom:0,left:0,right:0,width:'100%',height:42,opacity:.9},
  featurePressed:{opacity:.88,transform:[{scale:.987}]},

  root:{flex:1},
  scrollContent:{paddingBottom:112},
  hero:{height:466,overflow:'hidden',position:'relative',backgroundColor:'#083C32'},
  heroImage:{position:'absolute',left:0,right:0,top:0,height:295,width:'100%'},
  heroPhotoShade:{position:'absolute',left:0,right:0,top:0,height:300,backgroundColor:'rgba(6,18,16,.20)'},
  heroBase:{position:'absolute',left:0,right:0,top:265,bottom:0,backgroundColor:'#083C32'},
  heroBlend:{position:'absolute',left:0,right:0,top:220,height:86,backgroundColor:'rgba(8,60,50,.63)'},
  heroTop:{position:'absolute',top:44,left:20,right:20,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  brandPill:{backgroundColor:'rgba(8,34,29,.57)',borderWidth:1,borderColor:'rgba(255,255,255,.33)',borderRadius:999,paddingHorizontal:13,paddingVertical:9,flexDirection:'row',alignItems:'center',gap:7},
  brandPillText:{color:'white',fontSize:10,fontWeight:'900',letterSpacing:1.2},
  weatherLike:{width:41,height:41,borderRadius:15,backgroundColor:'rgba(8,34,29,.57)',borderWidth:1,borderColor:'rgba(255,255,255,.28)',alignItems:'center',justifyContent:'center'},
  heroCopy:{position:'absolute',left:23,right:23,bottom:56},
  heroLogoPill:{alignSelf:'flex-start',backgroundColor:'rgba(247,244,234,.96)',borderRadius:16,paddingHorizontal:10,paddingVertical:7,marginBottom:8},
  heroLogoImg:{width:185,height:91},
  heroKicker:{color:'#A9E8D4',fontSize:10,fontWeight:'900',letterSpacing:1.5},
  heroTitle:{color:'white',fontSize:38,lineHeight:43,fontWeight:'900',letterSpacing:-1.4,marginTop:8},
  heroDesc:{color:'rgba(255,255,255,.87)',fontSize:14,lineHeight:21,maxWidth:360,marginTop:13},
  body:{paddingHorizontal:19},
  searchFloat:{marginTop:-33,zIndex:3},
  searchWrap:{height:66,borderRadius:31,flexDirection:'row',alignItems:'center',paddingHorizontal:17,gap:10,borderWidth:1,borderColor:'rgba(255,255,255,.68)',backgroundColor:'rgba(255,255,255,.86)',elevation:5,shadowColor:'#16483C',shadowOpacity:.12,shadowRadius:18,shadowOffset:{width:0,height:8}},
  search:{flex:1,fontSize:15,fontWeight:'700'},
  shortcuts:{flexDirection:'row',gap:9,marginTop:23},
  shortcut:{flex:1,height:146,borderWidth:1,borderRadius:25,alignItems:'center',justifyContent:'flex-start',paddingTop:16,gap:3,overflow:'hidden',elevation:2,shadowColor:'#184B3D',shadowOpacity:.10,shadowRadius:12,shadowOffset:{width:0,height:5}},
  shortcutText:{fontSize:12,fontWeight:'800'},
  chips:{gap:9,paddingTop:24,paddingBottom:28,paddingRight:14},
  chip:{paddingHorizontal:17,paddingVertical:12,borderRadius:999,borderWidth:1,flexDirection:'row',alignItems:'center',gap:7,elevation:1},
  sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',marginBottom:16},
  sectionKicker:{fontSize:10,fontWeight:'900',letterSpacing:2},
  sectionHint:{fontSize:11,fontWeight:'800'},
  featureRow:{gap:13,paddingRight:14,paddingBottom:26},
  featureCard:{width:278,height:204,borderRadius:27,overflow:'hidden',backgroundColor:'#203A33',elevation:5,shadowColor:'#103D31',shadowOpacity:.20,shadowRadius:16,shadowOffset:{width:0,height:7}},
  featureShade:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(7,18,15,.32)'},
  featureTop:{position:'absolute',top:12,left:12},
  featureBadge:{backgroundColor:'rgba(6,63,48,.88)',borderRadius:999,paddingHorizontal:11,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:6},
  featureBadgeText:{color:'white',fontSize:9,fontWeight:'900',letterSpacing:.75},
  featureBottom:{position:'absolute',left:17,right:17,bottom:16},
  featureName:{color:'white',fontSize:22,fontWeight:'900',letterSpacing:-.45,paddingRight:39},
  featureDesc:{color:'rgba(255,255,255,.9)',fontSize:12,marginTop:6,paddingRight:32},
  featureArrow:{position:'absolute',right:0,bottom:0,width:37,height:37,borderRadius:19,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(255,255,255,.35)'},
  section:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:14},
  h2:{fontSize:27,fontWeight:'900',letterSpacing:-.75,marginTop:4},
  sectionSub:{fontSize:11,marginTop:4,fontWeight:'700',maxWidth:285},
  count:{minWidth:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center',paddingHorizontal:8},
});
