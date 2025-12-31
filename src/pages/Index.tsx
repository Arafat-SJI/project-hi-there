import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Copy } from 'lucide-react';

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">SJ Control Tower Framework</h1>
          <p className="text-xl text-muted-foreground">
            Next-generation project management and AI-powered productivity platform
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Copy className="h-5 w-5 text-primary" />
                <CardTitle>Edge Function Copy Tool</CardTitle>
              </div>
              <CardDescription>
                Copy edge functions between Supabase projects with a simple point-and-click interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/edge-function-copy">
                <Button className="w-full">
                  Open Copy Tool
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-3">
                No CLI required • Select functions • One-click copy
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Set up your new project with the framework</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">Quick Start Guides:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <a href="/docs/QUICKSTART_LOVABLE.md" className="hover:underline">Lovable Quick Start</a></li>
                  <li>• <a href="/docs/sj-innovation-framework_setup.md" className="hover:underline">Framework Setup</a></li>
                  <li>• <a href="/docs/EDGE_FUNCTION_COPY_TOOL.md" className="hover:underline">Copy Tool Guide</a></li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">What's Included?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div>
                <p className="font-semibold mb-1">Core Features</p>
                <ul className="text-muted-foreground space-y-0.5">
                  <li>• Authentication & Users</li>
                  <li>• Client Management</li>
                  <li>• Notifications System</li>
                  <li>• Feedback Collection</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">Advanced Modules</p>
                <ul className="text-muted-foreground space-y-0.5">
                  <li>• AI Agents Framework</li>
                  <li>• Knowledge Base</li>
                  <li>• Meetings (Zoom)</li>
                  <li>• Semantic Search</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">Infrastructure</p>
                <ul className="text-muted-foreground space-y-0.5">
                  <li>• 31 Edge Functions</li>
                  <li>• 51 UI Components</li>
                  <li>• Complete Database Schema</li>
                  <li>• Security & Validation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
