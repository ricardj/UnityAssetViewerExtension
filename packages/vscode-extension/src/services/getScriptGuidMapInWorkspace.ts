import * as vscode from 'vscode';
import * as path from 'path';

export async function getScriptGuidMapInWorkspace(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const csMetaFiles = await vscode.workspace.findFiles('**/*.cs.meta');
  const guidRegex = /guid:\s*([0-9a-f]{32})/;

  for (const metaUri of csMetaFiles) {
    try {
      const contentBuffer = await vscode.workspace.fs.readFile(metaUri);
      const text = new TextDecoder('utf-8').decode(contentBuffer);
      const match = guidRegex.exec(text);
      if (match) {
        const className = path.basename(metaUri.fsPath).replace('.cs.meta', '');
        map[match[1]] = className;
      }
    } catch (e) {
      // Ignore unreadable files
    }
  }
  return map;
}
