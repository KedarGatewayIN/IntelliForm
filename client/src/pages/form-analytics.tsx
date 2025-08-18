import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { useForm } from "@/hooks/use-forms";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeftIcon,
  EyeIcon,
  DownloadIcon,
  BarChart3Icon,
  CheckCircleIcon,
  BotIcon,
  ClockIcon,
  TrendingUpIcon,
  CircleX,
  BadgeAlert,
  CheckCheck,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface IFormAnalytics {
  totalResponses: number;
  completionRate: number;
  aiInteractions: number;
  averageTimeSeconds: number;
  recentResponses: Array<{
    id: string;
    completedAt: string;
    timeTaken: number;
    hasAiInteractions: boolean;
    status: "completed" | "partial";
  }>;
  responsesByDay: Array<{
    date: string;
    count: number;
  }>;
}

interface ISubmission {
  id: string;
  formId: string;
  data: {
    [key: string]: string;
  };
  completedAt: string;
  timeTaken: number;
  aiProblem: string;
  resolved: boolean;
  ipAddress: string;
  resolutionComment?: string;
  aiConversations: {
    id: string;
    submissionId: string;
    fieldId: string;
    messages: {
      role: string;
      content: string;
      timestamp: string;
    }[];
    createdAt: string;
  }[];
}

