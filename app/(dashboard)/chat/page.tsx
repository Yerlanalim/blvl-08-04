"use client";

import { ChatWindow } from '@/components/chat/ChatWindow';

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Чат поддержки</h1>
        <p className="text-muted-foreground mt-2">
          Задавайте вопросы нашему ИИ-ассистенту по образовательным материалам
        </p>
      </div>

      <ChatWindow />
    </div>
  );
} 