import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import DashboardNew from "@/pages/dashboard-new";
import FormsList from "@/pages/forms-list";
import FormBuilder from "@/pages/form-builder";
import FormBuilderNew from "@/pages/form-builder-new";
import FormPreview from "@/pages/form-preview";
import FormAnalytics from "@/pages/form-analytics";
import AnalyticsNew from "@/pages/analytics-new";
import TodoNew from "@/pages/todo-new";
import Bugs from "@/pages/bugs";
import ProtectedRoute from "@/components/layout/protected-route";
import ConversationalForm from "./pages/conversation";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardNew />
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <DashboardNew />
        </ProtectedRoute>
      </Route>
      <Route path="/forms" nest>
        <ProtectedRoute>
          <FormsList />
        </ProtectedRoute>
      </Route>
      <Route path="/forms/new">
        <ProtectedRoute>
          <FormBuilderNew />
        </ProtectedRoute>
      </Route>
      <Route path="/forms/:id/edit">
        <ProtectedRoute>
          <FormBuilderNew />
        </ProtectedRoute>
      </Route>
      <Route path="/analytics/:id?">
        <ProtectedRoute>
          <AnalyticsNew />
        </ProtectedRoute>
      </Route>
      <Route path="/todo">
        <ProtectedRoute>
          <TodoNew />
        </ProtectedRoute>
      </Route>
      <Route path="/bugs">
        <ProtectedRoute>
          <Bugs />
        </ProtectedRoute>
      </Route>
      <Route path="/forms/:id/preview">
        <ProtectedRoute>
          <FormPreview />
        </ProtectedRoute>
      </Route>
      <Route path="/forms/:id/analytics">
        <ProtectedRoute>
          <FormAnalytics />
        </ProtectedRoute>
      </Route>
      <Route path="/forms/:id/responses/:sid" component={FormPreview} />
      <Route path="/f/:id" component={ConversationalForm} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
