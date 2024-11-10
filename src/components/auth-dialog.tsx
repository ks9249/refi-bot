'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'

interface AuthDialogProps {
  triggerClassName?: string
  triggerChildren?: React.ReactNode
  variant?: 'default' | 'text'
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AuthDialog({ triggerClassName, triggerChildren, variant = 'default', isOpen, onOpenChange }: AuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user] = useAuthState(auth)
  const [activeTab, setActiveTab] = useState<'log-in' | 'sign-up'>('log-in')
  const router = useRouter()

  useEffect(() => {
    if (user) {
      onOpenChange?.(false)
    }
  }, [user, onOpenChange])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const isSignUp = activeTab === 'sign-up'

    console.log('Attempting authentication:', { email, isSignUp });

    try {
      if (isSignUp) {
        const firstName = formData.get('firstName') as string
        const lastName = formData.get('lastName') as string
        const birthday = formData.get('birthday') as string
        const customerId = formData.get('customerId') as string

        console.log('Signing up with:', { firstName, lastName, birthday, customerId });

        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(userCredential.user, {
          displayName: `${firstName} ${lastName}`,
        })
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          firstName,
          lastName,
          email,
          birthday,
          customerId,
          createdAt: new Date().toISOString(),
        })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }

      console.log('Authentication successful')
      onOpenChange?.(false)
      router.push('/home')
    } catch (error: any) {
      console.error('Authentication failed', error)
      setError(getErrorMessage(error))
    }

    setIsLoading(false)
  }

  const getErrorMessage = (error: any): string => {
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);

    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already in use. Please try logging in instead.';
      case 'auth/invalid-email':
        return 'Invalid email address. Please check and try again.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use a stronger password.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/operation-not-allowed':
        return 'This authentication method is not enabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later or reset your password.';
      default:
        return `An error occurred: ${error.message}. Please try again later.`;
    }
  }

  const TriggerComponent = variant === 'text' ? 'span' : Button

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <TriggerComponent 
          className={triggerClassName}
          onClick={() => onOpenChange?.(true)}
          {...(variant === 'text' ? {
            role: "button",
            tabIndex: 0,
            onKeyDown: (e: React.KeyboardEvent) => e.key === 'Enter' && onOpenChange?.(true)
          } : {})}
        >
          {user ? `Welcome, ${user.displayName}` : (triggerChildren || "Sign Up / Log In")}
        </TriggerComponent>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <VisuallyHidden>
          <DialogTitle>Authentication</DialogTitle>
        </VisuallyHidden>
        <Card>
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold">Welcome to RapidRefi</CardTitle>
            <CardDescription className="text-base">
              Log in or sign up to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'log-in' | 'sign-up')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="log-in">Log In</TabsTrigger>
                <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
              </TabsList>
              <form onSubmit={onSubmit} className="space-y-6">
                <TabsContent value="log-in">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input 
                        id="login-email" 
                        name="email" 
                        type="email" 
                        placeholder="name@example.com"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input 
                        id="login-password" 
                        name="password" 
                        type="password" 
                        placeholder="••••••••"
                        required 
                      />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                      {isLoading ? 'Logging in...' : 'Log In'}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="sign-up">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-first-name">First Name</Label>
                        <Input 
                          id="signup-first-name" 
                          name="firstName" 
                          type="text" 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-last-name">Last Name</Label>
                        <Input 
                          id="signup-last-name" 
                          name="lastName" 
                          type="text" 
                          required 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input 
                        id="signup-email" 
                        name="email" 
                        type="email" 
                        placeholder="name@example.com"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input 
                        id="signup-password" 
                        name="password" 
                        type="password" 
                        placeholder="••••••••"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-birthday">Birthday</Label>
                      <Input 
                        id="signup-birthday" 
                        name="birthday" 
                        type="date" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-customer-id">Customer ID</Label>
                      <Input 
                        id="signup-customer-id" 
                        name="customerId" 
                        type="text" 
                        placeholder="Enter your Customer ID"
                        required 
                      />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                      {isLoading ? 'Signing up...' : 'Sign Up'}
                    </Button>
                  </div>
                </TabsContent>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}