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

interface EducationData {
  education: string;
  school: string;
  enrollmentStatus: string;
  graduationYear: string;
}

interface EducationStepProps {
  formData: {
    educationEmployment?: EducationData;
  };
  onSubmit: (data: EducationData) => void;
}

const educationSchema = z.object({
  education: z.string().min(1, "Please select your education level"),
  school: z.string().min(2, "Please enter your school name"),
  enrollmentStatus: z.string().min(1, "Please select your enrollment status"),
  graduationYear: z.string().regex(/^(0[1-9]|1[0-2])\/\d{4}$/, "Please enter a valid date in MM/YYYY format"),
});

const EducationStep: React.FC<EducationStepProps> = ({ formData, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<EducationData>({
    resolver: zodResolver(educationSchema),
    defaultValues: formData.educationEmployment || {}
  });

  return (
    <form id="step-2-form" onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="pt-6 space-y-6">
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
              <Input 
                id="school" 
                {...register("school")} 
                placeholder="Enter your school name"
              />
              {errors.school && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.school.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label>Enrollment Status</Label>
              <Select 
                onValueChange={(value) => setValue('enrollmentStatus', value)}
                defaultValue={watch('enrollmentStatus')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select enrollment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="half-time">Half Time</SelectItem>
                  <SelectItem value="less-than-half">Less than Half Time</SelectItem>
                </SelectContent>
              </Select>
              {errors.enrollmentStatus && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.enrollmentStatus.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="graduationYear">Graduation Date</Label>
              <Input 
                id="graduationYear" 
                {...register("graduationYear")} 
                placeholder="MM/YYYY"
                maxLength={7}
              />
              {errors.graduationYear && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.graduationYear.message}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default EducationStep;