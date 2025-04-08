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
}

export function deactivate() {}
