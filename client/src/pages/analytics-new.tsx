import { useState, useEffect } from "react";
import { useParams } from "wouter";
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
import { useForms } from "@/hooks/use-forms";
import { useTitle } from "@/hooks/use-title";
import {
  SearchIcon,
  FileTextIcon,
  ClockIcon,
  EyeIcon,
  MessageSquareIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Submission {
  id: string;
  formId: string;
  data: Record<string, any>;
  completedAt: string;
  timeTaken?: number;
  ipAddress?: string;
  problems?: any[];
  aiConversations?: any[];
}

export default function AnalyticsNew() {
  useTitle("Analytics");
  const params = useParams();
  const { data: forms = [], isLoading: formsLoading } = useForms();
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-select first form or form from params
  useEffect(() => {
    if (forms.length > 0) {
      const formToSelect = params.id 
        ? forms.find(f => f.id === params.id) || forms[0]
        : forms[0];
      setSelectedForm(formToSelect);
    }
  }, [forms, params.id]);

  // Load submissions when form is selected
  useEffect(() => {
    if (selectedForm) {
      loadSubmissions(selectedForm.id);
    }
  }, [selectedForm]);

  const loadSubmissions = async (formId: string) => {
    setSubmissionsLoading(true);
    try {
      const response = await fetch(`/api/forms/${formId}/submissions`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error("Failed to load submissions:", error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const filteredForms = forms.filter((form) =>
    form.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const secondColumn = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        </div>
        
        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search forms..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Forms List */}
      <div className="flex-1 overflow-y-auto p-6">
        {formsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileTextIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No forms found
            </h3>
            <p className="text-gray-500">
              {searchQuery ? "Try adjusting your search terms" : "Create forms to view analytics"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredForms.map((form) => (
              <Card
                key={form.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedForm?.id === form.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedForm(form)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                      <FileTextIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{form.title}</h3>
                      <p className="text-sm text-gray-500">
                        {form.submissions?.length || 0} submissions
                      </p>
                    </div>
                    <Badge variant={form.isPublished ? "default" : "secondary"}>
                      {form.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const thirdColumn = selectedForm && (
    <div className="h-full flex flex-col">
      {/* Header & Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">All Submissions</h2>
          <div className="text-sm text-gray-500">
            {selectedForm.title}
          </div>
        </div>
        
        {/* Filters */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search submissions..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="flex-1 overflow-y-auto p-6">
        {submissionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileTextIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No submissions yet
            </h3>
            <p className="text-gray-500">
              This form hasn't received any responses yet.
            </p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Name</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Time Taken</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {selectedForm.title}
                      </TableCell>
                      <TableCell>
                        {formatDate(submission.completedAt)}
                      </TableCell>
                      <TableCell>
                        {submission.ipAddress || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
                          <span>{formatDuration(submission.timeTaken)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MessageSquareIcon className="h-4 w-4 mr-1" />
                                Todos
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>AI Summary</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <h4 className="font-medium mb-2">Problems Detected:</h4>
                                  {submission.problems && submission.problems.length > 0 ? (
                                    <ul className="space-y-2">
                                      {submission.problems.map((problem: any, index: number) => (
                                        <li key={index} className="text-sm">
                                          <span className="font-medium">{problem.problem}</span>
                                          {problem.solutions && (
                                            <ul className="ml-4 mt-1 text-gray-600">
                                              {problem.solutions.map((solution: string, sIndex: number) => (
                                                <li key={sIndex}>• {solution}</li>
                                              ))}
                                            </ul>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-gray-600">No problems detected</p>
                                  )}
                                </div>
                                
                                {submission.aiConversations && submission.aiConversations.length > 0 && (
                                  <div className="bg-blue-50 rounded-lg p-4">
                                    <h4 className="font-medium mb-2">AI Conversations:</h4>
                                    <p className="text-sm text-gray-600">
                                      {submission.aiConversations.length} conversation(s) recorded
                                    </p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/forms/${selectedForm.id}/responses/${submission.id}`)}
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
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
    <ThreeColumnLayout
      secondColumn={secondColumn}
      thirdColumn={thirdColumn}
      showThirdColumn={!!selectedForm}
    />
  );
}