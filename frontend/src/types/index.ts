export type UserRole = 'COACH' | 'PLAYER' | 'MANAGER' | 'PARENT'
export type TeamRole = 'COACH' | 'PLAYER' | 'MANAGER'
export type RsvpStatus = 'YES' | 'NO' | 'MAYBE'
export type EventType = 'GAME' | 'PRACTICE' | 'MEETING' | 'SOCIAL'

export interface User {
  userId: string
  email: string
  name: string
  role: UserRole
  createdAt: string
}

export interface Team {
  teamId: string
  teamName: string
  sport: string
  season: string
  createdBy: string
  createdAt: string
}

export interface Guardian {
  guardianId: string
  playerId: string
  relation?: string
}

export interface GuardianLink {
  guardian: User
  relation?: string
}

export interface TeamMembership {
  teamId: string
  userId: string
  joinedAt: string
  jerseyNumber?: number
  teamRole: TeamRole
  parentEmail?: string
  guardianUserId?: string
  user?: User
  guardians?: GuardianLink[]
}

export interface TeamEvent {
  eventId: string
  teamId: string
  title: string
  location: string
  eventType: EventType
  startTime: string
  endTime: string
  createdBy: string
}

export interface Rsvp {
  eventId: string
  userId: string
  status: RsvpStatus
  updatedAt: string
  user?: User
}

export interface RsvpSummary {
  eventId: string
  counts: Record<RsvpStatus, number>
  total: number
  myStatus?: RsvpStatus
}

export interface Reaction {
  emoji: string
  userId: string
}

export interface Gif {
  id: string
  url: string
  previewUrl?: string
  title?: string
}

export interface TeamMessage {
  msgId: string
  teamId: string
  senderId: string
  content: string
  createdAt: string
  sender?: User
  gifUrl?: string
  imageUrl?: string
  reactions?: Reaction[]
}

export interface DirectMessage {
  msgId: string
  dmChannelId: string
  senderId: string
  recipientId: string
  content: string
  createdAt: string
  gifUrl?: string
  imageUrl?: string
  reactions?: Reaction[]
}

export interface DmThread {
  dmChannelId: string
  otherUserId: string
  otherUserName: string
  lastMessage: string
  lastMessageAt: string
}
