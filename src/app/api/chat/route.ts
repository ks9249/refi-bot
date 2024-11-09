// app/api/chat/route.ts
import { NextResponse } from 'next/server'

interface Message {
  role: string;
  content: string;
}

interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: string; // Using string for ISO date format
}

interface RequestBody {
  message: string;
  loanInfo: LoanInfo;
  previousMessages: ChatMessage[];
}

interface LoanInfo {
  currentLender: string;
  interestRate: number;
  loanAmount: number;
  loanTerm: number;
  loanType: string;
}

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { message, loanInfo, previousMessages }: RequestBody = await req.json()

    // Format messages for Pinecone Assistant
    const formattedMessages: Message[] = [
      // Add system message with loan context
      {
        role: 'system',
        content: `Current loan information: 
          Amount: $${loanInfo.loanAmount}
          Interest Rate: ${loanInfo.interestRate}%
          Term: ${loanInfo.loanTerm} years
          Current Lender: ${loanInfo.currentLender}
          Loan Type: ${loanInfo.loanType}`
      },
      // Add previous messages with proper typing
      ...previousMessages.map((msg: ChatMessage) => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      })),
      // Add current message
      {
        role: 'user',
        content: message
      }
    ]

    // Construct Pinecone Assistant URL using the proper endpoint
    const url = `https://prod-1-data.ke.pinecone.io/assistant/chat/${process.env.PINECONE_ASSISTANT_NAME}`

    // Make request to Pinecone
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Key': process.env.PINECONE_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: formattedMessages,
        stream: true,
        model: "gpt-4o"
      }),
    })

    if (!response.ok) {
      throw new Error(`Pinecone API error: ${response.status}`)
    }

    // Return the streaming response with proper headers
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Error in chat API route:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}