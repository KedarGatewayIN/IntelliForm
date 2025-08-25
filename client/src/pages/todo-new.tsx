import { useState } from "react";
import ThreeColumnLayout from "@/components/layout/three-column-layout";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useTitle } from "@/hooks/use-title";
import {
  SearchIcon,
  CheckSquareIcon,
  InfoIcon,
  BarChart3Icon,
  CheckCheckIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function TodoNew() {
  useTitle("Todo");
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [resolveComment, setResolveComment] = useState("");
  const [resolvePopover, setResolvePopover] = useState<{
    problem: string;
    ids: string[];
  } | null>(null);

  const {
    data: { response: problems } = { response: [] },
    isLoading,
    refetch,
  } = useQuery<{
    response: {
      problem: string;
      count: number;
      form: {
        form_id: string;
        title: string;
        submission_id: string;
        completed_at?: string | null;
      }[];
      solutions: string[];
      ids?: string[];
    }[];
  }>({
    queryKey: ["/api/ai/summarize-problems"],
  });

  const filteredProblems = problems.filter((problem) =>
    problem.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.form.some(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleResolve = async (problem: string, submissionIds: string[]) => {
    if (!resolveComment.trim()) {
      setResolvePopover({ problem, ids: submissionIds });
      return;
    }

    try {
      const response = await fetch("/api/problems/resolve-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          problem,
          submissionIds,
          resolutionComment: resolveComment.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to resolve problem");
      }

      toast({
        title: "Problem Resolved",
        description: "The problem has been marked as resolved across all submissions.",
      });

      setResolveComment("");
      setResolvePopover(null);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve problem. Please try again.",
        variant: "destructive",
      });
    }
  };

  const secondColumn = (
    <div className="h-full flex flex-col">
      {/* Header & Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Todo</h1>
        </div>
        
        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search problems..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Problems Table */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CheckSquareIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No problems found" : "No action items"}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              {searchQuery 
                ? "Try adjusting your search terms"
                : "When AI analyzes your form submissions and identifies problems, action items will appear here."
              }
            </p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Problem</TableHead>
                    <TableHead>Form Name</TableHead>
                    <TableHead className="text-center">Times Reported</TableHead>
                    <TableHead>Solutions</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead className="text-right">Resolve</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProblems.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell className="font-medium capitalize">
                        {item.problem}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Set(item.form.map(f => f.form_id))).map(formId => {
                            const form = item.form.find(f => f.form_id === formId);
                            return (
                              <Badge key={formId} variant="outline" className="text-xs">
                                {form?.title}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {item.count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm">
                              <InfoIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-2">
                              <h4 className="font-medium">Suggested Solutions:</h4>
                              <ul className="list-disc pl-4 space-y-1">
                                {item.solutions.map((solution, sIdx) => (
                                  <li key={sIdx} className="text-sm">{solution}</li>
                                ))}
                              </ul>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <BarChart3Icon className="h-4 w-4 mr-1" />
                              {item.form.length}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-72">
                            {item.form.map((form) => (
                              <DropdownMenuItem
                                key={form.submission_id}
                                className="flex flex-col items-start gap-0.5"
                              >
                                <span className="font-medium">{form.title}</span>
                                <span className="text-xs text-gray-500">
                                  {form.completed_at
                                    ? new Date(form.completed_at).toLocaleString()
                                    : form.submission_id}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="text-right">
                        <Popover
                          open={resolvePopover?.problem === item.problem}
                          onOpenChange={(open) => {
                            if (!open) {
                              setResolvePopover(null);
                              setResolveComment("");
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => {
                                const submissionIds = item.form.map(f => f.submission_id);
                                handleResolve(item.problem, submissionIds);
                              }}
                            >
                              <CheckCheckIcon className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-96" align="end">
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium">
                                  Resolution Details
                                </Label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Describe how you resolved this problem
                                </p>
                              </div>
                              <Textarea
                                value={resolveComment}
                                onChange={(e) => setResolveComment(e.target.value)}
                                placeholder="Add details about how you resolved this..."
                                rows={4}
                                className="resize-none"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setResolvePopover(null);
                                    setResolveComment("");
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (resolvePopover) {
                                      handleResolve(resolvePopover.problem, resolvePopover.ids);
                                    }
                                  }}
                                  disabled={!resolveComment.trim()}
                                >
                                  Confirm Resolution
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <ThreeColumnLayout secondColumn={secondColumn} />
  );
}