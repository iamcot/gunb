/// <reference types="vite/client" />
/** Danh mục bản đồ cho màn tạo phòng: đọc mọi `assets/maps/<id>/map.json` lúc build (server cũng tự liệt kê thư mục này). */

interface MapJson { id: string; name: string; terrain: string; backgrounds?: { file: string }[] }

export interface MapCard { id: string; name: string; thumb: string }

const metas = import.meta.glob('../../../assets/maps/*/map.json', { eager: true, import: 'default' }) as Record<string, MapJson>

/** Bản đồ test lên cuối danh sách. */
const LAST = new Set(['thu-nghiem'])

export const MAPS: MapCard[] = Object.values(metas)
  .map(m => {
    const base = `/maps/${encodeURIComponent(m.id)}/`
    const far = m.backgrounds?.[0]?.file
    const thumb = `url("${base}${m.terrain}") center bottom / 100% auto no-repeat` + (far ? `, url("${base}${far}") center / cover no-repeat` : '') + ', linear-gradient(#6FB2E8, #cfe8fb)'
    return { id: m.id, name: m.name, thumb }
  })
  .sort((a, b) => Number(LAST.has(a.id)) - Number(LAST.has(b.id)) || a.name.localeCompare(b.name, 'vi'))

export function mapCard(id: string): MapCard {
  return MAPS.find(m => m.id === id) ?? { id, name: id, thumb: 'linear-gradient(#6FB2E8, #cfe8fb)' }
}
