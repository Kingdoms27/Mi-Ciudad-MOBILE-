import * as Network from 'expo-network';
export async function hayConexion(){const s=await Network.getNetworkStateAsync();return Boolean(s.isConnected&&s.isInternetReachable!==false);}
