'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { DollarSign, ArrowRight, LogOut } from 'lucide-react'
import Image from 'next/image'
import { auth, db } from '@/lib/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { doc, getDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  birthday: string;
  customerId: string;
  createdAt: string;
}

export default function HomePage() {
  const [user, loading] = useAuthState(auth)
  const [userData, setUserData] = useState<UserData | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData)
        }
      }
    }
    fetchUserData()
  }, [user])

  const handleSignOut = () => {
    signOut(auth)
    router.push('/')
  }

  if (loading || !user || !userData) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
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
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </nav>
      </header>
      <main className="flex-1 overflow-hidden">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-8 px-0 lg:px-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight sm:text-6xl xl:text-7xl/none text-foreground">
                    Welcome, {userData.firstName}!
                  </h1>
                  <p className="max-w-[600px] text-xl text-muted-foreground">
                    Here's your account information:
                  </p>
                </div>
                <div className="space-y-4">
                  <p><strong>Full Name:</strong> {userData.firstName} {userData.lastName}</p>
                  <p><strong>Email:</strong> {userData.email}</p>
                  <p><strong>Birthday:</strong> {userData.birthday}</p>
                  <p><strong>Customer ID:</strong> {userData.customerId}</p>
                  <p><strong>Account Created:</strong> {new Date(userData.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col gap-3 min-[400px]:flex-row">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    Start Refinancing <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg" className="border-2" asChild>
                    <Link href="/learn">Learn More</Link>
                  </Button>
                </div>
              </div>
              <div className="relative h-full">
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 to-purple-500/30 opacity-20 blur-3xl" />
                <Image
                  src="/student-loan-freedom.jpg"
                  alt="Student celebrating financial freedom"
                  className="relative rounded-2xl shadow-2xl border dark:border-white/10 w-full h-full object-cover"
                  width={700}
                  height={700}
                  priority
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50">
        <div className="flex-grow"></div>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Terms of Service</Link>
          <Link className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Privacy Policy</Link>
        </nav>
      </footer>
    </div>
  )
}