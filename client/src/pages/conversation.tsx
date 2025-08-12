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
import {
  CalendarIcon,
  StarIcon,
  UploadIcon,
  SendIcon,
  BotIcon,
  UserIcon,
  CheckCircleIcon,
  LoaderIcon,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface IAiConversation {
  submissionId: string;
  fieldId: string;
  messages: {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }[];
}

// Helper function to validate a field's value
const validateField = (
  field: FormField,
  response: any
): { valid: boolean; value?: any; message?: string } => {
  let value: any = response;

  if (
    field.required &&
    (value == null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0))
  ) {
    return { valid: false, message: "This field is required." };
  }

  if (field.validation) {
    for (const rule of field.validation) {
      switch (rule.type) {
        case "min":
          if (typeof value === "string" && value.length < rule.value)
            return { valid: false, message: rule.message };
          if (typeof value === "number" && value < rule.value)
            return { valid: false, message: rule.message };
          break;
        case "max":
          if (typeof value === "string" && value.length > rule.value)
            return { valid: false, message: rule.message };
          if (typeof value === "number" && value > rule.value)
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

// Modern Field Renderer Component
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
        <div className="space-y-3">
          <Input
            type={field.type}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            className={cn(
              "text-base border-2 transition-all duration-200 focus:border-blue-500",
              validationError
                ? "border-red-400 focus:border-red-500"
                : "border-gray-200"
            )}
            required={field.required}
            autoFocus
          />
          {validationError && (
            <p className="text-red-500 text-sm animate-in slide-in-from-top-1">
              {validationError}
            </p>
          )}
          <Button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            disabled={!!validationError}
          >
            Continue
          </Button>
        </div>
      );

    case "radio":
      return (
        <RadioGroup
          value={localValue}
          onValueChange={(val) => onSubmit(val)}
          className="space-y-3"
        >
          {(field.options || []).map((option, index) => (
            <Label
              key={option}
              className={cn(
                "flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200",
                "hover:border-blue-300 hover:bg-blue-50/50",
                "animate-in slide-in-from-left-2",
                localValue === option
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <RadioGroupItem value={option} id={`${field.id}-${option}`} />
              <span className="text-base">{option}</span>
            </Label>
          ))}
        </RadioGroup>
      );

    case "checkbox":
      return (
        <div className="space-y-4">
          <div className="space-y-3">
            {(field.options || []).map((option, index) => (
              <Label
                key={option}
                className={cn(
                  "flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200",
                  "hover:border-blue-300 hover:bg-blue-50/50",
                  "animate-in slide-in-from-left-2",
                  localValue.includes(option)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
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
                <span className="text-base">{option}</span>
              </Label>
            ))}
          </div>
          <Button
            onClick={() => onSubmit(localValue)}
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            Continue
          </Button>
        </div>
      );

    case "select":
      return (
        <Select onValueChange={(val) => onSubmit(val)}>
          <SelectTrigger className="text-base border-2 border-gray-200 focus:border-blue-500 h-12">
            <SelectValue placeholder="Choose an option" />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((option) => (
              <SelectItem
                key={option}
                value={option}
                className="text-base py-3"
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "date":
      return (
        <div className="space-y-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal text-base h-12 border-2 transition-all duration-200",
                  validationError
                    ? "border-red-400"
                    : "border-gray-200 hover:border-blue-300",
                  !localValue && "text-muted-foreground"
                )}
                onClick={() => setTouched(true)}
              >
                <CalendarIcon className="mr-3 h-5 w-5" />
                {localValue
                  ? format(new Date(localValue), "PPP")
                  : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
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
            <p className="text-red-500 text-sm animate-in slide-in-from-top-1">
              {validationError}
            </p>
          )}
        </div>
      );

    case "rating":
      return (
        <div className="space-y-4">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={cn(
                  "h-10 w-10 cursor-pointer transition-all duration-200 hover:scale-110",
                  star <= (localValue || 0)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300 hover:text-yellow-200"
                )}
                onClick={() => {
                  handleChange(star);
                  onSubmit(star);
                }}
              />
            ))}
          </div>
          {localValue > 0 && (
            <p className="text-center text-sm text-gray-600 animate-in fade-in">
              You rated {localValue} out of 5 stars
            </p>
          )}
        </div>
      );

    case "slider":
      return (
        <div className="space-y-4">
          <Slider
            value={[localValue || 0]}
            onValueChange={(val) => handleChange(val[0])}
            min={0}
            max={100}
            step={1}
            className="mt-4"
          />
          <div className="text-center">
            <span className="text-2xl font-bold text-blue-600">
              {localValue || 0}
            </span>
            <span className="text-gray-500 ml-1">/ 100</span>
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            disabled={!!validationError}
          >
            Continue
          </Button>
        </div>
      );

    case "file":
      return (
        <div className="space-y-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
              "hover:border-blue-400 hover:bg-blue-50/30",
              validationError ? "border-red-400" : "border-gray-300"
            )}
          >
            <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop your file here or click to browse
            </p>
            <p className="text-gray-500">SVG, PNG, JPG or GIF (max. 10MB)</p>
            <input
              type="file"
              className="hidden"
              id="file-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleChange(file.name);
                }
              }}
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <span className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                Select File
              </span>
            </label>
          </div>
          {validationError && (
            <p className="text-red-500 text-sm animate-in slide-in-from-top-1">
              {validationError}
            </p>
          )}
          <Button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            disabled={!!validationError}
          >
            Continue
          </Button>
        </div>
      );

    case "matrix":
      const matrixRows = field.matrixRows || ["Row 1", "Row 2", "Row 3"];
      const matrixColumns = field.matrixColumns || ["1", "2", "3", "4", "5"];
      const matrixValue = (localValue as Record<string, string>) || {};

      return (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg overflow-x-auto bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-4 border-b border-gray-200 bg-gray-50"></th>
                  {matrixColumns.map((col, index) => (
                    <th
                      key={index}
                      className="text-center p-4 border-b border-gray-200 font-medium text-gray-700 min-w-20 bg-gray-50"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    {/* Row label */}
                    <td className="p-4 font-medium text-gray-700 bg-gray-50 min-w-48 border-r border-gray-200">
                      {row}
                    </td>

                    {/* One radio per column */}
                    <RadioGroup
                      value={matrixValue[`${rowIndex}`] || ""}
                      onValueChange={(val) => {
                        const newValue = {
                          ...matrixValue,
                          [`${rowIndex}`]: val,
                        };
                        handleChange(newValue);
                      }}
                      className="contents"
                    >
                      {matrixColumns.map((_, colIndex) => (
                        <td key={colIndex} className="text-center p-4">
                          <div className="flex items-center justify-center">
                            <RadioGroupItem
                              value={`${colIndex + 1}`}
                              id={`${field.id}-${rowIndex}-${colIndex}`}
                              className="w-5 h-5 cursor-pointer"
                            />
                          </div>
                        </td>
                      ))}
                    </RadioGroup>
                  </tr>
                ))}
              </tbody>
            </table>

            {validationError && (
              <p className="text-red-500 text-sm animate-in slide-in-from-top-1">
                {validationError}
              </p>
            )}
          </div>

          <div className="w-20 ml-auto">
            <Button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              disabled={!!validationError}
            >
              Submit
            </Button>
          </div>
        </div>
      );

    default:
      return null;
  }
};

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex items-end space-x-3 justify-start animate-in slide-in-from-left-2">
    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
      <BotIcon className="w-4 h-4 text-white" />
    </div>
    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
    </div>
  </div>
);

