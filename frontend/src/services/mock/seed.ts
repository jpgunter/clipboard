import type {
  DirectMessage,
  Guardian,
  Rsvp,
  Team,
  TeamEvent,
  TeamMembership,
  TeamMessage,
  User,
} from '../../types'

// The signed-in user for the mock layer.
export const CURRENT_USER_ID = 'u1'

export const seedUsers: User[] = [
  { userId: 'u1', email: 'alex@team.app', name: 'Alex Rivera', role: 'COACH', createdAt: '2026-08-01T10:00:00.000Z' },
  { userId: 'u2', email: 'sam@team.app', name: 'Sam Chen', role: 'PLAYER', createdAt: '2026-08-02T10:00:00.000Z' },
  { userId: 'u3', email: 'jordan@team.app', name: 'Jordan Park', role: 'PLAYER', createdAt: '2026-08-03T10:00:00.000Z' },
  { userId: 'u4', email: 'casey@team.app', name: 'Casey Morgan', role: 'MANAGER', createdAt: '2026-08-04T10:00:00.000Z' },
  { userId: 'u5', email: 'maria@team.app', name: 'Maria Chen', role: 'PARENT', createdAt: '2026-08-05T10:00:00.000Z' },
  { userId: 'u6', email: 'david@team.app', name: 'David Chen', role: 'PARENT', createdAt: '2026-08-06T10:00:00.000Z' },
  { userId: 'u7', email: 'riley@team.app', name: 'Riley Park', role: 'PARENT', createdAt: '2026-08-07T10:00:00.000Z' },
]

export const seedTeams: Team[] = [
  { teamId: 't1', teamName: 'Riverside Raptors', sport: 'Soccer', season: 'Fall 2026', createdBy: 'u1', createdAt: '2026-08-10T10:00:00.000Z' },
  { teamId: 't2', teamName: 'Hilltop Hawks', sport: 'Basketball', season: 'Winter 2026', createdBy: 'u1', createdAt: '2026-09-01T10:00:00.000Z' },
]

export const seedMemberships: TeamMembership[] = [
  { teamId: 't1', userId: 'u1', joinedAt: '2026-08-10T10:00:00.000Z', teamRole: 'COACH' },
  { teamId: 't1', userId: 'u2', joinedAt: '2026-08-11T10:00:00.000Z', teamRole: 'PLAYER', jerseyNumber: 10 },
  { teamId: 't1', userId: 'u3', joinedAt: '2026-08-12T10:00:00.000Z', teamRole: 'PLAYER', jerseyNumber: 7 },
  { teamId: 't1', userId: 'u4', joinedAt: '2026-08-13T10:00:00.000Z', teamRole: 'MANAGER' },
  { teamId: 't2', userId: 'u1', joinedAt: '2026-09-01T10:00:00.000Z', teamRole: 'COACH' },
  { teamId: 't2', userId: 'u2', joinedAt: '2026-09-02T10:00:00.000Z', teamRole: 'PLAYER', jerseyNumber: 23 },
]

// Links a parent/guardian user to a player user.
export const seedGuardians: Guardian[] = [
  { guardianId: 'u5', playerId: 'u2', relation: 'Mother' },
  { guardianId: 'u6', playerId: 'u2', relation: 'Father' },
  { guardianId: 'u7', playerId: 'u3', relation: 'Guardian' },
]

export const seedEvents: TeamEvent[] = [
  { eventId: 'e1', teamId: 't1', title: 'Practice - Drills', location: 'Riverside Field 3', eventType: 'PRACTICE', startTime: '2026-11-06T17:00:00.000Z', endTime: '2026-11-06T18:30:00.000Z', createdBy: 'u1' },
  { eventId: 'e2', teamId: 't1', title: 'vs. Eastside Eagles', location: 'Riverside Stadium', eventType: 'GAME', startTime: '2026-11-09T15:00:00.000Z', endTime: '2026-11-09T17:00:00.000Z', createdBy: 'u1' },
  { eventId: 'e3', teamId: 't1', title: 'Team Bonding Dinner', location: "Tony's Pizzeria", eventType: 'SOCIAL', startTime: '2026-11-15T19:00:00.000Z', endTime: '2026-11-15T21:00:00.000Z', createdBy: 'u1' },
  { eventId: 'e4', teamId: 't2', title: 'Scrimmage', location: 'Hilltop Gym', eventType: 'PRACTICE', startTime: '2026-11-08T18:00:00.000Z', endTime: '2026-11-08T19:30:00.000Z', createdBy: 'u1' },
]

export const seedRsvps: Rsvp[] = [
  { eventId: 'e1', userId: 'u1', status: 'YES', updatedAt: '2026-11-01T10:00:00.000Z' },
  { eventId: 'e1', userId: 'u2', status: 'YES', updatedAt: '2026-11-01T11:00:00.000Z' },
  { eventId: 'e2', userId: 'u1', status: 'YES', updatedAt: '2026-11-02T10:00:00.000Z' },
  { eventId: 'e2', userId: 'u2', status: 'YES', updatedAt: '2026-11-02T11:00:00.000Z' },
  { eventId: 'e2', userId: 'u3', status: 'MAYBE', updatedAt: '2026-11-02T12:00:00.000Z' },
  { eventId: 'e2', userId: 'u4', status: 'NO', updatedAt: '2026-11-02T13:00:00.000Z' },
]

export const seedTeamMessages: TeamMessage[] = [
  { msgId: 'm1', teamId: 't1', senderId: 'u1', content: 'Reminder: bring cleats to Friday practice.', createdAt: '2026-11-04T14:00:00.000Z', reactions: [{ emoji: '👍', userId: 'u2' }] },
  { msgId: 'm2', teamId: 't1', senderId: 'u2', content: 'Got it, coach!', createdAt: '2026-11-04T14:05:00.000Z', reactions: [{ emoji: '👍', userId: 'u1' }, { emoji: '👍', userId: 'u3' }, { emoji: '❤️', userId: 'u2' }] },
  { msgId: 'm3', teamId: 't1', senderId: 'u3', content: 'Can someone give me a ride?', createdAt: '2026-11-04T14:10:00.000Z' },
]

// DM channel id = lexicographically sorted "min_max" of the two user ids.
export const seedDms: DirectMessage[] = [
  { msgId: 'dm1', dmChannelId: 'u1_u2', senderId: 'u1', recipientId: 'u2', content: "You're starting on Sunday.", createdAt: '2026-11-03T09:00:00.000Z' },
  { msgId: 'dm2', dmChannelId: 'u1_u2', senderId: 'u2', recipientId: 'u1', content: "Thanks coach, I'll be ready.", createdAt: '2026-11-03T09:05:00.000Z' },
  { msgId: 'dm3', dmChannelId: 'u1_u3', senderId: 'u3', recipientId: 'u1', content: 'Am I on the roster this week?', createdAt: '2026-11-03T16:00:00.000Z' },
]
