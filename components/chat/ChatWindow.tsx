import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChat, ConversationListItem } from '@/hooks/useChat';
import { AlertCircle, RefreshCw, List, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

// Scroll adjustment delay in ms
const SCROLL_ADJUSTMENT_DELAY = 100;

export function ChatWindow() {
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    resetChat, 
    conversationList, 
    loadConversation, 
    isLoadingHistory,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Scroll to bottom of messages when new message is added or when loading finishes
  useEffect(() => {
    if (!isLoading && !isLoadingHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isLoadingHistory]);

  // Format the date for conversation history
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM, HH:mm', { locale: ru });
    } catch (err) {
      console.error('Error formatting date:', err);
      return dateString; // Fallback to original string if formatting fails
    }
  }, []);

  // Handler for loading more messages with scroll position preservation
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return;
    
    // Save current scroll position
    if (messagesContainerRef.current) {
      setScrollPosition(messagesContainerRef.current.scrollHeight - messagesContainerRef.current.scrollTop);
    }
    
    // Load more messages
    await loadMoreMessages();
    
    // Restore scroll position after messages are loaded and rendered
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - scrollPosition;
      }
    }, SCROLL_ADJUSTMENT_DELAY);
  }, [isLoadingMore, loadMoreMessages, scrollPosition]);

  // Handler for creating a new chat
  const handleNewChat = useCallback(() => {
    resetChat();
    setIsHistoryOpen(false);
  }, [resetChat]);

  // Handler for selecting a conversation from history
  const handleSelectConversation = useCallback((id: string) => {
    loadConversation(id);
    setIsHistoryOpen(false);
  }, [loadConversation]);

  // Render conversation history items
  const renderConversationHistoryItems = useCallback((conversations: ConversationListItem[]) => {
    if (conversations.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-4">
          История диалогов пуста
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {conversations.map((conversation) => (
          <Button
            key={conversation.id}
            variant="ghost"
            className="w-full justify-start h-auto py-3 px-4"
            onClick={() => handleSelectConversation(conversation.id)}
          >
            <div className="flex flex-col items-start text-left">
              <span className="font-normal truncate w-full">
                {conversation.lastMessage}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {formatDate(conversation.timestamp)}
              </span>
            </div>
          </Button>
        ))}
      </div>
    );
  }, [formatDate, handleSelectConversation]);

  // Render loading skeleton for chat history
  const renderLoadingSkeleton = useCallback(() => (
    <div className="space-y-4">
      <Skeleton className="h-16 w-3/4" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-5/6" />
      <Skeleton className="h-16 w-4/5" />
    </div>
  ), []);

  // Render load more button
  const renderLoadMoreButton = useCallback(() => {
    if (!hasMoreMessages || isLoadingHistory) return null;
    
    return (
      <div className="flex justify-center mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          className="mb-2"
          aria-label="Загрузить предыдущие сообщения"
        >
          {isLoadingMore ? (
            <span className="flex items-center">
              <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Загрузка...
            </span>
          ) : (
            <span className="flex items-center">
              <ChevronUp className="h-4 w-4 mr-2" />
              Загрузить предыдущие сообщения
            </span>
          )}
        </Button>
      </div>
    );
  }, [hasMoreMessages, isLoadingHistory, isLoadingMore, handleLoadMore]);

  // Render loading indicator for new messages
  const renderLoadingIndicator = useCallback(() => {
    if (!isLoading) return null;
    
    return (
      <div className="flex items-center text-muted-foreground space-x-2 animate-pulse" aria-label="Загрузка ответа">
        <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
        <div className="w-2 h-2 rounded-full bg-muted-foreground animation-delay-[200ms]"></div>
        <div className="w-2 h-2 rounded-full bg-muted-foreground animation-delay-[400ms]"></div>
      </div>
    );
  }, [isLoading]);

  return (
    <Card className="flex flex-col h-[calc(100dvh-15rem)]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>BizBot</CardTitle>
        <div className="flex space-x-2">
          <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                title="История диалогов"
                aria-label="История диалогов"
              >
                <List className="h-4 w-4 mr-2" />
                История
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>История диалогов</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <Button 
                  variant="outline" 
                  className="w-full mb-4"
                  onClick={handleNewChat}
                >
                  Новый диалог
                </Button>
                
                {renderConversationHistoryItems(conversationList)}
              </div>
            </SheetContent>
          </Sheet>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetChat}
            title="Начать новый чат"
            aria-label="Начать новый чат"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Сбросить
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1 overflow-hidden">
        {/* Error message display */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Messages Container */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          aria-live="polite"
          aria-atomic="false"
          aria-relevant="additions"
        >
          {renderLoadMoreButton()}

          {isLoadingHistory ? renderLoadingSkeleton() : (
            <>
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message}
                  isUserMessage={message.role === 'user'}
                />
              ))}
            </>
          )}
          
          {renderLoadingIndicator()}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t mt-auto">
          <ChatInput onSendMessage={sendMessage} isLoading={isLoading || isLoadingHistory} />
        </div>
      </CardContent>
    </Card>
  );
} 