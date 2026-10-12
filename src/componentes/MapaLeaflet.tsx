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
  {lugares,coord,oscuro,onLugarPress},
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
    }));

    const tema=oscuro?'dark_all':'light_all';

    return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body,#map{height:100%;width:100%;margin:0;padding:0;overflow:hidden}
body{background:${oscuro?'#111815':'#EEECE3'};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
#map{position:relative;touch-action:none;user-select:none}
#tiles,#markers{position:absolute;inset:0;overflow:hidden}
.tile{position:absolute;width:256px;height:256px;object-fit:cover;pointer-events:none}
.pin{position:absolute;width:30px;height:30px;border-radius:50% 50% 50% 0;background:#0E7562;transform:translate(-50%,-100%) rotate(-45deg);border:3px solid rgba(255,255,255,.96);box-shadow:0 5px 15px rgba(0,0,0,.25);cursor:pointer}
.pin:after{content:'';position:absolute;width:8px;height:8px;border-radius:50%;background:#fff;left:8px;top:8px}
.pin.active{width:35px;height:35px;background:#D39A43}
.pin.active:after{left:10px;top:10px}
.user{position:absolute;width:20px;height:20px;border-radius:50%;background:#3B82F6;border:4px solid #fff;box-shadow:0 0 0 6px rgba(59,130,246,.18),0 3px 12px rgba(0,0,0,.28);transform:translate(-50%,-50%)}
.label{position:absolute;transform:translate(-50%,-100%);background:rgba(14,32,27,.9);color:white;padding:5px 8px;border-radius:8px;font-size:11px;font-weight:700;white-space:nowrap;pointer-events:none;margin-top:-38px;opacity:0;transition:opacity .12s}
.attribution{position:absolute;right:7px;bottom:7px;z-index:30;padding:4px 6px;border-radius:7px;background:rgba(255,255,255,.82);color:#4B5A55;font-size:8px;font-weight:600}
.zoom{position:absolute;right:14px;bottom:118px;z-index:40;display:flex;flex-direction:column;gap:8px}
.zoom button{width:42px;height:42px;border:0;border-radius:14px;background:${oscuro?'rgba(18,31,27,.94)':'rgba(255,255,255,.95)'};color:${oscuro?'#E9F2EF':'#0E5A4B'};font-size:24px;font-weight:500;box-shadow:0 4px 14px rgba(0,0,0,.12)}
</style>
</head>
<body>
<div id="map">
  <div id="tiles"></div>
  <div id="markers"></div>
  <div class="zoom">
    <button id="zoomIn" aria-label="Acercar">+</button>
    <button id="zoomOut" aria-label="Alejar">−</button>
  </div>
  <div class="attribution">© OpenStreetMap · © CARTO</div>
</div>
<script>
(function(){
  const TILE=256;
  const minZoom=4;
  const maxZoom=19;
  let zoom=13;
  let center={lat:${CENTRO_COLON.latitud},lon:${CENTRO_COLON.longitud}};
  let activeId=null;
  const points=${escapar(JSON.stringify(puntos))};
  const user=${coord?JSON.stringify({lat:coord.latitud,lon:coord.longitud}):'null'};
  const tilesEl=document.getElementById('tiles');
  const markersEl=document.getElementById('markers');
  const mapEl=document.getElementById('map');

  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function project(lat,lon,z){
    const scale=TILE*Math.pow(2,z);
    const sin=clamp(Math.sin(lat*Math.PI/180),-.9999,.9999);
    return {
      x:(lon+180)/360*scale,
      y:(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*scale
    };
  }
  function unproject(x,y,z){
    const scale=TILE*Math.pow(2,z);
    const lon=x/scale*360-180;
    const n=Math.PI-2*Math.PI*y/scale;
    const lat=180/Math.PI*Math.atan(.5*(Math.exp(n)-Math.exp(-n)));
    return {lat:clamp(lat,-85,85),lon:((lon+540)%360)-180};
  }
  function tileUrl(z,x,y){
    return 'https://a.basemaps.cartocdn.com/${tema}/'+z+'/'+x+'/'+y+'.png';
  }
  function osmUrl(z,x,y){
    return 'https://tile.openstreetmap.org/'+z+'/'+x+'/'+y+'.png';
  }
  function render(){
    const w=mapEl.clientWidth||window.innerWidth;
    const h=mapEl.clientHeight||window.innerHeight;
    const cp=project(center.lat,center.lon,zoom);
    const n=Math.pow(2,zoom);
    const x0=Math.floor((cp.x-w/2)/TILE);
    const x1=Math.floor((cp.x+w/2)/TILE);
    const y0=Math.floor((cp.y-h/2)/TILE);
    const y1=Math.floor((cp.y+h/2)/TILE);

    tilesEl.innerHTML='';
    for(let ty=y0;ty<=y1;ty++){
      if(ty<0||ty>=n)continue;
      for(let tx=x0;tx<=x1;tx++){
        const wrapped=((tx%n)+n)%n;
        const img=document.createElement('img');
        img.className='tile';
        img.draggable=false;
        img.style.left=(tx*TILE-cp.x+w/2)+'px';
        img.style.top=(ty*TILE-cp.y+h/2)+'px';
        img.src=tileUrl(zoom,wrapped,ty);
        img.onerror=function(){
          if(!img.dataset.fallback){
            img.dataset.fallback='1';
            img.src=osmUrl(zoom,wrapped,ty);
          }
        };
        tilesEl.appendChild(img);
      }
    }

    markersEl.innerHTML='';
    points.forEach(function(p){
      const pp=project(p.lat,p.lon,zoom);
      const x=pp.x-cp.x+w/2;
      const y=pp.y-cp.y+h/2;
      if(x<-60||x>w+60||y<-60||y>h+80)return;

      const marker=document.createElement('div');
      marker.className='pin'+(p.id===activeId?' active':'');
      marker.style.left=x+'px';
      marker.style.top=y+'px';
      marker.title=p.nombre;
      marker.addEventListener('click',function(ev){
        ev.stopPropagation();
        activeId=p.id;
        render();
        window.ReactNativeWebView.postMessage(JSON.stringify({tipo:'lugar',id:p.id}));
      });
      markersEl.appendChild(marker);

      if(p.id===activeId){
        const label=document.createElement('div');
        label.className='label';
        label.style.left=x+'px';
        label.style.top=y+'px';
        label.style.opacity='1';
        label.textContent=p.nombre;
        markersEl.appendChild(label);
      }
    });

    if(user){
      const up=project(user.lat,user.lon,zoom);
      const ux=up.x-cp.x+w/2;
      const uy=up.y-cp.y+h/2;
      const dot=document.createElement('div');
      dot.className='user';
      dot.style.left=ux+'px';
      dot.style.top=uy+'px';
      markersEl.appendChild(dot);
    }
  }

  let dragging=false;
  let moved=false;
  let start={x:0,y:0};
  let startCenter={x:0,y:0};
  let pinchDistance=0;
  let pinchZoom=zoom;

  function distance(a,b){
    const dx=a.clientX-b.clientX,dy=a.clientY-b.clientY;
    return Math.sqrt(dx*dx+dy*dy);
  }

  mapEl.addEventListener('touchstart',function(e){
    if(e.touches.length===1){
      dragging=true;moved=false;
      start={x:e.touches[0].clientX,y:e.touches[0].clientY};
      startCenter=project(center.lat,center.lon,zoom);
    }else if(e.touches.length===2){
      dragging=false;
      pinchDistance=distance(e.touches[0],e.touches[1]);
      pinchZoom=zoom;
    }
  },{passive:true});

  mapEl.addEventListener('touchmove',function(e){
    e.preventDefault();
    if(e.touches.length===1&&dragging){
      const dx=e.touches[0].clientX-start.x;
      const dy=e.touches[0].clientY-start.y;
      if(Math.abs(dx)+Math.abs(dy)>5)moved=true;
      center=unproject(startCenter.x-dx,startCenter.y-dy,zoom);
      render();
    }else if(e.touches.length===2&&pinchDistance){
      const d=distance(e.touches[0],e.touches[1]);
      const ratio=d/pinchDistance;
      const next=clamp(pinchZoom+(ratio>1.25?1:ratio<.8?-1:0),minZoom,maxZoom);
      if(next!==zoom){zoom=next;render();}
    }
  },{passive:false});

  mapEl.addEventListener('touchend',function(){dragging=false;pinchDistance=0;});
  mapEl.addEventListener('dblclick',function(e){
    e.preventDefault();
    zoom=clamp(zoom+1,minZoom,maxZoom);
    render();
  });

  document.getElementById('zoomIn').addEventListener('click',function(e){
    e.stopPropagation();zoom=clamp(zoom+1,minZoom,maxZoom);render();
  });
  document.getElementById('zoomOut').addEventListener('click',function(e){
    e.stopPropagation();zoom=clamp(zoom-1,minZoom,maxZoom);render();
  });

  window.__miCiudadFlyTo=function(lat,lon,z){
    center={lat:lat,lon:lon};
    zoom=clamp(z||15,minZoom,maxZoom);
    render();
  };

  window.addEventListener('resize',render);
  render();
})();
</script>
</body>
</html>`;
  },[lugares,coord,oscuro]);

  return <WebView
    ref={webRef}
    source={{html}}
    style={s.web}
    originWhitelist={['*']}
    javaScriptEnabled
    domStorageEnabled
    cacheEnabled
    mixedContentMode="never"
    overScrollMode="never"
    bounces={false}
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
  web:{position:'absolute',top:0,right:0,bottom:0,left:0,backgroundColor:'transparent'},
});
