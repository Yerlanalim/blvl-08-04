import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Message } from '@/hooks/useChat';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ChatMessageProps {
  message: Message;
  isUserMessage: boolean;
}

export function ChatMessage({ message, isUserMessage }: ChatMessageProps) {
  // Format the timestamp for display
  const formattedTime = useMemo(() => {
    try {
      const date = new Date(message.timestamp);
      return format(date, 'HH:mm', { locale: ru });
    } catch (err) {
      console.error('Error formatting message time:', err);
      return '';
    }
  }, [message.timestamp]);

  // Define ARIA labels based on message role
  const roleLabel = useMemo(() => {
    if (isUserMessage) return 'Ваше сообщение';
    if (message.role === 'system') return 'Системное сообщение';
    return 'Сообщение ассистента';
  }, [isUserMessage, message.role]);

  return (
    <div
      className={`flex gap-3 ${
        isUserMessage ? 'justify-end' : 'justify-start'
      }`}
      aria-label={roleLabel}
    >
      {!isUserMessage && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src="/bot-avatar.png" alt="Аватар бота" />
          <AvatarFallback>БТ</AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={`max-w-[80%] p-3 rounded-lg ${
          isUserMessage
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary'
        }`}
      >
        {isUserMessage ? (
          <div className="break-words">{message.content}</div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            <ReactMarkdown
              components={{
                // Make links open in new tab
                a: ({ node, ...props }) => (
                  <a 
                    {...props} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  />
                ),
                // Style code blocks and inline code
                code: ({ node, inline, ...props }) => (
                  inline 
                    ? <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props} />
                    : <code className="block bg-muted p-2 rounded-md text-sm overflow-x-auto" {...props} />
                )
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        
        {formattedTime && (
          <div
            className={`text-xs mt-1 ${
              isUserMessage
                ? 'text-primary-foreground/70'
                : 'text-muted-foreground'
            }`}
            aria-label={`Отправлено в ${formattedTime}`}
          >
            {formattedTime}
          </div>
        )}
      </div>
      
      {isUserMessage && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src="/placeholder-avatar.jpg" alt="Ваш аватар" />
          <AvatarFallback>ПЗ</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
} 