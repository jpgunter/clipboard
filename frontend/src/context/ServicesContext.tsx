import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { AppServices } from '../services/interfaces'
import { createMockServices } from '../services/mock/mockServices'

const ServicesContext = createContext<AppServices | null>(null)

// mock-first: swap createMockServices() for createHttpServices() when the backend is ready.
export function ServicesProvider({ children }: { children: ReactNode }) {
  const services = useMemo<AppServices>(() => createMockServices(), [])
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
}

export function useServices(): AppServices {
  const ctx = useContext(ServicesContext)
  if (!ctx) throw new Error('useServices must be used within ServicesProvider')
  return ctx
}
