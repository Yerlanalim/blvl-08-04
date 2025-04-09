"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/lib/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "./profile-form";
import PasswordForm from "./password-form";
import NotificationsForm from "./notifications-form";
import AppearanceForm from "./appearance-form";

interface SettingsClientProps {
  user: User;
  profile: Profile | null;
}

export default function SettingsClient({ user, profile }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("profile");
  
  return (
    <Tabs 
      defaultValue="profile" 
      value={activeTab} 
      onValueChange={setActiveTab}
      className="space-y-6"
    >
      <TabsList className="grid grid-cols-4 w-full max-w-2xl">
        <TabsTrigger value="profile">Профиль</TabsTrigger>
        <TabsTrigger value="security">Безопасность</TabsTrigger>
        <TabsTrigger value="notifications">Уведомления</TabsTrigger>
        <TabsTrigger value="appearance">Внешний вид</TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile" className="space-y-4">
        <ProfileForm user={user} profile={profile} />
      </TabsContent>
      
      <TabsContent value="security" className="space-y-4">
        <PasswordForm user={user} />
      </TabsContent>
      
      <TabsContent value="notifications" className="space-y-4">
        <NotificationsForm profile={profile} />
      </TabsContent>
      
      <TabsContent value="appearance" className="space-y-4">
        <AppearanceForm profile={profile} />
      </TabsContent>
    </Tabs>
  );
} 