import { useState, useCallback, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { MessageRole } from '@/lib/supabase/types';

// Define types for messages
export type Message = {
  id: number | string;
  role: MessageRole;
  content: string;
  timestamp: string;
  conversation_id?: string;
};

export type ChatMessage = {
  role: MessageRole;
  content: string;
};

// Type for conversation list items
export type ConversationListItem = {
  id: string;
  lastMessage: string;
  timestamp: string;
};

// Type for useChat hook return value
interface ChatHook {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  resetChat: () => void;
  conversationId: string | null;
  conversationList: ConversationListItem[];
  loadConversation: (id: string) => Promise<void>;
  isLoadingHistory: boolean;
  loadMoreMessages: () => Promise<boolean>;
  hasMoreMessages: boolean;
  isLoadingMore: boolean;
}

// Constant values
const MESSAGES_PER_PAGE = 20;
const MAX_DISPLAY_MESSAGE_LENGTH = 30;
const SCROLL_POSITION_ADJUSTMENT_DELAY = 100;

// Helper function to get current time in ISO format
const getCurrentTime = () => new Date().toISOString();

// Helper to truncate long messages for display
const truncateMessage = (message: string) => 
  message.length > MAX_DISPLAY_MESSAGE_LENGTH 
    ? `${message.substring(0, MAX_DISPLAY_MESSAGE_LENGTH)}...` 
    : message;

export function useChat(initialConversationId?: string): ChatHook {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageIdCounter = useRef(1);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null);
  const [conversationList, setConversationList] = useState<ConversationListItem[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [page, setPage] = useState(0);
  const supabase = createClient();

  // Helper to get next message ID
  const getNextMessageId = useCallback(() => messageIdCounter.current++, []);

  // Load conversation list on mount
  useEffect(() => {
    const loadConversationList = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
          .from('chat_messages')
          .select('conversation_id, content, created_at')
          .eq('user_id', session.user.id)
          .eq('role', 'user')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Create a map of unique conversation IDs with their latest message
        const conversationsMap = new Map<string, { lastMessage: string, timestamp: string }>();
        data.forEach(message => {
          if (!conversationsMap.has(message.conversation_id)) {
            conversationsMap.set(message.conversation_id, {
              lastMessage: message.content,
              timestamp: message.created_at
            });
          }
        });

        // Convert map to array
        const conversationArray = Array.from(conversationsMap).map(([id, { lastMessage, timestamp }]) => ({
          id,
          lastMessage: truncateMessage(lastMessage),
          timestamp
        }));

        setConversationList(conversationArray);
      } catch (err) {
        console.error('Error loading conversation list:', err);
        // Don't set error state here to avoid disrupting the UI if conversation list fails to load
      }
    };

    loadConversationList();
  }, [supabase]);

  // Load conversation if conversationId is provided
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      // Initialize with system message for new conversation
      resetChat();
    }
  }, [conversationId]);

  // Convert database message to Message format
  const convertDatabaseMessageToMessage = useCallback((msg: any): Message => ({
    id: msg.id,
    role: msg.role as MessageRole,
    content: msg.content,
    timestamp: msg.created_at,
    conversation_id: msg.conversation_id
  }), []);

  // Update conversation list with new message
  const updateConversationList = useCallback((conversationId: string, content: string) => {
    setConversationList(prev => {
      const exists = prev.some(conv => conv.id === conversationId);
      const truncatedContent = truncateMessage(content);
      
      if (exists) {
        return prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, lastMessage: truncatedContent, timestamp: getCurrentTime() }
            : conv
        );
      } else {
        return [
          { 
            id: conversationId, 
            lastMessage: truncatedContent,
            timestamp: getCurrentTime() 
          },
          ...prev
        ];
      }
    });
  }, []);

  // Load messages for a specific conversation
  const loadConversation = async (id: string) => {
    setIsLoadingHistory(true);
    setError(null);
    setPage(0);
    
    try {
      setConversationId(id);
      
      const { data, error, count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })
        .range(0, MESSAGES_PER_PAGE - 1);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setMessages([]);
        messageIdCounter.current = 1;
        setHasMoreMessages(false);
        return;
      }
      
      // Convert database messages to Message format
      const loadedMessages = data.map(convertDatabaseMessageToMessage);
      
      setMessages(loadedMessages);
      messageIdCounter.current = loadedMessages.length + 1;
      
      // Set whether there are more messages to load
      if (count !== null) {
        setHasMoreMessages(count > MESSAGES_PER_PAGE);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversation history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load more messages (pagination)
  const loadMoreMessages = async (): Promise<boolean> => {
    if (!conversationId || isLoadingMore || !hasMoreMessages) return false;
    
    setIsLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const from = nextPage * MESSAGES_PER_PAGE;
      const to = from + MESSAGES_PER_PAGE - 1;
      
      const { data, error, count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(from, to);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setHasMoreMessages(false);
        return false;
      }
      
      // Convert database messages to Message format
      const loadedMessages = data.map(convertDatabaseMessageToMessage);
      
      // Append new messages to the existing ones
      setMessages(prev => [...prev, ...loadedMessages]);
      setPage(nextPage);
      
      // Check if there are more messages
      if (count !== null) {
        setHasMoreMessages(count > (nextPage + 1) * MESSAGES_PER_PAGE);
      } else {
        setHasMoreMessages(data.length === MESSAGES_PER_PAGE);
      }
      
      return true;
    } catch (err) {
      console.error('Error loading more messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more messages');
      return false;
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Save message to database
  const saveMessageToDatabase = useCallback(async (
    userId: string, 
    conversationId: string, 
    role: MessageRole, 
    content: string
  ) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        role,
        content
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }, [supabase]);

  // Send a message to the API
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    // Create or get conversation ID
    const currentConversationId = conversationId || uuidv4();
    if (!conversationId) {
      setConversationId(currentConversationId);
    }
    
    // Create user message
    const userMessage: Message = {
      id: getNextMessageId(),
      role: 'user',
      content,
      timestamp: getCurrentTime(),
      conversation_id: currentConversationId
    };
    
    // Add user message to state immediately (optimistic update)
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Save user message to database
      await saveMessageToDatabase(user.id, currentConversationId, 'user', content);
      
      // Prepare messages for API in the format it expects
      const apiMessages: ChatMessage[] = messages
        .filter(msg => msg.role !== 'system' || messages.indexOf(msg) === 0) // Only include initial system message
        .concat(userMessage)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Call the API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get a response from the assistant');
      }
      
      const data = await response.json();
      
      // Create assistant message
      const assistantMessage: Message = {
        id: getNextMessageId(),
        role: 'assistant',
        content: data.content,
        timestamp: getCurrentTime(),
        conversation_id: currentConversationId
      };
      
      // Save assistant message to database
      await saveMessageToDatabase(user.id, currentConversationId, 'assistant', data.content);
      
      // Add assistant message to state
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation list with new/updated conversation
      updateConversationList(currentConversationId, content);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [messages, conversationId, supabase, getNextMessageId, saveMessageToDatabase, updateConversationList]);

  // Reset the chat to initial state
  const resetChat = useCallback(() => {
    setMessages([
      {
        id: 1,
        role: 'system',
        content: 'Привет! Я BizBot, ваш помощник по обучению. Как я могу помочь вам сегодня?',
        timestamp: getCurrentTime(),
      },
    ]);
    setConversationId(null);
    setError(null);
    setPage(0);
    setHasMoreMessages(false);
    messageIdCounter.current = 2;
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    resetChat,
    conversationId,
    conversationList,
    loadConversation,
    isLoadingHistory,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore
  };
} 