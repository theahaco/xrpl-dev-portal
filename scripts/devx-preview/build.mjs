import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const out = path.resolve(root, process.argv[2] || 'out/devx-preview')
assert(out !== root && out.startsWith(root + path.sep), 'Output must be a subdirectory of the repository')
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const repo = 'https://github.com/theahaco/xrpl-dev-portal'
const audit = 'https://github.com/theahaco/xrpl.js/blob/aha/devx-audit-2026-09/devx-audit/'
const escape = s => s.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c])

function tidy(source, comments = false) {
  const lines = source.split('\n').filter(line => !line.trim().startsWith('// @chunk') && (comments || !line.trim().startsWith('//')))
  while (lines.length && !lines[0].trim()) lines.shift()
  while (lines.length && !lines.at(-1).trim()) lines.pop()
  const indent = Math.min(...lines.filter(x => x.trim()).map(x => x.match(/^ */)[0].length))
  return lines.map(line => line.slice(indent)).join('\n')
}
function between(source, start, end) {
  const a = source.indexOf(start)
  assert(a >= 0, `Missing start marker: ${start}`)
  const b = source.indexOf(end, a + start.length)
  assert(b > a, `Missing end marker: ${end}`)
  return tidy(source.slice(a,b))
}
function chunk(source, tag) {
  const marker = `// @chunk {"steps": ["${tag}"]}`
  return between(source, marker, '// @chunk-end')
}
function highlight(line) {
  const pattern = /(?:\/\/.*)|(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|\b(?:const|let|await|async|function|return|if|else|throw|new|try|catch|finally|import|from|export|type|satisfies|typeof|void|undefined|null)\b|\b\d+(?:_\d+)*(?:\.\d+)?\b/g
  let html = '', last = 0
  for (const match of line.matchAll(pattern)) {
    html += escape(line.slice(last, match.index))
    const token = match[0], cls = token.startsWith('//') ? 'comment' : /^["'`]/.test(token) ? 'string' : /^\d/.test(token) ? 'number' : 'keyword'
    html += `<span class="${cls}">${escape(token)}</span>`
    last = match.index + token.length
  }
  return html + escape(line.slice(last))
}
function codeBlock(code, other, id) {
  const shared = new Set(other.split('\n').map(x => x.trim()))
  return `<pre tabindex="0" aria-label="TypeScript source"><code id="${id}">${code.split('\n').map(line => `<span class="code-line${line.trim() && !shared.has(line.trim()) ? ' changed' : ''}">${highlight(line)}\n</span>`).join('')}</code></pre>`
}
const journeys = [
  { id:'get-started', label:'Getting Started', title:'Send your first test XRP', subtitle:'Connect a wallet, discover a request, send a payment and listen for ledger events.', defaultStep:'payment', before:'_code-samples/devx-before/get-started/get-acct-info.ts', after:'_code-samples/get-started/ts/get-acct-info.ts', doc:'docs/tutorials/get-started/get-started-typescript.md', steps:(b,a)=>[
    {id:'connect',label:'1. Connect',title:'Bind the signing wallet once',description:'A wallet-bound client carries the account and signer through the rest of the workflow.', before:between(b,'async function main()', '    // @chunk {"steps": ["get-account-create-wallet-tag"]}'),after:between(a,'async function main()', '    // @chunk {"steps": ["get-account-create-wallet-tag"]}'),old:'The connection and the signing wallet are managed separately.',next:'WalletClient receives a wallet when it is created.',note:'Both examples close their connection in finally. Open Full example to see setup and cleanup together.'},
    {id:'query',label:'2. Query',title:'Discover commands in the editor',description:'Choose accountInfo from client.command, then let its fields and response guide the next step.',before:chunk(b,'query-xrpl-tag'),after:chunk(a,'query-xrpl-tag'),old:'Name the command and import a request type.',next:'A named command supplies the discriminator and infers the response.',note:'The prototype exposes 45 modeled commands with inline descriptions. Explicit api_version values drive version inference; mutable client-version inference remains a known limitation.'},
    {id:'payment',label:'3. Send a payment',title:'Let the library handle the ceremony',description:'Describe the amount and destination. The client supplies the account, signs the transaction and waits for success.',before:chunk(b,'build-tx-tag'),after:chunk(a,'build-tx-tag'),old:'Repeat the transaction kind and account, validate the shape, guard metadata, then interpret a result code.',next:'The builder selects Payment. signAndSubmit returns successful confirmation or throws.',note:'This is a proposed breaking change: submitAndWait also throws on unsuccessful validated transactions. For explicit outcome handling, trySubmitAndWait and trySignAndSubmit return an ok-discriminated response/error result. Transport errors can leave the outcome unknown.'},
    {id:'events',label:'4. Listen',title:'Follow the ledger as it advances',description:'Register the handler, then subscribe to ledger updates. The event payload remains inferred.',before:chunk(b,'listen-for-events-tag'),after:chunk(a,'listen-for-events-tag'),old:'Select the subscription through a command string.',next:'Discover subscribe alongside the other command methods.',note:'Subscription failures propagate to the entrypoint, which reports the error and closes the connection.'},
  ]},
  {id:'send-xrp',label:'Send XRP',title:'Describe the payment, then send it',subtitle:'Build a typed draft and let the wallet-bound client prepare, sign and confirm it.',defaultStep:'prepare',before:'_code-samples/send-xrp/ts/send-xrp.ts',after:'_code-samples/devx-after/send-xrp.ts',doc:'docs/tutorials/payments/send-xrp.md',steps:(b,a)=>[
    {id:'prepare',label:'1. Build a payment',title:'Let the builder supply the transaction shape',description:'Choose payment from client.tx and fill in its destination and amount.',before:between(b,'  const payment =','  // Current SDK workaround'),after:between(a,'  const payment =','  // Prepare, sign locally'),old:'Repeat the transaction kind and account, then name the Payment type.',next:'The wallet supplies Account and the builder supplies TransactionType.',note:'Creating a draft sends nothing. The client is bound to its signing wallet in the full example.'},
    {id:'confirm',label:'2. Send and confirm',title:'Make successful completion the default',description:'One explicit call prepares the transaction, signs it locally and waits for successful validation.',before:between(b,'  const prepared =','\n}\n'),after:between(a,'  const confirmed =','\n}\n'),old:'Autofill, sign, submit, guard metadata and compare the protocol result.',next:'signAndSubmit returns a successful Payment response or throws.',note:'The full example retains error reporting and connection cleanup. A validated failure can still charge a ledger fee; transport errors may leave the outcome unknown.'},
  ]},
  {id:'issue-mpt',label:'Issue an MPT',title:'Create, inspect and update token metadata',subtitle:'Let the requested ledger object determine the returned type.',defaultStep:'inspect',before:'_code-samples/issue-mpt-with-metadata/ts/issue-mpt-with-metadata.ts',after:'_code-samples/devx-after/issue-mpt-with-metadata.ts',doc:'docs/tutorials/tokens/mpts/issue-a-multi-purpose-token.md',steps:(b,a)=>[
    {id:'create',label:'1. Create the issuance',title:'Separate library checks from domain checks',description:'The SDK owns transaction success. The application still verifies that the issuance ID is present.',before:between(b,'  const issuance =','  // Query and decode metadata'),after:between(a,'  const created =','  // Query and decode metadata'),old:'Check the metadata representation and success code before reading the issuance ID.',next:'The issuance builder supplies the transaction type and account, and returns parsed metadata on success.',note:'A typed issuance object already preserves its metadata type on 5.3.0. This example does not claim otherwise.'},
    {id:'inspect',label:'2. Inspect metadata',title:'The selector should describe the answer',description:'An mpt_issuance lookup should expose MPTokenIssuance fields, without another ledger-kind check.',before:between(b,'  const entry =','  // Update mutable properties'),after:between(a,'  const entry =','  // Update mutable properties'),old:'The response is a broad union; narrow the ledger-entry kind again.',next:'The selector infers the MPT object. Optional metadata stays optional.',note:'Literal selectors narrow results. Broad, ambiguous or binary requests retain safe alternatives.'},
    {id:'update',label:'3. Confirm the update',title:'Keep only the checks the domain needs',description:'Await the update, query the issuance again and decode the returned metadata.',before:between(b,'  const updatedMetadata =','\n}\n'),after:between(a,'  await client.tx.mpTokenIssuanceSet','\n}\n'),old:'Guard the update result, check its code and narrow the confirmation object.',next:'A named builder submits the update; a named command infers the confirmation object.',note:'This workflow needs the relevant MPT amendments, including DynamicMPT for mutable metadata. The audit used an isolated ledger with the required configuration.'},
  ]},
  {id:'create-amm',label:'Create an AMM',title:'Make each setup transaction count',subtitle:'Configure an issuer, establish a trust line and create a trading pool.',defaultStep:'setup',before:'_code-samples/create-amm/ts/create-amm-guided.ts',after:'_code-samples/devx-after/create-amm.ts',doc:'docs/tutorials/defi/dex/create-an-automated-market-maker.md',steps:(b,a)=>[
    {id:'setup',label:'1. Configure the issuer',title:'Await success at every setup step',description:'Each step should finish successfully before the next transaction is submitted.',before:between(b,'function requireSuccess(', '\nfunction describeAmount')+'\n\n'+between(b,'  const configureIssuer =','  // Give the provider'),after:between(a,'  await issuer.tx.accountSet','  // Give the provider'),old:'Create a result-checking helper and remember to call it after every transaction.',next:'The wallet-bound accountSet builder checks the fields and waits for success.',note:'The full example binds one client to the issuer wallet and another to the liquidity provider. Every setup transaction uses the appropriate client and signing wallet.'},
    {id:'pool',label:'2. Create the pool',title:'Preserve the real protocol requirements',description:'The amount shapes and reserve-based AMM creation fee still need to be specified.',before:between(b,'  const server =','  // Query the AMM'),after:between(a,'  const server =','  // Query the AMM'),old:'Construct the transaction and explicitly check the returned result.',next:'ammCreate supplies the account and transaction kind; signAndSubmit waits for success.',note:'The unavailable validated-ledger check remains because the server may genuinely have no validated ledger yet.'},
  ]},
]

const css = await fs.readFile(path.join(here,'style.css'),'utf8')
const js = await fs.readFile(path.join(here,'app.js'),'utf8')
await fs.mkdir(path.join(out,'pr-1','sources'),{recursive:true})
await fs.writeFile(path.join(out,'.nojekyll'),'')
await fs.writeFile(path.join(out,'robots.txt'),'User-agent: *\nDisallow: /\n')
await fs.writeFile(path.join(out,'index.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=./pr-1/"><title>xrpl.js DevX preview</title><a href="./pr-1/">Open the before and after preview</a></html>')
await fs.writeFile(path.join(out,'pr-1','style.css'),css)
await fs.writeFile(path.join(out,'pr-1','app.js'),js)
const manifest={revision,repository:repo,generatedAt:new Date().toISOString(),journeys:[]}
for(const j of journeys){
  const before=await fs.readFile(path.join(root,j.before),'utf8'),after=await fs.readFile(path.join(root,j.after),'utf8')
  // Fail rather than silently publishing an incomplete comparison if source markers move.
  const steps=j.steps(before,after)
  steps.push({id:'full',label:'Full example',title:'Read the complete workflow',description:'The full source includes imports, account funding, error handling and connection cleanup.',before:tidy(before,true),after:tidy(after,true),old:'Revised example compatible with published xrpl 5.3.0.',next:'Matching workflow using the unreleased aha SDK prototype.',note:'This page displays source code; it does not execute examples or connect a wallet. Setup instructions are linked below. MPT and AMM require the relevant network amendments.'})
  for(const step of steps)assert(step.before.trim() && step.after.trim(),`${j.id}/${step.id}: empty excerpt`)
  const sourceLink=side=>`${repo}/blob/${revision}/${j[side]}`
  for(const side of ['before','after'])await fs.writeFile(path.join(out,'pr-1','sources',`${j.id}-${side}.ts.txt`),side==='before'?before:after)
  const panels=steps.map(step=>`<section class="step-panel" id="${step.id}" aria-labelledby="title-${step.id}">
  <div class="step-intro"><span class="eyebrow">${escape(j.label)}</span><h2 id="title-${step.id}">${escape(step.title)}</h2><p>${escape(step.description)}</p></div>
  <div class="comparison">${['before','after'].map(side=>`<article class="code-card ${side}"><header class="card-heading"><div><span class="version-label">${side==='before'?'Before':'After'}</span><h3>${side==='before'?'Published xrpl 5.3.0':'aha SDK prototype'}</h3></div><button type="button" class="copy" data-copy="${step.id}-${side}" aria-label="Copy ${side} ${escape(step.label)} code">Copy code</button></header><p class="card-summary">${escape(side==='before'?step.old:step.next)}</p>${codeBlock(step[side],step[side==='before'?'after':'before'],`${step.id}-${side}`)}<footer class="card-footer"><a href="${sourceLink(side)}">View source ↗</a><a href="./sources/${j.id}-${side}.ts.txt" download="${j.id}-${side}.ts">Download full example ↓</a></footer></article>`).join('')}</div>
  <aside class="context"><strong>What to keep in mind</strong><p>${escape(step.note)}</p></aside></section>`).join('\n')
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="Compare the published xrpl.js developer workflow with the unreleased aha prototype."><title>${escape(j.label)} · xrpl.js before and after</title><link rel="stylesheet" href="./style.css"><script defer src="./app.js"></script></head><body class="show-changes" data-default-step="${j.defaultStep}"><a class="skip" href="#comparison">Skip to comparison</a>
  <header class="site-header"><a class="brand" href="./"><span class="aha">aha<span class="brand-dot">.</span></span><span>Developer experience review</span></a><nav aria-label="Review links"><a href="${repo}/pull/1">Docs PR ↗</a><a href="https://github.com/theahaco/xrpl.js/pull/57">SDK PR ↗</a></nav></header>
  <main><div class="hero"><div><p class="eyebrow">XRPL.JS / DEVELOPER JOURNEYS</p><h1>Before &amp; after.</h1><p class="lead">The same task. A library that guides more of the work.</p></div><div class="preview-label"><span class="status-dot"></span> PR #1 preview<br><small>Proposed API · not an npm release</small></div></div>
  <nav class="journeys" aria-label="Example journeys">${journeys.map((x,i)=>`<a href="./${x.id==='get-started'?'index':x.id}.html"${x.id===j.id?' aria-current="page"':''}><span>0${i+1}</span>${escape(x.label)}</a>`).join('')}</nav>
  <div class="journey-heading"><div><h2>${escape(j.title)}</h2><p>${escape(j.subtitle)}</p></div><button type="button" id="highlight" aria-pressed="true">Highlight changed lines</button></div>
  <p class="basis">Before: revised examples for published xrpl 5.3.0. After: the unreleased aha fork. <a href="${audit}evidence/prototype-example-diffs.md">About this comparison ↗</a></p>
  <div id="comparison"><nav class="steps" aria-label="Workflow steps">${steps.map(s=>`<a href="#${s.id}" data-step-link="${s.id}">${escape(s.label)}</a>`).join('')}</nav>${panels}</div>
  <section class="read-more"><div><h2>Explore the proposal</h2><p>Review the source tutorial, the audit findings and the release considerations behind these examples.</p></div><div><a href="${repo}/blob/${revision}/${j.doc}">Source tutorial ↗</a><a href="${repo}/blob/${revision}/_code-samples/devx-after/README.md">Run the prototype ↗</a><a href="${audit}output/report.md">Read the audit ↗</a></div></section>
  </main><footer class="site-footer"><span>aha company · Prepared for Ripple DevRel</span><span>Source <a href="${repo}/commit/${revision}">${revision.slice(0,7)}</a> · <a href="./manifest.json">Preview provenance</a></span></footer><p id="announcement" class="sr-only" role="status" aria-live="polite"></p></body></html>`
  await fs.writeFile(path.join(out,'pr-1',`${j.id==='get-started'?'index':j.id}.html`),html)
  manifest.journeys.push({id:j.id,steps:steps.map(s=>s.id),before:{file:j.before,sha256:createHash('sha256').update(before).digest('hex')},after:{file:j.after,sha256:createHash('sha256').update(after).digest('hex')}})
}
await fs.writeFile(path.join(out,'pr-1','manifest.json'),JSON.stringify(manifest,null,2)+'\n')
console.log(`Built ${journeys.length} source-backed comparisons, ${manifest.journeys.reduce((n,j)=>n+j.steps.length,0)} steps, at ${out}`)
