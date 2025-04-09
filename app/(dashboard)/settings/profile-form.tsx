"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/lib/supabase/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const profileFormSchema = z.object({
  full_name: z.string().min(2, { message: "Имя должно содержать минимум 2 символа" }).optional(),
  email: z.string().email({ message: "Введите корректный email" }).optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  user: User;
  profile: Profile | null;
}

export default function ProfileForm({ user, profile }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  
  const defaultValues: Partial<ProfileFormValues> = {
    full_name: profile?.full_name || user?.user_metadata?.full_name || "",
    email: user?.email || "",
    phone: profile?.phone || "",
    company: profile?.company || "",
    job_title: profile?.job_title || "",
  };
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });
  
  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    
    try {
      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
        }
      });
      
      if (authError) throw authError;
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          company: data.company,
          job_title: data.job_title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      toast({
        title: "Профиль обновлен",
        description: "Ваши данные успешно сохранены.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Ошибка обновления",
        description: "Не удалось обновить профиль. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setIsLoading(true);
      
      const file = event.target.files?.[0];
      if (!file) return;
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Файл слишком большой",
          description: "Максимальный размер файла 2MB",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Неверный формат файла",
          description: "Загрузите изображение",
          variant: "destructive",
        });
        return;
      }
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${user.id}-${Math.random().toString(36).substring(2)}`;
      const filePath = `avatars/${fileName}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);
      
      const avatarUrl = urlData.publicUrl;
      
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);
      
      if (updateError) throw updateError;
      
      setAvatarUrl(avatarUrl);
      
      toast({
        title: "Аватар обновлен",
        description: "Ваш аватар успешно обновлен",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить аватар. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Generate initials for avatar fallback
  const getInitials = () => {
    const fullName = profile?.full_name || user?.user_metadata?.full_name || user?.email || "";
    return fullName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Профиль</CardTitle>
        <CardDescription>
          Обновите данные вашего профиля и персональную информацию
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl || undefined} alt={profile?.full_name || user?.email || ""} />
            <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Аватар</h3>
            <p className="text-sm text-muted-foreground">
              Загрузите изображение в формате JPG, PNG или GIF (макс. 2MB)
            </p>
            <Label
              htmlFor="avatar-upload"
              className="cursor-pointer inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 max-w-max"
            >
              Загрузить аватар
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarUpload}
                disabled={isLoading}
              />
            </Label>
          </div>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Имя и Фамилия</Label>
              <Input
                id="full_name"
                {...form.register("full_name")}
                placeholder="Введите ваше имя"
              />
              {form.formState.errors.full_name && (
                <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                disabled
                placeholder="Ваш email"
              />
              <p className="text-xs text-muted-foreground">
                Email нельзя изменить после регистрации
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                {...form.register("phone")}
                placeholder="Введите номер телефона"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Компания</Label>
              <Input
                id="company"
                {...form.register("company")}
                placeholder="Название компании"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="job_title">Должность</Label>
              <Input
                id="job_title"
                {...form.register("job_title")}
                placeholder="Ваша должность"
              />
            </div>
          </div>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Сохранение..." : "Сохранить изменения"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 