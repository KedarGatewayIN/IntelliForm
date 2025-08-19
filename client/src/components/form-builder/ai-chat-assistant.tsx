import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BotIcon, SendIcon, MinimizeIcon, MaximizeIcon, XIcon, SparklesIcon } from "lucide-react";
import type { Form, FormField } from "@shared/schema";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  formSuggestion?: {
    action: 'create_form' | 'add_field' | 'modify_field' | 'update_form';
    data: any;
  };
}

interface AIChatAssistantProps {
  form: Partial<Form>;
  onUpdateForm: (updates: Partial<Form>) => void;
  onAddField: (fieldType: string, fieldData?: Partial<FormField>) => void;
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function AIChatAssistant({
  form,
  onUpdateForm,
  onAddField,
  onUpdateField,
  isOpen,
  onToggle,
}: AIChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI form building assistant. I can help you create forms by understanding what you need. Try saying something like 'Create a contact form' or 'Add a survey about customer satisfaction'.",
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/ai/form-builder", {
        message: inputMessage,
        currentForm: form,
        conversationHistory: messages.slice(-10), // Send last 10 messages for context
      });
      
      const result = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
        formSuggestion: result.formSuggestion,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Apply form suggestions if provided
      if (result.formSuggestion) {
        applyFormSuggestion(result.formSuggestion);
      }
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFormSuggestion = (suggestion: any) => {
    switch (suggestion.action) {
      case 'create_form':
        onUpdateForm({
          title: suggestion.data.title,
          description: suggestion.data.description,
        });
        break;
      case 'add_field':
        onAddField(suggestion.data.type, suggestion.data);
        break;
      case 'add_multiple_fields':
        // Add multiple fields in sequence
        suggestion.data.fields.forEach((fieldData: any) => {
          onAddField(fieldData.type, fieldData);
        });
        break;
      case 'modify_field':
        onUpdateField(suggestion.data.fieldId, suggestion.data.updates);
        break;
      case 'update_form':
        onUpdateForm(suggestion.data);
        break;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 transition-all duration-300"
        size="sm"
      >
        <SparklesIcon className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl border-2 border-primary/20 bg-white/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-secondary to-primary rounded-full flex items-center justify-center">
              <BotIcon className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg">AI Form Assistant</span>
            <span className="text-xs bg-gradient-to-r from-secondary to-primary text-white px-2 py-1 rounded-full">BETA</span>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
            >
              {isMinimized ? <MaximizeIcon className="h-4 w-4" /> : <MinimizeIcon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="flex flex-col h-[400px] p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-secondary to-primary rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                    <BotIcon className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[280px] p-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary to-secondary text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.formSuggestion && (
                    <div className="mt-2 p-2 bg-white/20 rounded-lg">
                      <p className="text-xs opacity-75">✨ Applied form changes</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 bg-gradient-to-r from-secondary to-primary rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                  <BotIcon className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe the form you want to create..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
                className="bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90"
              >
                <SendIcon className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Try: "Create a customer feedback form" or "Add a rating question"
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}