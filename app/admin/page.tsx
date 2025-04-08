'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminPage() {
  const { user, profile, signOut, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && profile && profile.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [isLoading, profile, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p className="text-lg">Загрузка...</p>
      </div>
    )
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p className="text-lg">У вас нет доступа к этой странице</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Панель администратора</h1>
        <Button onClick={handleSignOut}>Выйти</Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Административный доступ</CardTitle>
            <CardDescription>У вас есть права администратора</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <strong>ID: </strong>
                <span className="text-muted-foreground">{user?.id}</span>
              </div>
              <div>
                <strong>Email: </strong>
                <span className="text-muted-foreground">{user?.email}</span>
              </div>
              <div>
                <strong>Роль: </strong>
                <span className="text-muted-foreground">{profile?.role}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 