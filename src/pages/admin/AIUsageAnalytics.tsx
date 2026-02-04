import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  Users,
  Loader2,
  Download,
  Calendar,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface UsageLog {
  id: string;
  user_id: string;
  model_id: string;
  function_name: string;
  input_tokens: number;
  output_tokens: number;
  embedding_tokens: number;
  estimated_cost: number;
  created_at: string;
  user_email?: string;
  model_name?: string;
  provider_name?: string;
}

interface UsageSummary {
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
  avgCostPerRequest: number;
}

interface ProviderUsage {
  provider: string;
  cost: number;
  requests: number;
}

interface ModelUsage {
  model: string;
  requests: number;
}

export default function AIUsageAnalytics() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [summary, setSummary] = useState<UsageSummary>({
    totalTokens: 0,
    totalCost: 0,
    totalRequests: 0,
    avgCostPerRequest: 0,
  });
  const [providerUsage, setProviderUsage] = useState<ProviderUsage[]>([]);
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "month">("30d");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");

  useEffect(() => {
    loadUsageData();
  }, [dateRange, selectedProvider]);

  const getDateRangeFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "7d":
        return subDays(now, 7).toISOString();
      case "30d":
        return subDays(now, 30).toISOString();
      case "month":
        return startOfMonth(now).toISOString();
      default:
        return subDays(now, 30).toISOString();
    }
  };

  const loadUsageData = async () => {
    setLoading(true);
    try {
      const startDate = getDateRangeFilter();

      // Build query for usage logs - join with ai_models only (no FK to auth.users)
      let query = supabase
        .from("ai_usage_logs")
        .select(
          `
          *,
          ai_models (
            name,
            ai_providers (
              name
            )
          )
        `
        )
        .gte("created_at", startDate)
        .order("created_at", { ascending: false })
        .limit(100);

      const { data: logsData, error: logsError } = await query;

      if (logsError) throw logsError;

      // Get unique user IDs to fetch emails from profiles table
      const userIds = [...new Set((logsData || []).map((log: any) => log.user_id).filter(Boolean))];
      
      // Fetch user emails from profiles table
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      const userEmailMap = new Map<string, string>();
      (profilesData || []).forEach((profile: any) => {
        userEmailMap.set(profile.id, profile.email || "Unknown");
      });

      // Transform data
      const transformedLogs: UsageLog[] = (logsData || []).map((log: any) => ({
        id: log.id,
        user_id: log.user_id,
        model_id: log.model_id,
        function_name: log.function_name,
        input_tokens: log.input_tokens,
        output_tokens: log.output_tokens,
        embedding_tokens: log.embedding_tokens,
        estimated_cost: log.estimated_cost,
        created_at: log.created_at,
        user_email: userEmailMap.get(log.user_id) || "Unknown",
        model_name: log.ai_models?.name || "Unknown",
        provider_name: log.ai_models?.ai_providers?.name || "Unknown",
      }));

      setLogs(transformedLogs);

      // Calculate summary
      const totalTokens = transformedLogs.reduce(
        (sum, log) => sum + log.input_tokens + log.output_tokens + log.embedding_tokens,
        0
      );
      const totalCost = transformedLogs.reduce((sum, log) => sum + Number(log.estimated_cost), 0);
      const totalRequests = transformedLogs.length;

      setSummary({
        totalTokens,
        totalCost,
        totalRequests,
        avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      });

      // Calculate provider usage
      const providerMap = new Map<string, { cost: number; requests: number }>();
      transformedLogs.forEach((log) => {
        const provider = log.provider_name || "Unknown";
        const existing = providerMap.get(provider) || { cost: 0, requests: 0 };
        providerMap.set(provider, {
          cost: existing.cost + Number(log.estimated_cost),
          requests: existing.requests + 1,
        });
      });

      const providerUsageData = Array.from(providerMap.entries()).map(([provider, data]) => ({
        provider,
        cost: data.cost,
        requests: data.requests,
      }));
      setProviderUsage(providerUsageData);

      // Calculate model usage
      const modelMap = new Map<string, number>();
      transformedLogs.forEach((log) => {
        const model = log.model_name || "Unknown";
        modelMap.set(model, (modelMap.get(model) || 0) + 1);
      });

      const modelUsageData = Array.from(modelMap.entries())
        .map(([model, requests]) => ({ model, requests }))
        .sort((a, b) => b.requests - a.requests);
      setModelUsage(modelUsageData);
    } catch (error: any) {
      console.error("Error loading usage data:", error);
      toast.error("Failed to load usage analytics");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "User",
      "Provider",
      "Model",
      "Function",
      "Input Tokens",
      "Output Tokens",
      "Embedding Tokens",
      "Cost",
    ];

    const rows = logs.map((log) => [
      format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      log.user_email,
      log.provider_name,
      log.model_name,
      log.function_name || "N/A",
      log.input_tokens,
      log.output_tokens,
      log.embedding_tokens,
      log.estimated_cost.toFixed(6),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-usage-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Usage data exported to CSV");
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Usage Analytics</h1>
          <p className="text-muted-foreground">
            Monitor AI usage, costs, and performance across your platform
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="month">This month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              {dateRange === "7d" ? "Last 7 days" : dateRange === "30d" ? "Last 30 days" : "This month"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all models</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">API calls made</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Request</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.avgCostPerRequest.toFixed(6)}</div>
            <p className="text-xs text-muted-foreground">Per API call</p>
          </CardContent>
        </Card>
      </div>

      {/* Provider and Model Usage */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cost by Provider</CardTitle>
            <CardDescription>Breakdown of costs across AI providers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {providerUsage.map((provider) => {
                const percentage =
                  summary.totalCost > 0 ? (provider.cost / summary.totalCost) * 100 : 0;
                return (
                  <div key={provider.provider} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{provider.provider}</span>
                      <span className="text-muted-foreground">
                        ${provider.cost.toFixed(4)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Popularity</CardTitle>
            <CardDescription>Most frequently used models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modelUsage.slice(0, 5).map((model) => {
                const percentage =
                  summary.totalRequests > 0 ? (model.requests / summary.totalRequests) * 100 : 0;
                return (
                  <div key={model.model} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{model.model}</span>
                      <span className="text-muted-foreground">
                        {model.requests} calls ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Usage Log</CardTitle>
          <CardDescription>Recent AI usage across your platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {format(new Date(log.created_at), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell className="text-sm">{log.user_email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.provider_name}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{log.model_name}</TableCell>
                  <TableCell className="text-sm">
                    {(log.input_tokens + log.output_tokens + log.embedding_tokens).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    ${Number(log.estimated_cost).toFixed(6)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
