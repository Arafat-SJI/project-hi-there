// validate-api-key — supports: openai, sendgrid, zoom, anthropic, google_ai, perplexity, salesforce, hubspot, mailgun, postmark, amazon_ses, jira, asana, monday, clickup, workamajig, float, fellow
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // GET = health check (no body), return 200 so deployment checks pass
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ valid: true, message: 'ok' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }

  try {
    // Parse request body (POST may have empty body for health check)
    let requestBody: Record<string, unknown> = {};
    try {
      const parsed = await req.json();
      requestBody = parsed != null && typeof parsed === 'object' ? parsed : {};
    } catch {
      // Empty or invalid JSON body - treat as health check
      return new Response(
        JSON.stringify({ valid: true, message: 'ok' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Support both formats:
    // 1. { apiKey: "xxx", service: "sendgrid" } - direct format
    // 2. { provider: "sendgrid", credentials: { api_key: "xxx" } } - frontend format
    let apiKey = requestBody.apiKey as string | undefined;
    let service = requestBody.service as string | undefined;
    const ping = requestBody.ping as boolean | undefined;
    
    // Handle frontend format with provider/credentials
    const provider = requestBody.provider as string | undefined;
    const credentials = requestBody.credentials as Record<string, string> | undefined;

    // Health check / deployment test - no external calls (ping or empty body)
    if (ping === true || (requestBody && Object.keys(requestBody).length === 0)) {
      return new Response(
        JSON.stringify({ valid: true, message: 'ok' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Jira: integration hub sends jira_host, jira_email, jira_api_token (not a single apiKey)
    if (provider === 'jira' && credentials) {
      const jiraHost = String(credentials.jira_host || credentials.jiraHost || '').trim()
      const jiraEmail = String(credentials.jira_email || credentials.jiraEmail || '').trim()
      const jiraToken = String(credentials.jira_api_token || credentials.jiraApiToken || '').trim()
      if (jiraHost && jiraEmail && jiraToken) {
        const jiraResult = await validateJiraFromFields(jiraHost, jiraEmail, jiraToken)
        return new Response(
          JSON.stringify(jiraResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
      // Hub form uses jira_* keys — do not fall through to legacy colon parser (would treat URL as apiKey).
      const hubUsesTriplet =
        'jira_host' in credentials ||
        'jiraHost' in credentials ||
        'jira_email' in credentials ||
        'jiraEmail' in credentials ||
        'jira_api_token' in credentials ||
        'jiraApiToken' in credentials
      if (hubUsesTriplet) {
        return new Response(
          JSON.stringify({
            valid: false,
            message:
              'Jira requires all three: site URL, Atlassian email, and API token. Fill every field (token is often not sent until you tab out or save), then test again.',
            details: {},
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
    }

    if (provider === 'fellow' && credentials) {
      const rawSub = String(credentials.subdomain || credentials.fellow_subdomain || credentials.fellowSubdomain || '').trim()
      const fellowKey = String(credentials.api_key || credentials.apiKey || credentials.fellow_api_key || credentials.fellowApiKey || '').trim()
      const fellowResult = await validateFellow(rawSub, fellowKey)
      return new Response(
        JSON.stringify(fellowResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    if (provider && credentials) {
      service = provider;
      // Extract API key from credentials - common field names
      // Skip first-value fallback for Jira so jira_host URL is never passed to legacy validateJira
      if (provider !== 'jira') {
        apiKey = credentials.float_api_key || credentials.floatApiKey ||
          credentials.api_key || credentials.apiKey || credentials.access_token ||
          credentials.secret_key || credentials.token || Object.values(credentials)[0];
      } else {
        apiKey = credentials.api_key || credentials.apiKey || credentials.access_token ||
          credentials.secret_key || credentials.token;
      }
    }

    if (!apiKey || !service) {
      return new Response(
        JSON.stringify({ valid: false, error: 'API key and service are required. Expected { apiKey, service } or { provider, credentials }' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let validationResult = { valid: false, message: '', details: {} }

    // Validate based on service type
    switch (service) {
      case 'openai':
        validationResult = await validateOpenAI(apiKey)
        break
      case 'sendgrid':
        validationResult = await validateSendGrid(apiKey)
        break
      case 'zoom':
        validationResult = await validateZoom(apiKey)
        break
      case 'anthropic':
        validationResult = await validateAnthropic(apiKey)
        break
      case 'google_ai':
        validationResult = await validateGoogleAI(apiKey)
        break
      case 'perplexity':
        validationResult = await validatePerplexity(apiKey)
        break
      case 'salesforce':
        validationResult = await validateSalesforce(apiKey)
        break
      case 'hubspot':
        validationResult = await validateHubSpot(apiKey)
        break
      case 'mailgun':
        validationResult = await validateMailgun(apiKey)
        break
      case 'postmark':
        validationResult = await validatePostmark(apiKey)
        break
      case 'amazon_ses':
        validationResult = await validateAmazonSES(apiKey)
        break
      case 'jira':
        validationResult = await validateJira(apiKey)
        break
      case 'asana':
        validationResult = await validateAsana(apiKey)
        break
      case 'monday':
        validationResult = await validateMonday(apiKey)
        break
      case 'clickup':
        validationResult = await validateClickUp(apiKey)
        break
      case 'float':
        validationResult = await validateFloat(apiKey, credentials)
        break
      case 'workamajig':
        validationResult = await validateWorkamajig(apiKey, credentials)
        break
      default:
        return new Response(
          JSON.stringify({ valid: false, error: `Unknown service: ${service}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    return new Response(
      JSON.stringify(validationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ valid: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Validate OpenAI API key
async function validateOpenAI(apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        valid: true,
        message: 'OpenAI API key is valid',
        details: {
          models_count: data.data?.length || 0,
        },
      }
    } else {
      const errorData = await response.json()
      return {
        valid: false,
        message: errorData.error?.message || 'Invalid OpenAI API key',
        details: { status: response.status },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `OpenAI validation error: ${message}`,
      details: {},
    }
  }
}

// Validate SendGrid API key
async function validateSendGrid(apiKey: string) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/scopes', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        valid: true,
        message: 'SendGrid API key is valid',
        details: {
          scopes_count: data.scopes?.length || 0,
        },
      }
    } else {
      const errorData = await response.json()
      return {
        valid: false,
        message: errorData.errors?.[0]?.message || 'Invalid SendGrid API key',
        details: { status: response.status },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `SendGrid validation error: ${message}`,
      details: {},
    }
  }
}

// Validate Zoom credentials (OAuth requires account_id, client_id, client_secret)
async function validateZoom(credentials: string) {
  try {
    // Expect credentials in format: account_id:client_id:client_secret
    const [accountId, clientId, clientSecret] = credentials.split(':')

    if (!accountId || !clientId || !clientSecret) {
      return {
        valid: false,
        message: 'Zoom credentials must be in format: account_id:client_id:client_secret',
        details: {},
      }
    }

    // Test Zoom OAuth token endpoint
    const authString = btoa(`${clientId}:${clientSecret}`)
    const response = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    if (response.ok) {
      const data = await response.json()
      return {
        valid: true,
        message: 'Zoom credentials are valid',
        details: {
          token_type: data.token_type,
          expires_in: data.expires_in,
        },
      }
    } else {
      const errorData = await response.json()
      return {
        valid: false,
        message: errorData.reason || 'Invalid Zoom credentials',
        details: { status: response.status },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `Zoom validation error: ${message}`,
      details: {},
    }
  }
}

// Validate Anthropic API key
async function validateAnthropic(apiKey: string) {
  try {
    // Test a simple API call to list available models
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      }),
    })

    if (response.ok || response.status === 400) {
      // 400 is acceptable as it means the API key is valid but the request format might be intentionally minimal
      return {
        valid: true,
        message: 'Anthropic API key is valid',
        details: { status: response.status },
      }
    } else if (response.status === 401) {
      return {
        valid: false,
        message: 'Invalid Anthropic API key',
        details: { status: response.status },
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      return {
        valid: false,
        message: errorData.error?.message || 'Invalid Anthropic API key',
        details: { status: response.status },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `Anthropic validation error: ${message}`,
      details: {},
    }
  }
}

// Validate Google AI (Gemini) API key
async function validateGoogleAI(apiKey: string) {
  try {
    // Test the models endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.ok) {
      const data = await response.json()
      return {
        valid: true,
        message: 'Google AI API key is valid',
        details: {
          models_count: data.models?.length || 0,
        },
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      return {
        valid: false,
        message: errorData.error?.message || 'Invalid Google AI API key',
        details: { status: response.status },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `Google AI validation error: ${message}`,
      details: {},
    }
  }
}

// Validate Perplexity API key
async function validatePerplexity(apiKey: string) {
  try {
    // Test a simple chat completion request
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      }),
    })

    if (response.ok || response.status === 400) {
      // 400 is acceptable as it means the API key is valid
      return {
        valid: true,
        message: 'Perplexity API key is valid',
        details: { status: response.status },
      }
    } else if (response.status === 401) {
      return {
        valid: false,
        message: 'Invalid Perplexity API key',
        details: { status: response.status },
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      return {
        valid: false,
        message: errorData.error?.message || 'Invalid Perplexity API key',
        details: { status: response.status },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `Perplexity validation error: ${message}`,
      details: {},
    }
  }
}

// Validate Salesforce credentials (expects instance_url:access_token format or just access_token)
async function validateSalesforce(credentials: string) {
  try {
    // Parse credentials - can be either "instance_url:access_token" or just "access_token"
    let instanceUrl = 'https://login.salesforce.com'
    let accessToken = credentials

    if (credentials.includes(':')) {
      const parts = credentials.split(':')
      instanceUrl = parts[0]
      accessToken = parts.slice(1).join(':')
    }

    // Test Salesforce API with a simple query
    const response = await fetch(`${instanceUrl}/services/data/v58.0/limits`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        valid: true,
        message: 'Salesforce credentials are valid',
        details: {
          instance: instanceUrl,
          api_version: 'v58.0',
        },
      }
    } else if (response.status === 401) {
      return {
        valid: false,
        message: 'Invalid Salesforce access token',
        details: { status: response.status },
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      return {
        valid: false,
        message: errorData[0]?.message || 'Invalid Salesforce credentials',
        details: { status: response.status },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `Salesforce validation error: ${message}`,
      details: {},
    }
  }
}

// Validate HubSpot API key
async function validateHubSpot(apiKey: string) {
  try {
    // Test HubSpot API with account info endpoint
    const response = await fetch(
      `https://api.hubapi.com/account-info/v3/api-usage/daily?hapikey=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.ok) {
      return {
        valid: true,
        message: 'HubSpot API key is valid',
        details: { status: response.status },
      }
    } else if (response.status === 401 || response.status === 403) {
      return {
        valid: false,
        message: 'Invalid HubSpot API key',
        details: { status: response.status },
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      return {
        valid: false,
        message: errorData.message || 'Invalid HubSpot API key',
        details: { status: response.status },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `HubSpot validation error: ${message}`,
      details: {},
    }
  }
}

// Validate Mailgun API key (expects domain:api_key format)
async function validateMailgun(credentials: string) {
  try {
    // Parse credentials - expects "domain:api_key" format
    const [domain, apiKey] = credentials.split(':')

    if (!domain || !apiKey) {
      return {
        valid: false,
        message: 'Mailgun credentials must be in format: domain:api_key',
        details: {},
      }
    }

    // Test Mailgun API
    const authString = btoa(`api:${apiKey}`)
    const response = await fetch(`https://api.mailgun.net/v3/domains/${domain}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        valid: true,
        message: 'Mailgun API key is valid',
        details: {
          domain: data.domain?.name,
          state: data.domain?.state,
        },
      }
    } else if (response.status === 401) {
      return {
        valid: false,
        message: 'Invalid Mailgun API key',
        details: { status: response.status },
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      return {
        valid: false,
        message: errorData.message || 'Invalid Mailgun credentials',
        details: { status: response.status },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `Mailgun validation error: ${message}`,
      details: {},
    }
  }
}

// Validate Postmark API key (Server Token)
async function validatePostmark(apiKey: string) {
  try {
    // Test Postmark API with server info endpoint
    const response = await fetch('https://api.postmarkapp.com/server', {
      method: 'GET',
      headers: {
        'X-Postmark-Server-Token': apiKey,
        'Accept': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        valid: true,
        message: 'Postmark API key is valid',
        details: {
          server_name: data.Name,
          server_id: data.ID,
        },
      }
    } else if (response.status === 401 || response.status === 422) {
      return {
        valid: false,
        message: 'Invalid Postmark API key',
        details: { status: response.status },
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      return {
        valid: false,
        message: errorData.Message || 'Invalid Postmark API key',
        details: { status: response.status },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `Postmark validation error: ${message}`,
      details: {},
    }
  }
}

// Validate Amazon SES credentials (expects access_key_id:secret_access_key:region format)
async function validateAmazonSES(credentials: string) {
  try {
    // For SES, we can't directly validate without AWS SDK
    // Return a message indicating OAuth/proper setup is needed
    return {
      valid: false,
      message: 'Amazon SES requires OAuth 2.0 or AWS SDK integration. Please use the OAuth flow or configure via AWS console.',
      details: {
        note: 'Direct API key validation not supported for SES',
      },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `Amazon SES validation error: ${message}`,
      details: {},
    }
  }
}

// Validate Jira with site URL + email + API token (integration hub form)
async function validateJiraFromFields(host: string, email: string, apiToken: string) {
  try {
    let base = host.trim().replace(/\/$/, '')
    if (!/^https?:\/\//i.test(base)) {
      base = `https://${base}`
    }
    const authString = btoa(`${email}:${apiToken}`)
    const response = await fetch(`${base}/rest/api/3/myself`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        valid: true,
        message: 'Jira credentials are valid',
        details: {
          account_id: data.accountId,
          display_name: data.displayName,
        },
      }
    } else if (response.status === 401) {
      return {
        valid: false,
        message: 'Invalid Jira credentials',
        details: { status: response.status },
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      return {
        valid: false,
        message: errorData.errorMessages?.[0] || 'Invalid Jira credentials',
        details: { status: response.status },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `Jira validation error: ${message}`,
      details: {},
    }
  }
}

// Validate Jira credentials (legacy: email:api_token:domain format)
async function validateJira(credentials: string) {
  try {
    // Parse credentials - expects "email:api_token:domain" format
    const parts = credentials.split(':')

    if (parts.length < 3) {
      return {
        valid: false,
        message: 'Jira credentials must be in format: email:api_token:domain.atlassian.net',
        details: {},
      }
    }

    const email = parts[0]
    const apiToken = parts[1]
    const domain = parts.slice(2).join(':')

    // Test Jira API with myself endpoint
    const authString = btoa(`${email}:${apiToken}`)
    const response = await fetch(`https://${domain}/rest/api/3/myself`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        valid: true,
        message: 'Jira credentials are valid',
        details: {
          account_id: data.accountId,
          display_name: data.displayName,
        },
      }
    } else if (response.status === 401) {
      return {
        valid: false,
        message: 'Invalid Jira credentials',
        details: { status: response.status },
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      return {
        valid: false,
        message: errorData.errorMessages?.[0] || 'Invalid Jira credentials',
        details: { status: response.status },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `Jira validation error: ${message}`,
      details: {},
    }
  }
}

// Validate Asana API key (Personal Access Token)
async function validateAsana(apiKey: string) {
  try {
    // Test Asana API with user info endpoint
    const response = await fetch('https://app.asana.com/api/1.0/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        valid: true,
        message: 'Asana API key is valid',
        details: {
          user_name: data.data?.name,
          user_email: data.data?.email,
        },
      }
    } else if (response.status === 401) {
      return {
        valid: false,
        message: 'Invalid Asana API key',
        details: { status: response.status },
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      return {
        valid: false,
        message: errorData.errors?.[0]?.message || 'Invalid Asana API key',
        details: { status: response.status },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `Asana validation error: ${message}`,
      details: {},
    }
  }
}

// Validate Monday.com API key
async function validateMonday(apiKey: string) {
  try {
    // Test Monday.com API with GraphQL query
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ me { name email } }',
      }),
    })

    if (response.ok) {
      const data = await response.json()

      if (data.errors) {
        return {
          valid: false,
          message: data.errors[0]?.message || 'Invalid Monday.com API key',
          details: { status: response.status },
        }
      }

      return {
        valid: true,
        message: 'Monday.com API key is valid',
        details: {
          user_name: data.data?.me?.name,
          user_email: data.data?.me?.email,
        },
      }
    } else if (response.status === 401) {
      return {
        valid: false,
        message: 'Invalid Monday.com API key',
        details: { status: response.status },
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      return {
        valid: false,
        message: errorData.error_message || 'Invalid Monday.com API key',
        details: { status: response.status },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `Monday.com validation error: ${message}`,
      details: {},
    }
  }
}

// Validate ClickUp API key (Personal API Token or OAuth token)
async function validateClickUp(apiKey: string) {
  try {
    const response = await fetch('https://api.clickup.com/api/v2/user', {
      method: 'GET',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        valid: true,
        message: 'ClickUp API key is valid',
        details: {
          username: data.user?.username || 'unknown',
          email: data.user?.email || 'unknown',
        },
      }
    } else if (response.status === 401) {
      return {
        valid: false,
        message: 'Invalid ClickUp API key or token',
        details: { status: response.status },
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      return {
        valid: false,
        message: errorData.err || 'Invalid ClickUp API key',
        details: { status: response.status },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `ClickUp validation error: ${message}`,
      details: {},
    }
  }
}

// Validate Float API key
function cleanFellowSubdomain(raw: string): string {
  let s = raw.trim()
  s = s.replace(/^https?:\/\//i, '')
  s = (s.split('/')[0] ?? '').trim()
  s = s.replace(/\.fellow\.app$/i, '')
  return s.replace(/[^\w.-]/g, '').replace(/^\.+|\.+$/g, '')
}

async function validateFellow(subdomainRaw: string, apiKey: string) {
  const subdomain = cleanFellowSubdomain(subdomainRaw)
  if (!subdomain || !apiKey) {
    return {
      valid: false,
      message: 'Fellow requires workspace subdomain and API key',
      details: {},
    }
  }
  try {
    const url = `https://${subdomain}.fellow.app/api/v1/recordings`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({ limit: 1 }),
    })
    if (response.ok) {
      return {
        valid: true,
        message: 'Fellow API key and subdomain are valid',
        details: { subdomain },
      }
    }
    if (response.status === 401 || response.status === 403) {
      return {
        valid: false,
        message: 'Invalid Fellow API key or you do not have access to this workspace',
        details: { status: response.status },
      }
    }
    const text = await response.text()
    return {
      valid: false,
      message: `Fellow validation failed (${response.status})`,
      details: { status: response.status, body: text.slice(0, 160) },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `Fellow validation error: ${message}`,
      details: {},
    }
  }
}

async function validateFloat(apiKey: string, credentials?: Record<string, string>) {
  try {
    const baseUrl = (credentials?.float_base_url || credentials?.floatBaseUrl || 'https://api.float.com/v3')
      .replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/people?page=1&per-page=1`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    })

    if (response.ok) {
      return {
        valid: true,
        message: 'Float API key is valid',
        details: { base_url: baseUrl },
      }
    } else if (response.status === 401 || response.status === 403) {
      return {
        valid: false,
        message: 'Invalid Float API key',
        details: { status: response.status },
      }
    } else {
      const text = await response.text()
      return {
        valid: false,
        message: `Float validation failed (${response.status})`,
        details: { status: response.status, body: text.slice(0, 140) },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `Float validation error: ${message}`,
      details: {},
    }
  }
}

// Validate Workamajig API credentials (base_url + api_access_token + user_token)
async function validateWorkamajig(apiKey: string, credentials?: Record<string, string>) {
  try {
    const baseUrl = credentials?.base_url
    const accessToken = credentials?.api_access_token || apiKey
    const userToken = credentials?.user_token

    if (!baseUrl) {
      return {
        valid: false,
        message: 'Workamajig base URL is required',
        details: {},
      }
    }

    // Test the Workamajig API with a simple endpoint
    const headers: Record<string, string> = {
      'APIAccessToken': accessToken,
      'Content-Type': 'application/json',
    }
    if (userToken) {
      headers['UserToken'] = userToken
    }

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/beta1/services`, {
      method: 'GET',
      headers,
    })

    if (response.ok) {
      return {
        valid: true,
        message: 'Workamajig credentials are valid',
        details: { base_url: baseUrl },
      }
    } else if (response.status === 401 || response.status === 403) {
      return {
        valid: false,
        message: 'Invalid Workamajig credentials',
        details: { status: response.status },
      }
    } else {
      return {
        valid: false,
        message: `Workamajig API returned status ${response.status}`,
        details: { status: response.status },
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      message: `Workamajig validation error: ${message}`,
      details: {},
    }
  }
}
