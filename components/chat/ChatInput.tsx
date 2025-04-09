import React, { useState, useRef, FormEvent, KeyboardEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle form submission
  const handleSubmit = useCallback((e?: FormEvent) => {
    if (e) e.preventDefault();
    
    if (message.trim() === '' || isLoading) return;
    
    onSendMessage(message);
    setMessage('');
    
    // Focus back on input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [message, isLoading, onSendMessage]);

  // Handle keyboard events (Shift+Enter for line breaks)
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    // Submit on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid form submission
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <form 
      className="flex gap-2"
      onSubmit={handleSubmit}
      aria-label="Форма отправки сообщения"
    >
      <Input
        ref={inputRef}
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Напишите сообщение..."
        aria-label="Текст сообщения"
        disabled={isLoading}
        className="flex-1"
        autoComplete="off"
        maxLength={4000} // Reasonable limit for message length
      />
      <Button 
        type="submit" 
        size="icon"
        aria-label={isLoading ? "Отправка..." : "Отправить сообщение"}
        disabled={message.trim() === '' || isLoading}
        title="Отправить сообщение (Enter)"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
} 