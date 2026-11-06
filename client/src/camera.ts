import { clamp } from '@gunb/shared'

/** Camera 2D: (x, y) là góc trên trái của khung nhìn trong toạ độ bản đồ. */
export class Camera {
  x = 0
  y = 0
  constructor(public mapW: number, public mapH: number, public viewW: number, public viewH: number) {}

  resize(viewW: number, viewH: number): void {
    this.viewW = viewW
    this.viewH = viewH
    this.pan(0, 0)
  }

  /** Dịch camera, kẹp trong bản đồ (phía trên cho phép thấy thêm nửa màn hình bầu trời). */
  pan(dx: number, dy: number): void {
    this.x = this.mapW <= this.viewW ? (this.mapW - this.viewW) / 2 : clamp(this.x + dx, 0, this.mapW - this.viewW)
    const minY = -this.viewH / 2
    const maxY = this.mapH - this.viewH
    this.y = maxY <= minY ? maxY : clamp(this.y + dy, minY, maxY)
  }

  /** Đưa tâm khung nhìn tới (x, y) bản đồ, mượt theo hệ số k (0..1). */
  follow(x: number, y: number, k: number): void {
    this.pan((x - this.viewW / 2 - this.x) * k, (y - this.viewH / 2 - this.y) * k)
  }
}
