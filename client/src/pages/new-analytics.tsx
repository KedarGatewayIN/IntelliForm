import { useState, useEffect } from "react";
import { useParams } from "wouter";
import AppLayout from "@/components/layout/app-layout";
import { useTitle } from "@/hooks/use-title";
import { useForms } from "@/hooks/use-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart3, 
  FileText, 
  Search,
  Eye,
  Calendar,
  Clock,
  Globe,
  CheckSquare,
  MessageSquare
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FormSubmission {
  id: string;
  formName: string;
  submittedAt: string;
  ipAddress: string;
  timeTaken: string;
  data?: any;
}

// Mock data for submissions
const mockSubmissions: FormSubmission[] = [
  {
    id: "1",
    formName: "Customer Feedback",
    submittedAt: "2024-01-15 10:30:00",
    ipAddress: "192.168.1.100",
    timeTaken: "2m 15s",
    data: { name: "John Doe", email: "john@example.com", rating: "5" }
  },
  {
    id: "2",
    formName: "Customer Feedback",
    submittedAt: "2024-01-15 09:45:00",
    ipAddress: "192.168.1.101",
    timeTaken: "1m 45s",
    data: { name: "Jane Smith", email: "jane@example.com", rating: "4" }
  },
  {
    id: "3",
    formName: "Product Survey",
    submittedAt: "2024-01-14 16:20:00",
    ipAddress: "192.168.1.102",
    timeTaken: "3m 30s",
    data: { product: "Widget A", satisfaction: "Very Satisfied" }
  },
];

export default function NewAnalytics() {
  useTitle("Analytics");
  const { data: forms = [], isLoading } = useForms();
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmission[]>([]);

  useEffect(() => {
    if (forms.length > 0 && !selectedForm) {
      setSelectedForm(forms[0]);
    }
  }, [forms, selectedForm]);

  useEffect(() => {
    // Filter submissions based on selected form and search query
    let filtered = mockSubmissions;
    
    if (selectedForm) {
      filtered = filtered.filter(submission => 
        submission.formName === selectedForm.title
      );
    }
    
    if (searchQuery) {
      filtered = filtered.filter(submission =>
        submission.formName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.ipAddress.includes(searchQuery) ||
        Object.values(submission.data || {}).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    setFilteredSubmissions(filtered);
  }, [selectedForm, searchQuery]);

  const formsColumn = (
    <div className="h-full p-4">
      <h3 className="text-lg font-semibold mb-4">Forms</h3>
      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="space-y-2">
          {forms.map((form) => (
            <Card
              key={form.id}
              className={`cursor-pointer transition-colors ${
                selectedForm?.id === form.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedForm(form)}
            >
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-sm">{form.title}</div>
                    <div className="text-xs text-gray-500">
                      {mockSubmissions.filter(s => s.formName === form.title).length} submissions
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {forms.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No forms available</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const submissionsColumn = (
    <div className="h-full p-6">
      {selectedForm ? (
        <>
          {/* Header and Filters */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Submissions</h1>
                <p className="text-gray-600">Form: {selectedForm.title}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search submissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-lg border">
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
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No submissions found for this form
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span>{submission.formName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{submission.submittedAt}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-gray-500" />
                          <span>{submission.ipAddress}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{submission.timeTaken}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <CheckSquare className="h-4 w-4 mr-1" />
                                Todos
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>AI Summary - {submission.formName}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <h4 className="font-semibold text-blue-900 mb-2">AI Analysis</h4>
                                  <p className="text-blue-800">
                                    This submission shows positive feedback with high engagement. 
                                    The user spent {submission.timeTaken} completing the form, 
                                    indicating good form design and clear instructions.
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Suggested Actions:</h4>
                                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                    <li>Follow up with customer within 24 hours</li>
                                    <li>Add to newsletter if email provided</li>
                                    <li>Consider similar form structure for future surveys</li>
                                  </ul>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Submission Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-semibold">Submitted:</span>
                                    <p>{submission.submittedAt}</p>
                                  </div>
                                  <div>
                                    <span className="font-semibold">IP Address:</span>
                                    <p>{submission.ipAddress}</p>
                                  </div>
                                  <div>
                                    <span className="font-semibold">Time Taken:</span>
                                    <p>{submission.timeTaken}</p>
                                  </div>
                                </div>
                                
                                {submission.data && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Form Data:</h4>
                                    <div className="bg-gray-50 p-3 rounded space-y-2">
                                      {Object.entries(submission.data).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                          <span className="font-medium capitalize">{key}:</span>
                                          <span>{String(value)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Select a form to view its analytics</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AppLayout
      showThreeColumns={true}
      middleColumn={formsColumn}
      rightColumn={submissionsColumn}
    />
  );
}