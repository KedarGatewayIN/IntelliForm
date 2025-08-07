import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import AIConversation from "./ai-conversation";
import type { FormField } from "@shared/schema";
import { CalendarIcon, StarIcon, UploadIcon } from "lucide-react";
import { format } from "date-fns";

interface QuestionRendererProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
}

export default function QuestionRenderer({ field, value, onChange }: QuestionRendererProps) {
  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "number":
        return (
          <Input
            type={field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className="text-lg"
            required={field.required}
            // maxLength={field.validation}
          />
        );

      case "textarea":
        if (field.aiEnabled) {
          return <AIConversation field={field} value={value} onChange={onChange} />;
        }
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className="text-lg min-h-32"
            required={field.required}
          />
        );

      case "radio":
        return (
          <RadioGroup value={value} onValueChange={onChange} required={field.required}>
            <div className="space-y-3">
              {(field.options || []).map((option, index) => (
                <Label
                  key={index}
                  htmlFor={`${field.id}-${index}`}
                  className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <RadioGroupItem value={option} id={`${field.id}-${index}`} className="mr-4" />
                  <span className="text-gray-900">{option}</span>
                </Label>
              ))}
            </div>
          </RadioGroup>
        );

      case "checkbox":
        const selectedValues = value || [];
        return (
          <div className="space-y-3">
            {(field.options || []).map((option, index) => (
              <Label
                key={index}
                htmlFor={`${field.id}-${index}`}
                className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Checkbox
                  id={`${field.id}-${index}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, option]);
                    } else {
                      onChange(selectedValues.filter((val: string) => val !== option));
                    }
                  }}
                  className="mr-4"
                />
                <span className="text-gray-900">{option}</span>
              </Label>
            ))}
          </div>
        );

      case "select":
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="text-lg">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option, index) => (
                <SelectItem key={index} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal text-lg"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => onChange(date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case "rating":
        return (
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={`h-8 w-8 cursor-pointer transition-colors ${
                  star <= (value || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                }`}
                onClick={() => onChange(star)}
              />
            ))}
          </div>
        );

      case "file":
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Click to upload or drag and drop</p>
            <p className="text-gray-500">SVG, PNG, JPG or GIF (max. 10MB)</p>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onChange(file.name); // In a real app, you'd upload the file
                }
              }}
            />
          </div>
        );

      default:
        return <Input placeholder="Unknown field type" disabled />;
    }
  };

  return (
    <div className="stepper-question">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </h2>
        {field.placeholder && (
          <p className="text-gray-600">{field.placeholder}</p>
        )}
      </div>

      {renderField()}
    </div>
  );
}
