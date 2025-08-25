import { useState } from "react";
import { useLocation } from "wouter";
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
import { useForms, useDeleteForm } from "@/hooks/use-forms";
import { useToast } from "@/hooks/use-toast";
import { useTitle } from "@/hooks/use-title";
import {
  EyeIcon,
  BarChart3Icon,
  TrashIcon,
  SearchIcon,
  FileTextIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function FormsList() {
  useTitle("Forms");
  const [, navigate] = useLocation();
  const { data: forms = [], isLoading } = useForms();
  const deleteFormMutation = useDeleteForm();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredForms = forms.filter((form) =>
    form.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (formId: string, formTitle: string) => {
    try {
      await deleteFormMutation.mutateAsync(formId);
      toast({
        title: "Form Deleted",
        description: `"${formTitle}" has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete form. Please try again.",
        variant: "destructive",
      });
    }
  };

  const secondColumn = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
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

      {/* Forms Table */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileTextIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No forms found" : "No forms yet"}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              {searchQuery 
                ? "Try adjusting your search terms"
                : "Create your first form to start collecting responses"
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate("/forms/new")}>
                Create Your First Form
              </Button>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map((form) => (
                    <TableRow key={form.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                            <FileTextIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {form.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {form.description || "No description"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/forms/${form.id}/edit`)}
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/analytics/${form.id}`)}
                          >
                            <BarChart3Icon className="h-4 w-4 mr-1" />
                            Analytics
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Disable
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Form</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{form.title}"? 
                                  This action cannot be undone and will remove all submissions.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(form.id, form.title)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    <ThreeColumnLayout secondColumn={secondColumn} />
  );
}