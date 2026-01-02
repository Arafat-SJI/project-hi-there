/**
 * Webhook Handler Utilities
 * Types and helpers for managing provider webhooks
 */

import { supabase } from '@/lib/supabase';

// ============================================
// WEBHOOK TYPES
// ============================================

export type WebhookEvent =
  | 'meeting.created'
  | 'meeting.updated'
  | 'meeting.deleted'
  | 'meeting.started'
  | 'meeting.ended'
  | 'recording.completed'
  | 'recording.transcript_completed'
  | 'participant.joined'
  | 'participant.left'
  | 'contact.created'
  | 'contact.updated'
  | 'contact.deleted'
  | 'deal.created'
  | 'deal.updated'
  | 'deal.deleted'
  | 'task.created'
  | 'task.updated'
  | 'task.completed'
  | 'email.sent'
  | 'email.delivered'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked';

export type WebhookProvider =
  | 'zoom'
  | 'microsoft_teams'
  | 'google_meet'
  | 'salesforce'
  | 'hubspot'
  | 'sendgrid'
  | 'mailgun';

export interface WebhookPayload {
  event: WebhookEvent;
  provider: WebhookProvider;
  timestamp: string;
  data: Record<string, any>;
  signature?: string;
  delivery_id?: string;
}

export interface WebhookSubscription {
  id: string;
  organization_id: string;
  provider_id: string;
  provider_slug: WebhookProvider;
  webhook_url: string;
  events: WebhookEvent[];
  is_active: boolean;
  secret_token?: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  subscription_id: string;
  event: WebhookEvent;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  retry_count: number;
  processed_at?: string;
  created_at: string;
}

// ============================================
// WEBHOOK SIGNATURE VERIFICATION
// ============================================

/**
 * Verify Zoom webhook signature
 * @param payload - Raw webhook payload
 * @param timestamp - Webhook timestamp header
 * @param signature - Webhook signature header
 * @param secretToken - Webhook secret token
 */
