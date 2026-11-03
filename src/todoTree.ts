import * as vscode from 'vscode';
import { findTodos, TodoItem } from './scanner';

const EXCLUDE = '**/{node_modules,out,dist,build,.git,.vscode-test}/**';
const MAX_FILES = 2000;

export class FileNode extends vscode.TreeItem {
	constructor(
		public readonly uri: vscode.Uri,
		public readonly todos: TodoItem[],
	) {
		super(uri, vscode.TreeItemCollapsibleState.Expanded);

		const relativePath = vscode.workspace.asRelativePath(uri);
		const slashIndex = relativePath.lastIndexOf('/');
		const folder = slashIndex === -1 ? '' : `${relativePath.slice(0, slashIndex)} `;
		this.description = `${folder}(${todos.length})`;
	}
}

export class TodoNode extends vscode.TreeItem {
	constructor(uri: vscode.Uri, todo: TodoItem) {
		super(`[${todo.tag}] ${todo.text || '(без текста)'}`, vscode.TreeItemCollapsibleState.None);
		this.description = `строка ${todo.line + 1}`;
		this.iconPath = new vscode.ThemeIcon(todo.tag === 'FIXME' ? 'warning' : 'checklist');

		const position = new vscode.Position(todo.line, 0);
		this.command = {
			command: 'vscode.open',
			title: 'Открыть',
			arguments: [uri, { selection: new vscode.Range(position, position) }],
		};
	}
}

type TreeNode = FileNode | TodoNode;

export class TodoTreeProvider implements vscode.TreeDataProvider<TreeNode> {
    private readonly changeEmitter = new vscode.EventEmitter<TreeNode | undefined>();
	readonly onDidChangeTreeData = this.changeEmitter.event;
    private readonly scanEmitter = new vscode.EventEmitter<number>();
	readonly onDidScan = this.scanEmitter.event;

    private filter = '';

	refresh(): void {
		this.changeEmitter.fire(undefined);
	}

    setFilter(value: string): void {
		this.filter = value.trim().toLowerCase();
		this.refresh();
	}

    getFilter(): string {
		return this.filter;
	}

	getTreeItem(element: TreeNode): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: TreeNode): Promise<TreeNode[]> {
		if (element === undefined) {
			return this.scanWorkspace();
		}

		if (element instanceof FileNode) {
			return element.todos.map((todo) => new TodoNode(element.uri, todo));
		}

		return [];
	}

	private async scanWorkspace(): Promise<FileNode[]> {
		const uris = await vscode.workspace.findFiles('**/*', EXCLUDE, MAX_FILES);
		const decoder = new TextDecoder();
		const nodes: FileNode[] = [];

		for (const uri of uris) {
			try {
				const bytes = await vscode.workspace.fs.readFile(uri);
				if (bytes.includes(0)) {
					continue;
				}

				const todos = findTodos(decoder.decode(bytes)).filter((todo) =>
					`${todo.tag} ${todo.text}`.toLowerCase().includes(this.filter),
				);
				if (todos.length > 0) {
					nodes.push(new FileNode(uri, todos));
				}
			} catch {
			}
		}
        
        this.scanEmitter.fire(nodes.length);
		return nodes.sort((a, b) => a.uri.path.localeCompare(b.uri.path));
	}
}