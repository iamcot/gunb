/** Âm thanh bằng Web Audio, tạo hoàn toàn bằng code (không có file nào cần ghi nguồn). Gồm hiệu ứng bắn/nổ/trúng/đổi lượt và nhạc nền lặp. */

const STORE_KEY = 'gunb.mute'
const MUSIC_VOL = 0.05
const SFX_VOL = 0.5
// Giai điệu: 4 hợp âm (Am F C G) × 8 nốt gam ngũ cung, tốc độ 96 bpm
const BPM = 96
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
const ARP = [0, 1, 2, 1, 2, 1, 0, 2]
const mtof = (m: number): number => 440 * Math.pow(2, (m - 69) / 12)

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noiseBuf: AudioBuffer | null = null
  private musicOn = false
  private nextNote = 0
  private step = 0
  private timer = 0
  muted = false

  constructor() {
    try { this.muted = localStorage.getItem(STORE_KEY) === '1' } catch { /* bỏ qua */ }
  }

  /** Gọi trong sự kiện click/phím đầu tiên (trình duyệt chặn âm thanh trước đó). */
  unlock(): void {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : 1
      this.master.connect(this.ctx.destination)
      const len = this.ctx.sampleRate
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const d = this.noiseBuf.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1   // chỉ để tạo tiếng ồn, không ảnh hưởng gameplay
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  setMuted(m: boolean): void {
    this.muted = m
    try { localStorage.setItem(STORE_KEY, m ? '1' : '0') } catch { /* bỏ qua */ }
    if (this.master) this.master.gain.value = m ? 0 : 1
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, freqEnd = freq, when = 0): void {
    const c = this.ctx
    if (!c || !this.master) return
    const t0 = c.currentTime + when
    const o = c.createOscillator(), g = c.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t0)
    o.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur)
    g.gain.setValueAtTime(vol, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    o.connect(g).connect(this.master)
    o.start(t0); o.stop(t0 + dur + 0.02)
  }

  private noise(dur: number, vol: number, lowpassFrom: number, lowpassTo: number): void {
    const c = this.ctx
    if (!c || !this.master || !this.noiseBuf) return
    const t0 = c.currentTime
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain()
    src.buffer = this.noiseBuf
    f.type = 'lowpass'
    f.frequency.setValueAtTime(lowpassFrom, t0)
    f.frequency.exponentialRampToValueAtTime(lowpassTo, t0 + dur)
    g.gain.setValueAtTime(vol, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    src.connect(f).connect(g).connect(this.master)
    src.start(t0); src.stop(t0 + dur)
  }

  fire(): void { this.tone(320, 0.22, 'sawtooth', 0.25 * SFX_VOL, 70); this.noise(0.18, 0.35 * SFX_VOL, 3000, 300) }
  /** `r` = bán kính vụ nổ (px): to hơn thì trầm và dài hơn. */
  explode(r: number): void {
    const k = Math.min(1.6, Math.max(0.6, r / 40))
    this.noise(0.5 * k, 0.8 * SFX_VOL, 2500, 120)
    this.tone(110 / k, 0.4 * k, 'sine', 0.6 * SFX_VOL, 35)
  }
  hit(): void { this.tone(520, 0.12, 'square', 0.18 * SFX_VOL, 180) }
  bolt(): void { this.noise(0.35, 0.7 * SFX_VOL, 9000, 400); this.tone(1400, 0.25, 'sawtooth', 0.2 * SFX_VOL, 120) }
  turn(): void { this.tone(660, 0.1, 'triangle', 0.25 * SFX_VOL); this.tone(880, 0.14, 'triangle', 0.25 * SFX_VOL, 880, 0.1) }

  startMusic(): void {
    if (this.musicOn || !this.ctx) return
    this.musicOn = true
    this.nextNote = this.ctx.currentTime + 0.1
    this.step = 0
    this.timer = window.setInterval(() => this.schedule(), 200)
  }

  stopMusic(): void { this.musicOn = false; window.clearInterval(this.timer) }

  /** Xếp lịch các nốt trong 0.6 s tới (lặp vô hạn, không cần file). */
  private schedule(): void {
    const c = this.ctx
    if (!c || !this.master) return
    const beat = 60 / BPM / 2
    while (this.nextNote < c.currentTime + 0.6) {
      const bar = Math.floor(this.step / 8) % CHORDS.length, i = this.step % 8
      const chord = CHORDS[bar]!
      const note = chord[ARP[i]!]! + 12
      const when = this.nextNote - c.currentTime
      this.tone(mtof(note), beat * 1.6, 'triangle', MUSIC_VOL, mtof(note), when)
      if (i === 0) this.tone(mtof(chord[0]! - 12), beat * 7, 'sine', MUSIC_VOL * 1.2, mtof(chord[0]! - 12), when)
      this.nextNote += beat
      this.step++
    }
  }
}

export const audio = new AudioEngine()
