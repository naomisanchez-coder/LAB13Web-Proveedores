import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { execFileSync } from "node:child_process";
const values = existsSync('.env.local') ? parseEnv(readFileSync('.env.local','utf8')) : {};
const keys = ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET','NEXTAUTH_SECRET','DATABASE_URL','DIRECT_URL'];
const secrets = keys.map(key=>values[key]).filter(value=>value && value.length>=8);
const git = args=>execFileSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024});
const files = [...new Set((git(['ls-files'])+'\n'+git(['ls-files','--others','--exclude-standard'])).trim().split('\n').filter(Boolean))];
const history = git(['log','--all','-p','--format=']);
let failed = false;
for(const file of files){
  if(file.startsWith('.env') && file!=='.env.example') {console.error('Archivo de entorno no permitido en Git.');failed=true;}
  if(existsSync(file) && secrets.some(secret=>readFileSync(file,'utf8').includes(secret))) {console.error('Posible valor sensible en un archivo publicable: '+file);failed=true;}
}
if(secrets.some(secret=>history.includes(secret))) {console.error('Posible valor sensible en el historial Git.');failed=true;}
const historyFiles = git(['log','--all','--format=','--name-only']).split('\n');
if(historyFiles.some(file=>/(^|\/)\.env(\.|$)/.test(file) && file!=='.env.example')) {console.error('Archivo de entorno local detectado en el historial.');failed=true;}
if(failed)process.exit(1);
console.log('Sin variables locales en archivos publicables o historial; .env.example contiene placeholders. Esta revisión complementa la revisión manual.');
