import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BotIcon, SparklesIcon, XIcon } from "lucide-react";

interface AIWelcomeBannerProps {
  onOpenChat: () => void;
}

export default function AIWelcomeBanner({ onOpenChat }: AIWelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Card className="mb-6 bg-gradient-to-r from-secondary/5 to-primary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-secondary to-primary rounded-full flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🎉 New: AI-Powered Form Building
              </h3>
              <p className="text-gray-600 mb-4">
                Create forms faster than ever with our AI assistant! Just describe what you need in natural language, 
                and watch as your form comes to life. Try saying "Create a customer feedback survey" or "Add contact fields".
              </p>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={onOpenChat}
                  className="bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90"
                  size="sm"
                >
                  <BotIcon className="h-4 w-4 mr-2" />
                  Try AI Assistant
                </Button>
                <div className="text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">Powered by AI</span>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}