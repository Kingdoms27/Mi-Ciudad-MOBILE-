import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import Storage from 'expo-sqlite/kv-store';
import { Paleta, claro, oscuro } from '@/src/tema/colores';
import { Preferencias } from '@/src/tipos';

type ModoTema = Preferencias['tema'];
type Ctx = { modo:ModoTema; setModo:(m:ModoTema)=>Promise<void>; colores:Paleta; esOscuro:boolean };
const TemaContext = createContext<Ctx|undefined>(undefined);
const KEY='mi-ciudad:tema';
export function TemaProvider({children}:PropsWithChildren){
  const sistema=useColorScheme(); const[modo,setModoState]=useState<ModoTema>('sistema');
  useEffect(()=>{Storage.getItem(KEY).then(v=>{if(v==='claro'||v==='oscuro'||v==='sistema')setModoState(v);});},[]);
  const setModo=async(m:ModoTema)=>{setModoState(m);await Storage.setItem(KEY,m)};
  const esOscuro=modo==='oscuro'||(modo==='sistema'&&sistema==='dark');
  const value=useMemo(()=>({modo,setModo,colores:esOscuro?oscuro:claro,esOscuro}),[modo,esOscuro]);
  return <TemaContext.Provider value={value}>{children}</TemaContext.Provider>;
}
export function useTema(){const c=useContext(TemaContext);if(!c)throw new Error('useTema debe usarse dentro de TemaProvider');return c;}
