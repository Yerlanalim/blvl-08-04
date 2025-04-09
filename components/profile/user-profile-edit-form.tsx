'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Profile } from '@/lib/supabase/types';
import { useAuth } from '@/lib/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Loader2, Upload } from 'lucide-react';

// Схема валидации формы профиля
const profileFormSchema = z.object({
  full_name: z.string().min(2, 'Имя должно содержать не менее 2 символов').optional().nullable(),
  company: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UserProfileEditFormProps {
  userId: string;
  initialProfile: Profile | null;
}

/**
 * Компонент формы редактирования профиля пользователя
 */
export default function UserProfileEditForm({ userId, initialProfile }: UserProfileEditFormProps) {
  const { updateProfile } = useAuth();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile?.avatar_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Инициализация формы с React Hook Form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: initialProfile?.full_name || '',
      company: initialProfile?.company || '',
      position: initialProfile?.position || '',
      phone: initialProfile?.phone || '',
    },
  });

  // Обработчик отправки формы
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const result = await updateProfile({
        ...data,
        avatar_url: avatarUrl,
      });

      if (result.success) {
        toast({
          title: 'Профиль обновлен',
          description: 'Ваши данные успешно сохранены',
        });
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось обновить профиль',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при обновлении профиля',
        variant: 'destructive',
      });
    }
  };

  // Функция для загрузки аватара
  const uploadAvatar = useCallback(async (file: File) => {
    if (!userId) return;

    setIsUploading(true);
    const supabase = createBrowserSupabaseClient();

    try {
      // Генерируем уникальное имя файла
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Загружаем файл в хранилище
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Получаем публичный URL для аватара
      const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(filePath);

      // Обновляем аватар в интерфейсе
      setAvatarUrl(urlData.publicUrl);

      toast({
        title: 'Аватар обновлен',
        description: 'Изображение профиля успешно загружено',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить изображение профиля',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [userId, toast]);

  // Обработчик изменения файла
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Неподдерживаемый формат',
        description: 'Пожалуйста, загрузите изображение',
        variant: 'destructive',
      });
      return;
    }

    // Проверка размера файла (максимум 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Файл слишком большой',
        description: 'Максимальный размер файла - 2MB',
        variant: 'destructive',
      });
      return;
    }

    // Загружаем аватар
    uploadAvatar(file);
  }, [uploadAvatar, toast]);

  // Вычисляем инициалы для аватара
  const avatarFallback = initialProfile?.full_name 
    ? initialProfile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'ПЗ';

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Редактирование профиля</CardTitle>
          <CardDescription>
            Обновите ваши персональные данные и фото профиля
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Секция аватара */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl || ''} alt="Фото профиля" />
              <AvatarFallback className="text-xl">{avatarFallback}</AvatarFallback>
            </Avatar>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Загрузить фото
                  </>
                )}
              </Button>
              
              {avatarUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAvatarUrl(null)}
                  disabled={isUploading}
                >
                  Удалить фото
                </Button>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            <p className="text-xs text-muted-foreground">
              Поддерживаемые форматы: JPEG, PNG, GIF. Максимальный размер: 2MB
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Полное имя</Label>
              <Input
                id="full_name"
                placeholder="Введите ваше имя"
                {...form.register('full_name')}
              />
              {form.formState.errors.full_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.full_name.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                placeholder="Введите ваш телефон"
                {...form.register('phone')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Компания</Label>
              <Input
                id="company"
                placeholder="Введите название компании"
                {...form.register('company')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position">Должность</Label>
              <Input
                id="position"
                placeholder="Введите вашу должность"
                {...form.register('position')}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting || isUploading}
            className="flex items-center gap-2"
          >
            {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Сохранить изменения
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 