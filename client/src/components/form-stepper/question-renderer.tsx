import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import type { FormField, ValidationRule } from "@shared/schema";
import { CalendarIcon, StarIcon, UploadIcon } from "lucide-react";
import { format } from "date-fns";

interface QuestionRendererProps {
  autofocus: boolean;
  field: FormField;
  value: any;
  onChange?: (value: any) => void;
  previousStep?: () => void;
  nextStep?: () => void;
}

export default function QuestionRenderer({
  autofocus,
  field,
  value,
  onChange,
  previousStep,
  nextStep,
}: QuestionRendererProps) {
  const [touched, setTouched] = useState(false);

  // Reset touched state when field changes (e.g., navigating to a new question)
  useEffect(() => {
    setTouched(false);
  }, [field.id]);

  const validateField = (): string | null => {
    // Check if required field is filled
    if (field.required) {
      if (value === undefined || value === null || value === "") {
        return `${field.label} is required.`;
      }
      if (Array.isArray(value) && value.length === 0) {
        return `Please select at least one option for ${field.label}.`;
      }
    }

    // Skip validation if no value is provided and field is not required
    if (
      !field.required &&
      (value === undefined || value === null || value === "")
    ) {
      return null;
    }

    // Apply validation rules
    if (field.validation) {
      for (const rule of field.validation) {
        switch (rule.type) {
          case "min":
            if (
              field.type === "number" &&
              (isNaN(value) || Number(value) < Number(rule.value))
            ) {
              return rule.message;
            }
            if (
              (field.type === "text" ||
                field.type === "textarea" ||
                field.type === "email") &&
              value.length < Number(rule.value)
            ) {
              return rule.message;
            }
            if (
              (field.type === "checkbox" || field.type === "select") &&
              Array.isArray(value) &&
              value.length < Number(rule.value)
            ) {
              return rule.message;
            }
            break;
          case "max":
            if (
              field.type === "number" &&
              (isNaN(value) || Number(value) > Number(rule.value))
            ) {
              return rule.message;
            }
            if (
              (field.type === "text" ||
                field.type === "textarea" ||
                field.type === "email") &&
              value.length > Number(rule.value)
            ) {
              return rule.message;
            }
            if (
              (field.type === "checkbox" || field.type === "select") &&
              Array.isArray(value) &&
              value.length > Number(rule.value)
            ) {
              return rule.message;
            }
            break;
          case "email":
            if (field.type === "email" && value) {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                return rule.message;
              }
            }
            break;
          case "url":
            if ((field.type === "text" || field.type === "textarea") && value) {
              const urlRegex =
                /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
              if (!urlRegex.test(value)) {
                return rule.message;
              }
            }
            break;
          case "pattern":
            if (
              (field.type === "text" ||
                field.type === "textarea" ||
                field.type === "email") &&
              value
            ) {
              const regex = new RegExp(rule.value as string);
              if (!regex.test(value)) {
                return rule.message;
              }
            }
            break;
        }
      }
    }

    return null;
  };

  const validationError = touched ? validateField() : null;

  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "number":
        return (
          <div>
            <Input
              type={
                field.type === "email"
                  ? "email"
                  : field.type === "number"
                    ? "number"
                    : "text"
              }
              value={value || ""}
              onChange={(e) => {
                onChange(e.target.value);
                setTouched(true);
              }}
              onBlur={() => setTouched(true)}
              placeholder={
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }
              className={`text-lg ${validationError ? "border-red-500" : ""}`}
              required={field.required}
              maxLength={
                field.validation?.find((rule) => rule.type === "max")?.value as
                  | number
                  | undefined
              }
              autoFocus={autofocus}
            />
            {validationError && (
              <p className="text-red-500 text-sm mt-1">{validationError}</p>
            )}
          </div>
        );

      case "textarea":
        // if (field.aiEnabled) {
        //   return <AIConversation field={field} value={value} onChange={onChange} />;
        // }
        return (
          <div>
            <Textarea
              value={value || ""}
              onChange={(e) => {
                onChange(e.target.value);
                setTouched(true);
              }}
              onBlur={() => setTouched(true)}
              placeholder={
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }
              className={`text-lg min-h-32 ${validationError ? "border-red-500" : ""}`}
              required={field.required}
              maxLength={
                field.validation?.find((rule) => rule.type === "max")?.value as
                  | number
                  | undefined
              }
              autoFocus={autofocus}
            />
            {validationError && (
              <p className="text-red-500 text-sm mt-1">{validationError}</p>
            )}
          </div>
        );

      case "radio":
        return (
          <div>
            <RadioGroup
              value={value}
              onValueChange={(val) => {
                onChange(val);
                setTouched(true);
              }}
              required={field.required}
              autoFocus={autofocus}
            >
              <div className="space-y-3">
                {(field.options || []).map((option, index) => (
                  <Label
                    key={index}
                    htmlFor={`${field.id}-${index}`}
                    className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <RadioGroupItem
                      value={option}
                      id={`${field.id}-${index}`}
                      className="mr-4"
                    />
                    <span className="text-gray-900">{option}</span>
                  </Label>
                ))}
              </div>
            </RadioGroup>
            {validationError && (
              <p className="text-red-500 text-sm mt-1">{validationError}</p>
            )}
          </div>
        );

      case "checkbox":
        const selectedValues = value || [];
        return (
          <div>
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
                        onChange(
                          selectedValues.filter(
                            (val: string) => val !== option,
                          ),
                        );
                      }
                      setTouched(true);
                    }}
                    className="mr-4"
                  />
                  <span className="text-gray-900">{option}</span>
                </Label>
              ))}
            </div>
            {validationError && (
              <p className="text-red-500 text-sm mt-1">{validationError}</p>
            )}
          </div>
        );

      case "select":
        return (
          <div>
            <Select
              value={value}
              onValueChange={(val) => {
                onChange(val);
                setTouched(true);
              }}
            >
              <SelectTrigger
                className={`text-lg ${validationError ? "border-red-500" : ""}`}
              >
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent autoFocus={autofocus}>
                {(field.options || []).map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationError && (
              <p className="text-red-500 text-sm mt-1">{validationError}</p>
            )}
          </div>
        );

      case "date":
        return (
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal text-lg ${validationError ? "border-red-500" : ""}`}
                  onClick={() => setTouched(true)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value ? format(new Date(value), "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => {
                    onChange(date?.toISOString());
                    setTouched(true);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {validationError && (
              <p className="text-red-500 text-sm mt-1">{validationError}</p>
            )}
          </div>
        );

      case "rating":
        return (
          <div>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`h-8 w-8 cursor-pointer transition-colors ${
                    star <= (value || 0)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                  onClick={() => {
                    onChange(star);
                    setTouched(true);
                  }}
                />
              ))}
            </div>
            {validationError && (
              <p className="text-red-500 text-sm mt-1">{validationError}</p>
            )}
          </div>
        );

      case "file":
        return (
          <div>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-gray-400 transition-colors ${
                validationError ? "border-red-500" : "border-gray-300"
              }`}
            >
              <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-gray-500">SVG, PNG, JPG or GIF (max. 10MB)</p>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onChange(file.name); // In a real app, you'd upload the file
                    setTouched(true);
                  }
                }}
                onClick={() => setTouched(true)}
              />
            </div>
            {validationError && (
              <p className="text-red-500 text-sm mt-1">{validationError}</p>
            )}
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          nextStep();
        }}
      >
        {renderField()}
      </form>
    </div>
  );
}
