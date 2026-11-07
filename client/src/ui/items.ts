import { ITEM_IDS, ITEM_SLOTS, TUNING, isItemId, type ItemId } from '@gunb/shared'

/** Ký hiệu dự phòng khi chưa có ảnh `assets/ui/items/<id>.png` (prompt: plan/16-prompt-item.md). */
const GLYPH: Record<ItemId, string> = { dual: '×2', heal: '✚', teleport: '🌀', windShield: '🍃', fastTurn: '⏩' }
const ITEMS_KEY = 'gunb.items'

const esc = (s: string): string => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

/** Icon item: ảnh `assets/ui/items/<id>.png` (tải xong thì ẩn ký hiệu chữ bên dưới); ảnh lỗi thì tự gỡ, lộ ký hiệu chữ. */
export function itemIconHtml(id: ItemId): string {
  return `<span class="it-ico it-${id}"><b>${GLYPH[id]}</b><img src="/ui/items/${id}.png" alt="" onload="this.previousElementSibling.style.visibility='hidden'" onerror="this.remove()"></span>`
}

/** Dòng mô tả (tooltip): tên, công dụng, delay. */
export function itemTitle(id: ItemId): string {
  const d = TUNING.items[id]
  return `${d.name}: ${d.desc} (delay ${d.delay > 0 ? '+' : ''}${d.delay})`
}

export function loadSavedItems(): ItemId[] {
  try {
    const v = JSON.parse(localStorage.getItem(ITEMS_KEY) ?? '[]') as unknown
    return Array.isArray(v) ? v.filter(isItemId).slice(0, ITEM_SLOTS) : []
  } catch { return [] }
}

export function saveItems(items: readonly ItemId[]): void {
  try { localStorage.setItem(ITEMS_KEY, JSON.stringify(items)) } catch { /* bỏ qua */ }
}

/**
 * Ô chọn item trong phòng chờ: hàng ITEM_SLOTS ô đang mang (bấm để bỏ) + danh sách item (bấm để thêm vào ô trống đầu tiên, được trùng).
 * `onChange` nhận danh sách mới; người gọi gửi lên server.
 */
export function itemPickerHtml(items: readonly ItemId[], canPick: boolean): string {
  const slots = Array.from({ length: ITEM_SLOTS }, (_, k) => {
    const id = items[k]
    return id
      ? `<button class="gs-islot on" data-islot="${k}" title="${esc(itemTitle(id))} — bấm để bỏ"${canPick ? '' : ' disabled'}>${itemIconHtml(id)}<small>F${k + 1}</small></button>`
      : `<div class="gs-islot"><small>F${k + 1}</small></div>`
  }).join('')
  const full = items.length >= ITEM_SLOTS
  const list = ITEM_IDS.map(id => {
    const d = TUNING.items[id]
    return `<button class="gs-item" data-item="${id}" title="${esc(itemTitle(id))}"${canPick && !full ? '' : ' disabled'}>${itemIconHtml(id)}
      <span class="tx"><b>${esc(d.name)}</b><small>${esc(d.desc)}</small></span><span class="dl">${d.delay > 0 ? '+' : ''}${d.delay}</span></button>`
  }).join('')
  return `<div class="gs-ipick"><div class="gs-islots">${slots}</div><div class="gs-items">${list}</div></div>`
}

export function bindItemPicker(root: HTMLElement, items: readonly ItemId[], onChange: (items: ItemId[]) => void): void {
  root.querySelectorAll<HTMLButtonElement>('[data-islot]').forEach(b => b.addEventListener('click', () => {
    const next = items.slice()
    next.splice(Number(b.dataset.islot), 1)
    onChange(next)
  }))
  root.querySelectorAll<HTMLButtonElement>('[data-item]').forEach(b => b.addEventListener('click', () => {
    if (items.length >= ITEM_SLOTS || !isItemId(b.dataset.item)) return
    onChange([...items, b.dataset.item])
  }))
}
