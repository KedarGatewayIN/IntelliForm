import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/navbar";
import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { BarChart3, FileText, Inbox, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Submission {
  id: string;
  formId: string;
  formTitle: string;
  data: Record<string, any>;
  completedAt: string;
  timeTaken?: number;
  ipAddress?: string;
}

interface PaginatedSubmissions {
  submissions: Submission[];
  total: number;
  page: number;
  pageSize: number;
}

function SimplePagination({ 
  page, 
  pageSize, 
  total, 
  onPageChange 
}: { 
  page: number; 
  pageSize: number; 
  total: number; 
  onPageChange: (page: number) => void; 
}) {
  const totalPages = Math.ceil(total / pageSize);
  
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} submissions
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="text-sm">
          Page {page} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export default function RecentSubmissionsPage() {
  const [page, setPage] = useState(1);
  const [, navigate] = useLocation();
  const { data, isLoading } = useQuery<PaginatedSubmissions>({
    queryKey: ["/api/submissions/recent", page, 10], // 👈 page params in cache key
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/submissions/recent?page=${page}&pageSize=${10}`
      );
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return res.json();
    },
  });

  const hasSubmissions = data?.submissions && data.submissions.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !hasSubmissions ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Inbox className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No submissions yet
                </h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  When users submit responses to your forms, they will appear here for easy access and management.
                </p>
                <Button 
                  onClick={() => navigate("/")}
                  className="bg-primary hover:bg-primary/90"
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form Name</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Time Taken</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.submissions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-bold">{sub.formTitle}</TableCell>
                        <TableCell>
                          {new Date(sub.completedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{sub.ipAddress || "-"}</TableCell>
                        <TableCell>{formatDuration(sub.timeTaken!)}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      navigate(
                                        `/forms/${sub.formId}/responses/${sub.id}`
                                      )
                                    }
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  View Submission
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      navigate(`/forms/${sub.formId}/analytics`)
                                    }
                                  >
                                    <BarChart3 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  View Analytics
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4">
                  <SimplePagination
                    page={data?.page || 1}
                    pageSize={data?.pageSize || 10}
                    total={data?.total || 0}
                    onPageChange={setPage}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
