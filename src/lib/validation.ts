import { z } from "zod";

// Email validation
export const emailSchema = z.string().email("Invalid email address");

export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// URL validation
export const urlSchema = z.string().url("Invalid URL");

export function validateUrl(url: string): boolean {
  return urlSchema.safeParse(url).success;
}

// String sanitization
export function sanitizeString(str: string): string {
  return str.trim().replace(/\s+/g, " ");
}

// Phone validation
export const phoneSchema = z.string().regex(/^\+?[\d\s\-()]+$/, "Invalid phone number");

export function validatePhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

// Form validation helpers
export function isRequired(value: any): boolean {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
}

export function minLength(value: string, min: number): boolean {
  return value.length >= min;
}

export function maxLength(value: string, max: number): boolean {
  return value.length <= max;
}

// Common validation schemas - aligned with form requirements
export const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  company: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const meetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  meeting_date: z.string().min(1, "Date is required"),
  duration_minutes: z.number().min(1, "Duration must be at least 1 minute").optional(),
  description: z.string().optional(),
  client_id: z.string().optional().or(z.literal("")),
  zoom_meeting_id: z.string().optional(),
  zoom_join_url: z.string().optional(),
});

export const knowledgeEntrySchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;
export type MeetingFormData = z.infer<typeof meetingSchema>;
export type KnowledgeEntryFormData = z.infer<typeof knowledgeEntrySchema>;
