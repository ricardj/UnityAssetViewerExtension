import * as vscode from 'vscode';

export class VSCodeWorkspaceAssetResolver {
  public static async resolvePathByGuid(guid: string): Promise<string | null> {
    const metaFiles = await vscode.workspace.findFiles('**/*.meta');
    for (const metaUri of metaFiles) {
      try {
        const contentBuffer = await vscode.workspace.fs.readFile(metaUri);
        const text = new TextDecoder('utf-8').decode(contentBuffer);
        if (text.includes(`guid: ${guid}`)) {
          // Target file is the meta file path minus the '.meta' extension
          return metaUri.fsPath.slice(0, -5);
        }
      } catch (e) {
        // Ignore unreadable files
      }
    }
    return null;
  }
}
