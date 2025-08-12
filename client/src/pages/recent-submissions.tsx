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
import { Pagination } from "@/components/ui/pagination";
import Navbar from "@/components/layout/navbar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { BarChart3, FileText } from "lucide-react";
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
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form Name</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.submissions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>{sub.formTitle}</TableCell>
                        <TableCell>
                          {new Date(sub.completedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{sub.ipAddress || "-"}</TableCell>
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
                <div className="mt-4 flex justify-end">
                  <Pagination
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
