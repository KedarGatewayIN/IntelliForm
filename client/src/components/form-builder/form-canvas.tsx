import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FormElements from "./form-elements";
import type { Form, FormField } from "@shared/schema";
import { MousePointerIcon, BotIcon } from "lucide-react";

interface FormCanvasProps {
  form: Partial<Form>;
  selectedField: FormField | null;
  onSelectField: (field: FormField | null) => void;
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void;
  onDeleteField: (fieldId: string) => void;
  onMoveField: (fromIndex: number, toIndex: number) => void;
  onUpdateForm: (updates: Partial<Form>) => void;
}

export default function FormCanvas({
  form,
  selectedField,
  onSelectField,
  onUpdateField,
  onDeleteField,
  onMoveField,
  onUpdateForm,
}: FormCanvasProps) {
  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-sm border border-gray-200 min-h-96">
          <CardContent className="p-8">
            {/* Form Header */}
            <div className="mb-8">
              <Input
                type="text"
                value={form.title || ""}
                onChange={(e) =>
                  onUpdateForm({ ...form, title: e.target.value })
                }
                placeholder="Enter your form title..."
                className="text-2xl font-bold border-none outline-none shadow-none p-0 text-gray-900 placeholder-gray-400"
              />
              <Textarea
                value={form.description || ""}
                onChange={(e) =>
                  onUpdateForm({ ...form, description: e.target.value })
                }
                placeholder="Add a description (optional)..."
                className="mt-2 text-gray-600 placeholder-gray-400 border-none outline-none shadow-none p-0 resize-none"
                rows={2}
              />
            </div>

            {/* Form Fields */}
            {form.fields && form.fields.length > 0 ? (
              <div className="space-y-6">
                {form.fields.map((field, index) => (
                  <FormElements
                    key={field.id}
                    field={field}
                    isSelected={selectedField?.id === field.id}
                    onSelect={() => onSelectField(field)}
                    onUpdate={(updates) => onUpdateField(field.id, updates)}
                    onDelete={() => onDeleteField(field.id)}
                    onMove={(direction) => {
                      const newIndex =
                        direction === "up" ? index - 1 : index + 1;
                      if (newIndex >= 0 && newIndex < form.fields!.length) {
                        onMoveField(index, newIndex);
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              /* Drop Zone with AI suggestions */
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50/50">
                <MousePointerIcon className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  Click form element from the sidebar to start building
                </p>
                <p className="text-gray-400 text-sm mt-1">or</p>
                <div className="mt-6 p-4 bg-gradient-to-r from-secondary/5 to-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <BotIcon className="h-5 w-5 text-secondary" />
                    <span className="text-sm font-medium text-gray-700">
                      Try AI Assistant
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Let AI help you build your form with natural language
                  </p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>💬 "Create a customer feedback survey"</p>
                    <p>💬 "Add contact information fields"</p>
                    <p>💬 "Make a product review form"</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
