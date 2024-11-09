import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LoanInfoData {
  loanType: string;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  currentLender: string;
}

interface LoanInfoStepProps {
  formData: {
    loanInfo?: LoanInfoData;
  };
  onSubmit: (data: LoanInfoData) => void;
}

const loanInfoSchema = z.object({
  loanType: z.string().min(1, "Please select a loan type"),
  loanAmount: z.number().min(1000, "Loan amount must be at least $1,000"),
  interestRate: z.number().min(0).max(100, "Interest rate must be between 0 and 100"),
  loanTerm: z.number().min(1, "Loan term must be at least 1 year"),
  currentLender: z.string().min(2, "Please enter your current lender")
});

const LoanInfoStep: React.FC<LoanInfoStepProps> = ({ formData, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<LoanInfoData>({
    resolver: zodResolver(loanInfoSchema),
    defaultValues: formData.loanInfo || {
      loanAmount: 0,
      interestRate: 0,
      loanTerm: 0
    }
  });

  return (
    <form id="step-3-form" onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Loan Type</Label>
              <Select 
                onValueChange={(value) => setValue('loanType', value)}
                defaultValue={watch('loanType')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select loan type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="federal">Federal Student Loan</SelectItem>
                  <SelectItem value="private">Private Student Loan</SelectItem>
                  <SelectItem value="mixed">Mixed Federal/Private</SelectItem>
                </SelectContent>
              </Select>
              {errors.loanType && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.loanType.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanAmount">Total Loan Amount ($)</Label>
              <Input 
                id="loanAmount" 
                type="number" 
                {...register("loanAmount", { valueAsNumber: true })}
              />
              {errors.loanAmount && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.loanAmount.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestRate">Current Interest Rate (%)</Label>
              <Input 
                id="interestRate" 
                type="number" 
                step="0.1"
                {...register("interestRate", { valueAsNumber: true })}
              />
              {errors.interestRate && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.interestRate.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanTerm">Loan Term (years)</Label>
              <Input 
                id="loanTerm" 
                type="number"
                {...register("loanTerm", { valueAsNumber: true })}
              />
              {errors.loanTerm && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.loanTerm.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentLender">Current Lender</Label>
              <Input id="currentLender" {...register("currentLender")} />
              {errors.currentLender && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.currentLender.message}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default LoanInfoStep;