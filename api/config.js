// Exposes the public Supabase configuration (URL + anon/publishable key) to the
// browser client. Only non-secret, client-safe values are ever returned here.
module.exports = (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  response.status ? response.status(200) : (response.statusCode = 200);
  response.end(
    JSON.stringify({
      supabaseUrl,
      supabaseAnonKey,
    }),
  );
};
