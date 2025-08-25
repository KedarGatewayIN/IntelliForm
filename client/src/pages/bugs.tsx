import AppLayout from "@/components/layout/app-layout";
import { useTitle } from "@/hooks/use-title";
import { Bug } from "lucide-react";

export default function Bugs() {
  useTitle("Bugs");

  return (
    <AppLayout>
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Bug className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bug Tracking Coming Soon
          </h1>
          <p className="text-lg text-gray-600">
            We're building a comprehensive bug tracking system for you.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}