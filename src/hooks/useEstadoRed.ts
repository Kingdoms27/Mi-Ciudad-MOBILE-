import { useNetworkState } from 'expo-network';
export function useEstadoRed(){const s=useNetworkState();return{online:Boolean(s.isConnected&&s.isInternetReachable!==false),tipo:s.type};}
