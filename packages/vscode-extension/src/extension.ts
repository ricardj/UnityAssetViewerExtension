import * as vscode from 'vscode';
import * as path from 'path';

async function findFileByGuidInWorkspace(guid: string): Promise<string | null> {
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

async function getScriptGuidMapInWorkspace(): Promise<Record<string, string>> {
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

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('unityAssetViewer.showPreview', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    const document = editor.document;
    if (!document.fileName.endsWith('.prefab')) {
      vscode.window.showErrorMessage('Active file is not a Unity Prefab (.prefab).');
      return;
    }

    const workspaceRoots = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders.map(folder => folder.uri)
      : [];

    const panel = vscode.window.createWebviewPanel(
      'unityAssetViewer',
      `Prefab Preview: ${path.basename(document.fileName)}`,
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'dist')),
          ...workspaceRoots
        ]
      }
    );

    // Handle repo requests from the webview
    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'repoRequest') {
        const { id, type, payload } = message;
        try {
          let result: any = null;
          if (type === 'findPrefabByGuid') {
            const fsPath = await findFileByGuidInWorkspace(payload.guid);
            if (fsPath && fsPath.endsWith('.prefab')) {
              const contentBuffer = await vscode.workspace.fs.readFile(vscode.Uri.file(fsPath));
              result = new TextDecoder('utf-8').decode(contentBuffer);
            }
          } else if (type === 'getScriptGuidMap') {
            result = await getScriptGuidMapInWorkspace();
          } else if (type === 'resolveAssetUrl') {
            const fsPath = await findFileByGuidInWorkspace(payload.guid);
            if (fsPath) {
              result = panel.webview.asWebviewUri(vscode.Uri.file(fsPath)).toString();
            }
          }
          panel.webview.postMessage({ command: 'repoResponse', id, result });
        } catch (err) {
          panel.webview.postMessage({ command: 'repoResponse', id, result: null, error: String(err) });
        }
      }
    });

    // Get path to webview script
    const scriptPathOnDisk = vscode.Uri.file(
      path.join(context.extensionPath, 'dist', 'webview.js')
    );
    const scriptUri = panel.webview.asWebviewUri(scriptPathOnDisk);

    // Set webview HTML
    panel.webview.html = getWebviewContent(scriptUri);

    // Send the prefab text to the webview
    panel.webview.postMessage({ command: 'parse', text: document.getText() });
  });

  context.subscriptions.push(disposable);
}

function getWebviewContent(scriptUri: vscode.Uri): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unity Asset Viewer</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        background-color: #1e1e1e;
      }
      #root {
        width: 100%;
        height: 100%;
      }
    </style>
</head>
<body>
    <div id="root"></div>
    <script src="${scriptUri}"></script>
</body>
</html>`;
}

export function deactivate() {}
