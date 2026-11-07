/** Âm thanh bằng Web Audio. Ưu tiên file (.ogg) nếu có: nhạc sảnh/trận chung trong `assets/audio/sounds.json`, nhạc bản đồ theo `music` của map.json,
 *  tiếng bắn/nổ từng loại đạn theo `fire`/`boom`/`bolt` trong `assets/mobiles/<id>/shots.json`. Thiếu file thì dùng âm thanh tạo bằng code (bên dưới). */

const STORE_KEY = 'gunb.mute'
const MUSIC_VOL = 0.05        // nhạc tạo bằng code
const SFX_VOL = 0.5           // tiếng tạo bằng code
const MUSIC_FILE_VOL = 0.3    // nhạc từ file ở sảnh (file đã chuẩn hoá khá to)
const BATTLE_MUSIC_VOL = 0.18 // nhạc trong trận nhỏ hơn để nghe rõ tiếng đạn
const SFX_FILE_VOL = 0.7      // tiếng từ file
const MUSIC_FADE = 0.8        // s, chuyển bài
const SAME_SFX_GAP = 0.05     // s, cùng một tiếng không phát chồng sát nhau (vd. 7 gai nổ gần như cùng lúc)
const MANIFEST_URL = '/audio/sounds.json'

/** `assets/audio/sounds.json`: tên file (trong `assets/audio/`), mục nào không có thì dùng tiếng tạo bằng code. */
interface SoundsFile { music?: { lobby?: string; battle?: string }; sfx?: { turn?: string; hit?: string } }
/** URL tiếng của một loại đạn (từ shots.json của xe). */
export interface ShotSfx { fire?: string; boom?: string; bolt?: string; beam?: string }
/** Nhạc đang cần: sảnh (menu, phòng chờ) hoặc trận (`mapUrl` = nhạc riêng của bản đồ nếu có). */
export type MusicScene = { kind: 'lobby' } | { kind: 'battle'; mapUrl: string | null }
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
  /** Tiếng đã giải mã theo URL; null = đang tải/giải mã hoặc lỗi. */
  private readonly samples = new Map<string, AudioBuffer | null>()
  /** Đã tải xong nhưng chưa có AudioContext để giải mã (trước thao tác đầu tiên). */
  private readonly pending = new Map<string, ArrayBuffer>()
  private readonly lastPlayed = new Map<string, number>()
  private manifest: SoundsFile = {}
  private scene: MusicScene = { kind: 'lobby' }
  private track: { url: string; src: AudioBufferSourceNode; gain: GainNode } | null = null
  muted = false

  constructor() {
    try { this.muted = localStorage.getItem(STORE_KEY) === '1' } catch { /* bỏ qua */ }
    void fetch(MANIFEST_URL).then(r => (r.ok ? r.json() : {}) as Promise<SoundsFile>).then(m => {
      this.manifest = m
      const urls = [m.music?.lobby, m.music?.battle, m.sfx?.turn, m.sfx?.hit]
      for (const f of urls) if (f) this.load(this.audioUrl(f))
      this.applyMusic()
    }).catch(() => { /* không có manifest: dùng tiếng tạo bằng code */ })
  }

  private audioUrl(file: string): string { return '/audio/' + file }

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
    for (const [url, data] of this.pending) this.decode(url, data)
    this.pending.clear()
    this.applyMusic()
  }

  /** Tải trước một file âm thanh (gọi nhiều lần không sao). Giải mã ngay nếu đã có AudioContext. */
  load(url: string): void {
    if (this.samples.has(url)) return
    this.samples.set(url, null)
    void fetch(url).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer() }).then(data => {
      if (this.ctx) this.decode(url, data)
      else this.pending.set(url, data)
    }).catch(() => console.warn('[audio] không tải được', url))
  }

  private decode(url: string, data: ArrayBuffer): void {
    void this.ctx!.decodeAudioData(data).then(buf => {
      this.samples.set(url, buf)
      if (this.track?.url !== url && this.musicUrl() === url) this.applyMusic()
    }).catch(() => console.warn('[audio] không giải mã được', url))
  }

  /** Phát file nếu đã sẵn sàng; trả false để nơi gọi dùng tiếng tạo bằng code. */
  private play(url: string | undefined, vol: number): boolean {
    const c = this.ctx
    if (!url || !c || !this.master) return false
    const buf = this.samples.get(url)
    if (!buf) return false
    const last = this.lastPlayed.get(url)
    if (last !== undefined && c.currentTime - last < SAME_SFX_GAP) return true
    this.lastPlayed.set(url, c.currentTime)
    const src = c.createBufferSource(), g = c.createGain()
    src.buffer = buf
    g.gain.value = vol
    src.connect(g).connect(this.master)
    src.start()
    return true
  }

  /** Đổi nhạc theo cảnh (sảnh / trận). Có file thì phát lặp file, không thì nhạc tạo bằng code. */
  setMusicScene(scene: MusicScene): void {
    this.scene = scene
    const url = this.musicUrl()
    if (url) this.load(url)
    this.applyMusic()
  }

  private musicUrl(): string | null {
    const m = this.manifest.music
    if (this.scene.kind === 'battle') return this.scene.mapUrl ?? (m?.battle ? this.audioUrl(m.battle) : null)
    return m?.lobby ? this.audioUrl(m.lobby) : null
  }

  private applyMusic(): void {
    const c = this.ctx
    if (!c || !this.master) return
    const url = this.musicUrl()
    if (url && this.track?.url === url) return
    if (!url && !this.track && this.musicOn) return
    let buf: AudioBuffer | null = null
    if (url) {
      buf = this.samples.get(url) ?? null
      if (!buf) return   // đang tải: giữ nhạc cũ, decode xong sẽ gọi lại
    }
    if (this.track) {
      const { src, gain } = this.track
      gain.gain.setValueAtTime(gain.gain.value, c.currentTime)
      gain.gain.linearRampToValueAtTime(0, c.currentTime + MUSIC_FADE)
      src.stop(c.currentTime + MUSIC_FADE + 0.05)
      this.track = null
    }
    if (!buf || !url) { this.startMusic(); return }
    this.stopMusic()
    const src = c.createBufferSource(), gain = c.createGain()
    src.buffer = buf
    src.loop = true
    gain.gain.setValueAtTime(0, c.currentTime)
    gain.gain.linearRampToValueAtTime(this.scene.kind === 'battle' ? BATTLE_MUSIC_VOL : MUSIC_FILE_VOL, c.currentTime + MUSIC_FADE)
    src.connect(gain).connect(this.master)
    src.start()
    this.track = { url, src, gain }
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

  fire(url?: string): void {
    if (this.play(url, SFX_FILE_VOL)) return
    this.tone(320, 0.22, 'sawtooth', 0.25 * SFX_VOL, 70); this.noise(0.18, 0.35 * SFX_VOL, 3000, 300)
  }
  /** `r` = bán kính vụ nổ (px): to hơn thì trầm và dài hơn (chỉ với tiếng tạo bằng code). */
  explode(r: number, url?: string): void {
    if (this.play(url, SFX_FILE_VOL)) return
    const k = Math.min(1.6, Math.max(0.6, r / 40))
    this.noise(0.5 * k, 0.8 * SFX_VOL, 2500, 120)
    this.tone(110 / k, 0.4 * k, 'sine', 0.6 * SFX_VOL, 35)
  }
  hit(): void {
    const f = this.manifest.sfx?.hit
    if (f && this.play(this.audioUrl(f), SFX_FILE_VOL)) return
    this.tone(520, 0.12, 'square', 0.18 * SFX_VOL, 180)
  }
  bolt(url?: string): void {
    if (this.play(url, SFX_FILE_VOL)) return
    this.noise(0.35, 0.7 * SFX_VOL, 9000, 400); this.tone(1400, 0.25, 'sawtooth', 0.2 * SFX_VOL, 120)
  }
  /** Tia laser vệ tinh (Cú Thiên Văn). */
  beam(url?: string): void {
    if (this.play(url, SFX_FILE_VOL)) return
    this.tone(1800, 0.45, 'sine', 0.25 * SFX_VOL, 300); this.tone(900, 0.45, 'sawtooth', 0.12 * SFX_VOL, 150); this.noise(0.3, 0.4 * SFX_VOL, 6000, 800)
  }
  turn(): void {
    const f = this.manifest.sfx?.turn
    if (f && this.play(this.audioUrl(f), SFX_FILE_VOL)) return
    this.tone(660, 0.1, 'triangle', 0.25 * SFX_VOL); this.tone(880, 0.14, 'triangle', 0.25 * SFX_VOL, 880, 0.1)
  }

  /** Nhạc tạo bằng code (dùng khi cảnh hiện tại không có file nhạc). */
  private startMusic(): void {
    if (this.musicOn || !this.ctx) return
    this.musicOn = true
    this.nextNote = this.ctx.currentTime + 0.1
    this.step = 0
    this.timer = window.setInterval(() => this.schedule(), 200)
  }

  private stopMusic(): void { this.musicOn = false; window.clearInterval(this.timer) }

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
