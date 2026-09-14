import {writeFileSync} from 'node:fs';
import {defaultMesh,solveMesh} from '../src/mesh-solver.js';
import {createReport,reportSections} from '../src/pdf-report.js';
const p=defaultMesh(),r=solveMesh(p);
writeFileSync(process.argv[2],createReport({title:p.name,date:'2026-09-13',sections:reportSections(p,r,['Regime permanent, reseau plein. Controle numerique de continuite et energie. Pas de certification physique.','Reference : https://usepa.github.io/EPANET2.2/3_network_model.html'])}));
