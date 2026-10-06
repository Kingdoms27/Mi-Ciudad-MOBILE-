import * as SecureStore from 'expo-secure-store';
import { RespuestaApi } from '@/src/tipos';
const BASE=(process.env.EXPO_PUBLIC_API_URL??'').replace(/\/$/,'');
const TOKEN_KEY='mi-ciudad:token';
export function apiConfigurada(){return Boolean(BASE);}
async function headers(){const token=await SecureStore.getItemAsync(TOKEN_KEY);return {'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})};}
export async function apiGet<T>(path:string):Promise<RespuestaApi<T>>{try{const r=await fetch(`${BASE}${path}`,{headers:await headers()});const data=await r.json();if(!r.ok)return 'error'in data?data:{error:{codigo:`HTTP_${r.status}`,mensaje:'La API respondió con un error.'}};return data as RespuestaApi<T>;}catch{return{error:{codigo:'RED',mensaje:'No se pudo conectar con la API.'}}}}
export async function apiPost<T>(path:string,body:unknown):Promise<RespuestaApi<T>>{try{const r=await fetch(`${BASE}${path}`,{method:'POST',headers:await headers(),body:JSON.stringify(body)});const data=await r.json();if(!r.ok)return 'error'in data?data:{error:{codigo:`HTTP_${r.status}`,mensaje:'La API respondió con un error.'}};return data as RespuestaApi<T>;}catch{return{error:{codigo:'RED',mensaje:'No se pudo conectar con la API.'}}}}
