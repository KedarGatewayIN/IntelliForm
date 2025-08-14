import { useParams, useLocation } from "wouter";
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
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
    resolved: boolean
  ) => {
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
                                      <Button variant="outline" size="sm">
                                        <BadgeAlert className="h-4 w-4 text-red-600 cursor-pointer" />
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
                                <DialogContent className="max-w-2xl h-auto max-h-[80vh] flex flex-col">
                                  <DialogHeader>
                                    <DialogTitle className="text-lg font-semibold">
                                      AI Conversation
                                    </DialogTitle>
                                    <p className="text-sm text-muted-foreground">
                                      Showing all AI and User messages per field
                                    </p>
                                  </DialogHeader>

                                  {/* Scrollable Conversations */}
                                  <ScrollArea className="flex-1 pr-2 space-y-6 overflow-y-auto">
                                    {submission.aiConversations?.length ? (
                                      submission.aiConversations.map(
                                        (conv, idx: number) => (
                                          <Card
                                            key={conv.id || idx}
                                            className="shadow-sm border"
                                          >
                                            <CardHeader className="pb-2">
                                              <CardTitle className="text-sm font-medium text-gray-700">
                                                Field:{" "}
                                                {conv.messages[0].content}
                                              </CardTitle>
                                              <Separator />
                                            </CardHeader>

                                            <CardContent className="p-4 space-y-3">
                                              {conv.messages
                                                .slice(1)
                                                .map((msg, mIdx: number) => (
                                                  <div
                                                    key={mIdx}
                                                    className={`flex items-start gap-2 ${
                                                      msg.role === "user"
                                                        ? "justify-end"
                                                        : "justify-start"
                                                    }`}
                                                  >
                                                    {msg.role === "ai" && (
                                                      <div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center text-xs font-bold text-gray-800">
                                                        AI
                                                      </div>
                                                    )}

                                                    <div
                                                      className={`rounded-2xl px-4 py-2 max-w-[75%] text-sm shadow-sm ${
                                                        msg.role === "user"
                                                          ? "bg-blue-500 text-white rounded-br-none"
                                                          : "bg-yellow-100 text-gray-800 rounded-bl-none"
                                                      }`}
                                                    >
                                                      {msg.content}
                                                    </div>

                                                    {msg.role === "user" && (
                                                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                                                        U
                                                      </div>
                                                    )}
                                                  </div>
                                                ))}
                                            </CardContent>
                                          </Card>
                                        )
                                      )
                                    ) : (
                                      <div className="text-gray-500 text-center py-4">
                                        No conversation found.
                                      </div>
                                    )}
                                  </ScrollArea>

                                  {/* Footer */}
                                  <DialogFooter className="pt-4 border-t">
                                    <DialogClose>
                                      <div className="flex gap-4">
                                        {!submission.aiProblem ? (
                                          ""
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
                                            Mark as Unresolved
                                          </Button>
                                        ) : (
                                          <Button
                                            variant="default"
                                            onClick={() => {
                                              updateSubmissionResolved(
                                                submission.id,
                                                true
                                              );
                                            }}
                                          >
                                            Mark as Resolved
                                          </Button>
                                        )}
                                        <Button variant="outline">Close</Button>
                                      </div>
                                    </DialogClose>
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
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      updateSubmissionResolved(
                                        submission.id,
                                        !submission.resolved
                                      );
                                    }}
                                  >
                                    <CheckCheck className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Mark as{" "}
                                  {submission.resolved
                                    ? "unresolved"
                                    : "resolved"}
                                </TooltipContent>
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
