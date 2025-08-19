import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  BotIcon,
  SendIcon,
  SparklesIcon,
  MinusIcon,
  MessageCircleIcon,
} from "lucide-react";
import type { Form } from "@shared/schema";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  formSuggestion?: Partial<Form>;
}

interface AIChatAssistantProps {
  form: Partial<Form>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Form>>>;
  isOpen: boolean;
  onToggle: () => void;
}

export default function AIChatAssistant({
  form,
  setForm,
  isOpen,
  onToggle,
}: AIChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI form building assistant. I can help you create forms by understanding what you need. Try saying something like 'Create a contact form' or 'Add a survey about customer satisfaction'.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isLoading && inputRef.current && isOpen) {
      inputRef.current.focus();
    }
  }, [isLoading, isOpen]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await apiRequest("POST", "/api/ai/form-builder", {
        message: inputMessage,
        currentForm: form,
        conversationHistory: messages.slice(-10),
      });

      const result = await response.json();

      setTimeout(() => {
        const assistantMessage: Message = {
          role: "assistant",
          content: result.message,
          timestamp: new Date().toISOString(),
          formSuggestion: result.formData,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (result.formData) {
          setForm(result.formData);
        }
        setIsTyping(false);
      }, 800);
    } catch (error) {
      setIsTyping(false);
      toast({
        title: "AI Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 hover:shadow-3xl hover:scale-110 transition-all duration-300 border-2 border-white/20 backdrop-blur-sm"
        size="sm"
      >
        <div className="relative">
          <MessageCircleIcon className="h-7 w-7 text-white" />
        </div>
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl border border-gray-200/50 bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden transform transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <img
                  src="https://tse1.mm.bing.net/th/id/OIP.62xhYrRo3ea-St_vraobugHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
                  alt="Gateway AI"
                  className="h-5 w-5"
                />
              </div>
            </div>
            <div>
              <span className="text-lg font-semibold text-gray-800">
                Gateway AI
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded-full font-medium">
                  BETA
                </span>
              </div>
            </div>
          </CardTitle>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-full hover:bg-gray-100 transition-colors"
          >
            <MinusIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-[500px] p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex animate-in slide-in-from-bottom-2 fade-in duration-300 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mr-3 shadow-md">
                  <BotIcon className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="flex flex-col max-w-[280px]">
                <div
                  className={`p-4 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-md ml-auto"
                      : "bg-white border border-gray-100 text-gray-800 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  {message.formSuggestion && (
                    <div className="mt-3 p-2 bg-white/10 rounded-lg border border-white/20">
                      <p className="text-xs opacity-90 flex items-center">
                        <SparklesIcon className="h-3 w-3 mr-1" />
                        Applied form changes
                      </p>
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs text-gray-400 mt-1 ${
                    message.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-in slide-in-from-bottom-2 fade-in">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mr-3 shadow-md">
                <BotIcon className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Describe the form you want to create..."
                disabled={isLoading}
                className="pr-12 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-200 placeholder:text-gray-400"
              />
              {inputMessage && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 rounded-xl px-4 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
