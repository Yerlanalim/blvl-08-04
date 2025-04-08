'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { user, profile, signOut, isLoading } = useAuth()
  const router = useRouter()

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

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Панель управления</h1>
        <Button onClick={handleSignOut}>Выйти</Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Профиль пользователя</CardTitle>
            <CardDescription>Информация о вашей учетной записи</CardDescription>
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
                <strong>ФИО: </strong>
                <span className="text-muted-foreground">{profile?.full_name || 'Не указано'}</span>
              </div>
              <div>
                <strong>Компания: </strong>
                <span className="text-muted-foreground">{profile?.company || 'Не указано'}</span>
              </div>
              <div>
                <strong>Должность: </strong>
                <span className="text-muted-foreground">{profile?.position || 'Не указано'}</span>
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