import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/navbar";
import { useForms } from "@/hooks/use-forms";
import { PlusIcon, EyeIcon, PencilIcon, BarChart3Icon, BotIcon, ClockIcon, FileTextIcon } from "lucide-react";

export default function Dashboard() {
  const { data: forms = [], isLoading } = useForms();

  const stats = {
    totalForms: forms.length,
    totalResponses: forms.reduce((acc, form) => acc + (form.submissions?.length || 0), 0),
    aiConversations: forms.reduce((acc, form) => acc + (form.aiConversations || 0), 0),
    avgTime: "3m 42s"
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Forms</h1>
          <p className="text-gray-600">Create, manage, and analyze your intelligent forms</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileTextIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Forms</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalForms}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-50 rounded-lg">
                  <BarChart3Icon className="h-6 w-6 text-accent" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Responses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalResponses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <BotIcon className="h-6 w-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">AI Conversations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.aiConversations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Completion Time</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex space-x-2">
            <Button variant="default" size="sm">All Forms</Button>
            <Button variant="outline" size="sm">Published</Button>
            <Button variant="outline" size="sm">Draft</Button>
            <Button variant="outline" size="sm">AI-Enabled</Button>
          </div>
          
          <div className="relative">
            <Input
              type="text"
              placeholder="Search forms..."
              className="pl-10 w-full sm:w-64"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <Card key={form.id} className="hover:shadow-lg transition-all duration-200 group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                      <FileTextIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {form.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Updated {new Date(form.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${form.isPublished ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                    <span className="text-xs text-gray-500">
                      {form.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {form.description || 'No description provided'}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>
                    <BarChart3Icon className="h-4 w-4 inline mr-1" />
                    {form.submissions?.length || 0} responses
                  </span>
                  {form.fields.some((field: any) => field.aiEnabled) && (
                    <span>
                      <BotIcon className="h-4 w-4 inline mr-1 text-secondary" />
                      AI-enabled
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Link href={`/forms/${form.id}/preview`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/forms/${form.id}/edit`} className="flex-1">
                    <Button size="sm" className="w-full">
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create New Form Card */}
          <Link href="/forms/new">
            <Card className="border-2 border-dashed border-gray-300 hover:border-primary hover:bg-gray-50 transition-all duration-200 cursor-pointer group h-full">
              <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <PlusIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Create New Form</h3>
                <p className="text-gray-500 text-sm">Start building your intelligent form with our drag-and-drop builder</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
