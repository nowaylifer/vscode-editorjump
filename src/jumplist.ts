import * as vscode from "vscode";
import { List, Node } from "./list";

export class Jumplist {
  private list: List<vscode.Uri>;
  private cursor: Node<vscode.Uri> | undefined;
  private navigating: boolean = false;
  private renaming: boolean = false;
  private maxLength: number;

  constructor(initUri: vscode.Uri[] | vscode.Uri | undefined | null, { maxLength }: { maxLength: number }) {
    this.list = new List<vscode.Uri>();
    this.maxLength = maxLength;

    if (initUri) {
      const arr = Array.isArray(initUri) ? initUri : [initUri];
      for (const uri of arr) {
        this.list.push(uri);
      }
      this.cursor = this.list.tail;
    }
  }

  push(uri: vscode.Uri) {
    if (this.navigating || this.cursor?.value.path === uri.path) {
      return;
    }

    const node = this.list.findNode((node) => node.value.path === uri.path);
    if (node) {
      this.list.removeNode(node);
    }

    if (this.cursor && this.cursor !== this.list.tail) {
      const curUri = this.cursor.value;
      this.list.removeNode(this.cursor);
      this.list.push(curUri);
    }

    this.list.push(uri);
    this.cursor = this.list.tail!;

    if (this.list.length > this.maxLength) {
      this.list.removeNode(this.list.head!);
    }
  }

  async jumpForward() {
    if (this.navigating || this.renaming) {
      return;
    }

    let node = this.cursor?.next;

    while (node) {
      try {
        this.navigating = true;
        await vscode.window.showTextDocument(node.value);
        this.cursor = node;
        break;
      } catch {
        const tmp = node;
        node = node.next;
        this.list.removeNode(tmp);
      }
    }

    this.navigating = false;
  }

  async jumpBack() {
    if (this.navigating || this.renaming) {
      return;
    }

    let node = this.cursor?.prev;

    while (node) {
      try {
        this.navigating = true;
        await vscode.window.showTextDocument(node.value);
        this.cursor = node;
        break;
      } catch {
        const tmp = node;
        node = node.prev;
        this.list.removeNode(tmp);
      }
    }

    this.navigating = false;
  }

  toArray() {
    return this.list.toArray((n) => n.value);
  }

  clear() {
    this.list = new List();
    this.cursor = undefined;
  }

  async handleRenameFiles(renames: ReadonlyArray<{ readonly oldUri: vscode.Uri; readonly newUri: vscode.Uri }>) {
    this.renaming = true;
    await Promise.all(renames.map(this.renameFile, this));
    this.renaming = false;
  }

  private async renameFile({ oldUri, newUri }: { readonly oldUri: vscode.Uri; readonly newUri: vscode.Uri }) {
    let stat;

    try {
      stat = await vscode.workspace.fs.stat(oldUri);
    } catch {
      return;
    }

    if (stat.type === vscode.FileType.Directory) {
      for (let node = this.list.head; node; node = node.next) {
        if (node.value.path.startsWith(oldUri.path)) {
          node.value = vscode.Uri.from({
            ...node.value,
            path: node.value.path.replace(oldUri.path, newUri.path),
          });
        }
      }
    } else {
      const node = this.list.findNode((node) => node.value.path === oldUri.path);
      if (node) {
        node.value = newUri;
      }
    }
  }
}
