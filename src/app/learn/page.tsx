import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import { DollarSign, GraduationCap, PiggyBank } from 'lucide-react';

const MissionPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-900 dark:to-zinc-800">
      {/* Header remains the same */}
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
          <Link className="text-sm font-medium" href="/sign-in">
            Sign In
          </Link>
        </nav>
      </header>

      <main className="flex-1 overflow-hidden">
        {/* Our Solution Section */}
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <h2 className="text-primary uppercase tracking-wide font-medium">
                  OUR SOLUTION
                </h2>
                <h1 className="text-3xl font-bold text-black mt-2">
                  Automated Student Loan Refinancing
                </h1>
              </div>
              
              <p className="text-lg text-black">
  With over <strong className="text-2xl text-black-500">$1.7 trillion in outstanding student loan debt</strong>, the need for better refinancing solutions has never been more critical.
</p>
              
              <p className="text-lg text-black">
                We're automating the refinancing process, helping students across the country <strong className="text-2xl text-black-500">save thousands of dollars each year.</strong>
              </p>
              
              <p className="text-lg text-black">
                We leverage your personal data to craft a tailored set of financial solutions, and identify the cheapest refinancing options for you.
              </p>
            </div>
            
            <div className="relative">
              <Card className="bg-background/50 p-8 rounded-lg shadow-lg">
                <div className="relative aspect-square flex items-center justify-center">
                  <GraduationCap className="w-56 h-56 text-blue-700" strokeWidth={1.5} />
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* How it Works Section */}
        <div className="container max-w-4xl mx-auto px-4 py-12 mt-16 border-t">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative md:order-1">
              <Card className="bg-background/50 p-8 rounded-lg shadow-lg">
                <div className="relative aspect-square flex items-center justify-center">
                  <PiggyBank className="w-56 h-56 text-blue-700" strokeWidth={1.5} />
                </div>
              </Card>
            </div>

            <div className="space-y-6 md:order-2">
              <div>
                <h2 className="text-primary uppercase tracking-wide font-medium">
                  HOW IT WORKS
                </h2>
                <h1 className="text-3xl font-bold text-black-900 mt-2">
                  Cheap, Self-Directed Financing
                </h1>
              </div>
              
              <p className="text-lg text-black">
                Simply share your loan details and we'll help you save in seconds.
              </p>
              
              <p className="text-lg text-black">
                We analyze <strong className="text-2xl text-black-500">hundreds of lenders</strong> to find the matches that best suit your profile.
              </p>
              
              <p className="text-lg text-black">
                We will <strong className="text-2xl text-black-500"> switch your plans automatically</strong>, saving you thousands in a single click.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50">
        <div className="flex-grow"></div>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Terms of Service</Link>
          <Link className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Privacy Policy</Link>
        </nav>
      </footer>
    </div>
  );
};

export default MissionPage;