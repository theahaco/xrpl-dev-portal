const panels = Array.from(document.querySelectorAll('.step-panel'))
const links = Array.from(document.querySelectorAll('[data-step-link]'))
const announce = document.getElementById('announcement')
function showStep() {
  const requested = location.hash.slice(1)
  const selected = panels.find(panel => panel.id === requested) || panels.find(panel => panel.id === document.body.dataset.defaultStep) || panels[0]
  for (const panel of panels) panel.hidden = panel !== selected
  for (const link of links) {
    if (link.dataset.stepLink === selected.id) link.setAttribute('aria-current','step')
    else link.removeAttribute('aria-current')
  }
  announce.textContent = selected.querySelector('h2').textContent
}
for (const link of links) link.addEventListener('click', event => {
  event.preventDefault()
  history.pushState(null,'',link.getAttribute('href'))
  showStep()
})
window.addEventListener('popstate',showStep)
window.addEventListener('hashchange',showStep)
showStep()
const highlight = document.getElementById('highlight')
highlight.addEventListener('click', () => {
  const enabled = document.body.classList.toggle('show-changes')
  highlight.setAttribute('aria-pressed',String(enabled))
  announce.textContent = enabled ? 'Lines that differ between the excerpts are highlighted.' : 'Changed line highlights hidden.'
})
for (const button of document.querySelectorAll('[data-copy]')) button.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(document.getElementById(button.dataset.copy).textContent.trimEnd())
    button.textContent = 'Copied'
    announce.textContent = 'Code copied to clipboard.'
    setTimeout(() => {button.textContent='Copy code'},1800)
  } catch {
    button.textContent = 'Select code to copy'
    announce.textContent = 'Clipboard unavailable. Select and copy the code directly.'
  }
})
