"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Sample message data
const initialMessages = [
  {
    id: 1,
    sender: "system",
    avatar: "/bot-avatar.png",
    avatarFallback: "БТ",
    content: "Привет! Я BizBot, ваш помощник по обучению. Как я могу помочь вам сегодня?",
    timestamp: "10:00",
  },
  {
    id: 2,
    sender: "user",
    avatar: "/placeholder-avatar.jpg",
    avatarFallback: "ПЗ",
    content: "Привет! У меня есть вопрос по материалам Уровня 2.",
    timestamp: "10:01",
  },
  {
    id: 3,
    sender: "system",
    avatar: "/bot-avatar.png",
    avatarFallback: "БТ",
    content: "Конечно! Что именно вас интересует в материалах Уровня 2?",
    timestamp: "10:01",
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      sender: "user",
      avatar: "/placeholder-avatar.jpg",
      avatarFallback: "ПЗ",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Simulate bot response
    const botMessage = {
      id: messages.length + 2,
      sender: "system",
      avatar: "/bot-avatar.png",
      avatarFallback: "БТ",
      content: "Спасибо за ваше сообщение! Я обрабатываю ваш запрос.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, userMessage, botMessage]);
    setNewMessage("");
    
    // Focus the input field after sending a message
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Чат поддержки</h1>
        <p className="text-muted-foreground mt-2">
          Задайте вопрос нашему боту поддержки или преподавателям
        </p>
      </div>

      <Card className="flex flex-col h-[calc(100dvh-15rem)]">
        <CardHeader>
          <CardTitle>BizBot</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 overflow-hidden">
          {/* Messages Container */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            aria-live="polite"
            aria-atomic="false"
            aria-relevant="additions"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender !== "user" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={message.avatar} alt={`Аватар ${message.sender === "system" ? "бота" : "пользователя"}`} />
                    <AvatarFallback>{message.avatarFallback}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  }`}
                >
                  <div>{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.sender === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {message.timestamp}
                  </div>
                </div>
                {message.sender === "user" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={message.avatar} alt="Ваш аватар" />
                    <AvatarFallback>{message.avatarFallback}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t mt-auto">
            <form 
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Напишите сообщение..."
                aria-label="Текст сообщения"
                className="flex-1 px-4 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button 
                type="submit" 
                size="icon"
                aria-label="Отправить сообщение"
                disabled={newMessage.trim() === ""}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 