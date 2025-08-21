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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/navbar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { BarChart3, CheckSquare, SquareArrowOutUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTitle } from "@/hooks/use-title";
import { useQuery } from "@tanstack/react-query";

const TodoPage: React.FC = () => {
  useTitle("Action Items");
  const [, navigate] = useLocation();

  const {
    data: { response: problems } = { response: [] },
    isLoading: problemsLoading,
    refetch,
  } = useQuery<{
    response: {
      problem: string;
      count: number;
      form: {
        form_id: string;
        title: string;
        submission_id: string;
      }[];
      solutions: string[];
      ids?: string[];
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
                    <TableHead className="text-center">
                      Number of times reported
                    </TableHead>
                    <TableHead>Solutions</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead className="text-right">Resolve</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problems.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell className="font-medium capitalize">
                        {item.problem}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-wrap gap-2">
                          {removeDuplicates(item.form, "form_id").length > 0
                            ? removeDuplicates(item.form, "form_id").map(
                                (form) => (
                                  <Button
                                    key={form.form_id}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    aria-label={`Open analytics for ${form.title}`}
                                    onClick={() =>
                                      navigate(
                                        `/forms/${form.form_id}/analytics`
                                      )
                                    }
                                  >
                                    {form.title}
                                    <SquareArrowOutUpRight className="h-4 w-4" />
                                  </Button>
                                )
                              )
                            : "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="bg-blue-100 text-blue-800 border-blue-200"
                        >
                          {item.count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="hover:bg-blue-100"
                              aria-label="View Solutions"
                            >
                              <span className="sr-only">View Solutions</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-blue-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M12 20c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z"
                                />
                              </svg>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="max-w-xs p-4 rounded-lg shadow-lg bg-white border border-gray-200"
                          >
                            <div className="text-left">
                              <div className="font-semibold mb-2 text-blue-700">
                                Suggested Solutions
                              </div>
                              <ul className="list-disc pl-5 space-y-2">
                                {item.solutions.map((solution, idx) => (
                                  <li
                                    key={idx}
                                    className="text-gray-800 text-sm leading-snug"
                                  >
                                    {solution}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <BarChart3 className="h-4 w-4" />
                              {item.form.length}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-72">
                            {item.form.map((form) => (
                              <DropdownMenuItem
                                key={form.submission_id}
                                className="flex flex-col items-start gap-0.5 cursor-pointer"
                                onClick={() =>
                                  navigate(
                                    `/forms/${form.form_id}/responses/${form.submission_id}`
                                  )
                                }
                              >
                                <span className="font-medium">
                                  {form.title}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {form.submission_id}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="text-right">
                      <GroupResolveForm problem={item.problem} ids={item.form.map((f) => f.submission_id)} inputId={`group-res-${idx}`} refetch={refetch} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CheckSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No action items found
                </h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  When AI analyzes your form submissions and identifies
                  problems, action items will appear here with suggested
                  solutions to help you improve your forms.
                </p>
                <Button
                  onClick={() => navigate("/forms/new")}
                  className="bg-primary hover:bg-primary/90"
                >
                  Create Forms to Get Started
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TodoPage;
 
function GroupResolveForm({ problem, ids, inputId, refetch }: { problem: string; ids: string[]; inputId: string, refetch: any }) {
  const [comment, setComment] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/problems/resolve-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ problem, submissionIds: ids, resolutionComment: comment.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      refetch()
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <Tooltip delayDuration={100}>
      <Popover open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="default" size="sm" className="gap-2">
              Resolve Group
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>

        <PopoverContent className="w-96" align="end">
          <div className="space-y-3">
            <Label htmlFor={inputId} className="text-sm font-medium">
              Resolution Details
            </Label>
            <Textarea
              id={inputId}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide a brief resolution comment..."
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={loading}
                onClick={() => {
                  setComment("");
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button disabled={!comment.trim() || loading} onClick={handleConfirm}>
                Confirm Resolution
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <TooltipContent side="left">
        Resolve this problem across all listed submissions
      </TooltipContent>
    </Tooltip>
  );
}
