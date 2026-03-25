import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function sendToAgent(
  agentId: string,
  message: string
): Promise<string> {
  try {
    const sanitizedMessage = message.replace(/"/g, '\\"').replace(/\n/g, " ");
    const { stdout, stderr } = await execAsync(
      `openclaw send --agent ${agentId} --message "${sanitizedMessage}" --wait`,
      { timeout: 30000 }
    );

    if (stderr && !stdout) {
      console.error("OpenClaw stderr:", stderr);
    }

    return stdout.trim() || "I received your message but got no response.";
  } catch (error) {
    console.error("OpenClaw error:", error);
    return `Agent ${agentId} is currently unavailable. The command was: "${message}"`;
  }
}
