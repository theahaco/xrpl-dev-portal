import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const site = path.join(root,'out/devx-preview/pr-1')
const manifest = JSON.parse(await fs.readFile(path.join(site,'manifest.json'),'utf8'))
assert.equal(manifest.journeys.length,4)
assert.match(manifest.revision,/^[a-f0-9]{40}$/)
const decode = s => s.replace(/&(?:amp|lt|gt|quot|#39);/g,e=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"})[e])
function code(html,id){
  const match=html.match(new RegExp(`<code id="${id}">([\\s\\S]*?)<\\/code>`))
  assert(match,`Missing code ${id}`)
  return decode(match[1].replace(/<[^>]+>/g,''))
}
let copies=0,relativeLinks=0
for(const journey of manifest.journeys){
  const file=`${journey.id==='get-started'?'index':journey.id}.html`
  const html=await fs.readFile(path.join(site,file),'utf8')
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1])
  assert.equal(new Set(ids).size,ids.length,`${file}: duplicate HTML ids`)
  for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    const href=decode(match[1])
    if(href.startsWith('https://github.com/theahaco/xrpl-dev-portal/blob/'+manifest.revision+'/')){
      await fs.access(path.join(root,href.split('/blob/'+manifest.revision+'/')[1]))
    } else if(href.startsWith('#')){
      assert(ids.includes(href.slice(1)),`${file}: missing anchor ${href}`)
    } else if(href.startsWith('./')){
      const target=path.resolve(site,href)
      assert(target.startsWith(site),`Link escapes output: ${href}`)
      await fs.access(target)
      relativeLinks++
    }
  }
  assert(html.includes('name="robots" content="noindex,nofollow"'))
  assert.equal([...html.matchAll(/<script\b/g)].length,1,'Only the local comparison UI should execute')
  for(const side of ['before','after']){
    const source=await fs.readFile(path.join(root,journey[side].file),'utf8')
    const downloaded=await fs.readFile(path.join(site,'sources',`${journey.id}-${side}.ts.txt`),'utf8')
    assert.equal(downloaded,source,'Downloads must be exact source, not rewritten examples')
    assert.equal(createHash('sha256').update(source).digest('hex'),journey[side].sha256)
    const full=code(html,`full-${side}`)
    assert(full.includes("from 'xrpl'"),'Rendered source must preserve import quotes')
    assert(full.includes('finally'),'The full workflow must include cleanup')
    for(const step of journey.steps){
      assert(code(html,`${step}-${side}`).trim(),`${file}: empty code`)
      assert(html.includes(`data-copy="${step}-${side}"`))
      copies++
    }
  }
  if(journey.id==='get-started'){
    assert.match(code(html,'payment-before'),/satisfies Payment/)
    assert.match(code(html,'payment-before'),/tesSUCCESS/)
    const after=code(html,'payment-after')
    assert.match(after,/client\.tx\.payment/)
    assert.match(after,/\.signAndSubmit\(\)/)
    assert(!/satisfies|tesSUCCESS|typeof|TransactionType:|Account:/.test(after))
    assert.match(code(html,'query-after'),/client\.command\.accountInfo/)
  }
  if(journey.id==='send-xrp')assert(code(html,'prepare-before').includes('autofill<Payment>'),'HTML must preserve the generic, not interpret it as a tag')
}
console.log(`Verified ${manifest.journeys.length} journeys, ${copies} code/copy pairs, exact downloads and ${relativeLinks} relative links`)
