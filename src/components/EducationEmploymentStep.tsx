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

interface EducationEmploymentData {
  education: string;
  school: string;
  graduationYear: string;
  employer: string;
  occupation: string;
  employmentLength: string;
}

interface EducationEmploymentStepProps {
  formData: {
    educationEmployment?: EducationEmploymentData;
  };
  onSubmit: (data: EducationEmploymentData) => void;
}

const educationEmploymentSchema = z.object({
  education: z.string().min(1, "Please select your education level"),
  school: z.string().min(2, "Please enter your school name"),
  graduationYear: z.string().regex(/^\d{4}$/, "Please enter a valid year"),
  employer: z.string().min(2, "Please enter your employer name"),
  occupation: z.string().min(2, "Please enter your occupation"),
  employmentLength: z.string().min(1, "Please select your employment length")
});

const EducationEmploymentStep: React.FC<EducationEmploymentStepProps> = ({ formData, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<EducationEmploymentData>({
    resolver: zodResolver(educationEmploymentSchema),
    defaultValues: formData.educationEmployment || {}
  });

  return (
    <form id="step-2-form" onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Education Level</Label>
              <Select 
                onValueChange={(value) => setValue('education', value)} 
                defaultValue={watch('education')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high-school">High School</SelectItem>
                  <SelectItem value="associates">Associate's Degree</SelectItem>
                  <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                  <SelectItem value="masters">Master's Degree</SelectItem>
                  <SelectItem value="doctorate">Doctorate</SelectItem>
                </SelectContent>
              </Select>
              {errors.education && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.education.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="school">School Name</Label>
              <Input id="school" {...register("school")} />
              {errors.school && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.school.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="graduationYear">Graduation Year</Label>
              <Input 
                id="graduationYear" 
                {...register("graduationYear")} 
                placeholder="YYYY"
                maxLength={4}
              />
              {errors.graduationYear && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.graduationYear.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employer">Current Employer</Label>
              <Input id="employer" {...register("employer")} />
              {errors.employer && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.employer.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input id="occupation" {...register("occupation")} />
              {errors.occupation && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.occupation.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label>Length of Employment</Label>
              <Select 
                onValueChange={(value) => setValue('employmentLength', value)}
                defaultValue={watch('employmentLength')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1">Less than 1 year</SelectItem>
                  <SelectItem value="1-2">1-2 years</SelectItem>
                  <SelectItem value="2-5">2-5 years</SelectItem>
                  <SelectItem value="5-10">5-10 years</SelectItem>
                  <SelectItem value="10+">10+ years</SelectItem>
                </SelectContent>
              </Select>
              {errors.employmentLength && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.employmentLength.message}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default EducationEmploymentStep;