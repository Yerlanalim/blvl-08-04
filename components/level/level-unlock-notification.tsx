'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, Medal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface LevelUnlockNotificationProps {
  levelId: string;
  levelTitle: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function LevelUnlockNotification({
  levelId,
  levelTitle,
  isVisible,
  onClose
}: LevelUnlockNotificationProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Переход на страницу следующего уровня
  const handleNavigateToLevel = useCallback(() => {
    if (isNavigating || !levelId) return;
    
    try {
      setIsNavigating(true);
      router.push(`/level/${levelId}`);
      onClose();
    } catch (error) {
      console.error('Error navigating to next level:', error);
      setIsNavigating(false);
    }
  }, [levelId, router, onClose, isNavigating]);
  
  // Автоматически скрываем уведомление через 10 секунд
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);
  
  // Анимационные варианты для motion
  const variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-4 right-4 z-50 max-w-md w-full"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-gray-900">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-full">
                    <Medal className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <CardTitle className="text-xl">Новый уровень разблокирован!</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full" 
                  onClick={onClose}
                  aria-label="Закрыть уведомление"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Поздравляем! Вы успешно завершили уровень и разблокировали новый.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900/50">
                <p className="font-medium text-center text-amber-800 dark:text-amber-300">
                  "{levelTitle}"
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                onClick={handleNavigateToLevel}
                disabled={isNavigating}
              >
                {isNavigating ? (
                  "Переход..."
                ) : (
                  <>
                    Перейти к новому уровню
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 