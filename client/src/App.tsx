import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import FormBuilder from "@/pages/form-builder";
import FormPreview from "@/pages/form-preview";
import FormAnalytics from "@/pages/form-analytics";
import ProtectedRoute from "@/components/layout/protected-route";
import ConversationalForm from "./pages/conversation";
import AnalyticsPage from "./pages/analytics";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute>
          <AnalyticsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/forms/new">
        <ProtectedRoute>
          <FormBuilder />
        </ProtectedRoute>
      </Route>
      <Route path="/forms/:id/edit">
        <ProtectedRoute>
          <FormBuilder />
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
