import type { AppServices } from '../interfaces'
import type {
  DirectMessage,
  DmThread,
  RsvpStatus,
  RsvpSummary,
  Team,
  TeamEvent,
  TeamMessage,
  User,
} from '../../types'
import { createGifService } from '../gifService'
import {
  CURRENT_USER_ID,
  seedDms,
  seedEvents,
  seedGuardians,
  seedMemberships,
  seedRsvps,
  seedTeamMessages,
  seedTeams,
  seedUsers,
} from './seed'

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms))
const newId = () => (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2))
const nowIso = () => new Date().toISOString()
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const dmChannel = (a: string, b: string) => [a, b].sort().join('_')

// Mutable in-memory state, cloned so the seed stays intact across reloads.
const users = clone(seedUsers)
const teams = clone(seedTeams)
const memberships = clone(seedMemberships)
const guardians = clone(seedGuardians)
const events = clone(seedEvents)
const rsvps = clone(seedRsvps)
const teamMessages = clone(seedTeamMessages)
const dms = clone(seedDms)

const findUser = (id: string): User | undefined => users.find((u) => u.userId === id)

function summarize(eventId: string): RsvpSummary {
  const list = rsvps.filter((r) => r.eventId === eventId)
  const counts: Record<RsvpStatus, number> = { YES: 0, NO: 0, MAYBE: 0 }
  for (const r of list) counts[r.status]++
  const mine = list.find((r) => r.userId === CURRENT_USER_ID)
  return { eventId, counts, total: list.length, myStatus: mine?.status }
}

function toggleReaction(list: (TeamMessage | DirectMessage)[], msgId: string, emoji: string) {
  const msg = list.find((m) => m.msgId === msgId)
  if (!msg) return
  msg.reactions ??= []
  const mine = msg.reactions.find((r) => r.emoji === emoji && r.userId === CURRENT_USER_ID)
  if (mine) {
    msg.reactions = msg.reactions.filter((r) => r !== mine)
  } else {
    msg.reactions.push({ emoji, userId: CURRENT_USER_ID })
  }
}

export function createMockServices(): AppServices {
  const currentUser = findUser(CURRENT_USER_ID)!

  const auth: AppServices['auth'] = {
    async getCurrentUser() {
      await delay()
      return currentUser
    },
    async signIn(email) {
      await delay()
      const existing = users.find((u) => u.email === email)
      if (existing) return existing
      const user: User = {
        userId: newId(),
        email,
        name: email.split('@')[0],
        role: 'PLAYER',
        createdAt: nowIso(),
      }
      users.push(user)
      return user
    },
    async signOut() {
      await delay()
    },
  }

  const teamsSvc: AppServices['teams'] = {
    async listMyTeams() {
      await delay()
      const ids = memberships.filter((m) => m.userId === CURRENT_USER_ID).map((m) => m.teamId)
      return teams.filter((t) => ids.includes(t.teamId))
    },
    async getTeam(teamId) {
      await delay()
      const t = teams.find((x) => x.teamId === teamId)
      if (!t) throw new Error(`Team ${teamId} not found`)
      return t
    },
    async createTeam(input) {
      await delay()
      const team: Team = {
        teamId: newId(),
        teamName: input.teamName,
        sport: input.sport,
        season: input.season,
        createdBy: CURRENT_USER_ID,
        createdAt: nowIso(),
      }
      teams.push(team)
      memberships.push({ teamId: team.teamId, userId: CURRENT_USER_ID, joinedAt: nowIso(), teamRole: 'COACH' })
      return team
    },
    async listMembers(teamId) {
      await delay()
      return memberships
        .filter((m) => m.teamId === teamId)
        .map((m) => ({
          ...m,
          user: findUser(m.userId),
          guardians: guardians
            .filter((g) => g.playerId === m.userId)
            .map((g) => ({ guardian: findUser(g.guardianId)!, relation: g.relation })),
        }))
    },
  }

  const eventsSvc: AppServices['events'] = {
    async listEvents(teamId) {
      await delay()
      return events
        .filter((e) => e.teamId === teamId)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map((e) => ({ ...e, rsvp: summarize(e.eventId) }))
    },
    async createEvent(teamId, input) {
      await delay()
      const ev: TeamEvent = { ...input, eventId: newId(), teamId, createdBy: CURRENT_USER_ID }
      events.push(ev)
      return ev
    },
  }

  const rsvpSvc: AppServices['rsvp'] = {
    async setStatus(eventId, status) {
      await delay()
      let r = rsvps.find((x) => x.eventId === eventId && x.userId === CURRENT_USER_ID)
      if (r) {
        r.status = status
        r.updatedAt = nowIso()
      } else {
        r = { eventId, userId: CURRENT_USER_ID, status, updatedAt: nowIso() }
        rsvps.push(r)
      }
      return { ...r, user: findUser(r.userId) }
    },
    async getSummary(eventId) {
      await delay()
      return summarize(eventId)
    },
  }

  const messagesSvc: AppServices['messages'] = {
    async listTeamMessages(teamId) {
      await delay()
      return teamMessages
        .filter((m) => m.teamId === teamId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((m) => ({ ...m, sender: findUser(m.senderId) }))
    },
    async postTeamMessage(teamId, content, gifUrl) {
      await delay()
      const msg: TeamMessage = { msgId: newId(), teamId, senderId: CURRENT_USER_ID, content, createdAt: nowIso(), gifUrl }
      teamMessages.push(msg)
      return { ...msg, sender: findUser(msg.senderId) }
    },
    async react(msgId, emoji) {
      await delay()
      toggleReaction(teamMessages, msgId, emoji)
    },
  }

  const dmsSvc: AppServices['dms'] = {
    async listInbox() {
      await delay()
      const channels = new Set<string>()
      for (const d of dms) {
        if (d.senderId === CURRENT_USER_ID || d.recipientId === CURRENT_USER_ID) {
          channels.add(d.dmChannelId)
        }
      }
      const threads: DmThread[] = []
      for (const c of channels) {
        const msgs = dms.filter((d) => d.dmChannelId === c).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        const last = msgs[msgs.length - 1]
        const otherId = c.split('_').find((id) => id !== CURRENT_USER_ID)!
        threads.push({
          dmChannelId: c,
          otherUserId: otherId,
          otherUserName: findUser(otherId)?.name ?? otherId,
          lastMessage: last.content,
          lastMessageAt: last.createdAt,
        })
      }
      return threads.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
    },
    async listMessages(otherUserId) {
      await delay()
      const chan = dmChannel(CURRENT_USER_ID, otherUserId)
      return dms
        .filter((d) => d.dmChannelId === chan)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    },
    async sendMessage(otherUserId, content, gifUrl) {
      await delay()
      const msg: DirectMessage = {
        msgId: newId(),
        dmChannelId: dmChannel(CURRENT_USER_ID, otherUserId),
        senderId: CURRENT_USER_ID,
        recipientId: otherUserId,
        content,
        createdAt: nowIso(),
        gifUrl,
      }
      dms.push(msg)
      return msg
    },
    async react(msgId, emoji) {
      await delay()
      toggleReaction(dms, msgId, emoji)
    },
  }

  return { auth, teams: teamsSvc, events: eventsSvc, rsvp: rsvpSvc, messages: messagesSvc, dms: dmsSvc, gif: createGifService() }
}
