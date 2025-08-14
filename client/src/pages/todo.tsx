import React from "react";
import { useLocation } from "wouter";
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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";

const TodoPage: React.FC = () => {
  const [, navigate] = useLocation();

  const {
    data: { response: problems } = { response: [] },
    isLoading: problemsLoading,
  } = useQuery<{
    response: {
      problem: string;
      count: number;
      form: {
        form_id: string;
        title: string;
        submission_id: string;
      }[];
    }[];
  }>({
    queryKey: ["/api/ai/summarize-problems"],
  });

  function removeDuplicates<T>(array: T[], key: keyof T): T[] {
    const seen = new Set<any>();
    return array.filter((item) => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>TODO Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            {problemsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : problems && problems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Problem</TableHead>
                    <TableHead>Form Name</TableHead>
                    <TableHead className="text-center">Count</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problems.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell className="font-medium capitalize">
                        {item.problem}
                      </TableCell>
                      <TableCell className="font-medium">
                        {removeDuplicates(item.form, "form_id").length > 0
                          ? removeDuplicates(item.form, "form_id").map((form) => (
                              <Button
                                key={form.form_id}
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  navigate(
                                    `/forms/${form.form_id}/analytics`
                                  )
                                }
                              >
                                {form.title}
                              </Button>
                            ))
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="bg-blue-100 text-blue-800 border-blue-200"
                        >
                          {item.count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TableCell>
                          <ScrollArea className="w-16 overflow-x-auto">
                            <Tooltip>
                              {item.form.map((form) => (
                                <>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() =>
                                        navigate(
                                          `/forms/${form.form_id}/responses/${form.submission_id}`
                                        )
                                      }
                                    >
                                      <BarChart3 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    View Submission
                                  </TooltipContent>
                                </>
                              ))}
                            </Tooltip>
                          </ScrollArea>
                        </TableCell>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No problems found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TodoPage;
