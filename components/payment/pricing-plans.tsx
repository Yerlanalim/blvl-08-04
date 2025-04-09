'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/use-toast';

// Типы тарифов
const BILLING_PLANS = [
  {
    name: 'Базовый',
    id: 'basic',
    description: 'Доступ к базовым уровням обучения',
    price: {
      monthly: '1990',
      yearly: '19900',
    },
    features: [
      'Доступ к 5 базовым уровням',
      'Базовые учебные материалы',
      'Доступ к сообществу',
      'Email поддержка',
    ],
    priceId: {
      monthly: 'price_basic_monthly',
      yearly: 'price_basic_yearly',
    },
  },
  {
    name: 'Продвинутый',
    id: 'pro',
    description: 'Идеально для продолжающих обучение',
    price: {
      monthly: '3990',
      yearly: '39900',
    },
    features: [
      'Доступ ко всем уровням',
      'Расширенные учебные материалы',
      'Приоритетная поддержка',
      'Сертификат по окончании',
      'Доступ к закрытым вебинарам',
    ],
    priceId: {
      monthly: 'price_pro_monthly',
      yearly: 'price_pro_yearly',
    },
    popular: true,
  },
  {
    name: 'Бизнес',
    id: 'business',
    description: 'Для корпоративных клиентов',
    price: {
      monthly: '9990',
      yearly: '99900',
    },
    features: [
      'Все возможности Продвинутого тарифа',
      'До 5 пользователей',
      'Корпоративный доступ',
      'Персональный менеджер',
      'Индивидуальные консультации',
      'Персонализация материалов',
    ],
    priceId: {
      monthly: 'price_business_monthly',
      yearly: 'price_business_yearly',
    },
  },
];

export default function PricingPlans() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const router = useRouter();
  const { toast } = useToast();
  
  const createCheckoutSession = async (priceId: string) => {
    setIsLoading(priceId);
    
    try {
      const response = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment`,
        }),
      });
      
      const { url, error } = await response.json();
      
      if (error) {
        toast({
          title: 'Ошибка',
          description: error,
          variant: 'destructive',
        });
        return;
      }
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать сессию оплаты. Пожалуйста, попробуйте позже.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  };
  
  return (
    <div className="flex flex-col items-center space-y-8">
      <Tabs
        defaultValue="monthly"
        className="w-full"
        onValueChange={(value) => setBillingInterval(value as 'monthly' | 'yearly')}
      >
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="monthly">Ежемесячно</TabsTrigger>
            <TabsTrigger value="yearly">Ежегодно (скидка 15%)</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="monthly" className="mt-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {BILLING_PLANS.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                billingInterval={billingInterval}
                isLoading={isLoading === plan.priceId[billingInterval]}
                onSelectPlan={() => createCheckoutSession(plan.priceId[billingInterval])}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="yearly" className="mt-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {BILLING_PLANS.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                billingInterval={billingInterval}
                isLoading={isLoading === plan.priceId[billingInterval]}
                onSelectPlan={() => createCheckoutSession(plan.priceId[billingInterval])}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>Все цены указаны в рублях и включают НДС.</p>
        <p className="mt-1">Подробные условия доступны в разделе Условия использования.</p>
      </div>
    </div>
  );
}

interface PricingCardProps {
  plan: typeof BILLING_PLANS[number];
  billingInterval: 'monthly' | 'yearly';
  isLoading: boolean;
  onSelectPlan: () => void;
}

function PricingCard({ plan, billingInterval, isLoading, onSelectPlan }: PricingCardProps) {
  const price = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(Number(plan.price[billingInterval]) / 100);
  
  return (
    <Card className={`flex flex-col ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
      {plan.popular && (
        <div className="rounded-t-lg bg-primary py-1 text-center text-xs font-medium text-primary-foreground">
          Популярный выбор
        </div>
      )}
      
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <div className="mb-4">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-muted-foreground">
            /{billingInterval === 'monthly' ? 'мес' : 'год'}
          </span>
        </div>
        
        <ul className="space-y-2 text-sm">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button
          size="lg"
          className="w-full"
          onClick={onSelectPlan}
          disabled={isLoading}
          variant={plan.popular ? 'default' : 'outline'}
        >
          {isLoading ? 'Подготовка...' : 'Выбрать тариф'}
        </Button>
      </CardFooter>
    </Card>
  );
} 