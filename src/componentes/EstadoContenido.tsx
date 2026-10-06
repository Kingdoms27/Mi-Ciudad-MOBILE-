import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTema } from '@/src/contexto/TemaContext';
import { GlassSurface } from '@/src/componentes/GlassSurface';
import { Reveal } from '@/src/componentes/Reveal';

export function EstadoContenido({
  tipo,
  mensaje,
  onReintentar,
}:{
  tipo:'cargando'|'vacio'|'error';
  mensaje?:string;
  onReintentar?:()=>void;
}){
  const{colores}=useTema();

  if(tipo==='cargando'){
    return <Reveal>
      <View style={s.loading}>
        <ActivityIndicator size="small" color={colores.primario}/>
        <Text style={[s.loadingText,{color:colores.secundario}]}>Preparando contenido…</Text>
      </View>
    </Reveal>;
  }

  const esError=tipo==='error';
  return <Reveal>
    <GlassSurface style={s.box} intensity={48}>
      <View style={[s.icon,{backgroundColor:esError?'rgba(179,68,68,.10)':colores.primarioSuave}]}>
        <Ionicons
          name={esError?'cloud-offline-outline':'sparkles-outline'}
          size={27}
          color={esError?colores.peligro:colores.primario}
        />
      </View>
      <Text style={[s.title,{color:esError?colores.peligro:colores.tinta}]}>
        {esError?'No pudimos cargar':'Todavía no hay contenido'}
      </Text>
      <Text style={[s.text,{color:colores.secundario}]}>
        {mensaje??(esError?'Revisá la conexión e intentá nuevamente.':'Probá con otro filtro o volvé más tarde.')}
      </Text>
      {onReintentar?<Pressable onPress={onReintentar} style={[s.btn,{backgroundColor:colores.primario}]}>
        <Ionicons name="refresh-outline" size={17} color="white"/>
        <Text style={s.btnText}>Reintentar</Text>
      </Pressable>:null}
    </GlassSurface>
  </Reveal>;
}

const s=StyleSheet.create({
  loading:{paddingVertical:24,alignItems:'center',justifyContent:'center',gap:9},
  loadingText:{fontSize:12,fontWeight:'800'},
  box:{padding:24,borderRadius:24,alignItems:'center'},
  icon:{width:56,height:56,borderRadius:19,alignItems:'center',justifyContent:'center',marginBottom:4},
  title:{fontSize:18,fontWeight:'900',letterSpacing:-.25},
  text:{textAlign:'center',lineHeight:20,maxWidth:290},
  btn:{paddingHorizontal:15,paddingVertical:11,borderRadius:13,marginTop:7,flexDirection:'row',alignItems:'center',gap:6},
  btnText:{color:'white',fontWeight:'900'},
});
