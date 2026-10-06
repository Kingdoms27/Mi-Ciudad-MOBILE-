import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTema } from '@/src/contexto/TemaContext';

type Props=PropsWithChildren<{
  style?:StyleProp<ViewStyle>;
  intensity?:number;
}>;

export function GlassSurface({children,style,intensity=42}:Props){
  const{esOscuro}=useTema();
  return <BlurView
    intensity={intensity}
    tint={esOscuro?'dark':'light'}
    style={[
      s.base,
      {backgroundColor:esOscuro?'rgba(23,35,31,.72)':'rgba(255,255,255,.72)'},
      style,
    ]}
  >
    {children}
  </BlurView>;
}

const s=StyleSheet.create({
  base:{
    overflow:'hidden',
    borderWidth:1,
    borderColor:'rgba(255,255,255,.34)',
  },
});
