import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileImage, FileArchive, Filter } from "lucide-react";

// Sample artifact data
const artifacts = [
  {
    id: 1,
    title: "Шаблон бизнес-плана",
    description: "Готовый шаблон для составления бизнес-плана с пояснениями и примерами",
    type: "document",
    level: 1,
    size: "1.2 MB",
    downloads: 245,
  },
  {
    id: 2,
    title: "Чек-лист маркетинговой стратегии",
    description: "Полный чек-лист для запуска эффективной маркетинговой кампании",
    type: "document",
    level: 2,
    size: "845 KB",
    downloads: 178,
  },
  {
    id: 3,
    title: "Инфографика: Финансовые показатели",
    description: "Визуальное представление ключевых финансовых метрик для бизнеса",
    type: "image",
    level: 2,
    size: "3.5 MB",
    downloads: 132,
  },
  {
    id: 4,
    title: "Набор шаблонов презентаций",
    description: "Коллекция профессиональных шаблонов для бизнес-презентаций",
    type: "archive",
    level: 3,
    size: "24 MB",
    downloads: 97,
  },
];

// Icon mapping for artifact types
const typeIcons = {
  document: <FileText className="h-6 w-6" />,
  image: <FileImage className="h-6 w-6" />,
  archive: <FileArchive className="h-6 w-6" />,
};

export default function ArtifactsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Артефакты</h1>
          <p className="text-muted-foreground mt-2">
            Учебные материалы и ресурсы для вашего обучения
          </p>
        </div>
        <Button variant="outline" className="flex gap-2 self-start sm:self-center">
          <Filter className="h-4 w-4" />
          Фильтры
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {artifacts.map((artifact) => (
          <Card key={artifact.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="bg-secondary p-2 rounded-md">
                  {typeIcons[artifact.type as keyof typeof typeIcons]}
                </div>
                <div className="bg-secondary px-2 py-1 rounded-md text-xs">
                  Уровень {artifact.level}
                </div>
              </div>
              <CardTitle className="mt-3">{artifact.title}</CardTitle>
              <CardDescription>{artifact.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <div>Размер: {artifact.size}</div>
                <div>Скачиваний: {artifact.downloads}</div>
              </div>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full gap-2">
                <Download className="h-4 w-4" />
                Скачать
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 