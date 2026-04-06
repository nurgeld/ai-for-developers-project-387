import { tool } from "@opencode-ai/plugin";

const RENDER_API = "https://api.render.com/v1";

const DEPLOY_STATUS_MAP: Record<string, { status: string; label: string }> = {
  succeeded: { status: "deployed", label: "Deployed" },
  build_failed: { status: "failed", label: "Failed" },
  in_progress: { status: "deploying", label: "Deploying" },
  canceled: { status: "canceled", label: "Canceled" },
};

interface ServiceInfo {
  id: string;
  name: string;
  url: string;
}

interface DeployInfo {
  id: string;
  status: string;
  createdAt: string;
  finishedAt: string | null;
  commit: { id: string; message: string } | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDurationSeconds(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.round((e - s) / 1000);
}

function buildTextOutput(
  service: ServiceInfo,
  deploy: DeployInfo,
): string {
  const mapped = DEPLOY_STATUS_MAP[deploy.status] || { status: deploy.status, label: deploy.status };
  const icon = mapped.status === "deployed" ? "✅" : mapped.status === "failed" ? "❌" : mapped.status === "deploying" ? "🔄" : "⏸️";
  const lines = [
    `${icon} ${service.name} — ${mapped.label}`,
    `   URL: ${service.url}`,
    `   Deploy ID: ${deploy.id}`,
  ];

  if (deploy.commit) {
    lines.push(`   Commit: ${deploy.commit.id} - "${deploy.commit.message}"`);
  }

  lines.push(`   Started: ${deploy.createdAt}`);

  if (deploy.finishedAt) {
    const dur = formatDurationSeconds(deploy.createdAt, deploy.finishedAt);
    lines.push(`   Finished: ${deploy.finishedAt} (${dur}s)`);
  }

  return lines.join("\n");
}

export default tool({
  description:
    "Check the deployment status of a Render service. Supports one-shot check or waiting for deploy to finish.",

  args: {
    serviceName: tool.schema
      .string()
      .optional()
      .describe(
        "Name of the Render service. Defaults to RENDER_SERVICE_NAME env var or 'nurgeldy-calendar-booking'.",
      ),
    wait: tool.schema
      .boolean()
      .optional()
      .describe("Wait for an in-progress deploy to finish. Defaults to false."),
    timeout: tool.schema
      .number()
      .optional()
      .describe("Maximum wait time in seconds when wait=true. Defaults to 300."),
    pollInterval: tool.schema
      .number()
      .optional()
      .describe("Polling interval in seconds when wait=true. Defaults to 10."),
  },

  async execute({
    serviceName,
    wait = false,
    timeout = 300,
    pollInterval = 10,
  }) {
    const apiKey = process.env.RENDER_API_KEY;
    if (!apiKey) {
      return JSON.stringify({
        success: false,
        error: "RENDER_API_KEY is not set. Get it from https://dashboard.render.com/settings#api-keys",
      }, null, 2);
    }

    const targetName = serviceName || process.env.RENDER_SERVICE_NAME || "nurgeldy-calendar-booking";

    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    const apiRequest = async (path: string): Promise<{ status: number; data: unknown }> => {
      try {
        const response = await fetch(`${RENDER_API}${path}`, { headers });
        const text = await response.text();
        let data: unknown = null;
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = text;
          }
        }
        return { status: response.status, data };
      } catch (err) {
        return { status: 0, data: { error: "Network error", message: err instanceof Error ? err.message : "Unknown error" } };
      }
    };

    // 1. Find service by name
    const servicesResp = await apiRequest("/services?limit=100");
    if (servicesResp.status !== 200 || !Array.isArray(servicesResp.data)) {
      return JSON.stringify({
        success: false,
        error: `Failed to list services (status ${servicesResp.status})`,
        detail: servicesResp.data,
      }, null, 2);
    }

    const services = servicesResp.data as Array<{ service: { id: string; name: string; serviceDetails?: { url?: string } } }>;
    const found = services.find((s) => s.service.name === targetName);

    if (!found) {
      return JSON.stringify({
        success: false,
        error: `Service '${targetName}' not found`,
        availableServices: services.map((s) => s.service.name),
      }, null, 2);
    }

    const service: ServiceInfo = {
      id: found.service.id,
      name: found.service.name,
      url: found.service.serviceDetails?.url || `https://${targetName}.onrender.com`,
    };

    // 2. Get latest deploy
    const getLatestDeploy = async (): Promise<DeployInfo | null> => {
      const deploysResp = await apiRequest(`/services/${service.id}/deploys?limit=1`);
      if (deploysResp.status !== 200 || !Array.isArray(deploysResp.data) || deploysResp.data.length === 0) {
        return null;
      }
      const deploy = (deploysResp.data as Array<{ deploy: DeployInfo }>)[0].deploy;
      return deploy;
    };

    let deploy = await getLatestDeploy();

    if (!deploy) {
      return JSON.stringify({
        success: true,
        status: "never_deployed",
        service,
        message: `Service '${targetName}' exists but has no deployments yet.`,
      }, null, 2);
    }

    // 3. Wait loop if requested
    if (wait && deploy.status === "in_progress") {
      const deadline = Date.now() + timeout * 1000;
      while (deploy.status === "in_progress" && Date.now() < deadline) {
        await sleep(pollInterval * 1000);
        const updated = await getLatestDeploy();
        if (updated) {
          deploy = updated;
        }
      }

      if (deploy.status === "in_progress") {
        return JSON.stringify({
          success: true,
          status: "timeout",
          service,
          deploy,
          message: `Timed out waiting for deploy after ${timeout}s. Deploy is still in progress.`,
        }, null, 2);
      }
    }

    const mapped = DEPLOY_STATUS_MAP[deploy.status] || { status: deploy.status };

    return JSON.stringify({
      success: true,
      status: mapped.status,
      service,
      deploy: {
        id: deploy.id,
        status: deploy.status,
        createdAt: deploy.createdAt,
        finishedAt: deploy.finishedAt,
        durationSeconds: deploy.finishedAt ? formatDurationSeconds(deploy.createdAt, deploy.finishedAt) : null,
        commit: deploy.commit,
      },
      textOutput: buildTextOutput(service, deploy),
    }, null, 2);
  },
});
