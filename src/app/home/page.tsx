'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { DollarSign, ArrowRight, ArrowLeft, LogOut } from 'lucide-react'
import { auth, db } from '@/lib/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import PersonalInfoStep from '@/components/PersonalInfoStep'
import EducationEmploymentStep from '@/components/EducationEmploymentStep'
import LoanInfoStep from '@/components/LoanInfoStep'
import FinancialDetailsStep from '@/components/FinancialDetailsStep'

// Define interfaces for each step's data
interface PersonalInfoData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  ssn: string;
  citizenshipStatus: string;
}

interface EducationEmploymentData {
  education: string;
  school: string;
  enrollmentStatus: string;
  graduationYear: string;
}

interface LoanInfoData {
  loanType: string;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  currentLender: string;
}

interface FinancialDetailsData {
  annualIncome: number;
  monthlyDebt: number;
  creditScore: number;
  bankruptcyHistory: boolean;
  cosignerAvailable: boolean;
}

// Combined form data type
interface FormData {
  personalInfo?: PersonalInfoData;
  educationEmployment?: EducationEmploymentData;
  loanInfo?: LoanInfoData;
  financialDetails?: FinancialDetailsData;
}

// Base props interface that all steps will share
interface BaseStepProps {
  formData: FormData;
}

// Specific props interfaces for each step
interface PersonalInfoStepProps extends BaseStepProps {
  onSubmit: (data: PersonalInfoData) => void;
}

interface EducationEmploymentStepProps extends BaseStepProps {
  onSubmit: (data: EducationEmploymentData) => void;
}

interface LoanInfoStepProps extends BaseStepProps {
  onSubmit: (data: LoanInfoData) => void;
}

interface FinancialDetailsStepProps extends BaseStepProps {
  onSubmit: (data: FinancialDetailsData) => void;
}

// Union type for all possible step components
type StepComponent = 
  | React.ComponentType<PersonalInfoStepProps>
  | React.ComponentType<EducationEmploymentStepProps>
  | React.ComponentType<LoanInfoStepProps>
  | React.ComponentType<FinancialDetailsStepProps>;

interface Step {
  id: number;
  name: string;
  component: StepComponent;
}

const steps: Step[] = [
  { id: 1, name: 'Personal Info', component: PersonalInfoStep },
  { id: 2, name: 'Education', component: EducationEmploymentStep },
  { id: 3, name: 'Loan Information', component: LoanInfoStep },
  { id: 4, name: 'Financial Details', component: FinancialDetailsStep }
]

export default function SurveyPage() {
  const [user, loading] = useAuthState(auth)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({})
  const [submitting, setSubmitting] = useState(false)
  const [checkingSurvey, setCheckingSurvey] = useState(true)
  const [surveyCompleted, setSurveyCompleted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    const checkExistingSurvey = async () => {
      if (!user) return
      
      try {
        const userDocRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userDocRef)
        
        if (userDoc.exists() && userDoc.data()?.surveyData) {
          setSurveyCompleted(true)
        }
      } catch (error) {
        console.error('Error checking survey data:', error)
      } finally {
        setCheckingSurvey(false)
      }
    }

    checkExistingSurvey()
  }, [user])

  const handleSignOut = () => {
    signOut(auth)
    router.push('/')
  }

  const handleNext = (
    stepData: PersonalInfoData | EducationEmploymentData | LoanInfoData | FinancialDetailsData
  ) => {
    setFormData(prev => {
      const key = getStepKey(currentStep)
      return { ...prev, [key]: stepData }
    })
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async (finalStepData: FinancialDetailsData) => {
    if (!user) return

    setSubmitting(true)
    try {
      const completeFormData: FormData = {
        ...formData,
        financialDetails: finalStepData
      }

      // Reference to the user's document
      const userDocRef = doc(db, 'users', user.uid)

      // Check if the user document already exists
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        // Update existing document
        await updateDoc(userDocRef, {
          ...userDoc.data(),
          surveyData: completeFormData,
          lastUpdated: new Date().toISOString()
        })
      } else {
        // Create new document
        await setDoc(userDocRef, {
          userId: user.uid,
          email: user.email,
          surveyData: completeFormData,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        })
      }

      setSurveyCompleted(true)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getStepKey = (step: number): keyof FormData => {
    switch (step) {
      case 1:
        return 'personalInfo'
      case 2:
        return 'educationEmployment'
      case 3:
        return 'loanInfo'
      case 4:
        return 'financialDetails'
      default:
        throw new Error('Invalid step')
    }
  }

  if (loading || checkingSurvey) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  const Layout = ({ children }: { children: React.ReactNode }) => (
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
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </nav>
      </header>

      {children}

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50">
        <div className="flex-grow"></div>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Terms of Service</Link>
          <Link className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Privacy Policy</Link>
        </nav>
      </footer>
    </div>
  )

  if (surveyCompleted) {
    return (
      <Layout>
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 flex items-center justify-center">
          <h1 className="text-4xl font-bold">Home</h1>
        </main>
      </Layout>
    )
  }

  const CurrentStepComponent = steps[currentStep - 1].component
  const currentStepProps = {
    formData,
    onSubmit: currentStep === steps.length ? handleSubmit : handleNext
  } as any

  return (
    <Layout>
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="flex justify-center">
            <ol className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <li key={step.id} className="flex items-center">
                  <div className={`flex items-center ${
                    currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      currentStep >= step.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {step.id}
                    </span>
                    <span className="ml-2 text-sm font-medium">{step.name}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="ml-4 w-8 h-px bg-muted-foreground" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          <CurrentStepComponent {...currentStepProps} />
          
          <div className="mt-8 flex justify-between">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
            {currentStep === 1 && <div />}
            <Button
              type="submit"
              form={`step-${currentStep}-form`}
              disabled={submitting}
            >
              {currentStep === steps.length ? (
                submitting ? 'Submitting...' : 'Submit Application'
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </Layout>
  )
}