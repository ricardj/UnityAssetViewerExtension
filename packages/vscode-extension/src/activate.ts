import * as vscode from 'vscode';
import * as path from 'path';
import { findFileByGuidInWorkspace } from './findFileByGuidInWorkspace';
import { getScriptGuidMapInWorkspace } from './getScriptGuidMapInWorkspace';
import { getWebviewContent } from './getWebviewContent';

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
