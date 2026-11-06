import { decode, encode } from '@msgpack/msgpack'
import type { ShotResult } from './shot/types'
import type { ShotSlot } from './shots'
import type { Snapshot } from './netState'
import type { BotLevel } from './bot'
import type { PlayerStats } from './stats'

/** Số loại message. Thêm loại mới ở cuối, không đổi số cũ. */
export enum MsgType {
  Hello = 0,          // C→S  {name, token?}
  Welcome = 1,        // S→C  {pid, token, name, resumed}
  ListRooms = 2,      // C→S
  RoomList = 3,       // S→C  {rooms}
  CreateRoom = 4,     // C→S  {name, max, mapId, turnTime}
  JoinRoom = 5,       // C→S  {roomId}
  LeaveRoom = 6,      // C→S
  RoomState = 7,      // S→C  {room: RoomInfo | null}
  SetSeat = 8,        // C→S  {team?, mobileId?, ready?}
  StartGame = 9,      // C→S  (chủ phòng)
  Chat = 10,          // C→S  {text}
  ChatMsg = 11,       // S→C  {from, text}
  Loading = 12,       // S→C  {members: [{pid, pct, ready}]}
  LoadProgress = 13,  // C→S  {pct, ready}
  MatchStart = 14,    // S→C  {seed, mapId, turnTime, players, youId}
  Input = 15,         // C→S  {dir, angle}
  Fire = 16,          // C→S  {angle, power, slot}
  Skip = 17,          // C→S
  Snapshot = 18,      // S→C  {s: Snapshot}
  Shot = 19,          // S→C  {result: ShotResultNet}
  NeedTerrain = 20,   // C→S
  Terrain = 21,       // S→C  {w, h, rle}
  Error = 22,         // S→C  {text}
  AddBot = 23,        // C→S  {level, team}  (chủ phòng)
  RemoveBot = 24,     // C→S  {pid}          (chủ phòng)
  Stats = 25,         // S→C  {stats}        (khi hết trận)
}

export interface Msg {
  t: MsgType
  [key: string]: unknown
}

export type RoomStatus = 'lobby' | 'loading' | 'playing' | 'ended'

export interface RoomMember { pid: number; name: string; team: 0 | 1; mobileId: string; ready: boolean; connected: boolean; bot?: BotLevel }

export interface RoomInfo {
  id: string
  name: string
  hostPid: number
  max: number
  mapId: string
  turnTime: number
  status: RoomStatus
  members: RoomMember[]
}

export interface RoomSummary { id: string; name: string; players: number; max: number; status: RoomStatus; mapId: string }

export interface MatchPlayerInfo { id: number; pid: number; name: string; team: 0 | 1; mobileId: string }

/** ShotResult gửi qua mạng: bỏ `maskAfter` (client chỉ cần hash để kiểm tra). */
export type ShotResultNet = Omit<ShotResult, 'maskAfter'>

// Kiểu từng message (để hai đầu dùng chung, tránh gõ nhầm tên trường)
export interface HelloMsg { t: MsgType.Hello; name: string; token?: string }
export interface WelcomeMsg { t: MsgType.Welcome; pid: number; token: string; name: string; resumed: boolean }
export interface CreateRoomMsg { t: MsgType.CreateRoom; name: string; max: number; mapId: string; turnTime: number }
export interface JoinRoomMsg { t: MsgType.JoinRoom; roomId: string }
export interface SetSeatMsg { t: MsgType.SetSeat; team?: 0 | 1; mobileId?: string; ready?: boolean }
export interface ChatMsgOut { t: MsgType.Chat; text: string }
export interface LoadProgressMsg { t: MsgType.LoadProgress; pct: number; ready: boolean }
export interface InputMsg { t: MsgType.Input; dir: -1 | 0 | 1; angle: number }
export interface FireMsg { t: MsgType.Fire; angle: number; power: number; slot: ShotSlot }
export interface RoomListMsg { t: MsgType.RoomList; rooms: RoomSummary[] }
export interface RoomStateMsg { t: MsgType.RoomState; room: RoomInfo | null }
export interface ChatMsgIn { t: MsgType.ChatMsg; from: string; text: string }
export interface LoadingMsg { t: MsgType.Loading; members: { pid: number; pct: number; ready: boolean }[] }
export interface MatchStartMsg { t: MsgType.MatchStart; seed: number; mapId: string; turnTime: number; players: MatchPlayerInfo[]; youId: number }
export interface SnapshotMsg { t: MsgType.Snapshot; s: Snapshot }
export interface ShotMsg { t: MsgType.Shot; result: ShotResultNet }
export interface TerrainMsg { t: MsgType.Terrain; w: number; h: number; rle: Uint8Array }
export interface AddBotMsg { t: MsgType.AddBot; level: BotLevel; team: 0 | 1 }
export interface RemoveBotMsg { t: MsgType.RemoveBot; pid: number }
export interface StatsMsg { t: MsgType.Stats; stats: PlayerStats[] }
export interface ErrorMsg { t: MsgType.Error; text: string }

export function encodeMsg<T extends { t: MsgType }>(msg: T): Uint8Array {
  return encode(msg)
}

export function decodeMsg(data: Uint8Array): Msg {
  const m = decode(data) as Msg
  if (m === null || typeof m !== 'object' || typeof m.t !== 'number') throw new Error('message không hợp lệ')
  return m
}
