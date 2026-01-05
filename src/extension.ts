import * as vscode from "vscode";
import { Jumplist } from "./jumplist";

const getExtensionConfig = <T>(section: string) => vscode.workspace.getConfiguration("editorjump").get<T>(section)!;

export function activate(context: vscode.ExtensionContext) {
  console.log("editorjump is loaded");

  const getActiveEditorUri = () => vscode.window.activeTextEditor?.document.uri;

  const maxLength = getExtensionConfig<number>("jumplistLength");
  const jumplist = new Jumplist(getActiveEditorUri(), { maxLength });

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((e) => {
      if (e?.document.uri) {
        jumplist.push(e.document.uri);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onWillRenameFiles((e) => e.waitUntil(jumplist.handleRenameFiles(e.files)))
  );

  context.subscriptions.push(vscode.commands.registerCommand("editorjump.navigateBack", () => jumplist.jumpBack()));

  context.subscriptions.push(
    vscode.commands.registerCommand("editorjump.navigateForward", () => jumplist.jumpForward())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("editorjump.clearJumplist", () => {
      jumplist.clear();
      const activeUri = getActiveEditorUri();
      if (activeUri) {
        jumplist.push(activeUri);
      }
    })
  );

  // Command to show full jumplist in output channel
  const outputChannel = vscode.window.createOutputChannel("EditorJump Debug");
  context.subscriptions.push(outputChannel);

  context.subscriptions.push(
    vscode.commands.registerCommand("editorjump.showJumplist", () => {
      const debugInfo = jumplist.getDebugInfo();
      outputChannel.clear();
      outputChannel.appendLine("=== EditorJump Jumplist Debug ===");
      outputChannel.appendLine(`Total files: ${debugInfo.total}`);
      outputChannel.appendLine(
        `Current position: ${debugInfo.position}${debugInfo.total > 0 ? `/${debugInfo.total}` : ""}`
      );
      outputChannel.appendLine(`Can go back: ${debugInfo.canGoBack}`);
      outputChannel.appendLine(`Can go forward: ${debugInfo.canGoForward}`);
      outputChannel.appendLine("");
      outputChannel.appendLine("Jumplist items:");

      if (debugInfo.items.length === 0) {
        outputChannel.appendLine("  (empty)");
      } else {
        debugInfo.items.forEach((item, index) => {
          const marker = item.isCurrent ? "→" : " ";
          const path = vscode.workspace.asRelativePath(item.uri, false);
          outputChannel.appendLine(`  ${marker} [${index + 1}] ${path}`);
        });
      }

      outputChannel.show(true);
    })
  );
}

export function deactivate() {}
