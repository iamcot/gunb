export interface MapBackground {
  file: string        // đường dẫn tương đối với thư mục bản đồ
  parallax: number    // 0 = đứng yên, 1 = cuộn cùng địa hình
}

export interface SpawnZone { x1: number; x2: number }

export interface MapFile {
  id: string
  name: string
  width: number
  height: number
  terrain: string                 // PNG có alpha: alpha > 127 là đất
  backgrounds: MapBackground[]
  spawnZones: { A: SpawnZone; B: SpawnZone }
  music?: string
}
