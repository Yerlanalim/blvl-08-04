'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { type ResetPasswordData } from '@/lib/hooks/useAuth'

export default function ForgotPasswordPage() {
  const { resetPassword, isLoading } = useAuth()
  const [formData, setFormData] = useState<ResetPasswordData>({
    email: '',
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

    if (!formData.email) {
      setError('Пожалуйста, введите ваш email')
      return
    }

    const result = await resetPassword(formData)

    if (!result.success) {
      setError(result.error?.message || 'Ошибка отправки письма для сброса пароля')
      return
    }

    setSuccessMessage('Инструкции по сбросу пароля отправлены на ваш email')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Восстановление пароля</CardTitle>
          <CardDescription>
            Введите ваш email, и мы отправим вам инструкции по сбросу пароля
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || successMessage !== null}>
              {isLoading ? 'Отправка...' : 'Отправить инструкции'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Вспомнили пароль?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Вернуться ко входу
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 