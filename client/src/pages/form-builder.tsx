import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/layout/navbar";
import ElementSidebar from "@/components/form-builder/element-sidebar";
import FormCanvas from "@/components/form-builder/form-canvas";
import PropertiesPanel from "@/components/form-builder/properties-panel";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Form, FormField } from "@shared/schema";
import { ArrowLeftIcon, CopyIcon, EyeIcon, SaveIcon, ShareIcon, Trash } from "lucide-react";
import { useTitle } from "@/hooks/use-title";

export default function FormBuilder() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<Form>>({
    title: "Untitled Form",
    description: "",
    fields: [],
    settings: {},
    isPublished: false,
  });
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = params.id && params.id !== "new";

  useEffect(() => {
    if (isEditing) {
      loadForm();
    }
  }, [isEditing, params.id]);

  useTitle(isEditing ? (form.title || "Edit Form") : "Create Form");

  const loadForm = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", `/api/forms/${params.id}`);
      const formData = await response.json();
      setForm(formData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load form",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const saveForm = async () => {
    setIsSaving(true);
    try {
      const url = isEditing ? `/api/forms/${params.id}` : "/api/forms";
      const method = isEditing ? "PUT" : "POST";
      
      const response = await apiRequest(method, url, form);
      const savedForm = await response.json();
      
      setForm(savedForm);
      toast({
        title: "Success",
        description: "Form saved successfully",
      });

      if (!isEditing) {
        navigate(`/forms/${savedForm.id}/edit`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save form",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const publishForm = async () => {
    try {
      const updatedForm = { ...form, isPublished: true };
      const response = await apiRequest("PUT", `/api/forms/${params.id}`, updatedForm);
      const savedForm = await response.json();
      
      setForm(savedForm);
      toast({
        title: "Form Published",
        description: "Your form is now live and accepting responses",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish form",
        variant: "destructive",
      });
    }
  };

  const copyEmbedCode = () => {
    const chatbotId = params.id as string;
    if (!chatbotId || chatbotId === "new") {
      toast({ title: "Save form first", description: "Please save the form to get an ID." });
      return;
    }
    const embedCode = `<script id=\"gateway-chatbot\" chatbotId=\"${chatbotId}\" src=\"https://qqzgjlyqdabrrpeaxoud.supabase.co/storage/v1/object/public/Chatbot/chatbot.js\"></script>`;
    navigator.clipboard.writeText(embedCode);
    toast({ title: "Embed code copied!", description: "Paste this <script> tag into your website." });
  };

  
  const deleteForm = async () => {
    try {
      await apiRequest("DELETE", `/api/forms/${params.id}`);
      toast({
        title: "Form Deleted",
        description: "Your form is deleted successfully",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete form",
        variant: "destructive",
      });
    }
  };

  const addField = (fieldType: string) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type: fieldType as any,
      label: `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
      required: false,
      aiEnabled: fieldType === 'ai_conversation',
      validation: fieldType === 'email' ? [{
        type: 'email',
        message: 'Please enter a valid email address',
        value: '',
      }] : [],
      ...(fieldType === 'matrix' && {
        matrixRows: ["Row 1", "Row 2", "Row 3"],
        matrixColumns: ["1", "2", "3", "4", "5"]
      }),
      ...((fieldType === "checkbox" ||
        fieldType === "radio" ||
        fieldType === "select") && {
        options: ["Option 1", "Option 2", "Option 3"],
      }),
    };

    setForm(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField],
    }));
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {    
    setForm(prev => ({
      ...prev,
      fields: prev.fields?.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      ) || [],
    }));
    
    if (selectedField && selectedField.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
  };

  const deleteField = (fieldId: string) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields?.filter(field => field.id !== fieldId) || [],
    }));
    setSelectedField(null);
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const fields = [...(form.fields || [])];
    const [removed] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, removed);
    
    setForm(prev => ({ ...prev, fields }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex h-screen pt-16">
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex h-screen pt-16">
        {/* Left Sidebar - Form Elements */}
        <ElementSidebar onAddField={addField} />

        {/* Center - Form Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Builder Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
              <div>
                <Input
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="text-lg font-semibold border-none p-0 focus:ring-0"
                  placeholder="Form title"
                />
                <p className="text-sm text-gray-500">Last saved a few seconds ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={copyEmbedCode}
                disabled={!isEditing}
              >
                <CopyIcon className="h-4 w-4 mr-2" />
                Copy Embed Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/forms/${params.id}/preview`)}
                disabled={!form.fields?.length}
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="greenOutline"
                size="sm"
                onClick={saveForm}
                disabled={isSaving}
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                size="sm"
                onClick={publishForm}
                disabled={!form.fields?.length || !isEditing}
              >
                <ShareIcon className="h-4 w-4 mr-2" />
                Publish
              </Button>
              <Button
                variant='destructiveOutline'
                size="sm"
                onClick={deleteForm}
                disabled={!form.fields?.length || !isEditing}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {/* Form Canvas */}
          <FormCanvas
            form={form}
            selectedField={selectedField}
            onSelectField={setSelectedField}
            onUpdateField={updateField}
            onDeleteField={deleteField}
            onMoveField={moveField}
            onUpdateForm={setForm}
          />
        </div>

        {/* Right Sidebar - Properties */}
        <PropertiesPanel
          selectedField={selectedField}
          onUpdateField={(updates) => {
            if (selectedField) {
              updateField(selectedField.id, updates);
              setSelectedField(prev => prev ? { ...prev, ...updates } : null);
            }
          }}
        />
      </div>
    </div>
  );
}
