import {mkdir,readFile,writeFile} from 'node:fs/promises';
const html=await readFile('dist/index.html','utf8');
const routes=['news','products','prices','smartphones','laptops','gaming','reviews','guides','compare','ai','hello','about','contact','editorial-policy','product/galaxy-a56','product/nothing-3a','product/pixel-9a','product/macbook-air-m4','article/laptop-buying-guide','article/phone-specs-explained','article/ai-on-your-laptop','article/first-pc-build','article/gaming-monitor-guide','article/macbook-air-overview','article/headphone-buying-guide','article/buying-tech-nepal'];
for(const route of routes){await mkdir('dist/'+route,{recursive:true});await writeFile('dist/'+route+'/index.html',html)}
await writeFile('dist/404.html',html);
console.log(`Prepared ${routes.length} routes and the fallback page.`);