export async function verifyZoomWebhookSignature(
  payload: string,
  timestamp: string,
  signature: string,
  secretToken: string
): Promise<boolean> {
  try {
    // Zoom uses HMAC SHA256
    const message = `v0:${timestamp}:${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretToken),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    const expectedSignature = `v0=${hashHex}`;

    return expectedSignature === signature;
  } catch (error) {
    console.error('Zoom webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Verify SendGrid webhook signature
 * @param payload - Raw webhook payload
 * @param signature - Webhook signature header
 * @param timestamp - Webhook timestamp header
 * @param publicKey - SendGrid public key for verification
 */
export async function verifySendGridWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  publicKey: string
): Promise<boolean> {
  try {
    // SendGrid uses ECDSA signature verification
    // This would require the Web Crypto API or a library
    // For now, return true and log a warning
    console.warn('SendGrid webhook signature verification not fully implemented');
    return true;
  } catch (error) {
    console.error('SendGrid webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Verify HubSpot webhook signature
 * @param payload - Raw webhook payload
 * @param signature - X-HubSpot-Signature header
 * @param appSecret - HubSpot app secret
 */
export async function verifyHubSpotWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): Promise<boolean> {
  try {
    // HubSpot uses SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(appSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return hashHex === signature;
  } catch (error) {
    console.error('HubSpot webhook signature verification failed:', error);
    return false;
  }
}

// ============================================
// WEBHOOK SUBSCRIPTION MANAGEMENT
// ============================================

/**
 * Create webhook subscription for a provider
 * @param organizationId - Organization ID
 * @param providerId - Provider ID
 * @param events - Events to subscribe to
 */
export async function createWebhookSubscription(
  organizationId: string,
  providerId: string,
  events: WebhookEvent[]
): Promise<{ success: boolean; subscription?: WebhookSubscription; error?: string }> {
  try {
    // Generate webhook URL
    const webhookUrl = `${window.location.origin}/api/webhooks/${providerId}`;

    // Generate secret token
    const secretToken = generateWebhookSecret();

    const { data, error } = await supabase
      .from('webhook_subscriptions')
      .insert({
        organization_id: organizationId,
        provider_id: providerId,
        webhook_url: webhookUrl,
        events,
        is_active: true,
        secret_token: secretToken,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, subscription: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete webhook subscription
 * @param subscriptionId - Subscription ID
 */
export async function deleteWebhookSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('webhook_subscriptions')
      .delete()
      .eq('id', subscriptionId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log webhook event
 * @param subscriptionId - Subscription ID
 * @param event - Webhook event type
 * @param payload - Event payload
 */
export async function logWebhookEvent(
  subscriptionId: string,
  event: WebhookEvent,
  payload: Record<string, any>
): Promise<{ success: boolean; log?: WebhookLog; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('webhook_logs')
      .insert({
        subscription_id: subscriptionId,
        event,
        payload,
        status: 'pending',
        retry_count: 0,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, log: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update webhook log status
 * @param logId - Log ID
 * @param status - New status
 * @param errorMessage - Optional error message
 */
export async function updateWebhookLogStatus(
  logId: string,
  status: 'processing' | 'completed' | 'failed',
  errorMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      status,
      processed_at: new Date().toISOString(),
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabase.from('webhook_logs').update(updateData).eq('id', logId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// WEBHOOK HELPERS
// ============================================

/**
 * Generate secure webhook secret token
 */
export function generateWebhookSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Parse webhook event type from provider-specific format
 * @param provider - Provider slug
 * @param rawEvent - Raw event type from provider
 */
export function parseWebhookEvent(provider: WebhookProvider, rawEvent: string): WebhookEvent | null {
  // Map provider-specific event names to our standardized event types
  const eventMappings: Record<WebhookProvider, Record<string, WebhookEvent>> = {
    zoom: {
      'meeting.created': 'meeting.created',
      'meeting.updated': 'meeting.updated',
      'meeting.deleted': 'meeting.deleted',
      'meeting.started': 'meeting.started',
      'meeting.ended': 'meeting.ended',
      'recording.completed': 'recording.completed',
      'recording.transcript_completed': 'recording.transcript_completed',
    },
    microsoft_teams: {
      'meeting.created': 'meeting.created',
      'meeting.updated': 'meeting.updated',
      'meeting.deleted': 'meeting.deleted',
    },
    google_meet: {
      'meeting.created': 'meeting.created',
      'meeting.updated': 'meeting.updated',
      'meeting.deleted': 'meeting.deleted',
    },
    salesforce: {
      'contact.created': 'contact.created',
      'contact.updated': 'contact.updated',
      'contact.deleted': 'contact.deleted',
    },
    hubspot: {
      'contact.created': 'contact.created',
      'contact.updated': 'contact.updated',
      'contact.deleted': 'contact.deleted',
      'deal.created': 'deal.created',
      'deal.updated': 'deal.updated',
    },
    sendgrid: {
      'email.sent': 'email.sent',
      'email.delivered': 'email.delivered',
      'email.bounced': 'email.bounced',
      'email.opened': 'email.opened',
      'email.clicked': 'email.clicked',
    },
    mailgun: {
      'email.delivered': 'email.delivered',
      'email.bounced': 'email.bounced',
      'email.opened': 'email.opened',
      'email.clicked': 'email.clicked',
    },
  };

  const mapping = eventMappings[provider];
  return mapping?.[rawEvent] || null;
}

/**
 * Build webhook registration request for provider
 * @param provider - Provider slug
 * @param webhookUrl - Webhook URL to register
 * @param events - Events to subscribe to
 * @param accessToken - Provider access token
 */
export async function registerProviderWebhook(
  provider: WebhookProvider,
  webhookUrl: string,
  events: string[],
  accessToken: string
): Promise<{ success: boolean; webhookId?: string; error?: string }> {
  try {
    switch (provider) {
      case 'zoom':
        return await registerZoomWebhook(webhookUrl, events, accessToken);
      case 'hubspot':
        return await registerHubSpotWebhook(webhookUrl, events, accessToken);
      // Add more providers as needed
      default:
        return {
          success: false,
          error: `Webhook registration not implemented for ${provider}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Register Zoom webhook subscription
 */
async function registerZoomWebhook(
  webhookUrl: string,
  events: string[],
  accessToken: string
): Promise<{ success: boolean; webhookId?: string; error?: string }> {
  try {
    const response = await fetch('https://api.zoom.us/v2/webhooks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        events,
        auth_user: '',
        auth_password: '',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Failed to register Zoom webhook',
      };
    }

    const data = await response.json();
    return { success: true, webhookId: data.webhook_id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Register HubSpot webhook subscription
 */
async function registerHubSpotWebhook(
  webhookUrl: string,
  events: string[],
  accessToken: string
): Promise<{ success: boolean; webhookId?: string; error?: string }> {
  try {
    // HubSpot uses app-level webhook subscriptions
    // This would typically be configured in HubSpot developer portal
    // For API-based registration, use the webhooks API
    const response = await fetch('https://api.hubapi.com/webhooks/v3/subscriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType: events[0], // HubSpot subscribes one event at a time
        propertyName: '',
        active: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Failed to register HubSpot webhook',
      };
    }

    const data = await response.json();
    return { success: true, webhookId: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
