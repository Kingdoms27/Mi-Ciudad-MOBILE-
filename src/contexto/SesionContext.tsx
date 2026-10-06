import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { autenticarBiometria, biometriaDisponible, cerrarSesion, guardarUsuario, ingreso, obtenerSesionGuardada, registro } from '@/src/servicios/auth';
import { Sesion, Usuario } from '@/src/tipos';

type Resultado={ok:boolean;mensaje?:string};
type Ctx={usuario:Usuario|null;sesionGuardada:boolean;bloqueada:boolean;cargando:boolean;login:(email:string,password:string)=>Promise<Resultado>;registrar:(nombre:string,email:string,password:string)=>Promise<Resultado>;logout:()=>Promise<void>;desbloquear:()=>Promise<Resultado>;actualizarUsuario:(u:Usuario)=>Promise<void>};
const C=createContext<Ctx|undefined>(undefined);
export function SesionProvider({children}:PropsWithChildren){
 const[sesion,setSesion]=useState<Sesion|null>(null);const[bloqueada,setBloqueada]=useState(false);const[cargando,setCargando]=useState(true);
 useEffect(()=>{(async()=>{const s=await obtenerSesionGuardada();if(s){setSesion(s);setBloqueada(await biometriaDisponible().catch(()=>false));}setCargando(false);})()},[]);
 const login=async(email:string,password:string)=>{const r=await ingreso(email,password);if('error'in r)return{ok:false,mensaje:r.error.mensaje};setSesion(r.datos);setBloqueada(false);return{ok:true};};
 const registrar=async(nombre:string,email:string,password:string)=>{const r=await registro(nombre,email,password);if('error'in r)return{ok:false,mensaje:r.error.mensaje};setSesion(r.datos);setBloqueada(false);return{ok:true};};
 const logout=async()=>{await cerrarSesion();setSesion(null);setBloqueada(false);};
 const desbloquear=async()=>{const r=await autenticarBiometria();if(r.ok)setBloqueada(false);return r;};
 const actualizarUsuario=async(u:Usuario)=>{await guardarUsuario(u);setSesion(s=>s?{...s,usuario:u}:s);};
 const value=useMemo<Ctx>(()=>({usuario:bloqueada?null:sesion?.usuario??null,sesionGuardada:Boolean(sesion),bloqueada,cargando,login,registrar,logout,desbloquear,actualizarUsuario}),[sesion,bloqueada,cargando]);
 return <C.Provider value={value}>{children}</C.Provider>;
}
export function useSesion(){const c=useContext(C);if(!c)throw new Error('useSesion debe usarse dentro de SesionProvider');return c;}
