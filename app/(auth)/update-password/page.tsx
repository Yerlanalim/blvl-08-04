'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { type UpdatePasswordData } from '@/lib/hooks/useAuth'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const { updatePassword, isLoading } = useAuth()
  const [formData, setFormData] = useState<UpdatePasswordData & { confirmPassword: string }>({
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!formData.password || !formData.confirmPassword) {
      setError('Пожалуйста, заполните все поля')
      return
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    const result = await updatePassword({
      password: formData.password,
    })

    if (!result.success) {
      setError(result.error?.message || 'Ошибка обновления пароля')
      return
    }

    setSuccessMessage('Пароль успешно обновлен!')
    
    // Redirect to login after a short delay
    setTimeout(() => {
      router.push('/auth/login')
    }, 2000)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Обновление пароля</CardTitle>
          <CardDescription>
            Введите новый пароль для вашей учетной записи
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Новый пароль</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Минимум 6 символов
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || successMessage !== null}>
              {isLoading ? 'Обновление...' : 'Обновить пароль'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            После обновления пароля вы будете перенаправлены на страницу входа.
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 