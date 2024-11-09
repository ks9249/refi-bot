import React, { useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';

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

interface PersonalInfoStepProps {
  formData: {
    personalInfo?: PersonalInfoData;
  };
  onSubmit: (data: PersonalInfoData) => void;
}

const CITIZENSHIP_STATUSES = {
  'us_citizen': 'U.S. Citizen',
  'naturalized_citizen': 'Naturalized Citizen',
  'permanent_resident': 'Permanent Resident',
  'temporary_resident': 'Temporary Resident',
  'other': 'Other'
} as const;

const personalInfoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number"),
  address: z.string().min(5, "Please enter a valid address"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date (YYYY-MM-DD)"),
  ssn: z.string()
    .regex(/^\d{9}$/, "Please enter a valid 9-digit SSN without dashes")
    .transform((val) => val.replace(/(\d{3})(\d{2})(\d{4})/, "$1-$2-$3")),
  citizenshipStatus: z.enum(['us_citizen', 'naturalized resident', 'permanent_resident', 'temporary_resident', 'other'], {
    required_error: "Please select your citizenship status"
  })
});

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ formData, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: formData.personalInfo || {}
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            reset({
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || user.email || '',
              dateOfBirth: userData.birthday || '',
              phone: formData.personalInfo?.phone || '',
              address: formData.personalInfo?.address || '',
              ssn: formData.personalInfo?.ssn || '',
              citizenshipStatus: formData.personalInfo?.citizenshipStatus || ''
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [reset, formData.personalInfo]);

  const formatSSNInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 9) value = value.slice(0, 9);
    setValue('ssn', value);
  };

  return (
    <form id="step-1-form" onSubmit={handleSubmit(onSubmit)}>
      <Card className="pt-6">
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.firstName.message}</AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.lastName.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.email.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" {...register("phone")} placeholder="123-456-7890" />
              {errors.phone && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.phone.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ssn">Social Security Number</Label>
              <Input 
                id="ssn" 
                type="password" 
                autoComplete="off"
                {...register("ssn")}
                onChange={formatSSNInput}
                placeholder="XXX-XX-XXXX"
                maxLength={9}
                className="font-mono"
                spellCheck="false"
                data-private
              />
              {errors.ssn && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.ssn.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="citizenshipStatus">Citizenship Status</Label>
              <Select 
                onValueChange={(value) => setValue('citizenshipStatus', value)}
                defaultValue={watch('citizenshipStatus')}
              >
                <SelectTrigger id="citizenshipStatus">
                  <SelectValue placeholder="Select your citizenship status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CITIZENSHIP_STATUSES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.citizenshipStatus && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.citizenshipStatus.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} />
              {errors.address && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.address.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
              {errors.dateOfBirth && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.dateOfBirth.message}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default PersonalInfoStep;