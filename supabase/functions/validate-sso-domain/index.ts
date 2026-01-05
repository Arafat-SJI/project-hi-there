import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { email, provider_type } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'email is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Extract domain from email
    const domain = email.split('@')[1]?.toLowerCase()

    if (!domain) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid email format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // If provider_type is specified, validate against that provider's allowlist
    if (provider_type) {
      const { data: config, error: configError } = await supabaseClient
        .from('sso_configurations')
        .select('id, domain_restrictions')
        .eq('provider_type', provider_type)
        .eq('is_enabled', true)
        .single()

      if (configError || !config) {
        return new Response(
          JSON.stringify({ valid: false, error: 'SSO provider not configured or disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      // Check domain allowlist
      const { data: allowedDomains } = await supabaseClient
        .from('sso_domain_allowlist')
        .select('domain')
        .eq('sso_config_id', config.id)
        .eq('is_active', true)

      // If no allowlist entries, all domains are allowed
      if (!allowedDomains || allowedDomains.length === 0) {
        return new Response(
          JSON.stringify({ valid: true, domain, message: 'All domains allowed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      // Check if domain is in allowlist
      const isAllowed = allowedDomains.some((d) => d.domain.toLowerCase() === domain)

      // Log the validation attempt
      await supabaseClient
        .from('sso_login_logs')
        .insert({
          provider_type,
          email,
          success: isAllowed,
          error_message: isAllowed ? null : 'Domain not in allowlist',
          metadata: { domain, validation_type: 'domain_check' },
        })

      return new Response(
        JSON.stringify({
          valid: isAllowed,
          domain,
          message: isAllowed ? 'Domain is allowed' : `Domain @${domain} is not allowed for this SSO provider`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // No provider specified - check against all enabled providers
    const { data: configs } = await supabaseClient
      .from('sso_configurations')
      .select('id, provider_type, display_name')
      .eq('is_enabled', true)

    if (!configs || configs.length === 0) {
      return new Response(
        JSON.stringify({ valid: true, domain, message: 'No SSO restrictions configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Check which providers allow this domain
    const allowedProviders = []
    for (const config of configs) {
      const { data: allowedDomains } = await supabaseClient
        .from('sso_domain_allowlist')
        .select('domain')
        .eq('sso_config_id', config.id)
        .eq('is_active', true)

      // If no allowlist, all domains allowed for this provider
      if (!allowedDomains || allowedDomains.length === 0) {
        allowedProviders.push({
          provider_type: config.provider_type,
          display_name: config.display_name,
        })
        continue
      }

      // Check if domain is in allowlist
      if (allowedDomains.some((d) => d.domain.toLowerCase() === domain)) {
        allowedProviders.push({
          provider_type: config.provider_type,
          display_name: config.display_name,
        })
      }
    }

    return new Response(
      JSON.stringify({
        valid: allowedProviders.length > 0,
        domain,
        allowed_providers: allowedProviders,
        message: allowedProviders.length > 0
          ? `Domain allowed for: ${allowedProviders.map((p) => p.display_name).join(', ')}`
          : `Domain @${domain} is not allowed for any SSO provider`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    console.error('Validate SSO domain error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
