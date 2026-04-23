#!/usr/bin/env node

const RENDER_API = "https://api.render.com/v1";
const DEFAULT_SERVICE_NAME = "nurgeldy-calendar-booking";

const DEPLOY_STATUS_MAP = {
  succeeded: { status: "deployed", label: "Deployed", icon: "✅" },
  failed: { status: "failed", label: "Failed", icon: "❌" },
  in_progress: { status: "deploying", label: "Deploying", icon: "🔄" },
  canceled: { status: "canceled", label: "Canceled", icon: "⏸️" },
};

const EXIT_CODES = {
  SUCCESS: 0,
  DEPLOY_FAILED: 1,
  TIMEOUT: 2,
  NOT_FOUND: 3,
  API_KEY_MISSING: 4,
  API_ERROR: 5,
};

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    service: null,
    wait: false,
    timeout: 300,
    format: "text",
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--service":
      case "-s":
        result.service = args[++i];
        break;
      case "--wait":
      case "-w":
        result.wait = true;
        break;
      case "--timeout":
      case "-t":
        result.timeout = parseInt(args[++i], 10);
        break;
      case "--format":
      case "-f":
        result.format = args[++i];
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
    }
  }

  return result;
}

function printHelp() {
  console.log(`
Usage: node run-render-check.js [options]

Check the deployment status of a Render service.

Options:
  -s, --service <name>   Service name (default: RENDER_SERVICE_NAME env or "${DEFAULT_SERVICE_NAME}")
  -w, --wait             Wait for an in-progress deploy to finish
  -t, --timeout <sec>    Maximum wait time in seconds (default: 300)
  -f, --format <type>    Output format: text or json (default: text)
  -h, --help             Show this help message

Exit codes:
  0  Deployed successfully
  1  Deploy failed
  2  Timeout waiting for deploy
  3  Service not found
  4  API key not set
  5  API error

Examples:
  node run-render-check.js
  node run-render-check.js --wait --timeout 600
  node run-render-check.js --service my-app --format json
  node run-render-check.js -w -f text
`.trim());
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDurationSeconds(start, end) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.round((e - s) / 1000);
}

function buildTextOutput(service, deploy) {
  const mapped = DEPLOY_STATUS_MAP[deploy.status] || { status: deploy.status, label: deploy.status, icon: "❓" };
  const lines = [
    `${mapped.icon} ${service.name} — ${mapped.label}`,
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

async function apiRequest(path, apiKey) {
  const response = await fetch(`${RENDER_API}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: response.status, data };
}

async function findService(apiKey, targetName) {
  const resp = await apiRequest("/services?limit=100", apiKey);
  if (resp.status !== 200 || !Array.isArray(resp.data)) {
    return { error: `Failed to list services (status ${resp.status})`, exitCode: EXIT_CODES.API_ERROR };
  }

  const found = resp.data.find((s) => s.service.name === targetName);
  if (!found) {
    return {
      error: `Service '${targetName}' not found`,
      availableServices: resp.data.map((s) => s.service.name),
      exitCode: EXIT_CODES.NOT_FOUND,
    };
  }

  return {
    service: {
      id: found.service.id,
      name: found.service.name,
      url: found.service.serviceDetails?.url || `https://${targetName}.onrender.com`,
    },
  };
}

async function getLatestDeploy(apiKey, serviceId) {
  const resp = await apiRequest(`/services/${serviceId}/deploys?limit=1`, apiKey);
  if (resp.status !== 200 || !Array.isArray(resp.data) || resp.data.length === 0) {
    return null;
  }
  return resp.data[0].deploy;
}

async function main() {
  const args = parseArgs();
  const apiKey = process.env.RENDER_API_KEY;

  if (!apiKey) {
    console.error("Error: RENDER_API_KEY is not set.");
    console.error("Get it from: https://dashboard.render.com/settings#api-keys");
    console.error("Usage: export RENDER_API_KEY=rnd_...");
    process.exit(EXIT_CODES.API_KEY_MISSING);
  }

  const targetName = args.service || process.env.RENDER_SERVICE_NAME || DEFAULT_SERVICE_NAME;

  // Find service
  const serviceResult = await findService(apiKey, targetName);
  if (serviceResult.error) {
    if (args.format === "json") {
      console.log(JSON.stringify({ success: false, error: serviceResult.error, availableServices: serviceResult.availableServices }, null, 2));
    } else {
      console.error(`Error: ${serviceResult.error}`);
      if (serviceResult.availableServices?.length) {
        console.error(`Available services: ${serviceResult.availableServices.join(", ")}`);
      }
    }
    process.exit(serviceResult.exitCode);
  }

  const service = serviceResult.service;

  // Get latest deploy
  let deploy = await getLatestDeploy(apiKey, service.id);

  if (!deploy) {
    const output = {
      success: true,
      status: "never_deployed",
      service: { id: service.id, name: service.name, url: service.url },
      message: `Service '${targetName}' exists but has no deployments yet.`,
    };
    if (args.format === "json") {
      console.log(JSON.stringify(output, null, 2));
    } else {
      console.log(`📭 ${service.name} — No deployments yet`);
      console.log(`   URL: ${service.url}`);
    }
    process.exit(EXIT_CODES.SUCCESS);
  }

  // Wait loop
  if (args.wait && deploy.status === "in_progress") {
    const deadline = Date.now() + args.timeout * 1000;
    const pollInterval = 10;

    if (args.format === "text") {
      process.stdout.write(`⏳ Waiting for deploy to complete (timeout: ${args.timeout}s)...`);
    }

    while (deploy.status === "in_progress" && Date.now() < deadline) {
      await sleep(pollInterval * 1000);
      const updated = await getLatestDeploy(apiKey, service.id);
      if (updated) {
        deploy = updated;
      }
      if (args.format === "text") {
        process.stdout.write(".");
      }
    }

    if (args.format === "text") {
      process.stdout.write("\n");
    }

    if (deploy.status === "in_progress") {
      const output = {
        success: true,
        status: "timeout",
        service: { id: service.id, name: service.name, url: service.url },
        deploy: { id: deploy.id, status: deploy.status, createdAt: deploy.createdAt },
        message: `Timed out waiting for deploy after ${args.timeout}s.`,
      };
      if (args.format === "json") {
        console.log(JSON.stringify(output, null, 2));
      } else {
        console.log(`⏱️ Timeout: Deploy still in progress after ${args.timeout}s`);
        console.log(`   Deploy ID: ${deploy.id}`);
      }
      process.exit(EXIT_CODES.TIMEOUT);
    }
  }

  // Build output
  const mapped = DEPLOY_STATUS_MAP[deploy.status] || { status: deploy.status, label: deploy.status, icon: "❓" };

  const output = {
    success: true,
    status: mapped.status,
    service: { id: service.id, name: service.name, url: service.url },
    deploy: {
      id: deploy.id,
      status: deploy.status,
      createdAt: deploy.createdAt,
      finishedAt: deploy.finishedAt,
      durationSeconds: deploy.finishedAt ? formatDurationSeconds(deploy.createdAt, deploy.finishedAt) : null,
      commit: deploy.commit,
    },
  };

  if (args.format === "json") {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(buildTextOutput(service, deploy));
  }

  // Exit code based on status
  if (mapped.status === "failed") {
    process.exit(EXIT_CODES.DEPLOY_FAILED);
  } else if (mapped.status === "deploying") {
    process.exit(EXIT_CODES.TIMEOUT);
  } else {
    process.exit(EXIT_CODES.SUCCESS);
  }
}

main().catch((err) => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(EXIT_CODES.API_ERROR);
});
