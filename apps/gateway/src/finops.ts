import { logInfo, logWarn } from "./event_log.js";

const DAILY_BUDGET_CENTS = 500; // $5.00 safety limit per day

// WHY: Enforces standard FinOps practices by checking if a user has exceeded their daily spending limit from D1
export async function checkBudget(userId: string, env: any): Promise<boolean> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const midnight = `${today}T00:00:00.000Z`;

    // Query D1 SUM
    const row = await env.DB.prepare(
      "SELECT SUM(amount_cents) as total FROM cost_ledger WHERE user_id = ? AND created_at >= ?"
    ).bind(userId, midnight).first() as { total: number | null } | null;

    const totalCents = row?.total || 0;
    const withinBudget = totalCents < DAILY_BUDGET_CENTS;

    if (!withinBudget) {
      logWarn("Daily budget exceeded", { userId, totalCents });
    }

    return withinBudget;
  } catch (error: any) {
    logWarn("Failed to check budget in D1, defaulting to safe block", { userId, error: error.message });
    return false;
  }
}

// WHY: Registers spending transactions against the user's daily ledger in D1
export async function charge(userId: string, amountCents: number, env: any): Promise<void> {
  try {
    await env.DB.prepare(
      "INSERT INTO cost_ledger (user_id, amount_cents, description) VALUES (?, ?, 'api-call')"
    ).bind(userId, amountCents).run();

    const today = new Date().toISOString().split("T")[0];
    const midnight = `${today}T00:00:00.000Z`;
    const row = await env.DB.prepare(
      "SELECT SUM(amount_cents) as total FROM cost_ledger WHERE user_id = ? AND created_at >= ?"
    ).bind(userId, midnight).first() as { total: number | null } | null;
    
    const newTotal = row?.total || amountCents;

    logInfo("Charged user account", { userId, chargedCents: amountCents, newTotalCents: newTotal });
  } catch (error: any) {
    logWarn("Failed to charge user account in D1", { userId, amountCents, error: error.message });
  }
}
