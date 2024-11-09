'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { DollarSign, ArrowRight, Send, Building, Calendar, Percent, CreditCard, BookOpen } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

// Move helper functions outside component
const calculateMonthlyPayment = (amount: number, rate: number, term: number) => {
  const monthlyRate = rate / 100 / 12;
  const numberOfPayments = term * 12;
  return (amount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
};

interface LoanInfo {
  currentLender: string;
  interestRate: number;
  loanAmount: number;
  loanTerm: number;
  loanType: string;
}

interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
  citations?: Citation[];
}

interface FileInfo {
  status: string;
  id: string;
  name: string;
  size: number;
  metadata: null | any;
  updated_on: string;
  created_on: string;
  percent_done: number;
  signed_url: string;
}

interface Reference {
  file: FileInfo;
  pages: number[];
}

interface Citation {
  position: number;
  references: Reference[];
}

interface PineconeResponse {
  finish_reason: string;
  message: {
    role: string;
    content: string;
  };
  id: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: Citation[];
}

const sendToPinecone = async (message: string, loanContext: LoanInfo): Promise<PineconeResponse> => {
  const PINECONE_API_KEY = process.env.NEXT_PUBLIC_PINECONE_API_KEY;
  const ASSISTANT_NAME = process.env.NEXT_PUBLIC_ASSISTANT_NAME;

  if (!PINECONE_API_KEY || !ASSISTANT_NAME) {
    throw new Error('Missing required environment variables');
  }

  // Create a formatted context string with loan information
  const contextString = `
Current Loan Information:
- Loan Amount: $${loanContext.loanAmount.toLocaleString()}
- Interest Rate: ${loanContext.interestRate}%
- Loan Term: ${loanContext.loanTerm} years
- Current Lender: ${loanContext.currentLender}
- Loan Type: ${loanContext.loanType}
- Monthly Payment: $${calculateMonthlyPayment(loanContext.loanAmount, loanContext.interestRate, loanContext.loanTerm).toFixed(2)}

User Query: ${message}`;

  try {
    const response = await fetch(`https://prod-1-data.ke.pinecone.io/assistant/chat/${ASSISTANT_NAME}`, {
      method: 'POST',
      headers: {
        'Api-Key': PINECONE_API_KEY,
        'Content-Type': 'application/json'
      } as HeadersInit,
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: contextString,
          },
        ],
        stream: false,
        model: 'gpt-4o',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Pinecone API error:', error);
    throw error;
  }
};

export default function DashboardPage() {
  const [user, userLoading] = useAuthState(auth);
  const router = useRouter();
  const [loanInfo, setLoanInfo] = useState<LoanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userLoading) return;
    
    if (!user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user && !userLoading) {
      fetchLoanInfo();
    }
  }, [user, userLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchLoanInfo = async () => {
    if (!user) return;
    
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (data.surveyData?.loanInfo) {
          setLoanInfo(data.surveyData.loanInfo as LoanInfo);
          setError(null);
        } else {
          setError("No loan information found. Please complete the survey.");
        }
      } else {
        setError("User document not found.");
      }
    } catch (e) {
      console.error('Error fetching loan info:', e);
      setError("An error occurred while fetching your loan information.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isMessageLoading || !loanInfo) return;

    const userMessage: ChatMessage = {
      text: currentMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsMessageLoading(true);

    try {
      const response = await sendToPinecone(currentMessage, loanInfo);
      
      if (!response.message || !response.message.content) {
        throw new Error('Invalid response format from Pinecone API');
      }
      
      const aiMessage: ChatMessage = {
        text: response.message.content,
        isUser: false,
        timestamp: new Date(),
        citations: response.citations
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error instanceof Error ? error.message : 'Unknown error');
      
      const errorMessage: ChatMessage = {
        text: "I apologize, but I'm having trouble processing your request at the moment. Please try again later.",
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsMessageLoading(false);
    }
  };

  if (userLoading || loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-900 dark:to-zinc-800">
      <header className="px-4 lg:px-8 h-14 flex items-center border-b bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50">
        <Link className="flex items-center justify-center" href="#">
          <div className="bg-primary p-1.5 rounded-lg">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="ml-2 text-xl font-bold text-primary">
            refi-bot
          </span>
        </Link>
        <nav className="ml-auto flex gap-6 items-center">
          <Button variant="ghost" onClick={() => auth.signOut()}>Sign Out</Button>
        </nav>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="container max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Your Student Loan Dashboard</h1>
          <div className="grid gap-6 lg:grid-cols-2">
            {error ? (
              <div className="lg:col-span-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            ) : loanInfo ? (
              <>
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Loan Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Total Loan Amount:</span>
                      </div>
                      <span className="text-lg font-bold">${loanInfo.loanAmount.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Monthly Payment:</span>
                      </div>
                      <span className="text-lg font-bold">
                        ${calculateMonthlyPayment(loanInfo.loanAmount, loanInfo.interestRate, loanInfo.loanTerm).toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Interest Rate:</span>
                      </div>
                      <span className="text-lg font-bold">{loanInfo.interestRate}%</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Current Lender:</span>
                      </div>
                      <span className="text-lg font-bold">{loanInfo.currentLender}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-4">
                      <p>Loan Type: {loanInfo.loanType}</p>
                      <p>Loan Term: {loanInfo.loanTerm} years</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">
                      Explore Refinancing Options <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Chat with refi-bot</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`mb-4 flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`rounded-lg px-4 py-2 max-w-[80%] ${
                              message.isUser
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            <span className="text-xs opacity-70">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </ScrollArea>
                  </CardContent>
                  <CardFooter>
                    <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                      <Input
                        placeholder="Ask about your loan..."
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                      />
                      <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send message</span>
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              </>
            ) : (
              <div className="lg:col-span-2 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">No loan information available. </strong>
                <span className="block sm:inline">Please complete the loan survey to see your dashboard.</span>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50">
        <p className="text-xs text-muted-foreground">© 2024 refi-bot. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Terms of Service</Link>
          <Link className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Privacy Policy</Link>
        </nav>
      </footer>
    </div>
  )
}