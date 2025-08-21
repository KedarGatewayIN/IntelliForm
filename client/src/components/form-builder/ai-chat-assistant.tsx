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
  }, [messages, isOpen]);

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
    } else if (e.key === "Escape") {
      onToggle();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-[22rem] h-14 w-14 rounded-full 
             bg-gradient-to-br from-indigo-500 to-purple-600 
             shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 
             border border-white/30 backdrop-blur-md"
        size="sm"
      >
        <div className="relative flex items-center justify-center">
          <MessageCircleIcon className="h-6 w-6 text-white drop-shadow" />
        </div>
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-[22rem] w-96 h-[600px] shadow-2xl border border-gray-200/50 bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden transform transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in">
      <CardHeader className="p-[1.5rem] bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-b border-gray-200/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-3">
            <div className="w-[51px] h-[48px] bg-white/20 rounded-[12px] flex items-center justify-center backdrop-blur-[10px] border border-white/30 shadow-md">
              <img
                src="https://tse1.mm.bing.net/th/id/OIP.62xhYrRo3ea-St_vraobugHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
                alt="Gateway Logo"
                className="w-[50px] h-[47px] bg-white/20 rounded-[8px] backdrop-blur-[10px] border border-white/30"
              />
            </div>

            <div>
              <span className="text-lg font-semibold">Gateway AI</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                  BETA
                </span>
              </div>
            </div>
          </CardTitle>

          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-full hover:bg-white/10 transition-colors"
          >
            <MinusIcon className="h-4 w-4 text-white" />
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
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mr-3 shadow-md">
                  <BotIcon className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="flex flex-col max-w-[280px]">
                <div
                  className={`p-4 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md ml-auto"
                      : "bg-white border border-gray-100 text-gray-800 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
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
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mr-3 shadow-md">
                <BotIcon className="h-4 w-4 text-white" />
              </div>
              <div className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
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

        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-3">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Describe the form you want to create..."
              disabled={isLoading}
              className="flex-1 border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl px-4 shadow-md hover:scale-105 transition-all"
            >
              <SendIcon className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
