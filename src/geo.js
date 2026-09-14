// Web Mercator (EPSG:3857), tuiles de 256 px. Une unité du viewBox vaut un pixel
// de carte au zoom courant : le dessin existant reste inchangé, seule son
// interprétation devient géographique.
// EPSG:3857 pave le monde sur une sphere de rayon 6378137 m, mais les longueurs
// affichees ici sont des distances au sol : elles utilisent le rayon moyen. Le
// pavage ne depend pas du rayon (coordonnees normalisees), donc un seul rayon est
// employe pour tout ce qui est metrique — l echelle annoncee et la longueur
// calculee coincident exactement, au lieu de differer de 0,11 %.
const TILE=256, EARTH=6371008.8;
const rad=d=>d*Math.PI/180, deg=r=>r*180/Math.PI;
export const worldSize=zoom=>TILE*Math.pow(2,zoom);
export const lonToWorldX=(lon,zoom)=>(lon+180)/360*worldSize(zoom);
export function latToWorldY(lat,zoom){
  const phi=rad(Math.max(-85.05112878,Math.min(85.05112878,lat)));
  return (1-Math.log(Math.tan(phi)+1/Math.cos(phi))/Math.PI)/2*worldSize(zoom);
}
export const worldXToLon=(x,zoom)=>x/worldSize(zoom)*360-180;
export const worldYToLat=(y,zoom)=>deg(Math.atan(Math.sinh(Math.PI*(1-2*y/worldSize(zoom)))));
// Resolution au sol : elle depend de la latitude, le Mercator etirant les hautes latitudes.
export const metresPerPixel=(lat,zoom)=>2*Math.PI*EARTH*Math.cos(rad(lat))/worldSize(zoom);
// Distance orthodromique : exacte a l echelle d un reseau, independante de la projection.
export function haversine(a,b){
  const dLat=rad(b.lat-a.lat),dLon=rad(b.lon-a.lon);
  const s=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;
  return 2*EARTH*Math.asin(Math.min(1,Math.sqrt(s)));
}
// Le centre du viewBox (400, 220) porte la position geographique du projet.
const CENTRE_X=400, CENTRE_Y=220;
export function viewToLatLon(geo,x,y){
  const zoom=geo.zoom;
  return {
    lat:worldYToLat(latToWorldY(geo.lat,zoom)+(y-CENTRE_Y),zoom),
    lon:worldXToLon(lonToWorldX(geo.lon,zoom)+(x-CENTRE_X),zoom)
  };
}
export function latLonToView(geo,lat,lon){
  const zoom=geo.zoom;
  return {
    x:CENTRE_X+lonToWorldX(lon,zoom)-lonToWorldX(geo.lon,zoom),
    y:CENTRE_Y+latToWorldY(lat,zoom)-latToWorldY(geo.lat,zoom)
  };
}
export const geoDistance=(geo,a,b)=>haversine(viewToLatLon(geo,a.x,a.y),viewToLatLon(geo,b.x,b.y));
// Deplace le centre de la carte de (dx, dy) pixels ecran.
export function pan(geo,dx,dy){
  const zoom=geo.zoom;
  return {...geo,
    lat:worldYToLat(latToWorldY(geo.lat,zoom)+dy,zoom),
    lon:worldXToLon(lonToWorldX(geo.lon,zoom)+dx,zoom)};
}
export function tilesFor(geo,width=800,height=440){
  const zoom=Math.round(geo.zoom),span=Math.pow(2,zoom);
  const left=lonToWorldX(geo.lon,zoom)-CENTRE_X,top=latToWorldY(geo.lat,zoom)-CENTRE_Y;
  const tiles=[];
  for(let ty=Math.floor(top/TILE);ty<=Math.floor((top+height)/TILE);ty++){
    if(ty<0||ty>=span)continue;
    for(let tx=Math.floor(left/TILE);tx<=Math.floor((left+width)/TILE);tx++){
      tiles.push({z:zoom,x:((tx%span)+span)%span,y:ty,px:tx*TILE-left,py:ty*TILE-top,size:TILE});
    }
  }
  return tiles;
}
export const tileUrl=(template,t)=>template.replace('{z}',t.z).replace('{x}',t.x).replace('{y}',t.y);
// Accepte « 36.8065, 10.1815 », « 36.8065 10.1815 » ou une adresse Google Maps.
export function parseLatLon(text){
  const s=String(text||'').trim();
  const url=s.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?)z)?/);
  const pair=url||s.match(/(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)/);
  if(!pair)throw Error('Coordonnées non reconnues : attendu « latitude, longitude » ou une adresse Google Maps.');
  const lat=Number(pair[1]),lon=Number(pair[2]);
  if(!Number.isFinite(lat)||lat<-85.05112878||lat>85.05112878)throw Error('Latitude hors du domaine Mercator (−85,05 à 85,05).');
  if(!Number.isFinite(lon)||lon<-180||lon>180)throw Error('Longitude attendue entre −180 et 180.');
  const zoom=url&&url[3]?Math.max(1,Math.min(21,Math.round(Number(url[3])))):null;
  return zoom?{lat,lon,zoom}:{lat,lon};
}

// Fournisseur par defaut : aucune cle d API, attribution obligatoire. L utilisateur
// peut lui substituer n importe quel service de tuiles XYZ, avec sa propre source.
export const defaultTiles={
  url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution:'Imagerie : Esri, Maxar, Earthstar Geographics et la communauté SIG'
};
