import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditEntityType, AuditLog } from "@/types/database";

export interface LogAuditOptions {
  gymId: string;
  action: string;
  entityType: AuditEntityType;
  entityId?: string | null;
  performedByEmail?: string | null;
  details?: Record<string, any>;
}

/**
 * Appends an immutable audit log record.
 * Audit logs cannot be updated or deleted under PostgreSQL RLS.
 */
export async function logAuditEvent(options: LogAuditOptions): Promise<AuditLog | null> {
  try {
    const db = createAdminClient() as any;

    const { data, error } = await db
      .from("audit_logs")
      .insert({
        gym_id: options.gymId,
        action: options.action,
        entity_type: options.entityType,
        entity_id: options.entityId ?? null,
        performed_by_email: options.performedByEmail ?? "system@gymos.cloud",
        details: options.details ?? {},
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("[AuditLog Error]", error);
      return null;
    }

    return data as AuditLog;
  } catch (err) {
    console.error("[AuditLog Fatal]", err);
    return null;
  }
}

export async function getAuditLogs(gymId: string, limit: number = 50) {
  try {
    const db = createAdminClient() as any;
    const { data, error } = await db
      .from("audit_logs")
      .select("*")
      .eq("gym_id", gymId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return (data as AuditLog[]) || [];
  } catch {
    return [];
  }
}
