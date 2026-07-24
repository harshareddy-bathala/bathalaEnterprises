import { spawnSync } from "node:child_process";

const steps = [
  {
    name: "Verify environment variables",
    command: ["node", "scripts/predeploy/verify-environment.mjs"],
  },
  {
    name: "Check external API connections",
    command: ["node", "scripts/predeploy/check-external-connections.mjs"],
  },
  {
    name: "Validate SSL certificate",
    command: ["node", "scripts/predeploy/validate-ssl.mjs"],
  },
];

for (const step of steps) {
  console.log(`\n== ${step.name} ==`);
  const result = spawnSync(step.command[0], step.command.slice(1), {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if ((result.status ?? 1) !== 0) {
    console.error(`\nPre-deploy checklist failed at: ${step.name}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nPre-deploy checklist completed successfully.");
