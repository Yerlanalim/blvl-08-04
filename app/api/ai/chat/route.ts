import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createClient } from '@/lib/supabase/server';

// Rate limiting helper
const rateLimit = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 requests per minute
  cache: new Map<string, { count: number; resetTime: number }>()
};

export async function POST(req: Request) {
  try {
    // Get user from Supabase auth
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting
    const userId = user.id;
    const now = Date.now();
    const userRate = rateLimit.cache.get(userId) || { count: 0, resetTime: now + rateLimit.windowMs };
    
    if (now > userRate.resetTime) {
      // Reset if window expired
      userRate.count = 0;
      userRate.resetTime = now + rateLimit.windowMs;
    }
    
    if (userRate.count >= rateLimit.maxRequests) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Increment request count
    userRate.count += 1;
    rateLimit.cache.set(userId, userRate);

    // Parse request
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create a thread if one doesn't exist or use the provided thread ID
    let threadId: string;
    
    const threadResponse = await openai.threads.create();
    threadId = threadResponse.id;

    // Add messages to the thread
    for (const message of messages) {
      if (message.role === 'user') {
        await openai.threads.messages.create(
          threadId,
          {
            role: 'user',
            content: message.content,
          }
        );
      }
    }

    // Run the assistant on the thread
    const run = await openai.threads.runs.create(
      threadId,
      {
        assistant_id: process.env.OPENAI_ASSISTANT_ID!,
      }
    );

    // Poll for the run to complete
    let runStatus = await openai.threads.runs.retrieve(
      threadId,
      run.id
    );

    // Simple polling mechanism with timeout
    const startTime = Date.now();
    const timeout = 30000; // 30 seconds timeout
    
    while (
      runStatus.status !== 'completed' && 
      runStatus.status !== 'failed' && 
      runStatus.status !== 'cancelled' &&
      Date.now() - startTime < timeout
    ) {
      // Wait a bit before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get the updated status
      runStatus = await openai.threads.runs.retrieve(
        threadId,
        run.id
      );
    }

    if (runStatus.status !== 'completed') {
      throw new Error(`Assistant run did not complete: ${runStatus.status}`);
    }

    // Get the messages, sorted by creation time
    const threadMessages = await openai.threads.messages.list(threadId);
    
    // Get the last assistant message (the response to the user's query)
    const lastMessage = threadMessages.data
      .filter(message => message.role === 'assistant')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!lastMessage) {
      throw new Error('No response from assistant');
    }

    // Return the response formatted like a chat completion
    return NextResponse.json({
      role: 'assistant',
      content: lastMessage.content[0].type === 'text' 
        ? lastMessage.content[0].text.value 
        : 'The assistant responded with non-text content',
    });
    
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
} 