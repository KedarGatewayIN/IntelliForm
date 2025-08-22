"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import Navbar from "@/components/layout/navbar";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import {
  BarChart3,
  FileText,
  Inbox,
  ChevronLeft,
  ChevronRight,
  CheckCircleIcon,
  CheckCheck,
  BadgeAlert,
  CircleX,
  BotIcon,
  CalendarIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTitle } from "@/hooks/use-title";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface Submission {
  id: string;
  formId: string;
  formTitle: string | null;
  data: Record<string, any>;
  completedAt: string;
  timeTaken?: number;
  ipAddress?: string;
  problems?: {
    id: string;
    problem: string;
    solutions: string[];
    resolved: boolean;
    resolutionComment: string;
  }[];
}

interface UserFormOption {
  id: string;
  title: string;
}

interface SubmissionsResponse {
  recent: Submission[];
  others: Submission[];
  total: number;
  recentCount: number;
  othersTotal: number;
  page: number;
  pageSize: number;
  recentLimit: number;
}

function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function SimplePagination({
  page,
  pageSize,
  total,
  onPageChange,
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
        Showing {(page - 1) * pageSize + 1} to{" "}
        {Math.min(page * pageSize, total)} of {total} submissions
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

const formatDuration = (seconds?: number) => {
  if (seconds == null) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

function ResolveProblemForm({
  submissionId,
  problemId,
}: {
  submissionId: string;
  problemId: string;
}) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="space-y-3">
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Provide a brief resolution comment..."
        className="min-h-[100px]"
      />
      <div className="flex justify-end gap-2">
        <Button
          disabled={loading}
          variant="outline"
          onClick={() => {
            // naive close via reload; page state will re-fetch
            window.location.reload();
          }}
        >
          Cancel
        </Button>
        <Button
          disabled={!comment.trim() || loading}
          onClick={async () => {
            try {
              setLoading(true);
              const res = await fetch(
                `/api/submission/${submissionId}/problem`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    problemId,
                    resolved: true,
                    resolutionComment: comment.trim(),
                  }),
                },
              );
              if (!res.ok) throw new Error(await res.text());
              window.location.reload();
            } catch (e) {
              setLoading(false);
            }
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          Confirm Resolve
        </Button>
      </div>
    </div>
  );
}

