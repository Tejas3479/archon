// WHY: Unified gateway tools router bundling email, calendar, and plaid integrations.
import { emailTools } from "./email";
import { calendarTools } from "./calendar";
import { plaidTools } from "./plaid";
import { healthTools } from "./health";
import { homeAssistantTools } from "./home_assistant";
import { socialTools } from "./social";
import { travelTools } from "./travel";
import { skillRegistryTools } from "./skill_registry";
import { defiTools } from "./defi";
import { fheSearchTools } from "./fhe_search";
import { deepfakeTools } from "./deepfake";
import { dataWipeTools } from "./data_wipe";
import { sandboxReviewTools } from "./sandbox_review";
import { developerAgentTools } from "./developer_agent";
import { orgManagementTools } from "./org_management";
import { auditExportTools } from "./audit_export";

export const gatewayTools = {
  manifest: [
    ...emailTools.manifest,
    ...calendarTools.manifest,
    ...plaidTools.manifest,
    ...healthTools.manifest,
    ...homeAssistantTools.manifest,
    ...socialTools.manifest,
    ...travelTools.manifest,
    ...skillRegistryTools.manifest,
    ...defiTools.manifest,
    ...fheSearchTools.manifest,
    ...deepfakeTools.manifest,
    ...dataWipeTools.manifest,
    ...sandboxReviewTools.manifest,
    ...developerAgentTools.manifest,
    ...orgManagementTools.manifest,
    ...auditExportTools.manifest
  ],

  async handle(toolName: string, args: any, db?: any): Promise<any> {
    if (toolName.startsWith("email.")) {
      return emailTools.handle(toolName, args);
    }
    if (toolName.startsWith("calendar.")) {
      return calendarTools.handle(toolName, args);
    }
    if (toolName.startsWith("plaid.")) {
      return plaidTools.handle(toolName, args);
    }
    if (toolName.startsWith("health.")) {
      return healthTools.handle(toolName, args);
    }
    if (toolName.startsWith("home_assistant.")) {
      return homeAssistantTools.handle(toolName, args);
    }
    if (toolName.startsWith("social.")) {
      return socialTools.handle(toolName, args);
    }
    if (toolName.startsWith("travel.")) {
      return travelTools.handle(toolName, args);
    }
    if (toolName.startsWith("skill_registry.")) {
      return skillRegistryTools.handle(toolName, args);
    }
    if (toolName.startsWith("defi.")) {
      return defiTools.handle(toolName, args);
    }
    if (toolName.startsWith("fhe.")) {
      return fheSearchTools.handle(toolName, args);
    }
    if (toolName.startsWith("deepfake.")) {
      return deepfakeTools.handle(toolName, args);
    }
    if (toolName.startsWith("data_wipe.")) {
      return dataWipeTools.handle(toolName, args);
    }
    if (toolName.startsWith("sandbox.")) {
      return sandboxReviewTools.handle(toolName, args);
    }
    if (toolName.startsWith("developer.")) {
      return developerAgentTools.handle(toolName, args);
    }
    if (toolName.startsWith("org.")) {
      return orgManagementTools.handle(toolName, args, db);
    }
    if (toolName.startsWith("audit.")) {
      return auditExportTools.handle(toolName, args);
    }
    throw new Error(`Tool catalog entry not found: ${toolName}`);
  }
};


