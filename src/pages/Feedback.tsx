import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
import { MessageSquare, Bug, Lightbulb, TrendingUp, Star, Loader2, Send, Upload, X } from "lucide-react";

const SCREENSHOT_ACCEPT = "image/png,image/jpeg,image/jpg,image/gif,image/webp";
const SCREENSHOT_MAX = 5;
const SCREENSHOT_MAX_SIZE_MB = 5;

interface FeedbackItem {
  id: string;
  user_id: string;
  type: "bug" | "feature" | "improvement" | "general";
  subject: string;
  message: string;
  rating: number | null;
  status: "pending" | "reviewed" | "resolved" | "closed";
  admin_notes: string | null;
  metadata: { screenshot_urls?: string[] } | null;
  created_at: string;
  updated_at: string;
}

type ScreenshotPreview = { file: File; previewUrl: string };

export default function Feedback() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myFeedback, setMyFeedback] = useState<FeedbackItem[]>([]);
  const [screenshots, setScreenshots] = useState<ScreenshotPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const addScreenshotFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const next: ScreenshotPreview[] = [];
    for (let i = 0; i < files.length && screenshots.length + next.length < SCREENSHOT_MAX; i++) {
      const file = files[i];
      if (!SCREENSHOT_ACCEPT.split(",").some((t) => t.trim() === file.type)) {
        toast.error(`${file.name}: use PNG, JPG, GIF, or WebP`);
        continue;
      }
      if (file.size > SCREENSHOT_MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name}: max ${SCREENSHOT_MAX_SIZE_MB}MB`);
        continue;
      }
      next.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    if (next.length) setScreenshots((prev) => prev.concat(next).slice(0, SCREENSHOT_MAX));
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => {
      const next = prev.slice();
      URL.revokeObjectURL(next[index].previewUrl);
      next.splice(index, 1);
      return next;
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.files;
    if (!items?.length) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) imageFiles.push(items[i]);
    }
    if (imageFiles.length) {
      e.preventDefault();
      const dto = new DataTransfer();
      imageFiles.forEach((f) => dto.items.add(f));
      addScreenshotFiles(dto.files);
    }
  };

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

  const uploadScreenshots = async (): Promise<string[]> => {
    if (!user || !screenshots.length) return [];
    const urls: string[] = [];
    for (const { file } of screenshots) {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/feedback/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("user-knowledge").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("user-knowledge").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
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
      const screenshotUrls = await uploadScreenshots();
      const metadata =
        screenshotUrls.length > 0 ? { screenshot_urls: screenshotUrls } : null;

      const { error } = await supabase.from("feedback").insert({
        user_id: user.id,
        type: formData.type,
        subject: formData.subject,
        message: formData.message,
        rating: formData.rating,
        status: "pending",
        metadata,
      });

      if (error) throw error;

      toast.success("Feedback submitted successfully!");
      setFormData({
        type: "general",
        subject: "",
        message: "",
        rating: 5,
      });
      setScreenshots((prev) => {
        prev.forEach((s) => URL.revokeObjectURL(s.previewUrl));
        return [];
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
            <form onSubmit={handleSubmit} onPaste={handlePaste} className="space-y-4">
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
                <Label>Screenshots (Optional)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={SCREENSHOT_ACCEPT}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addScreenshotFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={submitting || screenshots.length >= SCREENSHOT_MAX}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Add Screenshot
                </Button>
                <p className="text-xs text-muted-foreground">
                  Upload or paste up to {SCREENSHOT_MAX} images (PNG, JPG, GIF, WebP). Max {SCREENSHOT_MAX_SIZE_MB}MB each.
                </p>
                {screenshots.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {screenshots.map((s, i) => (
                      <div
                        key={i}
                        className="relative rounded-md border overflow-hidden bg-muted w-20 h-20 flex-shrink-0"
                      >
                        <img
                          src={s.previewUrl}
                          alt={`Screenshot ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          aria-label="Remove screenshot"
                          className="absolute top-0.5 right-0.5 rounded-full bg-destructive/90 text-destructive-foreground p-1 hover:bg-destructive"
                          onClick={() => removeScreenshot(i)}
                          disabled={submitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                          {item.metadata?.screenshot_urls?.length ? (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.metadata.screenshot_urls.map((url, i) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block rounded border overflow-hidden w-14 h-14 bg-muted flex-shrink-0"
                                >
                                  <img
                                    src={url}
                                    alt={`Screenshot ${i + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </a>
                              ))}
                            </div>
                          ) : null}
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
