import type {
  DirectMessage,
  DmThread,
  Gif,
  Rsvp,
  RsvpStatus,
  RsvpSummary,
  Team,
  TeamEvent,
  TeamMembership,
  TeamMessage,
  User,
} from '../types'

export interface AuthService {
  getCurrentUser(): Promise<User | null>
  signIn(email: string): Promise<User>
  signOut(): Promise<void>
}

export interface TeamService {
  listMyTeams(): Promise<Team[]>
  getTeam(teamId: string): Promise<Team>
  createTeam(input: { teamName: string; sport: string; season: string }): Promise<Team>
  listMembers(teamId: string): Promise<TeamMembership[]>
}

export interface EventService {
  // Each event carries its aggregated RSVP summary (matches GET /teams/{id}/events).
  listEvents(teamId: string): Promise<(TeamEvent & { rsvp: RsvpSummary })[]>
  createEvent(
    teamId: string,
    input: Omit<TeamEvent, 'eventId' | 'teamId' | 'createdBy'>,
  ): Promise<TeamEvent>
}

export interface RsvpService {
  setStatus(eventId: string, status: RsvpStatus): Promise<Rsvp>
  getSummary(eventId: string): Promise<RsvpSummary>
}

export interface MessageService {
  listTeamMessages(teamId: string): Promise<TeamMessage[]>
  postTeamMessage(teamId: string, content: string, gifUrl?: string): Promise<TeamMessage>
  react(msgId: string, emoji: string): Promise<void>
}

export interface DmService {
  listInbox(): Promise<DmThread[]>
  listMessages(otherUserId: string): Promise<DirectMessage[]>
  sendMessage(otherUserId: string, content: string, gifUrl?: string): Promise<DirectMessage>
  react(msgId: string, emoji: string): Promise<void>
}

export interface GifService {
  trending(): Promise<Gif[]>
  search(query: string): Promise<Gif[]>
}

export interface AppServices {
  auth: AuthService
  teams: TeamService
  events: EventService
  rsvp: RsvpService
  messages: MessageService
  dms: DmService
  gif: GifService
}