export default function FormAnalytics() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: form, isLoading: formLoading } = useForm(params.id);

  const { data: analytics, isLoading: analyticsLoading } =
    useQuery<IFormAnalytics>({
      queryKey: ["/api/forms", params.id, "analytics"],
      enabled: !!params.id,
    });
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  const [resolvePopover, setResolvePopover] = useState<{
    submissionId: string | null;
    anchor: "row" | "dialog" | null;
  }>({ submissionId: null, anchor: null });
  const [resolutionComment, setResolutionComment] = useState<string>("");

  const { data: submissions, isLoading: submissionsLoading } = useQuery<
    ISubmission[]
  >({
    queryKey: ["/api/forms", params.id, "submissions"],
    enabled: !!params.id,
  });

  const exportData = async () => {
    try {
      const response = await apiRequest(
        "GET",
        `/api/forms/${params.id}/export`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${form?.title || "form"}-responses.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Your form responses have been downloaded as CSV.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export form data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const updateSubmissionResolved = (
    submission_id: string,
    resolved: boolean,
    comment?: string,
    anchor?: "row" | "dialog"
  ) => {
    if (resolved) {
      if (!comment || !comment.trim()) {
        setResolvePopover({
          submissionId: submission_id,
          anchor: anchor ?? "row",
        });
        return;
      }
      apiRequest("PUT", `/api/submission/${submission_id}`, {
        resolved,
        resolutionComment: comment.trim(),
      })
        .then((resp) => resp.json())
        .then((updated: ISubmission) => {
          toast({
            title: "Update Successful",
            description: `Submission marked as resolved.`,
          });
          queryClient.setQueryData<ISubmission[]>(
            ["/api/forms", params.id, "submissions"],
            (old) => {
              if (!old) return [];
              return old.map((val) =>
                val.id === submission_id
                  ? {
                      ...val,
                      resolved: true,
                      resolutionComment: comment.trim(),
                    }
                  : val
              );
            }
          );
          setUser((prev) => {
            prev!.todoCount -= 1;
            return prev;
          });
          setResolvePopover({ submissionId: null, anchor: null });
          setResolutionComment("");
        })
        .catch(() => {
          toast({
            title: "Update Failed",
            description:
              "Failed to update submission status. Please try again.",
            variant: "destructive",
          });
        });
      return;
    }

    apiRequest("PUT", `/api/submission/${submission_id}`, {
      resolved,
    })
      .then(() => {
        toast({
          title: "Update Successful",
          description: `Submission marked as ${
            resolved ? "resolved" : "unresolved"
          }.`,
        });
        queryClient.setQueryData<ISubmission[]>(
          ["/api/forms", params.id, "submissions"],
          (old) => {
            if (!old) return [];
            return old.map((val) => {
              if (val.id === submission_id) {
                val.resolved = resolved;
              }
              return val;
            });
          }
        );
        setUser((prev) => {
          if (resolved) prev!.todoCount -= 1;
          else prev!.todoCount += 1;
          return prev;
        });
      })
      .catch((error) => {
        toast({
          title: "Update Failed",
          description: "Failed to update submission status. Please try again.",
          variant: "destructive",
        });
      });
  };

  if (formLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto pt-20 px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Form Not Found
              </h1>
              <p className="text-gray-600">
                The form you're looking for doesn't exist.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = analytics || {
    totalResponses: 0,
    completionRate: 0,
    aiInteractions: 0,
    averageTimeSeconds: 0,
    recentResponses: [],
    responsesByDay: [],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{form.title}</h1>
              <p className="text-gray-600 mt-1">Form Analytics & Responses</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={exportData}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => navigate(`/forms/${params.id}/preview`)}>
              <EyeIcon className="h-4 w-4 mr-2" />
              View Form
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Responses
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalResponses}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <BarChart3Icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-green-600 font-medium">+12%</span>
                <span className="text-gray-500 ml-2">from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Completion Rate
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {Math.round(stats.completionRate)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-accent" />
                </div>
              </div>
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.completionRate}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    AI Interactions
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.aiInteractions}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <BotIcon className="h-6 w-6 text-secondary" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-secondary font-medium">
                  {stats.totalResponses > 0
                    ? Math.round(
                        (stats.aiInteractions / stats.totalResponses) * 100
                      )
                    : 0}
                  %
                </span>
                <span className="text-gray-500 ml-2">used AI assistance</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatDuration(stats.averageTimeSeconds)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">-8%</span>
                <span className="text-gray-500 ml-2">faster than average</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Responses</CardTitle>
          </CardHeader>
          <CardContent>
            {submissionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : submissions && submissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Time Taken</TableHead>
                    <TableHead>AI Used</TableHead>
                    <TableHead>Action Needed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id} className="hover:bg-gray-50">
                      <TableCell>
                        {formatDate(submission.completedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 border-green-200"
                        >
                          Completed
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {submission.timeTaken
                          ? formatDuration(submission.timeTaken)
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {submission.aiConversations &&
                        submission.aiConversations.length > 0 ? (
                          <BotIcon className="h-4 w-4 text-secondary" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <TooltipTrigger asChild>
                                    {!submission.aiProblem ||
                                    submission.resolved ? (
                                      <Button variant="outline" size="sm">
                                        <CheckCheck className="h-4 w-4 text-green-600 cursor-pointer" />
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="destructiveOutline"
                                        size="sm"
                                      >
                                        <BadgeAlert className="h-4 w-4 cursor-pointer" />
                                      </Button>
                                    )}
                                  </TooltipTrigger>
                                </DialogTrigger>

                                {/* Tooltip Content */}
                                <TooltipContent side="top" align="center">
                                  {!submission.aiProblem
                                    ? "No problem detected"
                                    : submission.resolved
                                    ? "Problem Resolved"
                                    : submission.aiProblem}
                                </TooltipContent>

                                {/* Dialog Content */}
                                <DialogContent className="max-w-4xl h-auto max-h-[90vh] flex flex-col overflow-hidden">
                                  <DialogHeader className="pb-4 border-b">
                                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                                      <BotIcon className="h-5 w-5 text-secondary" />
                                      Submission Insights
                                    </DialogTitle>
                                    <p className="text-sm text-muted-foreground">
                                      Detailed analysis of AI interactions and
                                      suggested improvements.
                                    </p>
                                  </DialogHeader>

                                  <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
                                    {/* Issue Status Banner */}
                                    <div
                                      className={`rounded-lg p-4 border-l-4 ${
                                        !submission.aiProblem
                                          ? "bg-green-50 border-l-green-400"
                                          : submission.resolved
                                          ? "bg-blue-50 border-l-blue-400"
                                          : "bg-red-50 border-l-red-400"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {!submission.aiProblem ? (
                                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                        ) : submission.resolved ? (
                                          <CheckCheck className="h-5 w-5 text-blue-600" />
                                        ) : (
                                          <BadgeAlert className="h-5 w-5 text-red-600" />
                                        )}
                                        <span className="font-medium text-sm">
                                          {!submission.aiProblem
                                            ? "No Issues Detected"
                                            : submission.resolved
                                            ? "Issue Resolved"
                                            : "Action Required"}
                                        </span>
                                      </div>
                                    </div>

                                    {/* AI Issue Summary */}
                                    <Card className="shadow-sm border-0 bg-gradient-to-r from-red-50 to-orange-50">
                                      <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                          <CircleX className="h-4 w-4 text-red-500" />
                                          Issue Summary
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="pt-0">
                                        <div className="bg-white rounded-md p-4 border border-red-100">
                                          <p className="text-sm text-gray-700 leading-relaxed first-letter:capitalize">
                                            {submission.aiProblem?.trim()
                                              ?.length
                                              ? submission.aiProblem
                                              : "No AI issues were flagged for this submission. The user completed the form without requiring AI assistance or encountering any problems."}
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    <Card className="shadow-sm border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
                                      <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                          <BotIcon className="h-4 w-4 text-blue-500" />
                                          Recommended Actions
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="pt-0">
                                        <div className="bg-white rounded-md p-4 border border-blue-100">
                                          <div className="space-y-3">
                                            {submission.aiProblem
                                              ?.toLowerCase()
                                              .includes("unclear") ||
                                            submission.aiProblem
                                              ?.toLowerCase()
                                              .includes("confusing") ? (
                                              <div className="flex items-start gap-3">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                  <span className="text-xs font-bold text-blue-600">
                                                    1
                                                  </span>
                                                </div>
                                                <div>
                                                  <p className="font-medium text-sm text-gray-900">
                                                    Clarify Question Wording
                                                  </p>
                                                  <p className="text-sm text-gray-600">
                                                    Revise ambiguous language
                                                    and add context to help
                                                    users understand what's
                                                    expected.
                                                  </p>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="flex items-start gap-3">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                  <span className="text-xs font-bold text-blue-600">
                                                    1
                                                  </span>
                                                </div>
                                                <div>
                                                  <p className="font-medium text-sm text-gray-900">
                                                    Improve Field Guidance
                                                  </p>
                                                  <p className="text-sm text-gray-600">
                                                    Add helpful placeholders and
                                                    examples to set clear
                                                    expectations.
                                                  </p>
                                                </div>
                                              </div>
                                            )}

                                            <div className="flex items-start gap-3">
                                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-xs font-bold text-blue-600">
                                                  2
                                                </span>
                                              </div>
                                              <div>
                                                <p className="font-medium text-sm text-gray-900">
                                                  Add Input Validation
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                  Implement real-time validation
                                                  to catch issues before AI
                                                  assistance is needed.
                                                </p>
                                              </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-xs font-bold text-blue-600">
                                                  3
                                                </span>
                                              </div>
                                              <div>
                                                <p className="font-medium text-sm text-gray-900">
                                                  Optimize Form Flow
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                  Break complex sections into
                                                  smaller, more manageable
                                                  steps.
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    {/* Resolution Details */}
                                    {submission.resolved && (
                                      <Card className="shadow-sm border-0 bg-gradient-to-r from-green-50 to-emerald-50">
                                        <CardHeader className="pb-3">
                                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                            Resolution Details
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                          <div className="bg-white rounded-md p-4 border border-green-100">
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                              {submission.resolutionComment?.trim()
                                                ?.length
                                                ? submission.resolutionComment
                                                : "This issue has been marked as resolved without additional details."}
                                            </p>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    )}

                                    <Card className="shadow-sm border-0 bg-gradient-to-r from-purple-50 to-pink-50">
                                      <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                          <BotIcon className="h-4 w-4 text-purple-500" />
                                          AI & User History
                                          <Badge
                                            variant="secondary"
                                            className="ml-2"
                                          >
                                            {submission.aiConversations
                                              ?.length || 0}{" "}
                                            conversations
                                          </Badge>
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="pt-0">
                                        <div className="bg-white rounded-md border border-purple-100 overflow-hidden">
                                          {submission.aiConversations
                                            ?.length ? (
                                            <Accordion
                                              type="multiple"
                                              className="w-full"
                                            >
                                              {submission.aiConversations.map(
                                                (conv, idx: number) => (
                                                  <AccordionItem
                                                    key={conv.id || idx}
                                                    value={String(
                                                      conv.id || idx
                                                    )}
                                                    className="border-b border-gray-100 last:border-b-0"
                                                  >
                                                    <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:bg-gray-50 no-underline hover:no-underline">
                                                      <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                          <BotIcon className="h-4 w-4 text-purple-600" />
                                                        </div>
                                                        <div className="text-left">
                                                          <p className="font-medium">
                                                            Field:{" "}
                                                            {conv.messages?.[0]
                                                              ?.content ||
                                                              "Unknown Field"}
                                                          </p>
                                                          <p className="text-xs text-gray-500 mt-0.5">
                                                            {conv.messages
                                                              ?.length ||
                                                              0}{" "}
                                                            messages •{" "}
                                                            {formatDate(
                                                              conv.createdAt
                                                            )}
                                                          </p>
                                                        </div>
                                                      </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-4 pb-4">
                                                      <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                                                        <div className="space-y-4">
                                                          {conv.messages
                                                            ?.slice(1)
                                                            .map(
                                                              (
                                                                msg,
                                                                mIdx: number
                                                              ) => (
                                                                <div
                                                                  key={mIdx}
                                                                  className={`flex gap-3 ${
                                                                    msg.role ===
                                                                    "user"
                                                                      ? "flex-row-reverse"
                                                                      : "flex-row"
                                                                  }`}
                                                                >
                                                                  <div
                                                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                                      msg.role ===
                                                                      "user"
                                                                        ? "bg-blue-500 text-white"
                                                                        : "bg-yellow-400 text-gray-800"
                                                                    }`}
                                                                  >
                                                                    <span className="text-xs font-bold">
                                                                      {msg.role ===
                                                                      "user"
                                                                        ? "U"
                                                                        : "AI"}
                                                                    </span>
                                                                  </div>
                                                                  <div
                                                                    className={`flex-1 max-w-[80%] ${
                                                                      msg.role ===
                                                                      "user"
                                                                        ? "text-right"
                                                                        : "text-left"
                                                                    }`}
                                                                  >
                                                                    <div
                                                                      className={`inline-block rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                                                        msg.role ===
                                                                        "user"
                                                                          ? "bg-blue-500 text-white rounded-br-md"
                                                                          : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                                                                      }`}
                                                                    >
                                                                      <p className="leading-relaxed">
                                                                        {
                                                                          msg.content
                                                                        }
                                                                      </p>
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 mt-1 px-2">
                                                                      {formatDate(
                                                                        msg.timestamp
                                                                      )}
                                                                    </p>
                                                                  </div>
                                                                </div>
                                                              )
                                                            )}
                                                        </div>
                                                      </div>
                                                    </AccordionContent>
                                                  </AccordionItem>
                                                )
                                              )}
                                            </Accordion>
                                          ) : (
                                            <div className="text-center py-8 px-4">
                                              <BotIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                              <p className="text-gray-500 font-medium">
                                                No AI conversations found
                                              </p>
                                              <p className="text-gray-400 text-sm mt-1">
                                                This user completed the form
                                                without AI assistance
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  <DialogFooter className="pt-6 border-t bg-gray-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
                                    <div className="flex items-center justify-between w-full">
                                      <div className="text-xs text-gray-500">
                                        Submission ID:{" "}
                                        {submission.id.slice(0, 8)}...
                                      </div>
                                      <div className="flex gap-3">
                                        {!submission.aiProblem ? (
                                          <Button variant="outline" disabled>
                                            No Action Needed
                                          </Button>
                                        ) : submission.resolved ? (
                                          <Button
                                            variant="destructive"
                                            onClick={() => {
                                              updateSubmissionResolved(
                                                submission.id,
                                                false
                                              );
                                            }}
                                          >
                                            <CircleX className="h-4 w-4 mr-2" />
                                            Mark as Unresolved
                                          </Button>
                                        ) : (
                                          <Popover
                                            open={
                                              resolvePopover.submissionId ===
                                                submission.id &&
                                              resolvePopover.anchor === "dialog"
                                            }
                                            onOpenChange={(open) => {
                                              if (!open) {
                                                setResolvePopover({
                                                  submissionId: null,
                                                  anchor: null,
                                                });
                                                setResolutionComment("");
                                              }
                                            }}
                                          >
                                            <PopoverTrigger asChild>
                                              <Button
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => {
                                                  updateSubmissionResolved(
                                                    submission.id,
                                                    true,
                                                    undefined,
                                                    "dialog"
                                                  );
                                                }}
                                              >
                                                <CheckCircleIcon className="h-4 w-4 mr-2" />
                                                Mark as Resolved
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                              className="w-96"
                                              align="end"
                                            >
                                              <div className="space-y-4">
                                                <div>
                                                  <Label
                                                    htmlFor={`resolution-${submission.id}`}
                                                    className="text-sm font-medium"
                                                  >
                                                    Resolution Details
                                                  </Label>
                                                  <p className="text-xs text-gray-500 mt-1">
                                                    Describe how you resolved
                                                    this issue for future
                                                    reference
                                                  </p>
                                                </div>
                                                <Textarea
                                                  id={`resolution-${submission.id}`}
                                                  value={resolutionComment}
                                                  onChange={(e) =>
                                                    setResolutionComment(
                                                      e.target.value
                                                    )
                                                  }
                                                  placeholder="Add details about how you resolved this"
                                                  rows={4}
                                                  className="resize-none"
                                                />
                                                <div className="flex justify-end gap-2">
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                      setResolvePopover({
                                                        submissionId: null,
                                                        anchor: null,
                                                      });
                                                      setResolutionComment("");
                                                    }}
                                                  >
                                                    Cancel
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    onClick={() => {
                                                      updateSubmissionResolved(
                                                        submission.id,
                                                        true,
                                                        resolutionComment
                                                      );
                                                    }}
                                                    disabled={
                                                      !resolutionComment.trim()
                                                        .length
                                                    }
                                                    className="bg-green-600 hover:bg-green-700"
                                                  >
                                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                                    Confirm Resolution
                                                  </Button>
                                                </div>
                                              </div>
                                            </PopoverContent>
                                          </Popover>
                                        )}
                                        <DialogClose asChild>
                                          <Button variant="outline">
                                            Close
                                          </Button>
                                        </DialogClose>
                                      </div>
                                    </div>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    navigate(
                                      `/forms/${params.id}/responses/${submission.id}`
                                    )
                                  }
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View submission</TooltipContent>
                            </Tooltip>
                            {!submission.aiProblem ? (
                              ""
                            ) : (
                              <Tooltip>
                                <Popover
                                  open={
                                    resolvePopover.submissionId ===
                                      submission.id &&
                                    resolvePopover.anchor === "row"
                                  }
                                  onOpenChange={(open) => {
                                    if (!open) {
                                      setResolvePopover({
                                        submissionId: null,
                                        anchor: null,
                                      });
                                      setResolutionComment("");
                                    }
                                  }}
                                >
                                  <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          updateSubmissionResolved(
                                            submission.id,
                                            !submission.resolved,
                                            undefined,
                                            "row"
                                          );
                                        }}
                                      >
                                        <CheckCheck className="h-4 w-4" />
                                      </Button>
                                    </PopoverTrigger>
                                  </TooltipTrigger>
                                  <PopoverContent className="w-80" align="end">
                                    <div className="space-y-2">
                                      <Label
                                        htmlFor={`resolution-${submission.id}`}
                                      >
                                        Resolution comment
                                      </Label>
                                      <Textarea
                                        id={`resolution-${submission.id}`}
                                        value={resolutionComment}
                                        onChange={(e) =>
                                          setResolutionComment(e.target.value)
                                        }
                                        placeholder="Add details about how you resolved this"
                                        rows={4}
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setResolvePopover({
                                              submissionId: null,
                                              anchor: null,
                                            });
                                            setResolutionComment("");
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            updateSubmissionResolved(
                                              submission.id,
                                              true,
                                              resolutionComment
                                            );
                                          }}
                                          disabled={
                                            !resolutionComment.trim().length
                                          }
                                        >
                                          Confirm
                                        </Button>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                  <TooltipContent>
                                    Mark as{" "}
                                    {submission.resolved
                                      ? "unresolved"
                                      : "resolved"}
                                  </TooltipContent>
                                </Popover>
                              </Tooltip>
                            )}
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <BarChart3Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No responses yet</p>
                <p className="text-gray-400 text-sm">
                  Share your form to start collecting responses
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
