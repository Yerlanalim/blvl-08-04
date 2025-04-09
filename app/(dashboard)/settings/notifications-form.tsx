"use client";

import { useState } from "react";
import { Profile } from "@/lib/supabase/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface NotificationsFormProps {
  profile: Profile | null;
}

type NotificationSettings = {
  email: {
    marketing: boolean;
    social: boolean;
    security: boolean;
    courseUpdates: boolean;
  };
  push: {
    newContent: boolean;
    completedLevels: boolean;
    achievements: boolean;
    reminders: boolean;
  };
};

export default function NotificationsForm({ profile }: NotificationsFormProps) {
  const defaultSettings: NotificationSettings = {
    email: {
      marketing: profile?.notification_settings?.email?.marketing ?? true,
      social: profile?.notification_settings?.email?.social ?? true,
      security: profile?.notification_settings?.email?.security ?? true,
      courseUpdates: profile?.notification_settings?.email?.courseUpdates ?? true,
    },
    push: {
      newContent: profile?.notification_settings?.push?.newContent ?? true,
      completedLevels: profile?.notification_settings?.push?.completedLevels ?? true,
      achievements: profile?.notification_settings?.push?.achievements ?? true,
      reminders: profile?.notification_settings?.push?.reminders ?? false,
    },
  };

  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const handleEmailChange = (key: keyof NotificationSettings["email"]) => {
    setSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: !prev.email[key],
      },
    }));
  };

  const handlePushChange = (key: keyof NotificationSettings["push"]) => {
    setSettings(prev => ({
      ...prev,
      push: {
        ...prev.push,
        [key]: !prev.push[key],
      },
    }));
  };

  const saveSettings = async () => {
    if (!profile) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_settings: settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      toast({
        title: "Настройки обновлены",
        description: "Ваши настройки уведомлений успешно сохранены.",
      });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast({
        title: "Ошибка обновления",
        description: "Не удалось обновить настройки уведомлений. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Уведомления</CardTitle>
        <CardDescription>
          Настройте способы получения уведомлений от платформы
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Email уведомления</h3>
          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="email-marketing"
                checked={settings.email.marketing}
                onCheckedChange={() => handleEmailChange("marketing")}
              />
              <Label htmlFor="email-marketing" className="font-normal">Маркетинговые уведомления о новых курсах и предложениях</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="email-social"
                checked={settings.email.social}
                onCheckedChange={() => handleEmailChange("social")}
              />
              <Label htmlFor="email-social" className="font-normal">Социальные уведомления (комментарии, отзывы)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="email-security"
                checked={settings.email.security}
                onCheckedChange={() => handleEmailChange("security")}
              />
              <Label htmlFor="email-security" className="font-normal">Уведомления безопасности (вход с нового устройства, смена пароля)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="email-updates"
                checked={settings.email.courseUpdates}
                onCheckedChange={() => handleEmailChange("courseUpdates")}
              />
              <Label htmlFor="email-updates" className="font-normal">Обновления доступных уровней и новый контент</Label>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Push уведомления</h3>
          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="push-newcontent"
                checked={settings.push.newContent}
                onCheckedChange={() => handlePushChange("newContent")}
              />
              <Label htmlFor="push-newcontent" className="font-normal">Уведомления о новом контенте</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="push-levels"
                checked={settings.push.completedLevels}
                onCheckedChange={() => handlePushChange("completedLevels")}
              />
              <Label htmlFor="push-levels" className="font-normal">Уведомления о завершенных уровнях</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="push-achievements"
                checked={settings.push.achievements}
                onCheckedChange={() => handlePushChange("achievements")}
              />
              <Label htmlFor="push-achievements" className="font-normal">Уведомления о полученных достижениях</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="push-reminders"
                checked={settings.push.reminders}
                onCheckedChange={() => handlePushChange("reminders")}
              />
              <Label htmlFor="push-reminders" className="font-normal">Напоминания о продолжении обучения</Label>
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <Button onClick={saveSettings} disabled={isLoading}>
            {isLoading ? "Сохранение..." : "Сохранить настройки"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 