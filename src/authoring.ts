import { createSandboxedUiClient } from '@neo-anki/extension-sdk'
import { fromPoints, type Rect } from './geometry.js'

interface Asset { id: string; filename: string; mimeType: string; dataUrl: string; byteLength: number; hash: string; altText: string; createdAt: string; updatedAt: string }

const css = `:root{--ext-text:var(--neo-text,#282622);--ext-soft:var(--neo-text-soft,#68645e);--ext-surface:var(--neo-surface,#fff);--ext-surface-strong:var(--neo-surface-strong,#fff);--ext-muted:var(--neo-surface-muted,#f4f2ed);--ext-border:var(--neo-border,#d7d2c8);--ext-border-strong:var(--neo-border-strong,#aaa);--ext-primary:var(--neo-primary,#7866b2);--ext-primary-hover:var(--neo-primary-hover,#65549d);--ext-danger:var(--neo-danger,#a33a2d);--ext-focus:var(--neo-focus,#7866b2);color-scheme:light dark;font:var(--neo-font-size,16px)/var(--neo-line-height,1.5) var(--neo-font-family,system-ui,sans-serif)}:root[data-theme=dark]{--ext-text:var(--neo-text,#f3f0e9);--ext-soft:var(--neo-text-soft,#c8c2b8);--ext-surface:var(--neo-surface,#18202b);--ext-surface-strong:var(--neo-surface-strong,#202a38);--ext-muted:var(--neo-surface-muted,#111821);--ext-border:var(--neo-border,#455162);--ext-border-strong:var(--neo-border-strong,#718096);--ext-primary:var(--neo-primary,#a99ad8);--ext-primary-hover:var(--neo-primary-hover,#b9abe3);--ext-danger:var(--neo-danger,#ff9a8d);--ext-focus:var(--neo-focus,#b7a8e6)}*{box-sizing:border-box}body{margin:0;color:var(--ext-text);background:transparent}.panel{display:grid;gap:16px;padding:16px;border:1px solid var(--ext-border);border-radius:var(--neo-radius-md,12px);background:var(--ext-surface)}.field{display:grid;gap:6px;color:var(--ext-text);font-weight:650}.field small,.hint{margin:0;color:var(--ext-soft);font-weight:400}.upload{width:100%;min-height:44px;padding:7px;border:1px solid var(--ext-border-strong);border-radius:var(--neo-radius-sm,8px);background:var(--ext-surface-strong)}button,input{font:inherit;color:inherit}button{min-height:44px;padding:8px 12px;border:1px solid var(--ext-border-strong);border-radius:var(--neo-radius-sm,8px);background:var(--ext-surface-strong);cursor:pointer;transition:background-color .18s ease,border-color .18s ease}.secondary:hover{border-color:var(--ext-primary);background:var(--neo-primary-soft,var(--ext-muted))}.stage{position:relative;display:block;width:100%;min-height:0;padding:0;overflow:hidden;border-color:var(--ext-border);background:var(--ext-muted);touch-action:manipulation}.stage img{display:block;width:100%;height:auto}.mask{position:absolute;display:grid;place-items:center;border:2px solid white;background:color-mix(in srgb,var(--ext-primary) 88%,transparent);color:white;font-size:.75rem;line-height:1.2;text-align:center}.list{display:grid;gap:8px}.mask-row{display:grid;grid-template-columns:minmax(130px,1fr) repeat(4,minmax(58px,70px)) auto;gap:6px;padding:10px;border:1px solid var(--ext-border);border-radius:var(--neo-radius-sm,8px);background:var(--ext-muted)}.mask-row input{min-width:0;min-height:44px;padding:7px;border:1px solid var(--ext-border-strong);border-radius:var(--neo-radius-sm,8px);background:var(--ext-surface-strong)}.remove{color:var(--ext-danger)}button:focus-visible,input:focus-visible{outline:3px solid var(--ext-focus);outline-offset:2px}@media(max-width:700px){.mask-row{grid-template-columns:repeat(2,minmax(0,1fr))}.mask-row .label{grid-column:1/-1}.mask-row .remove{grid-column:1/-1}}@media(max-width:480px){.panel{padding:12px}.secondary{width:100%}}@media(prefers-reduced-motion:reduce){button{transition:none}}`

const bytesToDataUrl = (bytes: Uint8Array, mime: string) => {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 32768) binary += String.fromCharCode(...bytes.subarray(index, index + 32768))
  return `data:${mime};base64,${btoa(binary)}`
}

const hash = async (bytes: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes.slice().buffer as ArrayBuffer))).map((value) => value.toString(16).padStart(2, '0')).join('')

