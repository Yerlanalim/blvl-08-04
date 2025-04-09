"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: "Пароль должен содержать минимум 6 символов" }),
  newPassword: z.string().min(8, { message: "Новый пароль должен содержать минимум 8 символов" })
    .regex(/[a-z]/, { message: "Пароль должен содержать хотя бы одну строчную букву" })
    .regex(/[A-Z]/, { message: "Пароль должен содержать хотя бы одну заглавную букву" })
    .regex(/[0-9]/, { message: "Пароль должен содержать хотя бы одну цифру" }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "Новый пароль должен отличаться от текущего",
  path: ["newPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

interface PasswordFormProps {
  user: User;
}

export default function PasswordForm({ user }: PasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  async function onSubmit(data: PasswordFormValues) {
    setIsLoading(true);
    
    try {
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      
      if (error) throw error;
      
      toast({
        title: "Пароль обновлен",
        description: "Ваш пароль успешно изменен.",
      });
      
      // Reset form
      form.reset();
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Ошибка обновления пароля",
        description: "Не удалось обновить пароль. Пожалуйста, проверьте текущий пароль и попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Безопасность</CardTitle>
        <CardDescription>
          Изменение пароля для защиты вашего аккаунта
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Текущий пароль</Label>
            <Input
              id="currentPassword"
              type="password"
              {...form.register("currentPassword")}
              placeholder="Введите текущий пароль"
            />
            {form.formState.errors.currentPassword && (
              <p className="text-sm text-destructive">{form.formState.errors.currentPassword.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">Новый пароль</Label>
            <Input
              id="newPassword"
              type="password"
              {...form.register("newPassword")}
              placeholder="Введите новый пароль"
            />
            {form.formState.errors.newPassword && (
              <p className="text-sm text-destructive">{form.formState.errors.newPassword.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Подтверждение пароля</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...form.register("confirmPassword")}
              placeholder="Повторите новый пароль"
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          
          <div className="pt-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Обновление..." : "Обновить пароль"}
            </Button>
          </div>
        </form>
        
        <div className="mt-4 pt-4 border-t">
          <h3 className="text-sm font-medium mb-2">Рекомендации по созданию надежного пароля</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
            <li>Используйте минимум 8 символов</li>
            <li>Комбинируйте строчные и заглавные буквы</li>
            <li>Добавляйте цифры и специальные символы</li>
            <li>Избегайте последовательностей (123, abc) и повторений</li>
            <li>Не используйте личную информацию (имя, дату рождения)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 