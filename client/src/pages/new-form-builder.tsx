import { useState, useEffect } from "react";
import { useParams } from "wouter";
import AppLayout from "@/components/layout/app-layout";
import { useTitle } from "@/hooks/use-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Type, 
  AlignLeft, 
  Calendar, 
  CheckSquare, 
  Circle, 
  Upload, 
  Hash,
  Mail,
  Phone,
  Settings,
  MessageCircle,
  Wand2
} from "lucide-react";

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

const availableTools = [
  { id: "text", label: "Text Input", icon: Type, type: "text" },
  { id: "textarea", label: "Text Area", icon: AlignLeft, type: "textarea" },
  { id: "email", label: "Email", icon: Mail, type: "email" },
  { id: "phone", label: "Phone", icon: Phone, type: "tel" },
  { id: "number", label: "Number", icon: Hash, type: "number" },
  { id: "date", label: "Date", icon: Calendar, type: "date" },
  { id: "checkbox", label: "Checkbox", icon: CheckSquare, type: "checkbox" },
  { id: "radio", label: "Radio Button", icon: Circle, type: "radio" },
  { id: "file", label: "File Upload", icon: Upload, type: "file" },
];

export default function NewFormBuilder() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  useTitle(isEditing ? "Edit Form" : "New Form");

  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [rightPanelMode, setRightPanelMode] = useState<"properties" | "ai">("properties");

  const addField = (toolType: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: toolType,
      label: `New ${toolType} field`,
      placeholder: "",
      required: false,
    };
    
    if (toolType === "radio" || toolType === "checkbox") {
      newField.options = ["Option 1", "Option 2"];
    }
    
    setFormFields([...formFields, newField]);
    setSelectedField(newField);
    setRightPanelMode("properties");
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormFields(fields => 
      fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );
    
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
  };

  const removeField = (fieldId: string) => {
    setFormFields(fields => fields.filter(field => field.id !== fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const toolsColumn = (
    <div className="h-full p-4">
      <h3 className="text-lg font-semibold mb-4">Form Tools</h3>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-2">
          {availableTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => addField(tool.type)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tool.label}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  const previewColumn = (
    <div className="h-full p-4 bg-gray-50">
      <div className="mb-4">
        <Input
          placeholder="Form Title"
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          className="mb-2 text-xl font-semibold"
        />
        <Textarea
          placeholder="Form Description"
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          className="mb-4"
        />
      </div>

      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-4">
          {formFields.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Type className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Add form fields from the tools panel</p>
            </div>
          ) : (
            formFields.map((field) => (
              <Card
                key={field.id}
                className={`cursor-pointer transition-colors ${
                  selectedField?.id === field.id ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => {
                  setSelectedField(field);
                  setRightPanelMode("properties");
                }}
              >
                <CardContent className="p-4">
                  <Label className="text-sm font-medium">{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      placeholder={field.placeholder}
                      className="mt-1"
                      disabled
                    />
                  ) : field.type === "checkbox" || field.type === "radio" ? (
                    <div className="mt-2 space-y-2">
                      {field.options?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type={field.type}
                            disabled
                            className="h-4 w-4"
                          />
                          <span className="text-sm">{option}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Input
                      type={field.type}
                      placeholder={field.placeholder}
                      className="mt-1"
                      disabled
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-red-600 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeField(field.id);
                    }}
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const propertiesPanel = (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Field Properties</h3>
      {selectedField ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="field-label">Label</Label>
            <Input
              id="field-label"
              value={selectedField.label}
              onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="field-placeholder">Placeholder</Label>
            <Input
              id="field-placeholder"
              value={selectedField.placeholder || ""}
              onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="field-required"
              checked={selectedField.required || false}
              onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
            />
            <Label htmlFor="field-required">Required field</Label>
          </div>

          {(selectedField.type === "radio" || selectedField.type === "checkbox") && (
            <div>
              <Label>Options</Label>
              <div className="space-y-2 mt-2">
                {selectedField.options?.map((option, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(selectedField.options || [])];
                        newOptions[index] = e.target.value;
                        updateField(selectedField.id, { options: newOptions });
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOptions = selectedField.options?.filter((_, i) => i !== index);
                        updateField(selectedField.id, { options: newOptions });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...(selectedField.options || []), `Option ${(selectedField.options?.length || 0) + 1}`];
                    updateField(selectedField.id, { options: newOptions });
                  }}
                >
                  Add Option
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500">Select a field to edit its properties</p>
      )}
    </div>
  );

  const aiChatPanel = (
    <div className="p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4">AI Form Assistant</h3>
      <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4">
        <div className="text-center text-gray-500">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>AI-powered form creation assistant</p>
          <p className="text-sm mt-2">Coming soon...</p>
        </div>
      </div>
      <div className="flex space-x-2">
        <Input placeholder="Describe what you want to add..." />
        <Button size="sm">
          <Wand2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const rightColumn = (
    <div className="h-full">
      <Tabs value={rightPanelMode} onValueChange={(value) => setRightPanelMode(value as "properties" | "ai")}>
        <TabsList className="grid w-full grid-cols-2 m-4">
          <TabsTrigger value="properties">
            <Settings className="h-4 w-4 mr-2" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Wand2 className="h-4 w-4 mr-2" />
            AI Assistant
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="properties" className="m-0 h-[calc(100%-80px)]">
          {propertiesPanel}
        </TabsContent>
        
        <TabsContent value="ai" className="m-0 h-[calc(100%-80px)]">
          {aiChatPanel}
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <AppLayout
      showThreeColumns={true}
      middleColumn={toolsColumn}
      rightColumn={
        <div className="flex flex-col h-full">
          <div className="flex-1 flex">
            <div className="flex-1 border-r border-gray-200">
              {previewColumn}
            </div>
            <div className="w-80">
              {rightColumn}
            </div>
          </div>
          <div className="border-t border-gray-200 p-4">
            <div className="flex justify-end space-x-2">
              <Button variant="outline">Cancel</Button>
              <Button>Save Form</Button>
            </div>
          </div>
        </div>
      }
    />
  );
}