import { Image, ImageStyle, StyleProp, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useImagenLugar } from '@/src/hooks/useImagenLugar';

/** Fotos de agenda: primero la API, luego la copia descargada en el dispositivo.
 * Si no hay fotografía, mostrar un respaldo honesto y legible, no inventar una.
 */
export function ImagenEvento({
  id, url, style,
}: {
  id: string; url: string | null; style?: StyleProp<ImageStyle>;
}) {
  const { imagen, reportarError } = useImagenLugar(`evento-${id}`,url ?? []);
  if (imagen) {
    return <Image
      source={{uri:imagen}}
      style={style}
      resizeMode="cover"
      onError={(evento)=>reportarError(evento.nativeEvent.error)}
      accessibilityLabel="Fotografía del evento"
    />;
  }
  return <View style={[s.respaldo,style]}>
    <Ionicons name="calendar-outline" size={32} color="#B7E6D3"/>
    <Text style={s.texto}>SIN FOTOGRAFÍA</Text>
  </View>;
}

const s = StyleSheet.create({
  respaldo:{backgroundColor:'#1D5147',alignItems:'center',justifyContent:'center',gap:9},
  texto:{color:'#B7E6D3',fontSize:10,fontWeight:'800',letterSpacing:1.1},
});
