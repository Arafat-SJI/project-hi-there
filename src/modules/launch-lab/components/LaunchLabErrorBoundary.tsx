import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class LaunchLabErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[launch-lab] render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <Card className="max-w-lg mx-auto mt-8 border-destructive/30">
          <CardHeader>
            <CardTitle>Launch Lab failed to load</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {this.state.error.message || "An unexpected error occurred."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => this.setState({ error: null })}>Try again</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
