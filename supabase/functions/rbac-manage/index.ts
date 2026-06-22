import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requirePermission } from "../_shared/permission-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_TENANT = "00000000-0000-0000-0000-000000000001";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const authResult = await requirePermission(
      req,
      userClient,
      corsHeaders,
      "settings.admin"
    );
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const { action, role_id, permission_keys, target_user_id, new_role } = body;

    if (action === "change_user_role") {
      if (!target_user_id || !new_role) {
        return new Response(JSON.stringify({ error: "target_user_id and new_role are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (target_user_id === userId) {
        return new Response(
          JSON.stringify({ error: "self_change_not_allowed", message: "You cannot change your own role" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: existing } = await serviceClient
        .from("user_roles")
        .select("role")
        .eq("user_id", target_user_id)
        .maybeSingle();

      if (existing?.role === "admin" && new_role !== "admin") {
        const { count: adminCount } = await serviceClient
          .from("user_roles")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "admin");

        if ((adminCount ?? 0) <= 1) {
          return new Response(
            JSON.stringify({ error: "last_admin", message: "Cannot change the role of the last remaining admin" }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const { error: upsertError } = existing
        ? await serviceClient.from("user_roles").update({ role: new_role }).eq("user_id", target_user_id)
        : await serviceClient.from("user_roles").insert([{ user_id: target_user_id, role: new_role }]);

      if (upsertError) throw upsertError;

      await serviceClient.from("activity_logs").insert({
        user_id: userId,
        action: "user.role_changed",
        resource_type: "user",
        resource_id: target_user_id,
        details: { previous_role: existing?.role ?? null, new_role },
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set_role_permissions") {
      if (!role_id || !Array.isArray(permission_keys)) {
        return new Response(JSON.stringify({ error: "role_id and permission_keys required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: perms } = await serviceClient
        .from("permissions")
        .select("id, key")
        .in("key", permission_keys);

      await serviceClient.from("role_permissions").delete().eq("role_id", role_id);

      if (perms?.length) {
        await serviceClient.from("role_permissions").insert(
          perms.map((p) => ({ role_id, permission_id: p.id }))
        );
      }

      await serviceClient.from("activity_logs").insert({
        user_id: userId,
        action: "permission.changed",
        resource_type: "role",
        resource_id: role_id,
        details: { permission_count: permission_keys.length },
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "clone_role") {
      if (!role_id) {
        return new Response(JSON.stringify({ error: "role_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: source, error: sourceError } = await serviceClient
        .from("roles")
        .select("*")
        .eq("id", role_id)
        .single();

      if (sourceError || !source) {
        return new Response(JSON.stringify({ error: "Source role not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const cloneName = `${source.name} (Copy)`;
      const cloneSlug = `${source.slug || source.name.toLowerCase()}_copy_${Date.now()}`;

      const { data: newRole, error: createError } = await serviceClient
        .from("roles")
        .insert({
          name: cloneName,
          slug: cloneSlug,
          description: source.description,
          tenant_id: source.tenant_id || DEFAULT_TENANT,
          is_system: false,
          cloned_from_id: role_id,
        })
        .select()
        .single();

      if (createError || !newRole) {
        return new Response(JSON.stringify({ error: createError?.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: rolePerms } = await serviceClient
        .from("role_permissions")
        .select("permission_id")
        .eq("role_id", role_id);

      if (rolePerms?.length) {
        await serviceClient.from("role_permissions").insert(
          rolePerms.map((rp) => ({
            role_id: newRole.id,
            permission_id: rp.permission_id,
          }))
        );
      }

      await serviceClient.from("activity_logs").insert({
        user_id: userId,
        action: "role.created",
        resource_type: "role",
        resource_id: newRole.id,
        details: { cloned_from: role_id },
      });

      return new Response(JSON.stringify({ role: newRole }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("rbac-manage error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
