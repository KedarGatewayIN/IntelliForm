import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { FormField } from "@shared/schema";
import { BotIcon, SendIcon } from "lucide-react";

interface AIConversationProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AIConversation({ field, value, onChange }: AIConversationProps) {
  const [messages, setMessages] = useState<Message[]>(value?.messages || []);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    onChange({
      messages,
      summary: messages.length > 0 ? `Conversation with ${messages.length} messages` : ""
    });
  }, [messages, onChange]);

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
      const response = await apiRequest("POST", "/api/ai/chat", {
        message: inputMessage,
        fieldId: field.id,
      });
      
      const result = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-secondary/10 to-primary/10 p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <BotIcon className="h-5 w-5 text-secondary" />
          <span className="font-medium text-gray-900">AI Assistant</span>
          <span className="text-xs bg-secondary text-white px-2 py-1 rounded-full">BETA</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          I'm here to help you provide detailed and accurate information.
        </p>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <BotIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start a conversation by typing a message below</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-r from-secondary to-primary rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                <BotIcon className="h-4 w-4 text-white" />
              </div>
            )}
            <div className={`max-w-xs p-3 rounded-2xl ${
              message.role === 'user'
                ? 'bg-gradient-to-r from-primary to-secondary text-white rounded-br-md'
                : 'bg-gray-100 text-gray-800 rounded-bl-md'
            }`}>
              <p className="text-sm">{message.content}</p>
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
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
