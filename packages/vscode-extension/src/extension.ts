import * as vscode from 'vscode';
import * as path from 'path';

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

    const panel = vscode.window.createWebviewPanel(
      'unityAssetViewer',
      `Prefab Preview: ${path.basename(document.fileName)}`,
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'dist'))]
      }
    );

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