export default function RecentSubmissionsPage() {
  useTitle("Submissions");
  const [page, setPage] = useState(1);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [filters, setFilters] = useState({
    formId: "any",
    q: "",
    aiQuery: "",
    ip: "",
    resolved: "any",
    hasAiProblem: "any",
    hasAiConversation: "any",
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
  });
  const pageSize = 10;
  const recentLimit = 10;
  const debouncedQ = useDebouncedValue(filters.q);
  const debouncedAiQuery = useDebouncedValue(filters.aiQuery);
  const debouncedIp = useDebouncedValue(filters.ip);
  const queryKey = useMemo(
    () => [
      "/api/submissions",
      page,
      pageSize,
      recentLimit,
      filters.formId,
      filters.resolved,
      filters.hasAiProblem,
      filters.hasAiConversation,
      debouncedQ,
      debouncedAiQuery,
      debouncedIp,
      filters.dateFrom ? filters.dateFrom.toISOString() : "",
      filters.dateTo ? filters.dateTo.toISOString() : "",
    ],
    [
      page,
      pageSize,
      recentLimit,
      filters.formId,
      filters.resolved,
      filters.hasAiProblem,
      filters.hasAiConversation,
      debouncedQ,
      debouncedAiQuery,
      debouncedIp,
      filters.dateFrom,
      filters.dateTo,
    ],
  );
  const { data, isLoading } = useQuery<SubmissionsResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        recentLimit: String(recentLimit),
      });
      if (filters.formId && filters.formId !== "any")
        params.set("formId", filters.formId);
      if (debouncedQ) params.set("q", debouncedQ);
      if (debouncedAiQuery) params.set("aiQuery", debouncedAiQuery);
      if (debouncedIp) params.set("ip", debouncedIp);
      if (filters.resolved !== "any") params.set("resolved", filters.resolved);
      if (filters.hasAiProblem !== "any")
        params.set("hasAiProblem", filters.hasAiProblem);
      if (filters.hasAiConversation !== "any")
        params.set("hasAiConversation", filters.hasAiConversation);
      if (filters.dateFrom)
        params.set("dateFrom", new Date(filters.dateFrom).toISOString());
      if (filters.dateTo) params.set("dateTo", new Date(filters.dateTo).toISOString());
      const res = await apiRequest(
        "GET",
        `/api/submissions?${params.toString()}`,
      );
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return res.json();
    },
  });

  const [resolvePopover, setResolvePopover] = useState<{
    submissionId: string | null;
    anchor: "row" | "dialog" | null;
  }>({ submissionId: null, anchor: null });
  const [resolutionComment, setResolutionComment] = useState<string>("");

  const updateSubmissionResolved = (
    submissionId: string,
    resolved: boolean,
    comment?: string,
    anchor?: "row" | "dialog",
  ) => {
    if (resolved) {
      if (!comment || !comment.trim()) {
        setResolvePopover({ submissionId, anchor: anchor ?? "row" });
        return;
      }
      apiRequest("PUT", `/api/submission/${submissionId}`, {
        resolved: true,
        resolutionComment: comment.trim(),
      })
        .then((resp) => resp.json())
        .then(() => {
          toast({
            title: "Update Successful",
            description: "Submission marked as resolved.",
          });
          queryClient.setQueryData<SubmissionsResponse | undefined>(
            ["/api/submissions", page, pageSize, recentLimit, filters],
            (old) => {
              if (!old) return old;
              const apply = (arr: Submission[]) =>
                arr.map((s) =>
                  s.id === submissionId
                    ? {
                        ...s,
                        resolved: true,
                        resolutionComment: comment?.trim(),
                      }
                    : s,
                );
              return {
                ...old,
                recent: apply(old.recent),
                others: apply(old.others),
              };
            },
          );
          setUser((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              todoCount: Math.max((prev.todoCount ?? 0) - 1, 0),
            } as any;
          });
          setResolvePopover({ submissionId: null, anchor: null });
          setResolutionComment("");
        })
        .catch(() => {
          toast({
            title: "Update Failed",
            description: "Failed to update submission status.",
            variant: "destructive",
          });
        });
      return;
    }

    apiRequest("PUT", `/api/submission/${submissionId}`, { resolved: false })
      .then(() => {
        toast({
          title: "Update Successful",
          description: "Submission marked as unresolved.",
        });
        queryClient.setQueryData<SubmissionsResponse | undefined>(
          ["/api/submissions", page, pageSize, recentLimit, filters],
          (old) => {
            if (!old) return old;
            const apply = (arr: Submission[]) =>
              arr.map((s) =>
                s.id === submissionId ? { ...s, resolved: false } : s,
              );
            return {
              ...old,
              recent: apply(old.recent),
              others: apply(old.others),
            };
          },
        );
        setUser((prev) => {
          if (!prev) return prev;
          return { ...prev, todoCount: (prev.todoCount ?? 0) + 1 } as any;
        });
      })
      .catch(() => {
        toast({
          title: "Update Failed",
          description: "Failed to update submission status.",
          variant: "destructive",
        });
      });
  };

  // Fetch forms for the form filter
  const { data: formsData } = useQuery<UserFormOption[]>({
    queryKey: ["/api/forms"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/forms");
      if (!res.ok) return [];
      const json = await res.json();
      // Map to just id and title
      return Array.isArray(json)
        ? json.map((f: any) => ({
            id: f.id as string,
            title: String(f.title ?? "Untitled"),
          }))
        : [];
    },
  });

  const hasSubmissions =
    (data?.recent && data.recent.length > 0) ||
    (data?.others && data.others.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Form
                    </Label>
                    <Select
                      value={filters.formId}
                      onValueChange={(v) => {
                        setPage(1);
                        setFilters((f) => ({ ...f, formId: v }));
                      }}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="All forms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">All forms</SelectItem>
                        {(formsData ?? []).map((form) => (
                          <SelectItem key={form.id} value={form.id}>
                            {form.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2 lg:col-span-2">
                    <Label
                      htmlFor="q"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Search in answers
                    </Label>
                    <Input
                      id="q"
                      placeholder="Search in answers..."
                      value={filters.q}
                      onChange={(e) => {
                        setPage(1);
                        setFilters((f) => ({ ...f, q: e.target.value }));
                      }}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Status
                    </Label>
                    <Select
                      value={filters.resolved}
                      onValueChange={(v) => {
                        setPage(1);
                        setFilters((f) => ({ ...f, resolved: v }));
                      }}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Any status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">
                          <div className="flex items-center gap-2">
                            <span>Any status</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="true">
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>Resolved</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="false">
                          <div className="flex items-center gap-2">
                            <CircleX className="h-4 w-4" />
                            <span>Unresolved</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Advanced Filters
                    </h4>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label
                        htmlFor="aiq"
                        className="text-sm font-medium text-muted-foreground"
                      >
                        AI Problem
                      </Label>
                      <Input
                        id="aiq"
                        placeholder="Search AI problems..."
                        value={filters.aiQuery}
                        onChange={(e) => {
                          setPage(1);
                          setFilters((f) => ({
                            ...f,
                            aiQuery: e.target.value,
                          }));
                        }}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="ip"
                        className="text-sm font-medium text-muted-foreground"
                      >
                        IP Address
                      </Label>
                      <Input
                        id="ip"
                        placeholder="IP contains..."
                        value={filters.ip}
                        onChange={(e) => {
                          setPage(1);
                          setFilters((f) => ({ ...f, ip: e.target.value }));
                        }}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Has AI Problem
                      </Label>
                      <Select
                        value={filters.hasAiProblem}
                        onValueChange={(v) => {
                          setPage(1);
                          setFilters((f) => ({ ...f, hasAiProblem: v }));
                        }}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">
                            <div className="flex items-center gap-2">
                              <span>Any</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="true">
                            <div className="flex items-center gap-2">
                              <BadgeAlert className="h-4 w-4" />
                              <span>Yes</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="false">
                            <div className="flex items-center gap-2">
                              <CircleX className="h-4 w-4" />
                              <span>No</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Has AI Conversation
                      </Label>
                      <Select
                        value={filters.hasAiConversation}
                        onValueChange={(v) => {
                          setPage(1);
                          setFilters((f) => ({ ...f, hasAiConversation: v }));
                        }}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">
                            <div className="flex items-center gap-2">
                              <span>Any</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="true">
                            <div className="flex items-center gap-2">
                              <BotIcon className="h-4 w-4" />
                              <span>Yes</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="false">
                            <div className="flex items-center gap-2">
                              <CircleX className="h-4 w-4" />
                              <span>No</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Date Range
                    </h4>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        From
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start mt-1 font-normal bg-transparent"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.dateFrom
                              ? format(filters.dateFrom, "PP")
                              : "Select start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.dateFrom}
                            onSelect={(d) => {
                              setPage(1);
                              setFilters((f) => ({
                                ...f,
                                dateFrom: d
                                  ? (() => {
                                      const s = new Date(d);
                                      s.setHours(0, 0, 0, 0);
                                      return s;
                                    })()
                                  : undefined,
                              }));
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">
                        To
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start mt-1 font-normal bg-transparent"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.dateTo
                              ? format(filters.dateTo, "PP")
                              : "Select end date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.dateTo}
                            onSelect={(d) => {
                              setPage(1);
                              setFilters((f) => ({
                                ...f,
                                dateTo: d
                                  ? (() => {
                                      const e = new Date(d);
                                      e.setHours(23, 59, 59, 999);
                                      return e;
                                    })()
                                  : undefined,
                              }));
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                  When users submit responses to your forms, they will appear
                  here for easy access and management.
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
                {data?.recent && data.recent.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Recent
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Form Name</TableHead>
                          <TableHead>Submitted At</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Time Taken</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.recent.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-bold">
                              {sub.formTitle}
                            </TableCell>
                            <TableCell>
                              {new Date(sub.completedAt).toLocaleString()}
                            </TableCell>
                            <TableCell>{sub.ipAddress || "-"}</TableCell>
                            <TableCell>
                              {formatDuration(sub.timeTaken)}
                            </TableCell>
                            <TableCell className="align-top">
                              <TooltipProvider>
                                <Tooltip>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <TooltipTrigger asChild>
                                        {sub.problems?.some(
                                          (p) => !p.resolved,
                                        ) ? (
                                          <Button
                                            variant="destructiveOutline"
                                            size="sm"
                                          >
                                            <BadgeAlert className="h-4 w-4" />
                                          </Button>
                                        ) : (
                                          <Button
                                            variant="greenOutline"
                                            size="sm"
                                          >
                                            <CheckCheck className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </TooltipTrigger>
                                    </DialogTrigger>

                                    <TooltipContent side="top" align="center">
                                      {(sub.problems?.length ?? 0) === 0
                                        ? "No problem detected"
                                        : sub.problems?.some((p) => !p.resolved)
                                          ? sub.problems?.find(
                                              (p) => !p.resolved,
                                            )?.problem || "Action Required"
                                          : "Problem Resolved"}
                                    </TooltipContent>

                                    <DialogContent className="max-w-3xl h-auto max-h-[90vh] flex flex-col overflow-hidden">
                                      <DialogHeader className="pb-3 border-b">
                                        <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                                          <BotIcon className="h-5 w-5 text-secondary" />
                                          Submission Insights
                                        </DialogTitle>
                                      </DialogHeader>

                                      <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-4">
                                        <div
                                          className={`rounded-lg p-3 border-l-4 ${
                                            (sub.problems?.length ?? 0) === 0
                                              ? "bg-green-50 border-l-green-400"
                                              : sub.problems?.some(
                                                    (p) => !p.resolved,
                                                  )
                                                ? "bg-red-50 border-l-red-400"
                                                : "bg-blue-50 border-l-blue-400"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            {(sub.problems?.length ?? 0) ===
                                            0 ? (
                                              <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                            ) : sub.problems?.some(
                                                (p) => !p.resolved,
                                              ) ? (
                                              <BadgeAlert className="h-5 w-5 text-red-600" />
                                            ) : (
                                              <CheckCheck className="h-5 w-5 text-blue-600" />
                                            )}
                                            <span className="font-medium text-sm">
                                              {(sub.problems?.length ?? 0) === 0
                                                ? "No Issues Detected"
                                                : sub.problems?.some(
                                                      (p) => !p.resolved,
                                                    )
                                                  ? "Action Required"
                                                  : "Issue Resolved"}
                                            </span>
                                          </div>
                                        </div>

                                        <Card className="shadow-sm border-0 bg-gradient-to-r from-red-50 to-orange-50">
                                          <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                              <CircleX className="h-4 w-4 text-red-500" />
                                              Issue Summary
                                            </CardTitle>
                                          </CardHeader>
                                          <CardContent className="pt-0">
                                            <div className="bg-white rounded-md p-3 border border-red-100 space-y-3">
                                              {sub.problems &&
                                              sub.problems.length > 0 ? (
                                                <div className="space-y-2">
                                                  {sub.problems.map((p) => (
                                                    <div
                                                      key={p.id}
                                                      className="flex items-start justify-between gap-3 border-b last:border-b-0 pb-2 last:pb-0"
                                                    >
                                                      <div>
                                                        <p className="text-sm text-gray-800 first-letter:capitalize">
                                                          {p.problem}
                                                        </p>
                                                        {p.solutions &&
                                                          p.solutions.length >
                                                            0 && (
                                                            <ul className="list-disc pl-5 mt-1 text-xs text-gray-600">
                                                              {p.solutions.map(
                                                                (s, i) => (
                                                                  <li key={i}>
                                                                    {s}
                                                                  </li>
                                                                ),
                                                              )}
                                                            </ul>
                                                          )}
                                                        {p.resolved &&
                                                          p.resolutionComment && (
                                                            <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">
                                                              {
                                                                p.resolutionComment
                                                              }
                                                            </p>
                                                          )}
                                                      </div>
                                                      <div className="shrink-0">
                                                        {p.resolved ? (
                                                          <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                              fetch(
                                                                `/api/submission/${sub.id}/problem`,
                                                                {
                                                                  method: "PUT",
                                                                  headers: {
                                                                    "Content-Type":
                                                                      "application/json",
                                                                  },
                                                                  credentials:
                                                                    "include",
                                                                  body: JSON.stringify(
                                                                    {
                                                                      problemId:
                                                                        p.id,
                                                                      resolved: false,
                                                                    },
                                                                  ),
                                                                },
                                                              )
                                                                .then((r) => {
                                                                  if (!r.ok)
                                                                    throw new Error(
                                                                      "Failed",
                                                                    );
                                                                  window.location.reload();
                                                                })
                                                                .catch(() => {})
                                                            }
                                                          >
                                                            Mark Unresolved
                                                          </Button>
                                                        ) : (
                                                          <Popover>
                                                            <PopoverTrigger
                                                              asChild
                                                            >
                                                              <Button size="sm">
                                                                Resolve
                                                              </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent
                                                              className="w-80"
                                                              align="end"
                                                            >
                                                              <div className="space-y-3">
                                                                <Label
                                                                  htmlFor={`res-${sub.id}-${p.id}`}
                                                                  className="text-sm font-medium"
                                                                >
                                                                  Resolution
                                                                  Details
                                                                </Label>
                                                                <ResolveProblemForm
                                                                  submissionId={
                                                                    sub.id
                                                                  }
                                                                  problemId={
                                                                    p.id
                                                                  }
                                                                />
                                                              </div>
                                                            </PopoverContent>
                                                          </Popover>
                                                        )}
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className="text-sm text-gray-700 leading-relaxed first-letter:capitalize">
                                                  No AI issues were flagged for
                                                  this submission.
                                                </p>
                                              )}
                                            </div>
                                          </CardContent>
                                        </Card>
                                      </div>

                                      <DialogFooter className="pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
                                        <div className="flex items-center justify-between w-full">
                                          <div className="text-xs text-gray-500">
                                            Submission ID: {sub.id.slice(0, 8)}
                                            ...
                                          </div>
                                          <div className="flex gap-3">
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
                            </TableCell>
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
                                            `/forms/${sub.formId}/responses/${sub.id}`,
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
                                          navigate(
                                            `/forms/${sub.formId}/analytics`,
                                          )
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
                  </div>
                )}

                {data?.others && data.others.length > 0 && (
                  <div className="mt-8 space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      All other submissions
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Form Name</TableHead>
                          <TableHead>Submitted At</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Time Taken</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.others.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-bold">
                              {sub.formTitle}
                            </TableCell>
                            <TableCell>
                              {new Date(sub.completedAt).toLocaleString()}
                            </TableCell>
                            <TableCell>{sub.ipAddress || "-"}</TableCell>
                            <TableCell>
                              {formatDuration(sub.timeTaken)}
                            </TableCell>
                            <TableCell className="align-top">
                              <TooltipProvider>
                                <Tooltip>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <TooltipTrigger asChild>
                                        {sub.problems?.some(
                                          (p) => !p.resolved,
                                        ) ? (
                                          <Button
                                            variant="destructiveOutline"
                                            size="sm"
                                          >
                                            <BadgeAlert className="h-4 w-4" />
                                          </Button>
                                        ) : (
                                          <Button
                                            variant="greenOutline"
                                            size="sm"
                                          >
                                            <CheckCheck className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </TooltipTrigger>
                                    </DialogTrigger>

                                    <TooltipContent side="top" align="center">
                                      {(sub.problems?.length ?? 0) === 0
                                        ? "No problem detected"
                                        : sub.problems?.some((p) => !p.resolved)
                                          ? sub.problems?.find(
                                              (p) => !p.resolved,
                                            )?.problem || "Action Required"
                                          : "Problem Resolved"}
                                    </TooltipContent>

                                    <DialogContent className="max-w-3xl h-auto max-h-[90vh] flex flex-col overflow-hidden">
                                      <DialogHeader className="pb-3 border-b">
                                        <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                                          <BotIcon className="h-5 w-5 text-secondary" />
                                          Submission Insights
                                        </DialogTitle>
                                      </DialogHeader>

                                      <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-4">
                                        <div
                                          className={`rounded-lg p-3 border-l-4 ${
                                            (sub.problems?.length ?? 0) === 0
                                              ? "bg-green-50 border-l-green-400"
                                              : sub.problems?.some(
                                                    (p) => !p.resolved,
                                                  )
                                                ? "bg-red-50 border-l-red-400"
                                                : "bg-blue-50 border-l-blue-400"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            {(sub.problems?.length ?? 0) ===
                                            0 ? (
                                              <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                            ) : sub.problems?.some(
                                                (p) => !p.resolved,
                                              ) ? (
                                              <BadgeAlert className="h-5 w-5 text-red-600" />
                                            ) : (
                                              <CheckCheck className="h-5 w-5 text-blue-600" />
                                            )}
                                            <span className="font-medium text-sm">
                                              {(sub.problems?.length ?? 0) === 0
                                                ? "No Issues Detected"
                                                : sub.problems?.some(
                                                      (p) => !p.resolved,
                                                    )
                                                  ? "Action Required"
                                                  : "Issue Resolved"}
                                            </span>
                                          </div>
                                        </div>

                                        <Card className="shadow-sm border-0 bg-gradient-to-r from-red-50 to-orange-50">
                                          <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                              <CircleX className="h-4 w-4 text-red-500" />
                                              Issue Summary
                                            </CardTitle>
                                          </CardHeader>
                                          <CardContent className="pt-0">
                                            <div className="bg-white rounded-md p-3 border border-red-100 space-y-3">
                                              {sub.problems &&
                                              sub.problems.length > 0 ? (
                                                <div className="space-y-2">
                                                  {sub.problems.map((p) => (
                                                    <div
                                                      key={p.id}
                                                      className="flex items-start justify-between gap-3 border-b last:border-b-0 pb-2 last:pb-0"
                                                    >
                                                      <div>
                                                        <p className="text-sm text-gray-800 first-letter:capitalize">
                                                          {p.problem}
                                                        </p>
                                                        {p.solutions &&
                                                          p.solutions.length >
                                                            0 && (
                                                            <ul className="list-disc pl-5 mt-1 text-xs text-gray-600">
                                                              {p.solutions.map(
                                                                (s, i) => (
                                                                  <li key={i}>
                                                                    {s}
                                                                  </li>
                                                                ),
                                                              )}
                                                            </ul>
                                                          )}
                                                        {p.resolved &&
                                                          p.resolutionComment && (
                                                            <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">
                                                              {
                                                                p.resolutionComment
                                                              }
                                                            </p>
                                                          )}
                                                      </div>
                                                      <div className="shrink-0">
                                                        {p.resolved ? (
                                                          <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                              fetch(
                                                                `/api/submission/${sub.id}/problem`,
                                                                {
                                                                  method: "PUT",
                                                                  headers: {
                                                                    "Content-Type":
                                                                      "application/json",
                                                                  },
                                                                  credentials:
                                                                    "include",
                                                                  body: JSON.stringify(
                                                                    {
                                                                      problemId:
                                                                        p.id,
                                                                      resolved: false,
                                                                    },
                                                                  ),
                                                                },
                                                              )
                                                                .then((r) => {
                                                                  if (!r.ok)
                                                                    throw new Error(
                                                                      "Failed",
                                                                    );
                                                                  window.location.reload();
                                                                })
                                                                .catch(() => {})
                                                            }
                                                          >
                                                            Mark Unresolved
                                                          </Button>
                                                        ) : (
                                                          <Popover>
                                                            <PopoverTrigger
                                                              asChild
                                                            >
                                                              <Button size="sm">
                                                                Resolve
                                                              </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent
                                                              className="w-80"
                                                              align="end"
                                                            >
                                                              <div className="space-y-3">
                                                                <Label
                                                                  htmlFor={`res-${sub.id}-${p.id}`}
                                                                  className="text-sm font-medium"
                                                                >
                                                                  Resolution
                                                                  Details
                                                                </Label>
                                                                <ResolveProblemForm
                                                                  submissionId={
                                                                    sub.id
                                                                  }
                                                                  problemId={
                                                                    p.id
                                                                  }
                                                                />
                                                              </div>
                                                            </PopoverContent>
                                                          </Popover>
                                                        )}
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className="text-sm text-gray-700 leading-relaxed first-letter:capitalize">
                                                  No AI issues were flagged for
                                                  this submission.
                                                </p>
                                              )}
                                            </div>
                                          </CardContent>
                                        </Card>
                                      </div>

                                      <DialogFooter className="pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
                                        <div className="flex items-center justify-between w-full">
                                          <div className="text-xs text-gray-500">
                                            Submission ID: {sub.id.slice(0, 8)}
                                            ...
                                          </div>
                                          <div className="flex gap-3">
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
                            </TableCell>
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
                                            `/forms/${sub.formId}/responses/${sub.id}`,
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
                                          navigate(
                                            `/forms/${sub.formId}/analytics`,
                                          )
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
                        pageSize={data?.pageSize || pageSize}
                        total={data?.othersTotal || 0}
                        onPageChange={setPage}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
