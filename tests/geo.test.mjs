import test from 'node:test';
import assert from 'node:assert/strict';
import {lonToWorldX,latToWorldY,worldXToLon,worldYToLat,metresPerPixel,haversine,
        viewToLatLon,latLonToView,geoDistance,pan,zoomAt,tilesFor,tileUrl,parseLatLon} from '../src/geo.js';
const near=(a,b,t)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b} (tolérance ${t})`);
const SFAX={lat:34.7406,lon:10.7603,zoom:17,url:'https://exemple/{z}/{y}/{x}',attribution:'test'};

test('Web Mercator places the origin at the centre of the world square',()=>{
  near(lonToWorldX(0,0),128,1e-9); near(latToWorldY(0,0),128,1e-9);
  near(lonToWorldX(-180,0),0,1e-9); near(lonToWorldX(180,0),256,1e-9);
  // 85,05112878° est la limite du domaine : le carré se referme exactement
  near(latToWorldY(85.05112878,0),0,1e-6); near(latToWorldY(-85.05112878,0),256,1e-6);
});

test('Projection and inverse projection round-trip',()=>{
  for(const zoom of [1,10,17,21]) for(const lon of [-179,-10,0,10.7603,179])
    near(worldXToLon(lonToWorldX(lon,zoom),zoom),lon,1e-9);
  for(const zoom of [1,10,17,21]) for(const lat of [-80,-34.74,0,34.7406,80])
    near(worldYToLat(latToWorldY(lat,zoom),zoom),lat,1e-9);
});

test('Ground resolution derives from the same sphere as the distances',()=>{
  const equateur=2*Math.PI*6371008.8/256;
  near(metresPerPixel(0,0),equateur,1e-6);
  // La résolution est divisée par deux à chaque niveau et suit le cosinus de la latitude.
  near(metresPerPixel(0,1),equateur/2,1e-6);
  near(metresPerPixel(60,0),equateur*Math.cos(Math.PI/3),1e-6);
  // Échelle annoncée et longueur calculée doivent coïncider, sans écart de rayon.
  const geo={lat:34.7406,lon:10.7603,zoom:17};
  near(geoDistance(geo,{x:300,y:220},{x:500,y:220})/200,metresPerPixel(geo.lat,geo.zoom),1e-4);
});

test('Haversine reproduces a degree of latitude and a known city pair',()=>{
  near(haversine({lat:0,lon:0},{lat:1,lon:0}),111194.93,.5);       // 2πR/360
  near(haversine({lat:0,lon:0},{lat:0,lon:1}),111194.93,.5);       // idem sur l équateur
  near(haversine({lat:48.8566,lon:2.3522},{lat:51.5074,lon:-0.1278}),343556,600); // Paris–Londres
  near(haversine({lat:34.74,lon:10.76},{lat:34.74,lon:10.76}),0,1e-9);
});

test('The centre of the viewBox carries the project position',()=>{
  const c=viewToLatLon(SFAX,400,220);
  near(c.lat,SFAX.lat,1e-9); near(c.lon,SFAX.lon,1e-9);
  const v=latLonToView(SFAX,SFAX.lat,SFAX.lon);
  near(v.x,400,1e-9); near(v.y,220,1e-9);
});

test('View and geographic coordinates round-trip',()=>{
  for(const [x,y] of [[0,0],[800,440],[137,301],[400,220]]){
    const g=viewToLatLon(SFAX,x,y),v=latLonToView(SFAX,g.lat,g.lon);
    near(v.x,x,1e-6); near(v.y,y,1e-6);
  }
});

test('Distance on screen matches the ground resolution',()=>{
  const res=metresPerPixel(SFAX.lat,SFAX.zoom);
  // 200 unités horizontales au centre : l écart relatif reste sous le millième
  near(geoDistance(SFAX,{x:300,y:220},{x:500,y:220}),200*res,200*res*1e-3);
  near(geoDistance(SFAX,{x:400,y:120},{x:400,y:320}),200*res,200*res*2e-3);
  near(geoDistance(SFAX,{x:400,y:220},{x:400,y:220}),0,1e-9);
});

test('Panning moves the centre by the requested number of pixels',()=>{
  const moved=pan(SFAX,100,0);
  near(geoDistance(SFAX,{x:400,y:220},latLonToView(SFAX,moved.lat,moved.lon)),100*metresPerPixel(SFAX.lat,SFAX.zoom),50);
  const back=pan(pan(SFAX,60,-40),-60,40);
  near(back.lat,SFAX.lat,1e-9); near(back.lon,SFAX.lon,1e-9);
});

test('Tiles cover the whole viewBox without holes and stay in range',()=>{
  const t=tilesFor(SFAX);
  assert.ok(t.length>=Math.ceil(800/256)*Math.ceil(440/256),'couverture insuffisante');
  const span=Math.pow(2,SFAX.zoom);
  t.forEach(x=>{
    assert.ok(x.x>=0&&x.x<span&&x.y>=0&&x.y<span,'indice de tuile hors domaine');
    assert.ok(x.px>-256&&x.px<800&&x.py>-256&&x.py<440,'tuile placée hors cadre');
  });
  // aux pôles, les tuiles hors domaine sont écartées au lieu d être demandées
  assert.ok(tilesFor({...SFAX,lat:85,zoom:2}).every(x=>x.y>=0));
  assert.equal(tileUrl('https://ex/{z}/{y}/{x}.png',{z:5,x:9,y:3}),'https://ex/5/3/9.png');
});

test('Coordinates are read from a pair or from a Google Maps address',()=>{
  const a=parseLatLon('34.7406, 10.7603'); near(a.lat,34.7406,1e-9); near(a.lon,10.7603,1e-9);
  near(parseLatLon('34.7406 10.7603').lat,34.7406,1e-9);
  near(parseLatLon('-34,7 ; 10,7'.replace(/,/g,'.').replace('.7 ;','.7;')).lon,10.7,1e-9);
  const g=parseLatLon('https://www.google.com/maps/@34.7406,10.7603,18z/data=!3m1');
  near(g.lat,34.7406,1e-9); near(g.zoom,18,1e-9);
  assert.equal(parseLatLon('34.74, 10.76').zoom,undefined);
  for(const bad of ['','texte sans chiffre','91.2, 10',' -200, 10','abc,def'])
    assert.throws(()=>parseLatLon(bad),undefined,`aurait dû refuser : ${bad}`);
});

test('Zooming keeps the ground point under the cursor in place',()=>{
  for(const [x,y] of [[400,220],[120,90],[700,400]]) for(const dz of [1,-1,3]){
    const cible=viewToLatLon(SFAX,x,y);
    const apres=zoomAt(SFAX,SFAX.zoom+dz,x,y);
    const v=latLonToView(apres,cible.lat,cible.lon);
    near(v.x,x,1e-6); near(v.y,y,1e-6);
    assert.equal(apres.zoom,SFAX.zoom+dz);
  }
  // zoomer au centre revient a un simple changement d echelle
  const c=zoomAt(SFAX,SFAX.zoom+2,400,220);
  near(c.lat,SFAX.lat,1e-9); near(c.lon,SFAX.lon,1e-9);
});
