import { Metadata } from 'next';
import PricingPlans from '@/components/payment/pricing-plans';

export const metadata: Metadata = {
  title: 'Выбор тарифа - BizLevel',
  description: 'Выберите подходящий тариф для продолжения обучения на платформе BizLevel',
};

export default function PaymentPage() {
  return (
    <div className="container max-w-6xl py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Выбор тарифа</h1>
        <p className="mt-2 text-muted-foreground">
          Выберите подходящий тариф для продолжения обучения
        </p>
      </div>
      
      <PricingPlans />
    </div>
  );
} 