import {validateCurve} from './mesh-solver.js';
export const source='https://usepa.github.io/EPANET2.2/3_network_model.html';
// EPA Table 3.2: epsilon in 10^-3 ft; multiply by .3048 to obtain mm.
export const materials=[{name:'Plastique neuf',roughness:.001524},{name:'Acier neuf',roughness:.04572},{name:'Fonte neuve',roughness:.25908},{name:'Fer galvanisé neuf',roughness:.1524}];
export const fittings=[{name:'Entrée à arête vive',k:.5},{name:'Sortie',k:1},{name:'Coude grand rayon',k:.6},{name:'Vanne à opercule ouverte',k:.2},{name:'Té, passage en branche',k:1.8},{name:'Clapet battant ouvert',k:2.5}];
export function insideDiameter(outside,thickness){if(!Number.isFinite(outside)||!Number.isFinite(thickness)||outside<=0||thickness<=0||2*thickness>=outside)throw Error('Diamètre extérieur et épaisseur incohérents.');return outside-2*thickness;}
export function parsePumpCSV(text,name,source){
  const lines=text.trim().split(/\r?\n/).filter(x=>x.trim());if(lines.length>101)throw Error('Maximum 100 points.');
  const points=lines.map((line,i)=>{const cols=line.split(';').map(x=>x.trim().replace(',','.'));if(i===0&&/^q/i.test(cols[0]))return null;if(cols.length!==2||cols.some(x=>x===''))throw Error('CSV attendu : Q;H, unités L/s et m.');return cols.map(Number);}).filter(Boolean);
  return validateCurve({name,source,points});
}
export function validatePipeCatalog(x){if(!x||typeof x.name!=='string'||!x.name.trim()||x.name.length>120||typeof x.source!=='string'||!x.source.trim()||x.source.length>500||!Array.isArray(x.pipes)||!x.pipes.length||x.pipes.length>100)throw Error('Catalogue : nom, source et 1–100 sections requis.');x.pipes.forEach(p=>{if(typeof p.series!=='string'||!p.series.trim()||p.series.length>100||!Number.isFinite(p.roughness)||p.roughness<0)throw Error('Série ou rugosité incorrecte.');const d=insideDiameter(p.outside,p.thickness);if(d<1||d>20000||p.roughness>d*.05)throw Error('Section hors domaine.');});return x;}
