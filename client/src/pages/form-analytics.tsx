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
import { useToast } from "@/hooks/use-toast";
import {
  BotIcon,
  CheckCircleIcon,
  BadgeAlert,
  CheckCheck,
  CircleX,
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTitle } from "@/hooks/use-title";

interface IFormAnalytics {
  totalResponses: number;
  completionRate: number;
  aiInteractions: number;
  averageTimeSeconds: number;
  recentResponses: Array<{ id: string; completedAt: string; timeTaken: number; hasAiInteractions: boolean; status: "completed" | "partial"; }>;
  responsesByDay: Array<{ date: string; count: number }>;
}

interface ISubmission {
  id: string;
  formId: string;
  data: { [key: string]: string };
  completedAt: string;
  timeTaken: number;
  ipAddress: string;
  problems?: { id: string; problem: string; solutions: string[]; resolved: boolean; resolutionComment: string }[];
  aiConversations: Array<{
    id: string;
    submissionId: string;
    fieldId: string;
    messages: Array<{ role: string; content: string; timestamp: string }>;
    createdAt: string;
  }>;
}

export default function FormAnalytics() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: form } = useForm(params.id);
  useTitle(form?.title ? `${form.title} — Analytics` : "Form Analytics");
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  const [problemResolvePopover, setProblemResolvePopover] = useState<{ submissionId: string | null; problemId: string | null }>({ submissionId: null, problemId: null });
  const [problemResolutionComment, setProblemResolutionComment] = useState<string>("");

  const { data: analytics } = useQuery<IFormAnalytics>({
    queryKey: ["/api/forms", params.id, "analytics"],
    enabled: !!params.id,
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<ISubmission[]>({
    queryKey: ["/api/forms", params.id, "submissions"],
    enabled: !!params.id,
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds && seconds !== 0) return "N/A";
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

  const updateSubmissionProblem = (
    submission_id: string,
    problem_id: string,
    resolved: boolean,
    comment?: string
  ) => {
    if (resolved) {
      if (!comment || !comment.trim()) {
        setProblemResolvePopover({ submissionId: submission_id, problemId: problem_id });
        return;
      }
    }
    fetch(`/api/submission/${submission_id}/problem`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ problemId: problem_id, resolved, resolutionComment: resolved ? comment?.trim() : undefined }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((updated: ISubmission) => {
        toast({ title: "Update Successful", description: resolved ? "Problem resolved." : "Problem marked as unresolved." });
        queryClient.setQueryData<ISubmission[]>(["/api/forms", params.id, "submissions"], (old) => {
          if (!old) return [];
          return old.map((s) => (s.id === submission_id ? { ...s, ...updated } : s));
        });
        setProblemResolvePopover({ submissionId: null, problemId: null });
        setProblemResolutionComment("");
      })
      .catch(() => {
        toast({ title: "Update Failed", description: "Failed to update problem.", variant: "destructive" });
      });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>{form?.title || "Form Analytics"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>AI Used</TableHead>
                  <TableHead>Action Needed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id} className="hover:bg-gray-50">
                    <TableCell>{formatDate(submission.completedAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
                    </TableCell>
                    <TableCell>{formatDuration(submission.timeTaken)}</TableCell>
                    <TableCell>
                      {submission.aiConversations && submission.aiConversations.length > 0 ? (
                        <BotIcon className="h-4 w-4 text-secondary" />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <Dialog>
                            <DialogTrigger asChild>
                              <TooltipTrigger asChild>
                                {submission.problems?.some(p => !p.resolved) ? (
                                  <Button variant="destructiveOutline" size="sm">
                                    <BadgeAlert className="h-4 w-4 cursor-pointer" />
                                  </Button>
                                ) : (
                                  <Button variant="greenOutline" size="sm">
                                    <CheckCheck className="h-4 w-4 cursor-pointer" />
                                  </Button>
                                )}
                              </TooltipTrigger>
                            </DialogTrigger>
                            <TooltipContent side="top" align="center">
                              {(submission.problems?.length ?? 0) === 0
                                ? "No problem detected"
                                : submission.problems?.some(p => !p.resolved)
                                  ? submission.problems?.find(p => !p.resolved)?.problem || "Action Required"
                                  : "Problem Resolved"}
                            </TooltipContent>
                            <DialogContent className="max-w-4xl h-auto max-h-[90vh] flex flex-col overflow-hidden">
                              <DialogHeader className="pb-4 border-b">
                                <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                                  <BotIcon className="h-5 w-5 text-secondary" />
                                  Submission Insights
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground">Detailed analysis of AI interactions and suggested improvements.</p>
                              </DialogHeader>
                              <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
                                <div className={`rounded-lg p-4 border-l-4 ${(submission.problems?.length ?? 0) === 0 ? "bg-green-50 border-l-green-400" : submission.problems?.some(p => !p.resolved) ? "bg-red-50 border-l-red-400" : "bg-blue-50 border-l-blue-400"}`}>
                                  <div className="flex items-center gap-2">
                                    {(submission.problems?.length ?? 0) === 0 ? (
                                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                    ) : submission.problems?.some(p => !p.resolved) ? (
                                      <BadgeAlert className="h-5 w-5 text-red-600" />
                                    ) : (
                                      <CheckCheck className="h-5 w-5 text-blue-600" />
                                    )}
                                    <span className="font-medium text-sm">{(submission.problems?.length ?? 0) === 0 ? "No Issues Detected" : submission.problems?.some(p => !p.resolved) ? "Action Required" : "Issue Resolved"}</span>
                                  </div>
                                </div>
                                <Card className="shadow-sm border-0 bg-gradient-to-r from-red-50 to-orange-50">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                      <CircleX className="h-4 w-4 text-red-500" />
                                      Issue Summary
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-0">
                                    <div className="bg-white rounded-md p-4 border border-red-100 space-y-3">
                                      {submission.problems && submission.problems.length > 0 ? (
                                        <div className="space-y-2">
                                          {submission.problems.map((p) => (
                                            <div key={p.id} className="flex items-start justify-between gap-3 border-b last:border-b-0 pb-2 last:pb-0">
                                              <div>
                                                <p className="text-sm text-gray-800 first-letter:capitalize">{p.problem}</p>
                                                {p.solutions && p.solutions.length > 0 && (
                                                  <ul className="list-disc pl-5 mt-1 text-xs text-gray-600">
                                                    {p.solutions.map((s, i) => (
                                                      <li key={i}>{s}</li>
                                                    ))}
                                                  </ul>
                                                )}
                                                {p.resolved && p.resolutionComment && (
                                                  <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{p.resolutionComment}</p>
                                                )}
                                              </div>
                                              <div className="shrink-0">
                                                {p.resolved ? (
                                                  <Button variant="destructive" size="sm" onClick={() => updateSubmissionProblem(submission.id, p.id, false)}>
                                                    Mark Unresolved
                                                  </Button>
                                                ) : (
                                                  <Popover
                                                    open={problemResolvePopover.submissionId === submission.id && problemResolvePopover.problemId === p.id}
                                                    onOpenChange={(open) => {
                                                      if (!open) {
                                                        setProblemResolvePopover({ submissionId: null, problemId: null });
                                                        setProblemResolutionComment("");
                                                      }
                                                    }}
                                                  >
                                                    <PopoverTrigger asChild>
                                                      <Button size="sm" onClick={() => updateSubmissionProblem(submission.id, p.id, true, undefined)}>
                                                        Resolve
                                                      </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-96" align="end">
                                                      <div className="space-y-4">
                                                        <div>
                                                          <Label htmlFor={`resolution-${submission.id}-${p.id}`} className="text-sm font-medium">Resolution Details</Label>
                                                          <p className="text-xs text-gray-500 mt-1">Describe how you resolved this problem</p>
                                                        </div>
                                                        <Textarea id={`resolution-${submission.id}-${p.id}`} value={problemResolutionComment} onChange={(e) => setProblemResolutionComment(e.target.value)} placeholder="Add details about how you resolved this" rows={4} className="resize-none" />
                                                        <div className="flex justify-end gap-2">
                                                          <Button variant="outline" size="sm" onClick={() => { setProblemResolvePopover({ submissionId: null, problemId: null }); setProblemResolutionComment(""); }}>Cancel</Button>
                                                          <Button size="sm" onClick={() => updateSubmissionProblem(submission.id, p.id, true, problemResolutionComment)} disabled={!problemResolutionComment.trim().length} className="bg-green-600 hover:bg-green-700">Confirm Resolution</Button>
                                                        </div>
                                                      </div>
                                                    </PopoverContent>
                                                  </Popover>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-700 leading-relaxed first-letter:capitalize">No AI issues were flagged for this submission. The user completed the form without requiring AI assistance or encountering any problems.</p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card className="shadow-sm border-0 bg-gradient-to-r from-purple-50 to-pink-50">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                      <BotIcon className="h-4 w-4 text-purple-500" />
                                      AI & User History
                                      <Badge variant="secondary" className="ml-2">{submission.aiConversations?.length || 0} conversations</Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-0">
                                    <div className="bg-white rounded-md border border-purple-100 overflow-hidden">
                                      {submission.aiConversations?.length ? (
                                        <Accordion type="multiple" className="w-full">
                                          {submission.aiConversations.map((conv, idx) => (
                                            <AccordionItem key={conv.id || idx} value={String(conv.id || idx)} className="border-b border-gray-100 last:border-b-0">
                                              <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:bg-gray-50 no-underline hover:no-underline">
                                                <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <BotIcon className="h-4 w-4 text-purple-600" />
                                                  </div>
                                                  <div className="text-left">
                                                    <p className="font-medium">Field: {conv.messages?.[0]?.content || "Unknown Field"}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{conv.messages?.length || 0} messages • {formatDate(conv.createdAt)}</p>
                                                  </div>
                                                </div>
                                              </AccordionTrigger>
                                              <AccordionContent className="px-4 pb-4">
                                                <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                                                  <div className="space-y-4">
                                                    {conv.messages?.slice(1).map((msg, mIdx) => (
                                                      <div key={mIdx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-yellow-400 text-gray-800"}`}>
                                                          <span className="text-xs font-bold">{msg.role === "user" ? "U" : "AI"}</span>
                                                        </div>
                                                        <div className={`flex-1 max-w-[80%] ${msg.role === "user" ? "text-right" : "text-left"}`}>
                                                          <div className={`inline-block rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.role === "user" ? "bg-blue-500 text-white rounded-br-md" : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"}`}>
                                                            <p className="leading-relaxed">{msg.content}</p>
                                                          </div>
                                                          <p className="text-xs text-gray-500 mt-1 px-2">{formatDate(msg.timestamp)}</p>
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              </AccordionContent>
                                            </AccordionItem>
                                          ))}
                                        </Accordion>
                                      ) : (
                                        <div className="text-center py-8 px-4">
                                          <BotIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                          <p className="text-gray-500 font-medium">No AI conversations found</p>
                                          <p className="text-gray-400 text-sm mt-1">This user completed the form without AI assistance</p>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                              <DialogFooter className="pt-6 border-t bg-gray-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
                                <div className="flex items-center justify-between w-full">
                                  <div className="text-xs text-gray-500">Submission ID: {submission.id.slice(0, 8)}...</div>
                                  <div className="flex gap-3">
                                    <DialogClose asChild>
                                      <Button variant="outline">Close</Button>
                                    </DialogClose>
                                  </div>
                                </div>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {(submission.problems?.length ?? 0) === 0 ? (
                          <Badge variant="outline">No Issues</Badge>
                        ) : submission.problems?.some(p => !p.resolved) ? (
                          <Badge variant="destructive">Action Required</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Resolved</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

