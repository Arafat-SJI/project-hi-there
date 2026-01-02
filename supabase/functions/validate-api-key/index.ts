import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { apiKey, service } = await req.json()

    if (!apiKey || !service) {
      return new Response(
        JSON.stringify({ valid: false, error: 'API key and service are required' }),
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
