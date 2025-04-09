import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { createServerComponentClient } from "@/lib/supabase/client";
import SettingsClient from "./settings-client";

export const metadata = {
  title: "Настройки - BizLevel",
  description: "Управление настройками профиля и приложения"
};

async function SettingsContent() {
  const supabase = createServerComponentClient();
  
  // Get user profile data
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return <SettingsClient user={user} profile={profile} />;
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground mt-2">
          Управление настройками профиля, безопасности и уведомлений
        </p>
      </div>
      
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24 ml-1" />
          <Skeleton className="h-10 w-24 ml-1" />
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <div className="space-y-4 bg-card p-6 rounded-lg border">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32 mt-4" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 