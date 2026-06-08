// Vercel serverless function: privileged CRM user administration.
// Creating/updating/deleting Supabase Auth users requires the service role key,
// which must never be exposed to the browser. The caller must present a valid
// admin access token (Bearer) issued by Supabase Auth.
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  "";

function admin() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function sendJson(response, status, payload) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.status(status).end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve) => {
    if (request.body && typeof request.body === "object") {
      resolve(request.body);
      return;
    }
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        resolve({});
      }
    });
  });
}

function userToRow(user, authUserId) {
  const row = {
    id: user.id,
    full_name: user.fullName,
    email: user.email,
    login_id: user.loginId,
    role: user.role,
    department: user.department,
    status: user.status,
    updated_at: user.updatedAt || new Date().toISOString(),
  };
  if (user.createdAt) row.created_at = user.createdAt;
  if (user.password) row.password = user.password;
  if (authUserId !== undefined) row.auth_user_id = authUserId;
  return row;
}

async function requireAdmin(request, service) {
  const header = request.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return { error: "Missing admin session token.", status: 401 };
  }

  const {
    data: { user },
    error,
  } = await service.auth.getUser(token);

  if (error || !user) {
    return { error: "Admin session is invalid. Sign in again.", status: 401 };
  }

  const { data: profile, error: profileError } = await service
    .from("crm_users")
    .select("id, role, status, auth_user_id")
    .eq("auth_user_id", user.id)
    .eq("status", "Active")
    .single();

  if (profileError || !profile || profile.role !== "Admin") {
    return { error: "Admin privileges are required.", status: 403 };
  }

  return { user, profile };
}

module.exports = async (request, response) => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return sendJson(response, 500, {
      error: "Server is missing Supabase service role configuration.",
    });
  }

  const service = admin();
  const guard = await requireAdmin(request, service);
  if (guard.error) {
    return sendJson(response, guard.status, { error: guard.error });
  }

  const method = (request.method || "GET").toUpperCase();

  try {
    if (method === "POST") {
      const body = await readBody(request);
      const user = body.user || {};
      const password = body.password || "";

      if (!user.email || !password) {
        return sendJson(response, 400, {
          error: "Email and password are required to create a user.",
        });
      }

      const { data: created, error: createError } =
        await service.auth.admin.createUser({
          email: user.email,
          password,
          email_confirm: true,
          user_metadata: { full_name: user.fullName, login_id: user.loginId },
        });

      if (createError || !created?.user) {
        return sendJson(response, 400, {
          error: createError?.message || "Could not create the auth user.",
        });
      }

      const authUserId = created.user.id;
      const { error: insertError } = await service
        .from("crm_users")
        .insert(userToRow(user, authUserId));

      if (insertError) {
        // Roll back the auth user so we don't leave an orphan.
        await service.auth.admin.deleteUser(authUserId);
        return sendJson(response, 400, { error: insertError.message });
      }

      return sendJson(response, 200, { user: { auth_user_id: authUserId } });
    }

    if (method === "PUT") {
      const body = await readBody(request);
      const userId = body.userId;
      const user = body.user || {};
      const password = body.password || "";

      if (!userId) {
        return sendJson(response, 400, { error: "userId is required." });
      }

      const { data: existing, error: lookupError } = await service
        .from("crm_users")
        .select("auth_user_id")
        .eq("id", userId)
        .single();

      if (lookupError || !existing) {
        return sendJson(response, 404, { error: "User not found." });
      }

      if (existing.auth_user_id) {
        const updates = {};
        if (user.email) updates.email = user.email;
        if (password) updates.password = password;
        if (Object.keys(updates).length > 0) {
          const { error: authUpdateError } =
            await service.auth.admin.updateUserById(
              existing.auth_user_id,
              updates,
            );
          if (authUpdateError) {
            return sendJson(response, 400, { error: authUpdateError.message });
          }
        }
      }

      const { error: updateError } = await service
        .from("crm_users")
        .update(userToRow(user, existing.auth_user_id))
        .eq("id", userId);

      if (updateError) {
        return sendJson(response, 400, { error: updateError.message });
      }

      return sendJson(response, 200, {
        user: { auth_user_id: existing.auth_user_id },
      });
    }

    if (method === "DELETE") {
      const body = await readBody(request);
      const userId = body.userId;

      if (!userId) {
        return sendJson(response, 400, { error: "userId is required." });
      }

      const { data: existing, error: lookupError } = await service
        .from("crm_users")
        .select("auth_user_id")
        .eq("id", userId)
        .single();

      if (lookupError || !existing) {
        return sendJson(response, 404, { error: "User not found." });
      }

      const { error: deleteRowError } = await service
        .from("crm_users")
        .delete()
        .eq("id", userId);

      if (deleteRowError) {
        return sendJson(response, 400, { error: deleteRowError.message });
      }

      if (existing.auth_user_id) {
        await service.auth.admin.deleteUser(existing.auth_user_id);
      }

      return sendJson(response, 200, { ok: true });
    }

    return sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    return sendJson(response, 500, {
      error: error?.message || "Unexpected server error.",
    });
  }
};
