import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user with their token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, reason, reasonDetail, requestId } = await req.json();
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "request_deletion") {
      // Check for existing pending request
      const { data: existing } = await adminClient
        .from("account_deletion_requests")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ error: "Permintaan penghapusan sudah ada" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await adminClient
        .from("account_deletion_requests")
        .insert({
          user_id: user.id,
          reason: reason || null,
          reason_detail: reasonDetail || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Soft-delete: update profile to mark as pending deletion
      await adminClient
        .from("profiles")
        .update({ role: "pending_deletion" })
        .eq("user_id", user.id);

      return new Response(JSON.stringify({ success: true, request: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "cancel_deletion") {
      if (!requestId) {
        return new Response(JSON.stringify({ error: "Request ID required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: request } = await adminClient
        .from("account_deletion_requests")
        .select("*")
        .eq("id", requestId)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (!request) {
        return new Response(JSON.stringify({ error: "Permintaan tidak ditemukan" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if still within cancellation window
      if (new Date() > new Date(request.cancel_before)) {
        return new Response(JSON.stringify({ error: "Batas waktu pembatalan telah lewat" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await adminClient
        .from("account_deletion_requests")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", requestId);

      if (error) throw error;

      // Restore profile role
      await adminClient
        .from("profiles")
        .update({ role: "customer" })
        .eq("user_id", user.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_data_summary") {
      const { count: orderCount } = await adminClient
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: recipientCount } = await adminClient
        .from("recipients")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { data: profile } = await adminClient
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      return new Response(JSON.stringify({
        profile: profile ? { name: profile.full_name, phone: profile.phone } : null,
        email: user.email,
        orderCount: orderCount || 0,
        recipientCount: recipientCount || 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("delete-account error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
