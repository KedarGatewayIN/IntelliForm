import AppLayout from "@/components/layout/app-layout";
import { useTitle } from "@/hooks/use-title";
import { Construction } from "lucide-react";

export default function NewDashboard() {
  useTitle("Dashboard");

  return (
    <AppLayout>
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Construction className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Coming Soon
          </h1>
          <p className="text-lg text-gray-600">
            We're working hard to bring you an amazing dashboard experience.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}