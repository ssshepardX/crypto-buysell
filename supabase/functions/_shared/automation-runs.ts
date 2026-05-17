import { serviceClient } from "./admin-auth.ts";

export type AutomationRunStatus = "running" | "success" | "success_empty" | "partial" | "failed";

type MetaJson = Record<string, unknown>;

export async function startAutomationRun(jobName: string, metaJson: MetaJson = {}) {
  try {
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from("automation_runs")
      .insert({
        job_name: jobName,
        status: "running",
        started_at: new Date().toISOString(),
        meta_json: metaJson,
      })
      .select("id")
      .single();
    if (error) {
      console.error("automation_runs start failed:", jobName, error.message);
      return null;
    }
    return data?.id as string | null;
  } catch (error) {
    console.error("automation_runs start exception:", jobName, error instanceof Error ? error.message : "unknown_error");
    return null;
  }
}

export async function finishAutomationRun(
  id: string | null,
  status: AutomationRunStatus,
  itemsCount = 0,
  errorSummary: string | null = null,
  metaJson: MetaJson = {},
) {
  if (!id) return;
  try {
    const supabase = serviceClient();
    const { error } = await supabase
      .from("automation_runs")
      .update({
        status,
        items_count: itemsCount,
        error_summary: errorSummary,
        meta_json: metaJson,
        finished_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) console.error("automation_runs finish failed:", id, error.message);
  } catch (error) {
    console.error("automation_runs finish exception:", id, error instanceof Error ? error.message : "unknown_error");
  }
}

