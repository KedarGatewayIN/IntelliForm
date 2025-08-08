import React, { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CalendarIcon, StarIcon, UploadIcon } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

// Helper function to validate a field's value based on its type and rules.
const validateField = (
  field: FormField,
  response: any
): { valid: boolean; value?: any; message?: string } => {
  let value: any = response;
  // Required field validation
  if (
    field.required &&
    (value == null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0))
  ) {
    return { valid: false, message: "This field is required." };
  }

  // Type-specific validation and custom validation rules
  if (field.validation) {
    for (const rule of field.validation) {
      switch (rule.type) {
        case "min":
          if (typeof value === "string" && value.length < rule.value)
            return { valid: false, message: rule.message };
          if (typeof value === "number" && value < rule.value)
            return { valid: false, message: rule.message };
          if (Array.isArray(value) && value.length < rule.value)
            return { valid: false, message: rule.message };
          break;
        case "max":
          if (typeof value === "string" && value.length > rule.value)
            return { valid: false, message: rule.message };
          if (typeof value === "number" && value > rule.value)
            return { valid: false, message: rule.message };
          if (Array.isArray(value) && value.length > rule.value)
            return { valid: false, message: rule.message };
          break;
        case "pattern":
          if (
            typeof value === "string" &&
            !new RegExp(rule.value).test(value)
          ) {
            return { valid: false, message: rule.message };
          }
          break;
      }
    }
  }

  return { valid: true, value };
};

