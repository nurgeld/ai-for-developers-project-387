import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const BASE_URL = process.env.BASE_URL;

if (!BASE_URL) {
  throw new Error('BASE_URL is not set. Set vars.RENDER_BASE_URL or workflow_dispatch input.');
}

const normalizedBaseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportDir = join('artifacts', 'lighthouse', timestamp);

const targets = [
  {
    slug: 'landing',
    url: `${normalizedBaseUrl}/`,
  },
  {
    slug: 'book',
    url: `${normalizedBaseUrl}/book`,
  },
];

await mkdir(reportDir, { recursive: true });

for (const target of targets) {
  const htmlOutputPath = join(reportDir, `${target.slug}.report.html`);
  const jsonOutputPath = join(reportDir, `${target.slug}.report.json`);

  await runCommand('npx', lighthouseArgs(target.url, 'html', htmlOutputPath));
  await runCommand('npx', lighthouseArgs(target.url, 'json', jsonOutputPath));
}

const summaryPath = join('artifacts', 'lighthouse', 'summary.md');
const summary = await buildSummary(reportDir, targets);
await writeFile(summaryPath, summary, 'utf8');

console.log(`Lighthouse reports saved to ${reportDir}`);
console.log(`Summary saved to ${summaryPath}`);

async function buildSummary(currentReportDir, currentTargets) {
  const rows = [];

  for (const target of currentTargets) {
    const reportJsonPath = join(currentReportDir, `${target.slug}.report.json`);
    const content = await readFile(reportJsonPath, 'utf8');
    const report = JSON.parse(content);
    const categories = report.categories;

    rows.push({
      page: target.url,
      performance: formatScore(categories.performance.score),
      accessibility: formatScore(categories.accessibility.score),
      bestPractices: formatScore(categories['best-practices'].score),
      seo: formatScore(categories.seo.score),
    });
  }

  const lines = [
    '# Nightly Lighthouse Report',
    '',
    `- Base URL: ${normalizedBaseUrl}`,
    `- Generated at: ${new Date().toISOString()}`,
    `- Report directory: ${currentReportDir}`,
    '',
    '| Page | Performance | Accessibility | Best Practices | SEO |',
    '|---|---:|---:|---:|---:|',
  ];

  for (const row of rows) {
    lines.push(
      `| ${row.page} | ${row.performance} | ${row.accessibility} | ${row.bestPractices} | ${row.seo} |`,
    );
  }

  lines.push('');
  lines.push('Full HTML and JSON reports are attached as workflow artifacts.');

  return `${lines.join('\n')}\n`;
}

function lighthouseArgs(url, outputFormat, outputPath) {
  return [
    '--yes',
    'lighthouse',
    url,
    '--output',
    outputFormat,
    '--output-path',
    outputPath,
    '--only-categories',
    'performance,accessibility,best-practices,seo',
    '--chrome-flags=--headless=new --no-sandbox',
  ];
}

function formatScore(score) {
  return `${Math.round(score * 100)}`;
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed (${code}): ${command} ${args.join(' ')}`));
    });
  });
}
