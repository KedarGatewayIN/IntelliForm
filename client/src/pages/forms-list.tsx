import { useState } from "react";
import { Link } from "wouter";
import AppLayout from "@/components/layout/app-layout";
import { useTitle } from "@/hooks/use-title";
import { useForms } from "@/hooks/use-forms";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, BarChart3, Trash2, Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

export default function FormsList() {
  useTitle("Forms");
  const { data: forms = [], isLoading, refetch } = useForms();
  const { toast } = useToast();
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);

  const handleDisableForm = async (formId: string) => {
    setDeletingFormId(formId);
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: "Form deleted",
          description: "The form has been successfully deleted.",
        });
        refetch();
      } else {
        throw new Error('Failed to delete form');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingFormId(null);
    }
  };

  return (
    <AppLayout>
      <div className="h-full p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <p className="text-gray-600">Manage and view all your forms</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                      No forms found. <Link href="/forms/new" className="text-blue-600 hover:underline">Create your first form</Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  forms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{form.title}</div>
                          {form.description && (
                            <div className="text-sm text-gray-500">{form.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/forms/${form.id}/edit`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/forms/${form.id}/analytics`}>
                              <BarChart3 className="h-4 w-4 mr-1" />
                              Analytics
                            </Link>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={deletingFormId === form.id}
                              >
                                {deletingFormId === form.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 mr-1" />
                                )}
                                Disable
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action will permanently delete the form "{form.title}" and all its data. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDisableForm(form.id)}
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}