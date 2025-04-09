import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Оплата успешно завершена - BizLevel',
  description: 'Ваш платеж успешно обработан',
};

export default function PaymentSuccessPage() {
  return (
    <div className="container max-w-md py-10">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Оплата успешно завершена</CardTitle>
          <CardDescription>
            Спасибо за оплату! Ваш платеж был успешно обработан.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Доступ к оплаченным материалам уже открыт. Вы можете приступить к обучению прямо сейчас.
          </p>
          <p className="text-sm text-muted-foreground">
            Информация об оплате и квитанция были отправлены на ваш email.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" asChild>
            <Link href="/dashboard">Перейти к обучению</Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/payment">Вернуться к тарифам</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 