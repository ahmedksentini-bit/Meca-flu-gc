// Dependency-free, paginated PDF 1.4. Built-in Helvetica; text normalized to ASCII.
const ascii=s=>String(s).replace(/ρ/g,'rho').replace(/ν/g,'nu').replace(/λ/g,'lambda').replace(/Σ/g,'Somme').replace(/π/g,'pi').replace(/Δ/g,'Delta').replace(/²/g,'2').replace(/³/g,'3').replace(/⁻⁶/g,'-6').replace(/≥/g,'>=').replace(/≤/g,'<=').replace(/→/g,' -> ').replace(/œ/g,'oe').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\x20-\x7E\n]/g,' ');
const quote=s=>ascii(s).replace(/([\\()])/g,'\\$1');
export function createReport({title,sections,date=new Date().toISOString()}){
  const pages=[];let content='',y=760;
  const flush=()=>{pages.push(content);content='';y=760;};
  const line=(s,size=10)=>{if(y<65)flush();content+=`BT /F1 ${size} Tf 48 ${y} Td (${quote(s)}) Tj ET\n`;y-=size+6;};
  const wrap=(s,width=90)=>{const chunks=[];let row='';for(const word of ascii(s).split(/\s+/)){for(let i=0;i<word.length||i===0;i+=width){const token=word.slice(i,i+width);if(row.length+token.length+1>width){chunks.push(row);row='';}row+=(row?' ':'')+token;}}if(row)chunks.push(row);return chunks;};
  line('MECAFLU GC | NOTE DE CALCUL',18);wrap(title,60).forEach(t=>line(t,14));line('Edition : '+date,9);line('Calcul indicatif - verification technique requise',9);y-=12;
  for(const section of sections){if(y<120)flush();wrap(section.title,65).forEach(t=>line(t,13));for(const text of section.lines)wrap(text).forEach(t=>line(t));y-=12;}
  if(content)flush();
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];const kids=[];
  pages.forEach((page,i)=>{const pageId=objects.length+1,streamId=pageId+1;kids.push(`${pageId} 0 R`);objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`);const footer=`BT /F1 9 Tf 48 32 Td (MecaFlu GC - Page ${i+1}/${pages.length}) Tj ET\n`;const stream=page+footer;objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);});
  objects[1]=`<< /Type /Pages /Count ${pages.length} /Kids [${kids.join(' ')}] >>`;
  let pdf='%PDF-1.4\n',offsets=[0];objects.forEach((obj,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`;});const start=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(x=>String(x).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;return new TextEncoder().encode(pdf);
}
export function reportLines(value,prefix=''){
  if(value===null||value===undefined)return [];
  if(typeof value!=='object')return [`${prefix}: ${typeof value==='number'?Number(value.toPrecision(7)):value}`];
  return Object.entries(value).flatMap(([key,v])=>reportLines(v,prefix?`${prefix}.${key}`:key));
}
export function reportSections(data,result,notes){
  if(Array.isArray(data.edges)&&Array.isArray(result.sources)){
    const f=x=>Number(x.toPrecision(7));
    return [
      {title:'1. Conditions de calcul',lines:[`Projet : ${data.name}`,`Mode ${data.mode} ; rho ${data.rho} kg/m3 ; nu ${data.nu} x 10^-6 m2/s`,`Pressions de desserte : minimale ${data.pmin} m ; pleine desserte ${data.pfull} m`]},
      {title:'2. Geometrie et demandes',lines:[...data.nodes.map(x=>`${x.id} (${x.type}) : cote ${x.z} m ; ${x.type==='reservoir'?'charge imposee '+x.head+' m':'demande '+x.demand+' L/s'}`),...data.edges.flatMap(e=>[`${e.id} : ${e.from} -> ${e.to} ; ${e.type} ; ${e.closed?'fermee':'ouverte'}`,`  L ${e.length} m ; D interieur ${e.diameter} mm ; epsilon ${e.roughness} mm ; K ${e.sumK}`,...(e.type==='pump'?[e.curve?`  Courbe : ${e.curve.name} ; source : ${e.curve.source}`:`  Pompe indicative H = ${e.h0} - ${e.k} Q2, Q en L/s`,...(e.curve?e.curve.points.map(([q,h])=>`    Q ${q} L/s ; H ${h} m`):[])]:[])])]},
      {title:'3. Bilan hydraulique et controles',lines:[`Convergence : ${result.iterations} iterations ; residu nodal ${result.massResidual.toExponential(3)} L/s`,`Residu energetique ${result.energyResidual.toExponential(3)} m`,`Demande nominale ${f(result.totalDemand)} L/s ; distribue ${f(result.totalDelivered)} L/s`,...result.sources.map(x=>`Source ${x.id} : debit net fourni ${f(x.flow)} L/s`),...result.nodes.map(x=>`${x.id} : H ${f(x.H)} m ; pression ${f(x.pressure)} m ; desserte ${f(x.delivered)} L/s`),...result.edges.map(e=>`${e.id} : Q ${f(e.q)} L/s ; V ${f(e.v)} m/s ; perte ${f(e.loss)} m ; gain ${f(e.gain)} m`)]},
      {title:'4. Avertissements',lines:result.warnings.length?result.warnings:['Aucun avertissement numerique. Cela ne constitue pas une certification technique.']},
      {title:'5. Hypotheses, sources et limites',lines:notes}
    ];
  }
  return [{title:'1. Donnees (unites de l interface)',lines:reportLines(data)},{title:'2. Resultats et controles (L/s, m, mm, kg/m3, kW selon grandeur)',lines:reportLines(result)},{title:'3. Hypotheses et limites',lines:notes}];
}
export function downloadReport(title,data,result,notes){
  const bytes=createReport({title,sections:reportSections(data,result,notes)});
  const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),a=document.createElement('a');a.href=url;a.download='mecaflu-note-calcul.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
