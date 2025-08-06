import { useState, useEffect } from "react";
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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
      setCurrentQuestionIndex(form.fields.length);
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

  const nextQuestion = () => {
    if (!form) return;
    
    if (currentQuestionIndex < form.fields.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      submitForm();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
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
  if (currentQuestionIndex >= form.fields.length) {
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

  const currentField = form.fields[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / form.fields.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {form.fields.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="shadow-xl mb-6">
          <CardContent className="p-8">
            <QuestionRenderer
              field={currentField}
              value={answers[currentField.id]}
              onChange={(value) => updateAnswer(currentField.id, value)}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex space-x-2">
            {form.fields.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-primary'
                    : index < currentQuestionIndex
                    ? 'bg-primary/60'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <Button
            onClick={nextQuestion}
            disabled={isSubmitting}
            className="flex items-center"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : currentQuestionIndex === form.fields.length - 1 ? (
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
