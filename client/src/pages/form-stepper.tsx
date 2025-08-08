import { useState, useEffect, useMemo } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import QuestionRenderer from "@/components/form-stepper/question-renderer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Form } from "@shared/schema";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

export default function FormStepper() {
  const params = useParams();
  const { toast } = useToast();
  const [form, setForm] = useState<Form | null>(null);
  // Instead of question index, we use step index (each step can have multiple fields)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    loadForm();
  }, [params.id]);

  const loadForm = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/public/forms/${params.id}`);
      if (!response.ok) {
        throw new Error("Form not found");
      }
      const formData = await response.json();
      setForm(formData);
    } catch (error) {
      toast({
        title: "Error",
        description: "This form is not available or has been removed.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Group fields into steps: 2-3 fields per step, but AI-enabled textarea is always a single step
  const steps = useMemo(() => {
    if (!form) return [];
    const grouped = [];
    let currentGroup = [];
    for (let i = 0; i < form.fields.length; i++) {
      const field = form.fields[i];
      // If AI-enabled textarea, push as its own step
      if (field.type === "textarea" && field.aiEnabled) {
        if (currentGroup.length) {
          grouped.push(currentGroup);
          currentGroup = [];
        }
        grouped.push([field]);
      } else {
        currentGroup.push(field);
        if (currentGroup.length === 3) {
          grouped.push(currentGroup);
          currentGroup = [];
        }
      }
    }
    if (currentGroup.length) grouped.push(currentGroup);
    return grouped;
  }, [form]);

  // Validate all fields in the current step
  const validateCurrentStep = (): { valid: boolean; message?: string } => {
    if (!steps.length) return { valid: false };
    for (const field of steps[currentStepIndex]) {
      const value = answers[field.id];
      // Required check
      if (field.required) {
        if (value === undefined || value === null || value === "") {
          return { valid: false, message: `${field.label} is required.` };
        }
        if (Array.isArray(value) && value.length === 0) {
          return { valid: false, message: `Please select at least one option for ${field.label}.` };
        }
      }
      // Skip validation if not required and empty
      if (!field.required && (value === undefined || value === null || value === "")) {
        continue;
      }
      // Validation rules
      if (field.validation) {
        for (const rule of field.validation) {
          switch (rule.type) {
            case "min":
              if (field.type === "number" && (isNaN(value) || Number(value) < Number(rule.value))) {
                return { valid: false, message: rule.message };
              }
              if ((field.type === "text" || field.type === "textarea" || field.type === "email") && value.length < Number(rule.value)) {
                return { valid: false, message: rule.message };
              }
              if ((field.type === "checkbox" || field.type === "select") && Array.isArray(value) && value.length < Number(rule.value)) {
                return { valid: false, message: rule.message };
              }
              break;
            case "max":
              if (field.type === "number" && (isNaN(value) || Number(value) > Number(rule.value))) {
                return { valid: false, message: rule.message };
              }
              if ((field.type === "text" || field.type === "textarea" || field.type === "email") && value.length > Number(rule.value)) {
                return { valid: false, message: rule.message };
              }
              if ((field.type === "checkbox" || field.type === "select") && Array.isArray(value) && value.length > Number(rule.value)) {
                return { valid: false, message: rule.message };
              }
              break;
            case "email":
              if (field.type === "email" && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                  return { valid: false, message: rule.message };
                }
              }
              break;
            case "url":
              if ((field.type === "text" || field.type === "textarea") && value) {
                const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
                if (!urlRegex.test(value)) {
                  return { valid: false, message: rule.message };
                }
              }
              break;
            case "pattern":
              if ((field.type === "text" || field.type === "textarea" || field.type === "email") && value) {
                const regex = new RegExp(rule.value as string);
                if (!regex.test(value)) {
                  return { valid: false, message: rule.message };
                }
              }
              break;
          }
        }
      }
    }
    return { valid: true };
  };

  const submitForm = async () => {
    if (!form) return;

    setIsSubmitting(true);
    try {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      await apiRequest("POST", `/api/public/forms/${form.id}/submit`, {
        data: answers,
        timeTaken,
      });

      toast({
        title: "Thank you!",
        description: "Your response has been submitted successfully.",
      });
      
      // Reset form or show thank you message
      setCurrentStepIndex(steps.length);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (!steps.length) return;
    const validation = validateCurrentStep();
    if (!validation.valid) {
      toast({
        title: "Validation Error",
        description: validation.message || "Please correct the input.",
        variant: "destructive",
      });
      return;
    }
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      submitForm();
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const updateAnswer = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Form Not Found</h1>
            <p className="text-gray-600">This form is not available or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Thank you page after submission
  if (currentStepIndex >= steps.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
            <p className="text-gray-600 text-lg">Your response has been submitted successfully.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Current fields for this step
  const currentFields = steps[currentStepIndex] || [];
  // Progress: steps based
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStepIndex + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="shadow-xl mb-6">
          <CardContent className="p-8">
            {currentFields.map((field, index) => (
              <div key={field.id} className="mb-8 last:mb-0">
                <QuestionRenderer
                  autofocus={index === 0}
                  field={field}
                  value={answers[field.id]}
                  onChange={(value) => updateAnswer(field.id, value)}
                  previousStep={previousStep}
                  nextStep={nextStep}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={previousStep}
            disabled={currentStepIndex === 0}
            className="flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStepIndex
                    ? 'bg-primary'
                    : index < currentStepIndex
                    ? 'bg-primary/60'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <Button
            onClick={nextStep}
            disabled={isSubmitting}
            className="flex items-center"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : currentStepIndex === steps.length - 1 ? (
              "Submit"
            ) : (
              <>
                Next
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
