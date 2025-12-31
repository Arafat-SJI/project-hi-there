import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MessageSquare, Bug, Lightbulb, TrendingUp, Star, Loader2, Send } from "lucide-react";

interface FeedbackItem {
  id: string;
  user_id: string;
  type: "bug" | "feature" | "improvement" | "general";
  subject: string;
  message: string;
  rating: number | null;
  status: "pending" | "reviewed" | "resolved" | "closed";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function Feedback() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myFeedback, setMyFeedback] = useState<FeedbackItem[]>([]);
  const [formData, setFormData] = useState({
    type: "general" as FeedbackItem["type"],
    subject: "",
    message: "",
    rating: 5,
  });

  useEffect(() => {
    if (user) {
      fetchMyFeedback();
    }
  }, [user]);

  const fetchMyFeedback = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyFeedback((data || []) as FeedbackItem[]);
    } catch (error: any) {
      console.error("Fetch feedback error:", error);
      toast.error("Failed to load your feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        user_id: user.id,
        type: formData.type,
        subject: formData.subject,
        message: formData.message,
        rating: formData.rating,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Feedback submitted successfully!");
      setFormData({
        type: "general",
        subject: "",
        message: "",
        rating: 5,
      });
      fetchMyFeedback();
    } catch (error: any) {
      console.error("Submit feedback error:", error);
      toast.error(error.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <Bug className="h-4 w-4" />;
      case "feature":
        return <Lightbulb className="h-4 w-4" />;
      case "improvement":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      reviewed: "default",
      resolved: "default",
      closed: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      bug: "destructive",
      feature: "default",
      improvement: "secondary",
      general: "outline",
    };
    return (
      <Badge variant={variants[type] || "outline"} className="flex items-center gap-1">
        {getTypeIcon(type)}
        {type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground">
          Share your thoughts, report bugs, or suggest improvements
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Submit Feedback Form */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Submit Feedback</CardTitle>
            <CardDescription>We'd love to hear from you!</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: FeedbackItem["type"]) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        General Feedback
                      </div>
                    </SelectItem>
                    <SelectItem value="bug">
                      <div className="flex items-center gap-2">
                        <Bug className="h-4 w-4" />
                        Bug Report
                      </div>
                    </SelectItem>
                    <SelectItem value="feature">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Feature Request
                      </div>
                    </SelectItem>
                    <SelectItem value="improvement">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Improvement
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your feedback"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Provide detailed feedback here..."
                  rows={5}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Rating (Optional)</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="focus:outline-none"
                      disabled={submitting}
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= formData.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {formData.rating}/5
                  </span>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* My Feedback List */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>My Feedback</CardTitle>
            <CardDescription>Your previously submitted feedback</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : myFeedback.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  You haven't submitted any feedback yet
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {myFeedback.map((item, index) => (
                  <div key={item.id}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getTypeBadge(item.type)}
                            {getStatusBadge(item.status)}
                          </div>
                          <h4 className="font-medium mt-2">{item.subject}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.message}
                          </p>
                          {item.rating && (
                            <div className="flex items-center gap-1 mt-2">
                              {[...Array(item.rating)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-3 w-3 fill-yellow-400 text-yellow-400"
                                />
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Submitted {new Date(item.created_at).toLocaleDateString()}
                          </p>
                          {item.admin_notes && (
                            <div className="mt-3 rounded-md bg-muted p-3">
                              <p className="text-xs font-medium">Admin Response:</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.admin_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < myFeedback.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
