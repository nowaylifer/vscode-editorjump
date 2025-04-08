export class List<T = unknown> {
  tail?: Node<T>;
  head?: Node<T>;
  length: number = 0;

  constructor(list: Iterable<T> = []) {
    for (const item of list) {
      this.push(item);
    }
  }

  *[Symbol.iterator]() {
    let tmp = this.head;
    for (let node = tmp; node; node = tmp) {
      tmp = node.next;
      yield node;
    }
  }

  push(...args: T[]) {
    for (let i = 0, l = args.length; i < l; i++) {
      this.tail = new Node<T>(args[i], this.tail, undefined);
      if (!this.head) {
        this.head = this.tail;
      }
      this.length++;
    }
    return this.length;
  }

  findNode(predicate: (node: Node<T>) => boolean) {
    for (let node = this.head; node; node = node.next) {
      if (predicate(node)) {
        return node;
      }
    }
  }

  removeNode(node: Node<T>) {
    const next = node.next;
    const prev = node.prev;

    if (next) {
      next.prev = prev;
    }

    if (prev) {
      prev.next = next;
    }

    if (node === this.head) {
      this.head = next;
    }
    if (node === this.tail) {
      this.tail = prev;
    }

    this.length--;
    node.next = undefined;
    node.prev = undefined;

    return next;
  }

  toArray<U>(mapFn?: (node: Node<T>) => U) {
    const arr = new Array(this.length);
    for (let i = 0, node = this.head; node; i++, node = node.next) {
      arr[i] = mapFn ? mapFn(node) : node;
    }
    return arr;
  }
}

export class Node<T = unknown> {
  next?: Node<T>;
  prev?: Node<T>;
  value: T;

  constructor(value: T, prev?: Node<T> | undefined, next?: Node<T> | undefined) {
    this.value = value;

    if (prev) {
      prev.next = this;
      this.prev = prev;
    }

    if (next) {
      next.prev = this;
      this.next = next;
    }
  }
}
