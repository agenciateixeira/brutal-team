'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const initialSummaryError = null

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(initialSummaryError)

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[AuthContext] Erro ao carregar perfil:', error)
        setError(error.message)
        setProfile(null)
        return null
      }

      setError(null)
      setProfile(data as Profile)
      return data as Profile
    },
    [supabase]
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('[AuthContext] Erro ao buscar sessão:', error)
      setError(error.message)
      setSession(null)
      setProfile(null)
      setLoading(false)
      return
    }

    setSession(data.session)

    if (data.session) {
      await fetchProfile(data.session.user.id)
    } else {
      setProfile(null)
    }

    setLoading(false)
  }, [fetchProfile, supabase])

  useEffect(() => {
    let active = true

    const init = async () => {
      await refresh()
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!active) return

      setSession(currentSession)
      if (currentSession) {
        fetchProfile(currentSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, refresh, supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }, [supabase])

  const value: AuthContextValue = {
    session,
    profile,
    loading,
    error,
    refresh,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
