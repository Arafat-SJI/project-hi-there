import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImportResponse {
  success: boolean;
  message: string;
  imported?: number;
  errors?: string[];
}

function parseCSV(csvText: string): Record<string, string>[] {
  const rawLines = csvText.split(/\r?\n/);
  const lines = rawLines.filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    while (values.length < headers.length) values.push("");
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function normalizeWeekFormat(weekStr: string): string {
  if (!weekStr) return weekStr;
  const trimmed = weekStr.trim();
  if (/^\d{4}-W\d{2}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/^([A-Za-z]{3})\s+(\d{1,2})$/);
  if (match) {
    const [, monthStr, dayStr] = match;
    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
    const month = months[monthStr as keyof typeof months];
    const day = parseInt(dayStr, 10);
    if (month !== undefined && !Number.isNaN(day)) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const testDate = new Date(currentYear, month, day);
      const year = testDate > now ? currentYear - 1 : currentYear;
      const date = new Date(year, month, day);
      const startOfYear = new Date(year, 0, 1);
      const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
      const dayOfWeek = (startOfYear.getDay() + 6) % 7;
      const weekNum = Math.floor((dayOfYear + dayOfWeek) / 7) + 1;
      return `${year}-W${String(weekNum).padStart(2, "0")}`;
    }
  }
  return trimmed;
}

function normalizeEmployeeCode(value: string): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value.replace(/^"|"$/g, "");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const jwt = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
        if (authError || !user) {
          console.warn("Authentication failed:", authError?.message);
        }
      } catch (error) {
        console.warn("Auth check error:", error);
      }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, message: "No file provided" } as ImportResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No data rows found in CSV" } as ImportResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const errors: string[] = [];
    let importedCount = 0;
    let employeesCreated = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        const email = (row.email || row.Email || row["E-mail"] || row["E-mail Address"] || row["Email Address"] || "").trim();
        const rawWeek = row.week || row.Week || row["week "] || row["Week "] || "";
        const employeeCode = row.employee_code || row["Employee Code"] || row["employee code"] || "";
        const computerName = row.computer_name || row["Computer Name"] || row["computer name"] || "";
        const computerActivitiesHr = row.computer_activities_hr || row["Computer activities(hr)"] || row["Computer activities (hr)"] || "";
        const productiveTimeHr = row.productive_time_hr || row["Productive Time(hr)"] || row["Productive Time (hr)"] || "";
        const unproductiveTimeHr = row.unproductive_time_hr || row["Unproductive Time(hr)"] || row["Unproductive Time (hr)"] || "";
        const neutralTimeHr = row.neutral_time_hr || row["Neutral Time(hr)"] || row["Neutral Time (hr)"] || "";
        const productivityPercentage = row.productivity_percentage || row["Productivity Percentage"] || row["productivity_percentage"] || "";
        const unproductivityPercentage = row.unproductivity_percentage || row["Unproductivity Percentage"] || row["unproductivity_percentage"] || "";
        const presentDays = row.present_days || row["Present Days"] || row["present_days"] || "";

        const week = normalizeWeekFormat(rawWeek);

        if (!email || !week) {
          errors.push(`Row ${i + 2}: Missing required fields (email or week)`);
          continue;
        }

        let employee: { id: string; email: string } | null = null;
        const { data: employeeFound, error: empErrorFound } = await supabase
          .from("Employee")
          .select("id, email")
          .ilike("email", email)
          .is("deleted_at", null)
          .maybeSingle();

        if (employeeFound) {
          employee = employeeFound;
        } else if (empErrorFound && empErrorFound.code !== "PGRST116") {
          errors.push(`Row ${i + 2}: ${empErrorFound.message}`);
          continue;
        } else {
          const { data: employeeAny } = await supabase
            .from("Employee")
            .select("id, email, deleted_at")
            .ilike("email", email)
            .maybeSingle();

          if (employeeAny?.deleted_at) {
            const { data: restored } = await supabase
              .from("Employee")
              .update({ deleted_at: null } as never)
              .eq("id", employeeAny.id)
              .select("id, email")
              .single();
            employee = restored;
          } else {
            const name = (row.name || row.Name || "").trim() || email.split("@")[0] || "Unknown";
            const dept = (row.department || row.Department || "").trim() || null;
            const loc = (row.location || row.Location || "").trim() || null;

            const { data: newEmp, error: createErr } = await supabase
              .from("Employee")
              .insert({ name, email, department: dept, location: loc, role: "developer" } as never)
              .select("id, email")
              .single();

            if (createErr) {
              errors.push(`Row ${i + 2}: Could not create employee: ${createErr.message}`);
              continue;
            }
            employee = newEmp;
            employeesCreated++;
          }
        }

        if (!employee) {
          errors.push(`Row ${i + 2}: Employee not found`);
          continue;
        }

        if (rawWeek.trim() && rawWeek.trim() !== week) {
          await supabase
            .from("EmployeeProductivity")
            .delete()
            .eq("email", email)
            .eq("week", rawWeek.trim());
        }

        const productivityData = {
          id: row.id || `${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`,
          week: week.trim(),
          email: email,
          name: (row.name || row.Name || "").trim() || null,
          employee_code: normalizeEmployeeCode(employeeCode),
          location: (row.location || row.Location || "").trim() || null,
          department: (row.department || row.Department || "").trim() || null,
          computer_name: computerName.trim() || null,
          computer_activities_hr: computerActivitiesHr.trim() || null,
          productive_time_hr: productiveTimeHr.trim() || null,
          unproductive_time_hr: unproductiveTimeHr.trim() || null,
          neutral_time_hr: neutralTimeHr.trim() || null,
          present_days: presentDays ? parseInt(presentDays, 10) : null,
          productivity_percentage: productivityPercentage ? parseFloat(productivityPercentage) : null,
          unproductivity_percentage: unproductivityPercentage.trim() || null,
        };

        if (productivityData.present_days !== null && isNaN(productivityData.present_days)) {
          productivityData.present_days = null;
        }
        if (productivityData.productivity_percentage !== null && isNaN(productivityData.productivity_percentage)) {
          productivityData.productivity_percentage = null;
        }

        const { error: insertError } = await supabase
          .from("EmployeeProductivity")
          .upsert(productivityData, { onConflict: "email,week", ignoreDuplicates: false });

        if (insertError) {
          errors.push(`Row ${i + 2}: ${insertError.message}`);
        } else {
          importedCount++;
        }
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    const response: ImportResponse = {
      success: errors.length === 0 || importedCount > 0,
      message: `Imported ${importedCount} records${employeesCreated > 0 ? ` (${employeesCreated} employees created)` : ""}${errors.length > 0 ? ` with ${errors.length} errors` : ""}`,
      imported: importedCount,
      errors: errors.length > 0 ? errors.slice(0, 50) : undefined,
    };

    return new Response(JSON.stringify(response), {
      status: response.success ? 200 : 207,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in import-productivity-csv:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      } as ImportResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
