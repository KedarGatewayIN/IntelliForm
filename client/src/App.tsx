import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NewDashboard from "@/pages/new-dashboard";
import FormsList from "@/pages/forms-list";
import NewFormBuilder from "@/pages/new-form-builder";
import FormPreview from "@/pages/form-preview";
import NewAnalytics from "@/pages/new-analytics";
import NewTodo from "@/pages/new-todo";
import Bugs from "@/pages/bugs";
import Profile from "@/pages/profile";
import ProtectedRoute from "@/components/layout/protected-route";
import ConversationalForm from "./pages/conversation";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Main Dashboard */}
      <Route path="/">
        <ProtectedRoute>
          <NewDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Forms Routes */}
      <Route path="/forms">
        <ProtectedRoute>
          <FormsList />
        </ProtectedRoute>
      </Route>
      <Route path="/forms/new">
        <ProtectedRoute>
          <NewFormBuilder />
        </ProtectedRoute>
      </Route>
      <Route path="/forms/:id/edit">
        <ProtectedRoute>
          <NewFormBuilder />
        </ProtectedRoute>
      </Route>
      <Route path="/forms/:id/preview">
        <ProtectedRoute>
          <FormPreview />
        </ProtectedRoute>
      </Route>
      <Route path="/forms/:id/analytics">
        <ProtectedRoute>
          <NewAnalytics />
        </ProtectedRoute>
      </Route>
      
      {/* Navigation Pages */}
      <Route path="/todo">
        <ProtectedRoute>
          <NewTodo />
        </ProtectedRoute>
      </Route>
      <Route path="/bugs">
        <ProtectedRoute>
          <Bugs />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      
      {/* Legacy/Additional Routes */}
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
