// Edge Function: bulk_import_customers
// Upload a CSV file containing customer data and bulk‑insert into the public.customers table.
// The CSV must have a header row with the following column names (case‑insensitive):
//   first_name, last_name, email, phone, company_name, address_street,
//   address_city, address_state, address_zip, notes
// The function expects a multipart/form‑data request with the file field named "file".
// It uses the Supabase service‑role key to bypass RLS, so the function must be
// deployed as a privileged Edge Function.

import { createClient } from "npm:@supabase/supabase-js@2.39.1";
import { parse } from "npm:csv-parse@5.5.2";

// Initialise Supabase client with service‑role credentials.
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

/** Helper: parse the multipart body and extract the CSV file buffer. */
async function getCsvBuffer(req: Request): Promise<Uint8Array> {
  const contentType = req.headers.get("content-type");
  if (!contentType?.includes("multipart/form-data")) {
    throw new Error("Request must be multipart/form-data with a \"file\" field.");
  }

  // Use the native FormData API – Deno parses multipart bodies automatically.
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new Error("Missing 'file' field or it is not a valid file.");
  }
  return new Uint8Array(await file.arrayBuffer());
}

/** Helper: transform a CSV record into a row suitable for the customers table. */
function mapRecord(record: Record<string, string>, userId: string) {
  // Trim whitespace and keep undefined/null for optional columns.
  const toNull = (v: string | undefined) => (v && v.trim() !== "" ? v.trim() : null);

  return {
    first_name: toNull(record["first_name"]),
    last_name: toNull(record["last_name"]),
    email: toNull(record["email"]),
    phone: toNull(record["phone"]),
    company_name: toNull(record["company_name"]),
    address_street: toNull(record["address_street"]),
    address_city: toNull(record["address_city"]),
    address_state: toNull(record["address_state"]),
    address_zip: toNull(record["address_zip"]),
    notes: toNull(record["notes"]),
    // user_id is required – we pass it from the extracted user ID
    user_id: userId,
  };
}

/** Helper: extract the Supabase user ID from the Authorization header. */
function extractUserId(req: Request): string {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or malformed Authorization header.");
  }
  const jwt = authHeader.split(" ")[1];
  // The JWT is a base64‑url JSON payload. We only need the "sub" claim.
  const payload = JSON.parse(atob(jwt.split(".")[1].replace(/_/g, "/").replace(/-/g, "+")));
  if (!payload.sub) throw new Error("JWT does not contain sub claim.");
  return payload.sub;
}

// Main handler – Deno.serve creates the Edge Function entry point.
Deno.serve(async (req: Request) => {
  try {
    // Only accept POST.
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract user ID from JWT
    const userId = extractUserId(req);

    // Get the CSV file buffer.
    const csvBuffer = await getCsvBuffer(req);

    // Parse CSV – we use the stream API to avoid loading the whole file into memory.
    const records: Record<string, string>[] = [];
    const parser = parse(csvBuffer, {
      columns: true, // first line is header
      trim: true,
      skip_empty_lines: true,
    });

    for await (const record of parser) {
      records.push(record as Record<string, string>);
    }

    if (records.length === 0) {
      return new Response(JSON.stringify({ error: "CSV is empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Transform records into rows for insertion.
    const rows = records.map((r) => mapRecord(r, userId));

    // Insert in batches (max 1000 rows per request is a safe limit).
    const batchSize = 500;
    let inserted = 0;
    const errors: any[] = [];

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { data, error } = await supabase.from("customers").insert(batch);
      if (error) {
        errors.push({ batchStart: i, error: error.message });
      } else {
        inserted += data?.length ?? 0;
      }
    }

    const responseBody = {
      inserted,
      total: rows.length,
      errors,
    };

    return new Response(JSON.stringify(responseBody), {
      status: errors.length ? 207 : 200, // 207 Multi‑Status if some batches failed
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