// Renders the appropriate input control based on the field type for non-text fields.
const FieldRenderer: React.FC<{
  field: FormField;
  onSubmit: (value: any) => void;
}> = ({ field, onSubmit }) => {
  const [localValue, setLocalValue] = useState<any>(
    field.type === "checkbox" ? [] : ""
  );
  const [touched, setTouched] = useState(false);
  const validationError =
    touched && !validateField(field, localValue)?.valid
      ? validateField(field, localValue)?.message
      : null;

  const handleChange = (value: any) => {
    setLocalValue(value);
    setTouched(true);
  };

  const handleSubmit = () => {
    if (validateField(field, localValue).valid) {
      onSubmit(localValue);
    }
  };

  switch (field.type) {
    case "password":
    case "url":
      return (
        <div>
          <Input
            type={field.type}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
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
            autoFocus
          />
          {validationError && (
            <p className="text-red-500 text-sm mt-1">{validationError}</p>
          )}
          <Button
            onClick={handleSubmit}
            className="mt-2"
            disabled={!!validationError}
          >
            Submit
          </Button>
        </div>
      );
    case "radio":
      return (
        <RadioGroup
          value={localValue}
          onValueChange={(val) => onSubmit(val)}
          className="space-y-2"
        >
          {(field.options || []).map((option) => (
            <Label
              key={option}
              className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted cursor-pointer"
            >
              <RadioGroupItem value={option} id={`${field.id}-${option}`} />
              <span>{option}</span>
            </Label>
          ))}
        </RadioGroup>
      );
    case "checkbox":
      return (
        <div className="space-y-2">
          {(field.options || []).map((option) => (
            <Label
              key={option}
              className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted cursor-pointer"
            >
              <Checkbox
                id={`${field.id}-${option}`}
                checked={localValue.includes(option)}
                onCheckedChange={(checked) => {
                  const newValue = checked
                    ? [...localValue, option]
                    : localValue.filter((v: string) => v !== option);
                  setLocalValue(newValue);
                }}
              />
              <span>{option}</span>
            </Label>
          ))}
          <Button onClick={() => onSubmit(localValue)} className="mt-2">
            Submit
          </Button>
        </div>
      );
    case "select":
      return (
        <Select onValueChange={(val) => onSubmit(val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "date":
      return (
        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal text-lg ${
                  validationError ? "border-red-500" : ""
                }`}
                onClick={() => setTouched(true)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localValue
                  ? format(new Date(localValue), "PPP")
                  : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={localValue ? new Date(localValue) : undefined}
                onSelect={(date) => {
                  const val = date?.toISOString();
                  handleChange(val);
                  onSubmit(val);
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
                  star <= (localValue || 0)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
                onClick={() => {
                  handleChange(star);
                  onSubmit(star);
                }}
              />
            ))}
          </div>
          {validationError && (
            <p className="text-red-500 text-sm mt-1">{validationError}</p>
          )}
        </div>
      );
    case "slider":
      return (
        <div>
          <Slider
            value={[localValue || 0]}
            onValueChange={(val) => handleChange(val[0])}
            min={0}
            max={100}
            step={1}
            className="mt-2"
          />
          <p className="text-sm text-gray-500 mt-1">Value: {localValue}</p>
          {validationError && (
            <p className="text-red-500 text-sm mt-1">{validationError}</p>
          )}
          <Button
            onClick={handleSubmit}
            className="mt-2"
            disabled={!!validationError}
          >
            Submit
          </Button>
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
              id="file-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleChange(file.name); // Simplified; handle upload in real app
                }
              }}
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <span className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Select File
              </span>
            </label>
          </div>
          {validationError && (
            <p className="text-red-500 text-sm mt-1">{validationError}</p>
          )}
          <Button
            onClick={handleSubmit}
            className="mt-2"
            disabled={!!validationError}
          >
            Submit
          </Button>
        </div>
      );
    default:
      return null;
  }
};

export default function ConversationalForm() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [conversation, setConversation] = useState<
    { role: "system" | "user"; content: string }[]
  >([]);
  const [answeredFields, setAnsweredFields] = useState<Record<string, any>>({});
  const [activeField, setActiveField] = useState<FormField | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // --- STATE FOR SEAMLESS AI INTEGRATION ---
  const [isAiChatMode, setIsAiChatMode] = useState(false);
  const [aiChatStartIndex, setAiChatStartIndex] = useState<number | null>(null);

  const textInputTypes = [
    "text",
    "textarea",
    "email",
    "number",
    "password",
    "url",
  ];

  useEffect(() => {
    loadForm();
  }, [id]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [conversation]);

  // Effect to manage entering/exiting AI Chat Mode based on the active field.
  useEffect(() => {
    if (activeField?.type === "textarea" && (activeField as any).aiEnabled) {
      setIsAiChatMode(true);
      // When AI mode begins, we add the question to the log and record its index.
      // This marks the starting point of the AI interaction.
      setConversation((prev) => [
        ...prev,
        { role: "system", content: activeField.label },
      ]);
      setAiChatStartIndex(conversation.length);
    } else {
      setIsAiChatMode(false);
      setAiChatStartIndex(null);
    }
  }, [activeField]);

  const loadForm = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", `/api/public/forms/${id}`);
      const formData = await response.json();
      setForm(formData);
      const nextField = getNextField({}, formData.fields);
      setActiveField(nextField);
    } catch (error) {
      toast({
        title: "Error",
        description: "Form not found",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNextField = (
    currentAnswers: Record<string, any>,
    fields: FormField[]
  ): FormField | null => {
    for (const field of fields) {
      if (!currentAnswers.hasOwnProperty(field.id)) {
        const condition = field.conditionalLogic;
        if (condition && condition.fieldId && condition.value) {
          if (currentAnswers[condition.fieldId] === condition.value) {
            return field;
          }
        } else {
          return field;
        }
      }
    }
    return null;
  };

  const submitForm = async (finalAnswers: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", `/api/forms/${id}/submissions`, {
        responses: finalAnswers,
      });
      setIsSubmitted(true);
      setConversation((prev) => [
        ...prev,
        {
          role: "system",
          content: "Thank you for your submission!",
        },
      ]);
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Could not submit the form.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldSubmit = (field: FormField, value: any) => {
    const {
      valid,
      value: validatedValue,
      message,
    } = validateField(field, value);
    if (!valid) {
      toast({
        title: "Invalid Input",
        description: message,
        variant: "destructive",
      });
      return;
    }

    // Add question and final answer to the conversation log.
    setConversation((prev) => [
      ...prev,
      { role: "system", content: field.label },
      { role: "user", content: String(validatedValue) },
    ]);

    const newAnswers = { ...answeredFields, [field.id]: validatedValue };
    setAnsweredFields(newAnswers);
    setHistory((prev) => [...prev, field.id]);
    const nextField = getNextField(newAnswers, form!.fields);
    setActiveField(nextField);

    if (!nextField) {
      submitForm(newAnswers);
    }
  };

  const handleUserInputChange = async () => {
    if (!userInput.trim() || !activeField) return;

    const currentInput = userInput;
    setUserInput("");

    // --- AI CHAT MODE LOGIC ---
    if (isAiChatMode && aiChatStartIndex !== null) {
      setConversation((prev) => [
        ...prev,
        { role: "user", content: currentInput },
      ]);
      setIsSubmitting(true);

      try {
        const response = await apiRequest("POST", "/api/ai/chat", {
          message: currentInput,
        });
        const result = (await response.json()).response; // Expects { content, conversation_finished }

        setConversation((prev) => [
          ...prev,
          { role: "system", content: result.content },
        ]);

        if (result.conversation_finished) {
          // AI chat for this field is done. Time to summarize and move on.
          const chatToSummarize = conversation
            .slice(aiChatStartIndex + 1) // Get messages after the initial question
            .concat([
              { role: "user", content: currentInput },
              { role: "system", content: result.content },
            ])
            .map(
              (msg) =>
                `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
            )
            .join("\n");

          const summaryRes = await apiRequest("POST", "/api/ai/summarize", {
            conversation: chatToSummarize,
          });
          const summary =
            (await summaryRes.json()).response || "User provided feedback.";

          // Replace the detailed chat with the single, summarized answer.
          setConversation((prev) => {
            const cleanedConversation = prev.slice(0, aiChatStartIndex + 1); // Keep up to the initial question
            return [...cleanedConversation, { role: "user", content: summary }];
          });

          // Submit the summary as the field's answer and find the next field.
          const newAnswers = { ...answeredFields, [activeField.id]: summary };
          setAnsweredFields(newAnswers);
          setHistory((prev) => [...prev, activeField.id]);
          const nextField = getNextField(newAnswers, form!.fields);
          setActiveField(nextField); // This will trigger the useEffect to exit AI mode.

          if (!nextField) {
            submitForm(newAnswers);
          }
        }
      } catch (error) {
        toast({
          title: "AI Error",
          description: "The assistant is unavailable.",
          variant: "destructive",
        });
        // Failsafe: Revert the conversation to before the AI chat started
        setConversation((prev) => prev.slice(0, aiChatStartIndex));
        setIsAiChatMode(false); // Exit AI mode
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // --- STANDARD FORM LOGIC ---
      handleFieldSubmit(activeField, currentInput);
    }
  };

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading Form...
      </div>
    );
  if (!form)
    return (
      <div className="flex h-screen items-center justify-center">
        Form not found.
      </div>
    );
  if (isSubmitted) {
    return (
      <div className="flex h-screen items-center justify-center text-center p-4">
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {"Thank you!"}
          </h2>
          <p>Your submission has been received.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="px-6 py-4 border-b shadow-sm">
        <h1 className="text-2xl font-semibold">{form.title}</h1>
        <p className="text-sm text-muted-foreground">{form.description}</p>
      </header>

      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="space-y-4">
          {conversation.map((msg, index) => (
            <div
              key={index}
              className={`flex items-end space-x-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 rounded-lg max-w-md ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

          {activeField && !isAiChatMode && (
            <div className="flex items-end space-x-3 justify-start">
              <div className="p-3 rounded-lg max-w-md bg-muted">
                <p className="font-medium mb-2">{activeField.label}</p>
                {!textInputTypes.includes(activeField.type) ? (
                  <FieldRenderer
                    field={activeField}
                    onSubmit={(value) => handleFieldSubmit(activeField, value)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {activeField.placeholder ||
                      "Please provide your answer below."}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <footer className="px-6 py-4 border-t bg-background">
        {activeField && !isSubmitted && (
          <div className="flex items-center space-x-2">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUserInputChange();
              }}
              placeholder={
                isAiChatMode
                  ? "Chat with our assistant..."
                  : "Type your answer..."
              }
              disabled={
                isSubmitting || !textInputTypes.includes(activeField.type)
              }
              autoFocus
            />
            <Button
              onClick={handleUserInputChange}
              disabled={
                isSubmitting || !textInputTypes.includes(activeField.type)
              }
            >
              {isSubmitting ? "..." : "Send"}
            </Button>
          </div>
        )}
      </footer>
    </div>
  );
}
