import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { FormField } from "@shared/schema";
import { PlusIcon, XIcon, MousePointerIcon } from "lucide-react";

interface PropertiesPanelProps {
  selectedField: FormField | null;
  onUpdateField: (updates: Partial<FormField>) => void;
}

export default function PropertiesPanel({ selectedField, onUpdateField }: PropertiesPanelProps) {
  if (!selectedField) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
          <p className="text-sm text-gray-500 mt-1">Configure the selected element</p>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-gray-500">
            <MousePointerIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Select an element</p>
            <p className="text-sm mt-1">Click on a form element to configure its properties</p>
          </div>
        </div>
      </div>
    );
  }

  const hasOptions = ["radio", "checkbox", "select"].includes(selectedField.type);

  const addOption = () => {
    const options = selectedField.options || [];
    onUpdateField({
      options: [...options, `Option ${options.length + 1}`]
    });
  };

  const updateOption = (index: number, value: string) => {
    const options = [...(selectedField.options || [])];
    options[index] = value;
    onUpdateField({ options });
  };

  const removeOption = (index: number) => {
    const options = [...(selectedField.options || [])];
    options.splice(index, 1);
    onUpdateField({ options });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
        <p className="text-sm text-gray-500 mt-1">Configure the selected element</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Properties */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Basic Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field-label">Field Label</Label>
              <Input
                id="field-label"
                value={selectedField.label}
                onChange={(e) => onUpdateField({ label: e.target.value })}
                placeholder="Enter field label"
              />
            </div>

            {selectedField.type !== 'ai_conversation' && (
              <div className="space-y-2">
                <Label htmlFor="field-placeholder">Placeholder Text</Label>
                <Input
                  id="field-placeholder"
                  value={selectedField.placeholder || ""}
                  onChange={(e) => onUpdateField({ placeholder: e.target.value })}
                  placeholder="Enter placeholder text"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Required Field</Label>
                <p className="text-xs text-gray-500">Users must fill this field</p>
              </div>
              <Switch
                checked={selectedField.required}
                onCheckedChange={(required) => onUpdateField({ required })}
              />
            </div>

            {selectedField.type === 'textarea' && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable AI Assistance</Label>
                  <p className="text-xs text-gray-500">Add conversational AI to this field</p>
                </div>
                <Switch
                  checked={selectedField.aiEnabled || false}
                  onCheckedChange={(aiEnabled) => onUpdateField({ aiEnabled })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Options for choice fields */}
        {hasOptions && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(selectedField.options || []).map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Field Type Badge */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Field Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Badge variant="secondary" className="w-fit">
                {selectedField.type.replace('_', ' ').toUpperCase()}
              </Badge>
              {selectedField.aiEnabled && (
                <Badge variant="outline" className="w-fit ml-2 border-purple-200 text-purple-700">
                  AI ENABLED
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Validation Rules */}
        {["text", "email", "number"].includes(selectedField.type) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedField.type === "text" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="min-length">Minimum Length</Label>
                    <Input
                      id="min-length"
                      type="number"
                      placeholder="No minimum"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-length">Maximum Length</Label>
                    <Input
                      id="max-length"
                      type="number"
                      placeholder="No maximum"
                    />
                  </div>
                </>
              )}
              {selectedField.type === "number" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="min-value">Minimum Value</Label>
                    <Input
                      id="min-value"
                      type="number"
                      placeholder="No minimum"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-value">Maximum Value</Label>
                    <Input
                      id="max-value"
                      type="number"
                      placeholder="No maximum"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
