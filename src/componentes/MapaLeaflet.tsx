import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Coordenadas, Lugar } from '@/src/tipos';

export type MapaLeafletRef={
  enfocar:(latitud:number,longitud:number,zoom?:number)=>void;
};

type Props={
  lugares:Lugar[];
  coord:Coordenadas|null;
  oscuro:boolean;
  lugarSeleccionadoId?:string|null;
  onLugarPress:(id:string)=>void;
};

const CENTRO_COLON={latitud:-32.2231,longitud:-58.1440};

function escapar(valor:string){
  return valor
    .replaceAll('\\','\\\\')
    .replaceAll('`','\\`')
    .replaceAll('</script>','<\\/script>');
}

export const MapaLeaflet=forwardRef<MapaLeafletRef,Props>(function MapaLeaflet(
  {lugares,coord,oscuro,lugarSeleccionadoId,onLugarPress},
  ref,
){
  const webRef=useRef<WebView|null>(null);

  useImperativeHandle(ref,()=>({
    enfocar(latitud,longitud,zoom=15){
      webRef.current?.injectJavaScript(
        `window.__miCiudadFlyTo && window.__miCiudadFlyTo(${latitud},${longitud},${zoom}); true;`,
      );
    },
  }),[]);

  const html=useMemo(()=>{
    const puntos=lugares.map(l=>({
      id:l.id,
      nombre:l.nombre,
      lat:l.coordenadas.latitud,
      lon:l.coordenadas.longitud,
      seleccionado:l.id===lugarSeleccionadoId,
    }));

    const tiles=oscuro
      ?'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      :'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const atribucion=oscuro
      ?'© OpenStreetMap contributors · © CARTO'
      :'© OpenStreetMap contributors';

    return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
html,body,#map{height:100%;width:100%;margin:0;padding:0;background:${oscuro?'#111815':'#e9eee9'};}
.leaflet-control-zoom{display:none;}
.leaflet-control-attribution{display:none;}
.pin{width:30px;height:30px;border-radius:50% 50% 50% 0;background:#0E5A4B;transform:rotate(-45deg);border:3px solid rgba(255,255,255,.96);box-shadow:0 4px 12px rgba(0,0,0,.22);}
.pin:after{content:'';position:absolute;width:8px;height:8px;border-radius:50%;background:white;left:8px;top:8px;}
.pin.selected{background:#D59E4A;width:34px;height:34px;}
.pin.selected:after{left:10px;top:10px;}
.attribution{position:absolute;z-index:999;right:6px;bottom:5px;padding:3px 5px;border-radius:6px;background:rgba(255,255,255,.76);font:8px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#53615d;pointer-events:none;}
</style>
</head>
<body>
<div id="map"></div>
<div class="attribution">${atribucion}</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function(){
  const map=L.map('map',{zoomControl:false,attributionControl:false,preferCanvas:true})
    .setView([${CENTRO_COLON.latitud},${CENTRO_COLON.longitud}],13);

  L.tileLayer('${tiles}',{maxZoom:20,minZoom:3,crossOrigin:true}).addTo(map);

  const puntos=${escapar(JSON.stringify(puntos))};
  puntos.forEach(function(p){
    const html='<div class="pin '+(p.seleccionado?'selected':'')+'"></div>';
    const icon=L.divIcon({className:'',html:html,iconSize:[34,34],iconAnchor:[17,34]});
    L.marker([p.lat,p.lon],{icon:icon})
      .addTo(map)
      .bindTooltip(p.nombre,{direction:'top',offset:[0,-28]})
      .on('click',function(){
        window.ReactNativeWebView.postMessage(JSON.stringify({tipo:'lugar',id:p.id}));
      });
  });

  ${coord?`
  L.circleMarker([${coord.latitud},${coord.longitud}],{
    radius:9,color:'#ffffff',weight:4,fillColor:'#3b82f6',fillOpacity:1
  }).addTo(map).bindTooltip('Tu ubicación',{direction:'top'});
  `:''}

  window.__miCiudadFlyTo=function(lat,lon,zoom){
    map.flyTo([lat,lon],zoom||15,{duration:.55});
  };

  setTimeout(function(){map.invalidateSize(true);},150);
})();
</script>
</body>
</html>`;
  },[lugares,coord,oscuro,lugarSeleccionadoId]);

  return <WebView
    ref={webRef}
    source={{html,baseUrl:'https://localhost'}}
    style={s.web}
    originWhitelist={['*']}
    javaScriptEnabled
    domStorageEnabled
    mixedContentMode="never"
    setSupportMultipleWindows={false}
    onMessage={event=>{
      try{
        const data=JSON.parse(event.nativeEvent.data) as {tipo?:string;id?:string};
        if(data.tipo==='lugar'&&data.id)onLugarPress(data.id);
      }catch{}
    }}
  />;
});

const s=StyleSheet.create({
  web:{...StyleSheet.absoluteFillObject,backgroundColor:'transparent'},
});
