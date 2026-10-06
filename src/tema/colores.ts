export type Paleta = {
  fondo:string; superficie:string; superficie2:string; tinta:string; secundario:string; primario:string;
  primarioSuave:string; acento:string; peligro:string; exito:string; advertencia:string; borde:string; sombra:string;
};
export const claro: Paleta = {fondo:'#F5F2EA',superficie:'#FFFFFF',superficie2:'#F0EEE8',tinta:'#17342E',secundario:'#65736F',primario:'#0E5A4B',primarioSuave:'#DCEBE5',acento:'#D89C55',peligro:'#B34444',exito:'#2E7D5B',advertencia:'#A56B1F',borde:'#E4E4DE',sombra:'rgba(23,52,46,.12)'};
export const oscuro: Paleta = {fondo:'#0F1816',superficie:'#17231F',superficie2:'#1D2B27',tinta:'#F2F7F4',secundario:'#A8B7B1',primario:'#6FD0B2',primarioSuave:'#203A33',acento:'#E7B575',peligro:'#F18C8C',exito:'#75D4A5',advertencia:'#F1C477',borde:'#2D3D38',sombra:'rgba(0,0,0,.35)'};
export const colores = claro;
