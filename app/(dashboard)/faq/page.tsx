import { Suspense } from "react";
import { getAllFAQs, getAllFAQCategories } from "@/lib/services";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import FaqClient from "./faq-client";

export const metadata = {
  title: "FAQ - BizLevel",
  description: "Часто задаваемые вопросы о платформе BizLevel"
};

async function FaqContent() {
  const [faqs, categories] = await Promise.all([
    getAllFAQs(),
    getAllFAQCategories()
  ]);

  return <FaqClient faqs={faqs} categories={categories} />;
}

export default function FAQPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Часто задаваемые вопросы</h1>
        <p className="text-muted-foreground mt-2">
          Найдите ответы на распространенные вопросы о платформе
        </p>
      </div>

      <Suspense fallback={<FaqSkeleton />}>
        <FaqContent />
      </Suspense>
    </div>
  );
}

function FaqSkeleton() {
  return (
    <div className="space-y-6">
      <div className="relative">
        <Skeleton className="h-10 w-full" />
      </div>
      
      <div className="flex flex-wrap gap-2">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24" />
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-40" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-60" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 