void createSandboxedUiClient().then((client) => {
  document.documentElement.dataset.theme = client.init.theme
  let assets: Asset[] = []
  let rects: Rect[] = []
  let start: { x: number; y: number } | null = null
  const root = document.getElementById('root')!
  const style = document.createElement('style'); style.textContent = css; document.head.append(style)
  const commit = async (selectPromptType = 'image-occlusion') => client.call('command', { commandId: 'authoring.update', payload: { assets, occlusions: rects, selectPromptType } })

  const render = () => {
    root.replaceChildren()
    const panel = document.createElement('section'); panel.className = 'panel'; panel.setAttribute('aria-label', 'Image occlusion editor')
    const uploadLabel = document.createElement('label'); uploadLabel.className = 'field'; uploadLabel.append('Image')
    const upload = document.createElement('input'); upload.className = 'upload'; upload.type = 'file'; upload.accept = 'image/*'; upload.setAttribute('aria-label', 'Choose an image')
    const uploadHelp = document.createElement('small'); uploadHelp.textContent = 'Choose an image, describe it, then add one mask for each fact you want to recall.'
    upload.onchange = async () => {
      const file = upload.files?.[0]; if (!file) return
      const bytes = new Uint8Array(await file.arrayBuffer()), digest = await hash(bytes), now = new Date().toISOString()
      const asset = { id: `asset-${digest.slice(0, 20)}`, filename: file.name, mimeType: file.type || 'application/octet-stream', dataUrl: bytesToDataUrl(bytes, file.type || 'application/octet-stream'), byteLength: bytes.length, hash: digest, altText: '', createdAt: now, updatedAt: now }
      assets = [...assets.filter((value) => value.hash !== digest), asset]
      await commit('image-occlusion'); render()
    }
    uploadLabel.append(upload, uploadHelp); panel.append(uploadLabel)

    const image = assets.find((value) => value.mimeType.startsWith('image/'))
    if (image) {
      const altLabel = document.createElement('label'); altLabel.className = 'field'; altLabel.append('Image description')
      const alt = document.createElement('input'); alt.value = image.altText; alt.placeholder = 'Describe the image for non-visual review'; alt.setAttribute('aria-label', 'Image description')
      alt.onchange = () => { image.altText = alt.value; image.updatedAt = new Date().toISOString(); void commit() }
      altLabel.append(alt); panel.append(altLabel)

      const hint = document.createElement('p'); hint.className = 'hint'; hint.setAttribute('role', 'status'); hint.textContent = start ? 'Choose the opposite corner.' : 'Choose two opposite corners to draw a mask, or press Enter to add an adjustable mask.'; panel.append(hint)
      const stage = document.createElement('button'); stage.type = 'button'; stage.className = 'stage'; stage.setAttribute('aria-label', start ? 'Choose second mask corner' : 'Image mask canvas. Press Enter to add an adjustable mask')
      const img = document.createElement('img'); img.src = image.dataUrl; img.alt = image.altText || 'Uploaded image for image occlusion'; stage.append(img)
      for (const rect of rects) {
        const mask = document.createElement('span'); mask.className = 'mask'; mask.textContent = rect.label || 'Hidden'
        Object.assign(mask.style, { left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.width}%`, height: `${rect.height}%` }); stage.append(mask)
      }
      stage.onclick = async (event) => {
        if (event.detail === 0) { rects = [...rects, { id: crypto.randomUUID(), x: 25, y: 25, width: 30, height: 20, label: `Mask ${rects.length + 1}` }]; await commit(); render(); return }
        const box = stage.getBoundingClientRect(), point = { x: (event.clientX - box.left) / box.width * 100, y: (event.clientY - box.top) / box.height * 100 }
        if (!start) { start = point; render(); return }
        rects = [...rects, fromPoints(start, point, `Mask ${rects.length + 1}`)]; start = null; await commit(); render()
      }
      panel.append(stage)

      const add = document.createElement('button'); add.type = 'button'; add.className = 'secondary'; add.textContent = 'Add mask with keyboard controls'
      add.onclick = async () => { rects = [...rects, { id: crypto.randomUUID(), x: 25, y: 25, width: 30, height: 20, label: `Mask ${rects.length + 1}` }]; await commit(); render() }
      panel.append(add)

      const list = document.createElement('div'); list.className = 'list'
      rects.forEach((rect, index) => {
        const row = document.createElement('div'); row.className = 'mask-row'
        const label = document.createElement('input'); label.className = 'label'; label.value = rect.label || ''; label.setAttribute('aria-label', `Mask ${index + 1} answer`); label.onchange = async () => { rect.label = label.value; await commit() }; row.append(label)
        for (const field of ['x', 'y', 'width', 'height'] as const) {
          const input = document.createElement('input'); input.type = 'number'; input.min = '0'; input.max = '100'; input.value = String(Math.round(rect[field])); input.setAttribute('aria-label', `Mask ${index + 1} ${field}`); input.onchange = async () => { rect[field] = Number(input.value); await commit() }; row.append(input)
        }
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove'; remove.textContent = 'Remove'; remove.setAttribute('aria-label', `Delete mask ${index + 1}`); remove.onclick = async () => { rects = rects.filter((value) => value.id !== rect.id); await commit(); render() }; row.append(remove); list.append(row)
      })
      panel.append(list)
    }
    root.append(panel)
  }

  const initial = client.init.dto as { assets?: Asset[]; occlusions?: Rect[] }
  assets = initial.assets || []; rects = initial.occlusions || []
  client.onEvent((name, payload) => { if (name !== 'dto') return; const dto = payload as typeof initial; assets = dto.assets || assets; rects = dto.occlusions || rects; render() })
  render()
})
