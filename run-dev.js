const { spawn } = require("child_process");
const path = require("path");
const colors = require("colors/safe");

// Configuration
const processes = [
  {
    name: "Backend",
    command: "npm",
    args: ["run", "dev"],
    cwd: path.join(__dirname, "backend"),
    color: colors.blue,
  },
  {
    name: "Frontend",
    command: "npm",
    args: ["run", "dev"],
    cwd: path.join(__dirname, "frontend"),
    color: colors.green,
  },
];

// Start all processes
processes.forEach((process) => {
  const proc = spawn(process.command, process.args, {
    cwd: process.cwd,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  console.log(`${process.color(`[${process.name}]`)} Starting...`);

  // Handle stdout
  proc.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      console.log(`${process.color(`[${process.name}]`)} ${line}`);
    });
  });

  // Handle stderr
  proc.stderr.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      console.log(`${process.color(`[${process.name}]`)} ${line}`);
    });
  });

  // Handle process exit
  proc.on("close", (code) => {
    console.log(
      `${process.color(`[${process.name}]`)} Process exited with code ${code}`
    );
  });
});

console.log(
  colors.yellow(
    "Development servers started. Press Ctrl+C to stop all processes."
  )
);