export default function ConversationalForm() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [conversation, setConversation] = useState<
    { role: "system" | "user"; content: string; timestamp: Date }[]
  >([]);
  const [answeredFields, setAnsweredFields] = useState<Record<string, any>>({});
  const [activeField, setActiveField] = useState<FormField | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [startTime] = useState(Date.now());
  const [isAiChatMode, setIsAiChatMode] = useState(false);
  const [aiChatStartIndex, setAiChatStartIndex] = useState<number | null>(null);
  const [aiConversation, setAiConversation] = useState<IAiConversation[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, showTyping]);

  useEffect(() => {
    if (activeField?.type === "textarea" && (activeField as any).aiEnabled) {
      setIsAiChatMode(true);
      setShowTyping(true);
      setTimeout(() => {
        setShowTyping(false);
        setConversation((prev) => [
          ...prev,
          { role: "system", content: activeField.label, timestamp: new Date() },
        ]);
        setAiChatStartIndex(conversation.length);
      }, 1000);
    } else {
      setIsAiChatMode(false);
      setAiChatStartIndex(null);
    }
    inputRef.current?.focus();
  }, [activeField]);

  const loadForm = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", `/api/public/forms/${id}`);
      const formData = await response.json();
      setForm(formData);

      // Add welcome message
      setTimeout(() => {
        setConversation([
          {
            role: "system",
            content: `Hi! Welcome to ${formData.title}. ${formData.description}. Let's get started!`,
            timestamp: new Date(),
          },
        ]);

        setTimeout(() => {
          const nextField = getNextField({}, formData.fields);
          setActiveField(nextField);
        }, 1000);
      }, 500);
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

  const submitForm = async (
    finalAnswers: Record<string, any>,
    aiConvo?: IAiConversation[]
  ) => {
    setIsSubmitting(true);
    setShowTyping(true);

    try {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      const submission = await apiRequest(
        "POST",
        `/api/public/forms/${form!.id}/submit`,
        {
          data: finalAnswers,
          timeTaken,
        }
      );
      const response = await submission.json();
      if (aiConvo?.length) {
        await Promise.all(
          aiConvo.map((conv) => {
            apiRequest("POST", "/api/ai/saveAIConversation", {
              submissionId: response.submissionId,
              fieldId: conv.fieldId,
              messages: conv.messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
              })),
            });
          })
        );
      } else if (aiConversation.length) {
        await Promise.all(
          aiConversation.map((conv) => {
            apiRequest("POST", "/api/ai/saveAIConversation", {
              submissionId: response.submissionId,
              fieldId: conv.fieldId,
              messages: conv.messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
              })),
            });
          })
        );
      }

      setTimeout(() => {
        setShowTyping(false);
        setIsSubmitted(true);
        setConversation((prev) => [
          ...prev,
          {
            role: "system",
            content:
              "Perfect! Thank you for taking the time to complete this form. Your responses have been submitted successfully! 🎉",
            timestamp: new Date(),
          },
        ]);
      }, 1500);
    } catch (error) {
      setShowTyping(false);
      toast({
        title: "Submission Error",
        description: "Could not submit the form.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      inputRef.current?.focus();
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

    // Add user response
    setConversation((prev) => [
      ...prev,
      { role: "system", content: field.label, timestamp: new Date() },
      { role: "user", content: String(validatedValue), timestamp: new Date() },
    ]);

    const newAnswers = { ...answeredFields, [field.id]: validatedValue };
    setAnsweredFields(newAnswers);

    // Show typing indicator before next question
    setShowTyping(true);

    setTimeout(() => {
      setShowTyping(false);
      const nextField = getNextField(newAnswers, form!.fields);
      setActiveField(nextField);

      if (!nextField) {
        submitForm(newAnswers);
      }
    }, 800);
  };

  const handleUserInputChange = async () => {
    if (!userInput.trim() || !activeField) return;

    const currentInput = userInput;
    setUserInput("");

    if (isAiChatMode && aiChatStartIndex !== null) {
      setConversation((prev) => [
        ...prev,
        { role: "user", content: currentInput, timestamp: new Date() },
      ]);

      // setShowTyping(true);
      setIsSubmitting(true);

      try {
        const response = await apiRequest("POST", "/api/ai/chat", {
          message: currentInput,
        });
        const result = (await response.json()).response; // Expects { content, conversation_finished }

        setConversation((prev) => [
          ...prev,
          { role: "system", content: result.content, timestamp: new Date() },
        ]);

        if (result.conversation_finished) {
          // AI chat for this field is done. Time to summarize and move on.
          const chatToSummarize = conversation
            .slice(aiChatStartIndex)
            .concat([
              { role: "user", content: currentInput, timestamp: new Date() },
              {
                role: "system",
                content: result.content,
                timestamp: new Date(),
              },
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
          // setConversation((prev) => {
          //   const cleanedConversation = prev.slice(0, aiChatStartIndex + 1); // Keep up to the initial question
          //   return [...cleanedConversation, { role: "user", content: summary }];
          // });
          let aiConvo: IAiConversation[] = [];
          setAiConversation((prev) => {
            aiConvo = [
              ...prev,
              {
                submissionId: form!.id,
                fieldId: activeField.id,
                messages: conversation
                  .slice(aiChatStartIndex)
                  .concat([
                    {
                      role: "user",
                      content: currentInput,
                      timestamp: new Date(),
                    },
                    {
                      role: "system",
                      content: result.content,
                      timestamp: new Date(),
                    },
                  ])
                  .map((msg) => ({
                    role: msg.role === "system" ? "assistant" : "user",
                    content: msg.content,
                    timestamp: msg.timestamp!.toISOString(),
                  })),
              },
            ];
            return aiConvo;
          });

          // Submit the summary as the field's answer and find the next field.
          const newAnswers = { ...answeredFields, [activeField.id]: summary };
          setAnsweredFields(newAnswers);
          const nextField = getNextField(newAnswers, form!.fields);
          setActiveField(nextField); // This will trigger the useEffect to exit AI mode.

          if (!nextField) {
            submitForm(newAnswers, aiConvo);
          }
        }
      } catch (error) {
        setShowTyping(false);
        setIsSubmitting(false);
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
        setTimeout(() => {
          inputRef.current?.focus();
        });
      }
    } else {
      handleFieldSubmit(activeField, currentInput);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <LoaderIcon className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading your form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Form not found
          </h2>
          <p className="text-gray-600">
            The form you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <img
            src="https://thegatewaycorp.com/wp-content/themes/gatewaycorp/images/logo.svg"
            alt="Company Logo"
            className="h-8 w-auto"
          />
          <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
          <p className="text-gray-600 mt-1">{form.description}</p>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <ScrollArea className="flex-1 px-6 py-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {conversation.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-end space-x-3 animate-in slide-in-from-bottom-2",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {msg.role === "system" && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <BotIcon className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-md px-4 py-3 rounded-2xl shadow-sm",
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-white text-gray-900 rounded-bl-md border border-gray-200"
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {showTyping && <TypingIndicator />}

              {activeField && !isAiChatMode && !showTyping && (
                <div className="flex items-end space-x-3 justify-start animate-in slide-in-from-left-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <BotIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-md p-6 shadow-sm border border-gray-200 max-w-lg">
                    <p className="font-medium mb-4 text-gray-900">
                      {activeField.label}
                    </p>
                    {!textInputTypes.includes(activeField.type) ? (
                      <FieldRenderer
                        field={activeField}
                        onSubmit={(value) =>
                          handleFieldSubmit(activeField, value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-600">
                        {activeField.placeholder ||
                          "Please provide your answer below."}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {isSubmitted && (
                <div className="flex justify-center animate-in zoom-in-50">
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center max-w-md">
                    <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      Submission Complete!
                    </h3>
                    <p className="text-green-700">
                      Thank you for your time. Your responses have been
                      recorded.
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          {activeField && !isSubmitted && (
            <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleUserInputChange();
                      }
                    }}
                    placeholder={
                      isAiChatMode
                        ? "Continue the conversation..."
                        : activeField.placeholder || "Type your answer..."
                    }
                    disabled={
                      isSubmitting || !textInputTypes.includes(activeField.type)
                    }
                    className="text-base border-2 border-gray-200 focus:border-blue-500 pr-12 h-12 rounded-xl transition-all duration-200"
                    autoFocus
                    ref={inputRef}
                  />
                </div>
                <Button
                  onClick={handleUserInputChange}
                  disabled={
                    isSubmitting ||
                    !textInputTypes.includes(activeField.type) ||
                    !userInput.trim()
                  }
                  className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <SendIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
