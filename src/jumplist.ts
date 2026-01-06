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
    const uriString = uri.toString();

    if (this.navigating || this.cursor?.value.toString() === uriString) {
      return;
    }

    const node = this.list.findNode((node) => node.value.toString() === uriString);
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
    return this.jump(true);
  }

  async jumpBack() {
    return this.jump();
  }

  private async jump(isForward = false) {
    if (this.navigating || this.renaming) {
      return;
    }
    this.navigating = true;

    const key = isForward ? "next" : "prev";

    let node = this.cursor?.[key];

    while (node) {
      try {
        await vscode.window.showTextDocument(node.value);
        this.cursor = node;
        break;
      } catch {
        const tmp = node;
        node = node[key];
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

  getCurrentPosition(): number {
    if (!this.cursor) {
      return -1;
    }
    return this.list.indexOf(this.cursor);
  }

  getDebugInfo(): {
    total: number;
    position: number;
    canGoBack: boolean;
    canGoForward: boolean;
    items: Array<{ uri: vscode.Uri; isCurrent: boolean }>;
  } {
    const position = this.getCurrentPosition();
    const items = this.list.toArray((node) => ({
      uri: node.value,
      isCurrent: node === this.cursor,
    }));

    return {
      total: this.list.length,
      position: position >= 0 ? position + 1 : 0, // 1-based for display
      canGoBack: this.cursor?.prev !== undefined,
      canGoForward: this.cursor?.next !== undefined,
      items,
    };
  }

  remove(uri: vscode.Uri) {
    const uriString = uri.toString();
    const node = this.list.findNode((node) => node.value.toString() === uriString);
    if (!node) {
      return;
    }

    if (this.list.length === 1) {
      this.list.removeNode(node);
      this.cursor = undefined;
      return;
    }

    if (node === this.cursor) {
      const next = node.next ?? node.prev;
      this.list.removeNode(node);
      this.cursor = next;
      return;
    }

    this.list.removeNode(node);
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
