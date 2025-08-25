import { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { useTitle } from "@/hooks/use-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TodoItem {
  id: string;
  problem: string;
  formName: string;
  repetitions: number;
  solutions: string[];
  submissions: number;
  status: "open" | "resolved";
}

// Mock data for todos
const mockTodos: TodoItem[] = [
  {
    id: "1",
    problem: "Form validation error on email field",
    formName: "Customer Registration",
    repetitions: 15,
    solutions: [
      "Update email regex pattern",
      "Add better error messaging",
      "Implement real-time validation"
    ],
    submissions: 342,
    status: "open"
  },
  {
    id: "2",
    problem: "Submit button not working on mobile",
    formName: "Product Survey",
    repetitions: 8,
    solutions: [
      "Fix CSS button styling",
      "Update touch event handlers",
      "Test on various devices"
    ],
    submissions: 156,
    status: "open"
  },
  {
    id: "3",
    problem: "Required field validation inconsistent",
    formName: "Contact Form",
    repetitions: 22,
    solutions: [
      "Standardize validation logic",
      "Update form schema",
      "Add visual indicators"
    ],
    submissions: 789,
    status: "resolved"
  },
  {
    id: "4",
    problem: "Date picker not showing on Safari",
    formName: "Event Registration",
    repetitions: 6,
    solutions: [
      "Add Safari-specific polyfill",
      "Update date input component",
      "Test cross-browser compatibility"
    ],
    submissions: 93,
    status: "open"
  },
  {
    id: "5",
    problem: "Form submission timeout on slow connections",
    formName: "Application Form",
    repetitions: 12,
    solutions: [
      "Increase timeout duration",
      "Add progress indicators",
      "Implement auto-save functionality"
    ],
    submissions: 267,
    status: "open"
  }
];

export default function NewTodo() {
  useTitle("Todos");
  const [todos, setTodos] = useState<TodoItem[]>(mockTodos);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTodos = todos.filter(todo =>
    todo.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
    todo.formName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    todo.solutions.some(solution => 
      solution.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleResolve = (todoId: string) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === todoId ? { ...todo, status: "resolved" } : todo
      )
    );
  };

  const openTodos = filteredTodos.filter(todo => todo.status === "open");
  const resolvedTodos = filteredTodos.filter(todo => todo.status === "resolved");

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header and Filters Row */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Todo Issues</h1>
              <p className="text-gray-600">Track and resolve form-related problems</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  {openTodos.length} Open
                </Badge>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {resolvedTodos.length} Resolved
                </Badge>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Row */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problem</TableHead>
                  <TableHead>Form Name</TableHead>
                  <TableHead className="text-center">Repetitions</TableHead>
                  <TableHead>Solutions</TableHead>
                  <TableHead className="text-center">Submissions</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTodos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No issues found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTodos.map((todo) => (
                    <TableRow key={todo.id}>
                      <TableCell className="font-medium max-w-xs">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>{todo.problem}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-blue-600 font-medium">{todo.formName}</span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <Badge variant={todo.repetitions > 15 ? "destructive" : todo.repetitions > 10 ? "default" : "secondary"}>
                          {todo.repetitions}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="max-w-sm">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              View Solutions ({todo.solutions.length})
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Proposed Solutions</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                              <div className="font-medium text-gray-900">{todo.problem}</div>
                              <div className="space-y-2">
                                {todo.solutions.map((solution, index) => (
                                  <div key={index} className="flex items-start space-x-2">
                                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                                      {index + 1}
                                    </div>
                                    <span className="text-gray-700">{solution}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className="text-gray-600">{todo.submissions}</span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        {todo.status === "resolved" ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Open
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {todo.status === "open" ? (
                          <Button
                            size="sm"
                            onClick={() => handleResolve(todo.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-sm">Resolved</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}