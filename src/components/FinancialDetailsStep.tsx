import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

interface FinancialDetailsData {
  annualIncome: number;
  monthlyDebt: number;
  creditScore: number;
  bankruptcyHistory: boolean;
  cosignerAvailable: boolean;
}

interface FinancialDetailsStepProps {
  formData: {
    financialDetails?: FinancialDetailsData;
  };
  onSubmit: (data: FinancialDetailsData) => void;
}

const financialDetailsSchema = z.object({
  annualIncome: z.number().min(1, "Annual income must be greater than 0"),
  monthlyDebt: z.number().min(0, "Monthly debt payments cannot be negative"),
  creditScore: z.number().min(300).max(850, "Credit score must be between 300 and 850"),
  bankruptcyHistory: z.boolean(),
  cosignerAvailable: z.boolean()
});

const FinancialDetailsStep: React.FC<FinancialDetailsStepProps> = ({ formData, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FinancialDetailsData>({
    resolver: zodResolver(financialDetailsSchema),
    defaultValues: formData.financialDetails || {
      annualIncome: 0,
      monthlyDebt: 0,
      creditScore: 300,
      bankruptcyHistory: false,
      cosignerAvailable: false
    }
  });

  return (
    <form id="step-4-form" onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="annualIncome">Annual Income ($)</Label>
              <Input 
                id="annualIncome" 
                type="number"
                {...register("annualIncome", { valueAsNumber: true })}
              />
              {errors.annualIncome && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.annualIncome.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyDebt">Monthly Debt Payments ($)</Label>
              <Input 
                id="monthlyDebt" 
                type="number"
                {...register("monthlyDebt", { valueAsNumber: true })}
              />
              {errors.monthlyDebt && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.monthlyDebt.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditScore">Credit Score</Label>
              <Input 
                id="creditScore" 
                type="number"
                min="300"
                max="850"
                {...register("creditScore", { valueAsNumber: true })}
              />
              {errors.creditScore && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.creditScore.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bankruptcyHistory"
                checked={watch('bankruptcyHistory')}
                onCheckedChange={(checked) => {
                  setValue('bankruptcyHistory', checked as boolean);
                }}
              />
              <Label 
                htmlFor="bankruptcyHistory"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Have you filed for bankruptcy in the last 7 years?
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="cosignerAvailable"
                checked={watch('cosignerAvailable')}
                onCheckedChange={(checked) => {
                  setValue('cosignerAvailable', checked as boolean);
                }}
              />
              <Label 
                htmlFor="cosignerAvailable"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Do you have a cosigner available?
              </Label>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>This information helps us determine your refinancing options. All information is kept secure and confidential.</p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default FinancialDetailsStep;