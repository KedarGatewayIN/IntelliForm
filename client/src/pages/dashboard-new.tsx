import ThreeColumnLayout from "@/components/layout/three-column-layout";
import { Card, CardContent } from "@/components/ui/card";
import { useTitle } from "@/hooks/use-title";
import { Construction } from "lucide-react";

export default function DashboardNew() {
  useTitle("Dashboard");

  return (
    <ThreeColumnLayout>
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md mx-4">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Construction className="h-8 w-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Dashboard Coming Soon
            </h1>
            <p className="text-gray-600">
              We're working on an amazing dashboard experience for you. 
              Stay tuned for updates!
            </p>
          </CardContent>
        </Card>
      </div>
    </ThreeColumnLayout>
  );
}