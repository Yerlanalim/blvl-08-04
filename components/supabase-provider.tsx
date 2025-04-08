'use client'

import { createBrowserSupabaseClient } from '@/lib/supabase'
import { type Session, type User, type AuthError } from '@supabase/supabase-js'
import { type Database } from '@/lib/supabase/database.types'
import { createContext, useEffect, useState, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { type Profile } from '@/lib/supabase/types'

type SupabaseContextType = {
  supabase: ReturnType<typeof createBrowserSupabaseClient>
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  error: AuthError | null
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export interface SupabaseProviderProps {
  children: ReactNode
  initialSession?: Session | null
}

export function SupabaseProvider({ 
  children,
  initialSession = null
}: SupabaseProviderProps) {
  const [supabase] = useState(() => createBrowserSupabaseClient())
  const [session, setSession] = useState<Session | null>(initialSession)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    }

    const setupUser = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        setSession(currentSession)
        setUser(currentSession?.user || null)

        if (currentSession?.user) {
          const userProfile = await fetchProfile(currentSession.user.id)
          setProfile(userProfile)
        }
      } catch (error) {
        console.error('Error setting up user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    setupUser()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user || null)
        
        if (newSession?.user) {
          const userProfile = await fetchProfile(newSession.user.id)
          setProfile(userProfile)
        } else {
          setProfile(null)
        }

        // Refresh the page on sign-in/sign-out
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          router.refresh()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  return (
    <SupabaseContext.Provider 
      value={{ 
        supabase, 
        session, 
        user, 
        profile,
        isLoading,
        error
      }}
    >
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
} 