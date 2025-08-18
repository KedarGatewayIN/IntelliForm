# IntelliForm - Interactive Conversational Form Builder

## Overview

IntelliForm is a next-generation interactive form builder that revolutionizes the traditional form-filling experience. The platform combines a powerful drag-and-drop form builder with an innovative "one-question-at-a-time" stepper interface and AI-powered conversational capabilities. Built as a full-stack TypeScript application, IntelliForm aims to be a market-leading form builder that competes with platforms like Typeform and Jotform while offering unique AI-enhanced user interactions.

The application focuses on creating engaging, user-centric forms that move away from static layouts to dynamic, conversational experiences. The AI integration serves as a "superpower" feature for specific form fields, enhancing the core form-building functionality rather than replacing it.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with React and TypeScript, utilizing a modern component-based architecture:

- **UI Framework**: React with TypeScript for type safety and developer experience
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design system
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod for form validation and type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

The application follows a feature-based folder structure with reusable UI components, custom hooks, and page-level components. The form builder uses a canvas-based approach with drag-and-drop functionality for creating forms.

### Backend Architecture
The server-side is built with Express.js and follows a clean architecture pattern:

- **Web Framework**: Express.js with TypeScript for API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with HTTP-only cookies
- **API Design**: RESTful API structure with proper error handling and validation
- **Middleware**: Custom authentication middleware and request logging

The backend implements a service-oriented architecture with separate modules for storage, authentication, and AI services.

### Database Design
PostgreSQL database with Drizzle ORM provides robust data persistence:

- **Users Table**: Stores user authentication and profile information
- **Forms Table**: Contains form metadata, field definitions, and settings stored as JSON
- **Submissions Table**: Captures form responses with completion tracking and analytics
- **AI Conversations Table**: Logs AI interactions for specific form fields

The schema uses UUID primary keys and includes proper relationships between entities. JSON fields store complex form configurations and conversation data.

### Authentication System
JWT-based authentication provides secure user sessions:

- **Registration/Login**: Password hashing with bcrypt
- **Session Management**: HTTP-only cookies for token storage
- **Route Protection**: Middleware-based authentication for protected endpoints
- **User Context**: React context for client-side authentication state

### Form Builder Engine
The core form building functionality supports comprehensive form creation:

- **Drag-and-Drop Interface**: Visual form builder with element sidebar
- **Field Types**: Comprehensive support for text inputs, choice elements, advanced components
- **Conditional Logic**: Show/hide fields based on previous answers
- **Styling System**: Global and per-element customization options
- **Real-time Preview**: Live preview of forms during creation

### Stepper Interface
The unique user experience feature that differentiates IntelliForm:

- **One-Question-at-a-Time**: Progressive disclosure of form fields
- **Progress Tracking**: Visual progress indicators and completion tracking
- **Navigation Controls**: Forward/backward navigation with validation
- **Response Persistence**: Auto-saving of responses during completion

### Form Rendering System
Dynamic form rendering supports various field types:

- **Basic Inputs**: Text, email, number, textarea with validation
- **Choice Elements**: Radio buttons, checkboxes, dropdowns
- **Advanced Components**: Date pickers, rating scales, file uploads
- **AI Conversation Fields**: Special textarea with AI chat integration

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL hosting service accessed via `@neondatabase/serverless`
- **Connection Pooling**: WebSocket-based connection pooling for serverless environments

### AI Services
- **Groq API**: Large language model service via `@langchain/groq` for conversational AI
- **LangChain Integration**: Structured AI interactions with conversation management

### UI Component Libraries
- **Radix UI**: Headless UI primitives for accessibility and functionality
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library based on Radix UI and Tailwind CSS

### Development Tools
- **TypeScript**: Type safety across the entire application
- **Drizzle Kit**: Database migration and schema management
- **Vite**: Development server and build tool with hot module replacement
- **TanStack Query**: Server state management with caching and synchronization

### Authentication & Security
- **bcryptjs**: Password hashing for secure user authentication
- **jsonwebtoken**: JWT token generation and verification
- **cookie-parser**: HTTP cookie parsing for session management

### Form Management
- **React Hook Form**: Client-side form state management
- **Zod**: Runtime type validation and schema definition
- **date-fns**: Date manipulation and formatting utilities

The application is designed to be deployment-ready with environment-based configuration and uses modern web standards for optimal performance and user experience.