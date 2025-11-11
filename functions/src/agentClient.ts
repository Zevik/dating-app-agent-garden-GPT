import { readFileSync } from 'node:fs';
import path from 'node:path';
import fetch from 'node-fetch';

type ToolTransport = {
  type: 'http';
  method: 'POST';
  url: string;
};

type ToolDefinition = {
  name: string;
  input_schema: { $ref: string };
  output_schema: { $ref: string };
  transport: ToolTransport;
};

type Manifest = {
  tools: ToolDefinition[];
};

const manifestPath = path.resolve(__dirname, '../../adk/tools.manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
const toolMap = new Map(manifest.tools.map((tool) => [tool.name, tool]));

export async function callAgentTool<TInput, TOutput>(toolName: string, payload: TInput): Promise<TOutput> {
  const tool = toolMap.get(toolName);
  if (!tool) {
    throw new Error(`tool ${toolName} לא הוגדר במניפסט`);
  }
  const response = await fetch(tool.transport.url, {
    method: tool.transport.method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`קריאה לכלי ${toolName} נכשלה: ${response.status} ${text}`);
  }
  return (await response.json()) as TOutput;
}
