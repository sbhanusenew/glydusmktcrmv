// Admin-only API for managing CRM users. Runs server-side with the Supabase
// service role key so it can create/update/delete Supabase Auth users in
// addition to the public.crm_users profile rows. The caller MUST present a
// valid access token belonging to a CRM user whose role is "Admin".
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

function sendJson(response, statusCode, payload) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  if (response.status) {
    response.status(statusCode);
  } else {
    response.statusCode = statusCode;
  }
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  if (request.body && typeof request.body === "object") {
    return Promise.resolve(request.body);
  }

  if (typeof request.body === "string" && request.body.length) {
    try {
      return Promise.resolve(JSON.parse(request.body));
    } catch (error) {
      return Promise.resolve({});
    }
  }

  return new Promise((resolve) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        resolve({});
      }
    });
    request.on("error", () => resolve({}));
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

  if (user.createdAt) {
    row.created_at = user.createdAt;
  }
  if (authUserId !== undefined) {
    row.auth_user_id = authUserId;
  }
  if (user.password) {
    row.password = user.password;
  }

  return row;
}

module.exports = async (request, response) => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    sendJson(response, 500, { error: "Supabase server credentials are not configured." });
    return;
  }

  const authHeader = request.headers.authorization || request.headers.Authorization || "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!accessToken) {
    sendJson(response, 401, { error: "Missing authentication token." });
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify the caller and confirm they are an active admin.
  const { data: authData, error: authError } = await admin.auth.getUser(accessToken);
  if (authError || !authData?.user) {
    sendJson(response, 401, { error: "Invalid or expired session." });
    return;
  }

  const { data: callerProfile, error: callerError } = await admin
    .from("crm_users")
    .select("id, role, status")
    .eq("auth_user_id", authData.user.id)
    .single();

  if (callerError || !callerProfile || callerProfile.role !== "Admin" || callerProfile.status !== "Active") {
    sendJson(response, 403, { error: "Administrator access is required." });
    return;
  }

  const method = (request.method || "GET").toUpperCase();
  const body = await readBody(request);

  try {
    if (method === "POST") {
      const { user, password } = body;
      if (!user || !user.email || !password) {
        sendJson(response, 400, { error: "User email and password are required." });
        return;
      }

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: user.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: user.fullName, login_id: user.loginId },
      });

      if (createError || !created?.user) {
        sendJson(response, 400, { error: createError?.message || "Failed to create auth user." });
        return;
      }

      const row = userToRow(user, created.user.id);
      const { data: profile, error: profileError } = await admin
        .from("crm_users")
        .upsert(row, { onConflict: "id" })
        .select()
        .single();

      if (profileError) {
        // Roll back the orphaned auth user to keep things consistent.
        await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
        sendJson(response, 400, { error: profileError.message });
        return;
      }

      sendJson(response, 200, { user: profile });
      return;
    }

    if (method === "PUT") {
      const { userId, user, password } = body;
      if (!userId || !user) {
        sendJson(response, 400, { error: "User id and details are required." });
        return;
      }

      // Find the existing profile to locate its auth user id.
      const { data: existing, error: existingError } = await admin
        .from("crm_users")
        .select("auth_user_id")
        .eq("id", userId)
        .single();

      if (existingError || !existing) {
        sendJson(response, 404, { error: "User not found." });
        return;
      }

      let authUserId = existing.auth_user_id;

      if (authUserId) {
        const updates = {};
        if (user.email) {
          updates.email = user.email;
        }
        if (password) {
          updates.password = password;
        }
        if (Object.keys(updates).length) {
          const { error: updateAuthError } = await admin.auth.admin.updateUserById(authUserId, updates);
          if (updateAuthError) {
            sendJson(response, 400, { error: updateAuthError.message });
            return;
          }
        }
      } else if (user.email && password) {
        // Profile existed without an auth user (e.g. seeded). Create one now.
        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email: user.email,
          password,
          email_confirm: true,
          user_metadata: { full_name: user.fullName, login_id: user.loginId },
        });
        if (createError || !created?.user) {
          sendJson(response, 400, { error: createError?.message || "Failed to create auth user." });
          return;
        }
        authUserId = created.user.id;
      }

      const row = userToRow(user, authUserId);
      const { data: profile, error: profileError } = await admin
        .from("crm_users")
        .upsert(row, { onConflict: "id" })
        .select()
        .single();

      if (profileError) {
        sendJson(response, 400, { error: profileError.message });
        return;
      }

      sendJson(response, 200, { user: profile });
      return;
    }

    if (method === "DELETE") {
      const { userId } = body;
      if (!userId) {
        sendJson(response, 400, { error: "User id is required." });
        return;
      }

      const { data: existing, error: existingError } = await admin
        .from("crm_users")
        .select("auth_user_id")
        .eq("id", userId)
        .single();

      if (existingError || !existing) {
        sendJson(response, 404, { error: "User not found." });
        return;
      }

      const { error: deleteProfileError } = await admin
        .from("crm_users")
        .delete()
        .eq("id", userId);

      if (deleteProfileError) {
        sendJson(response, 400, { error: deleteProfileError.message });
        return;
      }

      if (existing.auth_user_id) {
        await admin.auth.admin.deleteUser(existing.auth_user_id).catch(() => {});
      }

      sendJson(response, 200, { success: true });
      return;
    }

    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Unexpected server error." });
  }
};
