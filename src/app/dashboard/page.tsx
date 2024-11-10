'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { DollarSign, Send, Building, Calendar, Percent, CreditCard } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import RefinancingOptions from '@/components/RefinancingOptions'

// Move helper functions outside component
const calculateMonthlyPayment = (amount: number, rate: number, term: number) => {
  const monthlyRate = rate / 100 / 12;
  const numberOfPayments = term * 12;
  //return (amount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  return 83.33
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

interface LenderOption {
  lender: string;
  fixed_apr: string;
  loan_term: string;
  loan_amount: string;
  requirements: string;
}

const dummyLenderOptions: LenderOption[] = [
  {"lender":"LendKey","fixed_apr":"5.24-9.40%","loan_term":"5-15 yrs","loan_amount":"$5k-$250k","requirements":"['Be a U.S. citizen or permanent resident', 'Have graduated with at least an associate degree']"},
  {"lender":"Education Loan Finance","fixed_apr":"4.84-8.44%","loan_term":"5-20 yrs","loan_amount":"starting at $1k","requirements":"['Be a U.S. citizen or permanent resident', 'Be the age of majority at the time of application', 'Earned a bachelor's degree or higher from a Title IV, U.S. domiciled nonprofit postsecondary institution at the time of application', 'Have a credit score of at least 680, at least 36 months of credit history and a minimum income of $35,000']"},
  {"lender":"EdvestinU","fixed_apr":"6.00-10.37%","loan_term":"5-20 yrs","loan_amount":"$7.5k-$225k","requirements":"['Be either a U.S. citizen or permanent resident who resides in an eligible state', 'Be at least 18 years old', 'Have qualifying federal or private student loans used to attend a Title IV institution', 'Have an individual income of $30,000 for loans of less than $100,000', 'Have a minimum individual income of $50,000 for anything above $100,000']"},
  {"lender":"Invested","fixed_apr":"5.12-9.46%","loan_term":"5-20 yrs","loan_amount":"$1k-$250k","requirements":"['Be either a U.S. citizen or permanent resident', 'Must be an Indiana resident', 'Have a FICO score of at least 670', 'Have an annual income of at least $36,000', 'No delinquencies of 60 days or more during the previous 24 months', 'Monthly payments for approved credit must not exceed 40% to 50% of gross monthly income', 'No repossessions, foreclosures or garnishments', 'No reported bankruptcies within the past five years', 'The loan must be a private or federal education loan, in repayment and current at the time of your refinance application']"},
  {"lender":"MEFA","fixed_apr":"6.20-8.99%","loan_term":"7-15 yrs","loan_amount":"$10k-$500k","requirements":"['Must be a U.S. citizen or permanent resident', 'Have an established credit history or a co-borrower with one', 'Have no history of bankruptcy or foreclosure in the past 60 months', 'Have no history of default on an education loan and no delinquencies on education debt in the past 12 months', 'Loans must have been used at an eligible nonprofit degree-granting institution']"},
  {"lender":"RISLA","fixed_apr":"3.85-8.74%","loan_term":"5-15 yrs","loan_amount":"$7.5k-$250k","requirements":"['Be a U.S. citizen or permanent resident', 'Be enrolled or planning to attend a Title IV degree-granting program at an eligible public or nonprofit school', 'Have a minimum annual income of at least $40,000']"},
  {"lender":"Citizens Bank","fixed_apr":"5.89-11.85%","loan_term":"5-20 yrs","loan_amount":"$10k-$750k","requirements":"['Borrowers must be U.S. citizens, permanent residents or resident aliens', 'Borrowers with an associate degree or no degree must have made at least 12 qualifying payments after leaving school,', \"Borrowers with a bachelor's degree may refinance while still enrolled in school\", 'Medical residents looking to refinance must have graduated from medical school and be matched to an eligible residency or fellowship program']"},
  {"lender":"SoFi","fixed_apr":"3.99-9.99%","loan_term":"5-20 yrs","loan_amount":"$1k-$500k","requirements":"['Be U.S. citizens, permanent residents or visa holders', 'Be at least the age of majority with sufficient income or an offer of employment', 'Must have graduated with at least an associate degree from a Title IV school', 'Bar loans and residency loans are not eligible']"},
  {"lender":"Earnest","fixed_apr":"3.95-8.99%","loan_term":"5-20 yrs","loan_amount":"$5k-$500k","requirements":"['Be a U.S. citizen or permanent resident of an eligible state', 'Be at least the age of majority', 'Be graduated or currently enrolled less than half time and be in repayment on your student loans or be completing your degree at the end of the semester', 'Have consistent income', 'Have all student loan accounts in good standing', 'Be current on rent or mortgage payments', 'Have no bankruptcies on your credit report', 'Minimum credit score of 665']"},
  {"lender":"Laurel Road","fixed_apr":"4.99-8.90%","loan_term":"3-20 yrs","loan_amount":"$5k-$500k","requirements":"['Be a U.S. citizen or permanent resident or have a co-signer who is', 'Have graduated or be enrolled in good standing in the final term preceding graduation and be employed or have an offer of employment']"},
  {"lender":"College Ave","fixed_apr":"6.99-13.99%","loan_term":"5-20 yrs","loan_amount":"$1k-$500k","requirements":"['Be U.S. citizens or permanent residents', 'Be at least 18 years old', \"Have graduated from a Title IV undergraduate or graduate program within College Ave's network\"]"}
];

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
  const [lenderOptions, setLenderOptions] = useState<LenderOption[]>([]);
  const [isLoadingLenderOptions, setIsLoadingLenderOptions] = useState(false);
  const [useDummyData, setUseDummyData] = useState(true);

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

  useEffect(() => {
    if (loanInfo) {
      handleRefreshLenderOptions();
    }
  }, [loanInfo]); // Updated useEffect

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

  const fetchLenderOptions = async (loanAmount: number) => {
    setIsLoadingLenderOptions(true);
    try {
      const response = await fetch('https://bankrate-analyzer-275902199394.us-central1.run.app/analyze-loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loan_type: 'Refinance',
          loan_amount: loanAmount,
          credit_score: 'Excellent (750+)',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLenderOptions(data);
    } catch (error) {
      console.error('Error fetching lender options:', error);
      setError('Failed to fetch refinancing options. Please try again later.');
    } finally {
      setIsLoadingLenderOptions(false);
    }
  };

  const handleRefreshLenderOptions = () => {
    if (loanInfo) {
      setIsLoadingLenderOptions(true);
      if (useDummyData) {
        setLenderOptions(dummyLenderOptions);
        setIsLoadingLenderOptions(false);
      } else {
        fetchLenderOptions(loanInfo.loanAmount);
      }
    }
  }; // Updated handleRefreshLenderOptions

  const handleToggleDummyData = () => {
    setUseDummyData(prev => !prev);
    // Removed automatic refresh
  }; // Updated handleToggleDummyData

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
            RapidRefi
          </span>
        </Link>
        <nav className="ml-auto flex gap-6 items-center">
          <Button variant="ghost" onClick={() => auth.signOut()}>Sign Out</Button>
        </nav>
      </header>
      <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
        <div className="container max-w-7xl mx-auto h-full">
          <h1 className="text-2xl font-bold mb-4">Your Student Loan Dashboard</h1>
          <div className="grid gap-4 lg:grid-cols-2 h-full">
            {error ? (
              <div className="lg:col-span-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            ) : loanInfo ? (
              <>
                <div className="lg:col-span-1 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Loan Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
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
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Chat with refi-bot</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[200px] pr-4">
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
                </div>
                
                <div className="lg:col-span-1 flex flex-col h-full">
                  <RefinancingOptions 
                    lenders={lenderOptions} 
                    loanAmount={loanInfo.loanAmount} 
                    isLoading={isLoadingLenderOptions}
                    onRefresh={handleRefreshLenderOptions}
                    useDummyData={useDummyData}
                    onToggleDummyData={handleToggleDummyData}
                  />
                </div>
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