import { useParams, useLocation } from "wouter";
import { useForm } from "@/hooks/use-forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/navbar";
import QuestionRenderer from "@/components/form-stepper/question-renderer";
import { ArrowLeftIcon, ExternalLinkIcon, ShareIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FormPreview() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { data: form, isLoading } = useForm(params.id);
  const { toast } = useToast();

  const shareForm = () => {
    const formUrl = `${window.location.origin}/f/${params.id}`;
    navigator.clipboard.writeText(formUrl);
    toast({
      title: "Link copied!",
      description: "The form link has been copied to your clipboard.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto pt-20 px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Form Not Found</h1>
              <p className="text-gray-600">The form you're looking for doesn't exist.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto pt-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/forms/${params.id}/edit`)}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
              <p className="text-gray-600">Form Preview</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={shareForm}>
              <ShareIcon className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button onClick={() => window.open(`/f/${params.id}`, '_blank')}>
              <ExternalLinkIcon className="h-4 w-4 mr-2" />
              Open Live Form
            </Button>
          </div>
        </div>

        {/* Form Preview */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {/* Form Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{form.title}</h2>
              {form.description && (
                <p className="text-gray-600 text-lg">{form.description}</p>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-8">
              {form.fields.map((field, index) => (
                <div key={field.id} className="border-b border-gray-200 pb-8 last:border-b-0">
                  <div className="mb-4">
                    <span className="text-sm text-gray-500 font-medium">Question {index + 1}</span>
                  </div>
                  <QuestionRenderer
                    field={field}
                    value=""
                    onChange={() => {}} // Preview mode - no interaction
                  />
                </div>
              ))}
            </div>

            {/* Preview Notice */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Preview Mode:</strong> This is how your form will appear to respondents. 
                Fields are not interactive in preview mode.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
