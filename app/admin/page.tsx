'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DashboardStats from '@/components/admin/dashboard-stats'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivityChart } from '@/components/admin/activity-chart'

export default function AdminDashboardPage() {
  const { profile, isLoading } = useAuth()
  const router = useRouter()
  const [statsIsLoading, setStatsIsLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && profile && profile.role !== 'admin') {
      router.push('/dashboard')
    }
    
    // Simulate data loading
    const timer = setTimeout(() => {
      setStatsIsLoading(false)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [isLoading, profile, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!profile || profile.role !== 'admin') {
    return null // Handled by router redirect
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Дашборд</h1>
        <p className="text-muted-foreground">
          Обзор основных метрик и статистики платформы
        </p>
      </div>

      {/* Statistics Cards */}
      <DashboardStats isLoading={statsIsLoading} />

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="levels">Уровни</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Активность пользователей</CardTitle>
              <CardDescription>
                Статистика активности пользователей за последние 30 дней
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityChart />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Статистика по пользователям</CardTitle>
              <CardDescription>
                Детальная информация о пользователях платформы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Раздел в разработке</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="levels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Популярность уровней</CardTitle>
              <CardDescription>
                Статистика по прохождению уровней
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Раздел в разработке</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 