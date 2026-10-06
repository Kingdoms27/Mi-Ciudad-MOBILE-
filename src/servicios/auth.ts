import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import Storage from 'expo-sqlite/kv-store';
import { RespuestaApi, Sesion, Usuario } from '@/src/tipos';
import { usuarioMock } from '@/src/mocks/usuario';
const TOKEN_KEY='mi-ciudad.token'; const USER_KEY='mi-ciudad:usuario';
const esperar=(ms=250)=>new Promise(r=>setTimeout(r,ms));
const normalizar=(u:Usuario):Usuario=>({...u,preferencias:{...u.preferencias}});
export async function registro(nombre:string,email:string,password:string):Promise<RespuestaApi<Sesion>>{
 await esperar(); if(nombre.trim().length<2)return{error:{codigo:'NOMBRE_INVALIDO',mensaje:'Ingresá tu nombre.'}};if(!email.includes('@'))return{error:{codigo:'EMAIL_INVALIDO',mensaje:'Ingresá un email válido.'}};if(password.length<6)return{error:{codigo:'PASSWORD_CORTA',mensaje:'La contraseña debe tener al menos 6 caracteres.'}};
 const usuario:Usuario={...normalizar(usuarioMock),id:`usr-${Date.now()}`,nombre:nombre.trim(),email:email.trim().toLowerCase(),creadoEn:new Date().toISOString()};
 const token=`mock.${usuario.id}.${Date.now()}`;await SecureStore.setItemAsync(TOKEN_KEY,token);await Storage.setItem(USER_KEY,JSON.stringify(usuario));return{datos:{token,usuario}};
}
export async function ingreso(email:string,password:string):Promise<RespuestaApi<Sesion>>{
 await esperar();if(!email.includes('@')||password.length<6)return{error:{codigo:'CREDENCIALES_INVALIDAS',mensaje:'Email o contraseña inválidos.'}};
 const guardado=await Storage.getItem(USER_KEY);let usuario:Usuario=guardado?JSON.parse(guardado):normalizar(usuarioMock);usuario={...usuario,email:email.trim().toLowerCase()};const token=`mock.${usuario.id}.${Date.now()}`;await SecureStore.setItemAsync(TOKEN_KEY,token);await Storage.setItem(USER_KEY,JSON.stringify(usuario));return{datos:{token,usuario}};
}
export async function cerrarSesion(){await SecureStore.deleteItemAsync(TOKEN_KEY);}
export async function obtenerSesionGuardada():Promise<Sesion|null>{const token=await SecureStore.getItemAsync(TOKEN_KEY);if(!token)return null;const raw=await Storage.getItem(USER_KEY);if(!raw)return null;return{token,usuario:JSON.parse(raw)};}
export async function guardarUsuario(usuario:Usuario){await Storage.setItem(USER_KEY,JSON.stringify(usuario));}
export async function biometriaDisponible(){const[hw,enrolled]=await Promise.all([LocalAuthentication.hasHardwareAsync(),LocalAuthentication.isEnrolledAsync()]);return hw&&enrolled;}
export async function autenticarBiometria(){if(!(await biometriaDisponible()))return{ok:false,mensaje:'Este dispositivo no tiene biometría disponible o configurada.'};const r=await LocalAuthentication.authenticateAsync({promptMessage:'Ingresar a Mi Ciudad',cancelLabel:'Cancelar',fallbackLabel:'Usar código del dispositivo'});return{ok:r.success,mensaje:r.success?'Acceso confirmado':'No se pudo validar la identidad'};}
