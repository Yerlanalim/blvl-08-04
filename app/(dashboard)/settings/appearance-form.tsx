"use client";

import { useState, useEffect } from "react";
import { Profile } from "@/lib/supabase/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useTheme } from "next-themes";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Moon, Sun, Laptop, Check } from "lucide-react";

interface AppearanceFormProps {
  profile: Profile | null;
}

type ThemeOption = "light" | "dark" | "system";

interface UISettings {
  theme: ThemeOption;
  fontSize: "small" | "default" | "large";
  reducedMotion: boolean;
}

export default function AppearanceForm({ profile }: AppearanceFormProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  
  const defaultSettings: UISettings = {
    theme: (profile?.ui_settings?.theme as ThemeOption) || "system",
    fontSize: profile?.ui_settings?.fontSize || "default",
    reducedMotion: profile?.ui_settings?.reducedMotion || false,
  };
  
  const [settings, setSettings] = useState<UISettings>(defaultSettings);
  
  // Wait until mounted to avoid hydration mismatch with theme
  useEffect(() => {
    setMounted(true);
    // Set theme from profile if available
    if (profile?.ui_settings?.theme) {
      setTheme(profile.ui_settings.theme);
    }
  }, [profile, setTheme]);
  
  const updateTheme = (newTheme: ThemeOption) => {
    setSettings(prev => ({ ...prev, theme: newTheme }));
    setTheme(newTheme);
  };
  
  const updateFontSize = (size: UISettings["fontSize"]) => {
    setSettings(prev => ({ ...prev, fontSize: size }));
  };
  
  const toggleReducedMotion = () => {
    setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };
  
  const saveSettings = async () => {
    if (!profile) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ui_settings: settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      toast({
        title: "Настройки обновлены",
        description: "Ваши настройки внешнего вида успешно сохранены.",
      });
    } catch (error) {
      console.error("Error updating UI settings:", error);
      toast({
        title: "Ошибка обновления",
        description: "Не удалось обновить настройки внешнего вида. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!mounted) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Внешний вид</CardTitle>
        <CardDescription>
          Настройте внешний вид приложения
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-3">Тема</h3>
            <div className="grid grid-cols-3 gap-4">
              <div 
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:border-primary ${settings.theme === 'light' ? 'border-primary' : 'border-border'}`}
                onClick={() => updateTheme("light")}
              >
                <Sun className="mb-3 h-6 w-6" />
                <div className="text-center">
                  <h4 className="text-sm font-medium">Светлая</h4>
                </div>
                {settings.theme === 'light' && (
                  <Check className="h-4 w-4 text-primary absolute top-2 right-2" />
                )}
              </div>
              
              <div 
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:border-primary ${settings.theme === 'dark' ? 'border-primary' : 'border-border'}`}
                onClick={() => updateTheme("dark")}
              >
                <Moon className="mb-3 h-6 w-6" />
                <div className="text-center">
                  <h4 className="text-sm font-medium">Темная</h4>
                </div>
                {settings.theme === 'dark' && (
                  <Check className="h-4 w-4 text-primary absolute top-2 right-2" />
                )}
              </div>
              
              <div 
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:border-primary ${settings.theme === 'system' ? 'border-primary' : 'border-border'}`}
                onClick={() => updateTheme("system")}
              >
                <Laptop className="mb-3 h-6 w-6" />
                <div className="text-center">
                  <h4 className="text-sm font-medium">Системная</h4>
                </div>
                {settings.theme === 'system' && (
                  <Check className="h-4 w-4 text-primary absolute top-2 right-2" />
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Размер шрифта</h3>
            <RadioGroup 
              value={settings.fontSize} 
              onValueChange={(value) => updateFontSize(value as UISettings["fontSize"])}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="font-small" value="small" />
                <Label htmlFor="font-small" className="font-normal">Уменьшенный</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="font-default" value="default" />
                <Label htmlFor="font-default" className="font-normal">Стандартный</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="font-large" value="large" />
                <Label htmlFor="font-large" className="font-normal">Увеличенный</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Доступность</h3>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="reduced-motion"
                checked={settings.reducedMotion}
                onChange={toggleReducedMotion}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="reduced-motion" className="font-normal">
                Уменьшенная анимация (для людей с вестибулярными нарушениями)
              </Label>
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