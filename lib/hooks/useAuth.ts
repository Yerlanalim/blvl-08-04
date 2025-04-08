'use client'

import { useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { type AuthError, type AuthResponse } from '@supabase/supabase-js'
import { type ProfileInsert } from '@/lib/supabase/types'

export type AuthData = {
  email: string
  password: string
}

export type RegisterData = AuthData & {
  full_name?: string
  company?: string
  position?: string
}

export type ResetPasswordData = {
  email: string
}

export type UpdatePasswordData = {
  password: string
}

export type AuthState = {
  isLoading: boolean
  error: AuthError | null
}

export type AuthActionResult<T = undefined> = {
  success: boolean
  data?: T
  error?: AuthError | string | null
}

export function useAuth() {
  const { supabase, user, profile, session, isLoading: contextLoading } = useSupabase()
  const [state, setState] = useState<AuthState>({
    isLoading: false,
    error: null,
  })

  // Helper function to handle auth operations and error handling
  const handleAuthAction = async <T,>(
    action: () => Promise<AuthActionResult<T>>
  ): Promise<AuthActionResult<T>> => {
    setState({ isLoading: true, error: null })
    
    try {
      const result = await action()
      setState({ isLoading: false, error: result.error as AuthError | null })
      return result
    } catch (error) {
      const authError = error as AuthError
      setState({ isLoading: false, error: authError })
      return { success: false, error: authError }
    }
  }

  const signUp = async (data: RegisterData) => {
    return handleAuthAction(async () => {
      // Sign up the user
      const authResponse = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (authResponse.error) {
        return { success: false, error: authResponse.error }
      }

      // If we have a user, create a profile record
      if (authResponse.data.user) {
        const newProfile: ProfileInsert = {
          id: authResponse.data.user.id,
          full_name: data.full_name || null,
          company: data.company || null,
          position: data.position || null,
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(newProfile)

        if (profileError) {
          console.error('Error creating profile:', profileError)
        }
      }

      return { success: true, data: authResponse.data }
    })
  }

  const signIn = async (data: AuthData) => {
    return handleAuthAction(async () => {
      const authResponse = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authResponse.error) {
        return { success: false, error: authResponse.error }
      }
      
      return { success: true, data: authResponse.data }
    })
  }

  const signOut = async () => {
    return handleAuthAction(async () => {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return { success: false, error }
      }
      
      return { success: true }
    })
  }

  const resetPassword = async (data: ResetPasswordData) => {
    return handleAuthAction(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      
      if (error) {
        return { success: false, error }
      }
      
      return { success: true }
    })
  }

  const updatePassword = async (data: UpdatePasswordData) => {
    return handleAuthAction(async () => {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })
      
      if (error) {
        return { success: false, error }
      }
      
      return { success: true }
    })
  }

  const updateProfile = async (profileData: Partial<ProfileInsert>) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    return handleAuthAction(async () => {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
      
      if (error) {
        return { success: false, error }
      }
      
      return { success: true }
    })
  }

  return {
    user,
    profile,
    session,
    isLoading: state.isLoading || contextLoading,
    error: state.error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  }
} 