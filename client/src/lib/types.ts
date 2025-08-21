export interface User {
  id: string;
  username: string;
  email: string;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: ValidationRule[];
  aiEnabled?: boolean;
  conditional?: ConditionalLogic;
}

export interface FormSettings {
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
  };
  stepperMode?: boolean;
  allowBack?: boolean;
  showProgress?: boolean;
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  userId: string;
  fields: FormField[];
  settings: FormSettings;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  submissions?: Submission[];
  aiConversationCount?: number;
}

export interface Submission {
  id: string;
  formId: string;
  data: Record<string, any>;
  completedAt: string;
  timeTaken?: number;
  ipAddress?: string;
  resolved?: boolean;
  problems?: Problem[];
  aiProblem?: string | null;
  aiSolutions?: string[];
  resolutionComment?: string | null;
  aiConversations?: AIConversation[];
}

export interface Problem {
  id: string;
  problem: string;
  solutions: string[];
  resolved: boolean;
  resolutionComment: string;
}

export interface AIConversation {
  id: string;
  submissionId: string;
  fieldId: string;
  messages: AIMessage[];
  createdAt: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ValidationRule {
  type: 'min' | 'max' | 'email' | 'url' | 'pattern';
  value: string | number;
  message: string;
}

export interface ConditionalLogic {
  showIf: {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains';
    value: string;
  };
}

export type FormFieldType = 
  | 'text'
  | 'textarea'
  | 'email'
  | 'number'
  | 'password'
  | 'url'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'date'
  | 'file'
  | 'rating'
  | 'slider'
  | 'ai_conversation';

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FormAnalytics {
  totalResponses: number;
  completionRate: number;
  aiInteractions: number;
  averageTimeSeconds: number;
  responsesByDay: Array<{
    date: string;
    count: number;
  }>;
  fieldAnalytics: Array<{
    fieldId: string;
    fieldLabel: string;
    responses: number;
    averageTime?: number;
    aiUsage?: number;
  }>;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Form Builder specific types
export interface DraggedElement {
  type: FormFieldType;
  label: string;
  icon: string;
}

export interface FormBuilderState {
  selectedField: FormField | null;
  draggedElement: DraggedElement | null;
  previewMode: boolean;
  isDirty: boolean;
}

// Theme and styling types
export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
}

export interface FormTheme {
  colors: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  typography: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
  };
  spacing: {
    padding?: string;
    margin?: string;
    borderRadius?: string;
  };
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireOnly<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;
