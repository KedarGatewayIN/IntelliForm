import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Form } from "@/lib/types";

export function useForms() {
  return useQuery<Form[]>({
    queryKey: ["/api/forms"],
  });
}

export function useForm(id: string | undefined) {
  return useQuery<Form>({
    queryKey: ["/api/forms", id],
    enabled: !!id,
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (formData: Partial<Form>) => 
      apiRequest("POST", "/api/forms", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
    },
  });
}

export function useUpdateForm(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (formData: Partial<Form>) => 
      apiRequest("PUT", `/api/forms/${id}`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forms", id] });
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/forms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
    },
  });
}
