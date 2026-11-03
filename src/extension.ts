import * as vscode from 'vscode';
import { findTodos } from './scanner';
import { TodoTreeProvider } from './todoTree';

export function activate(context: vscode.ExtensionContext) {
	const output = vscode.window.createOutputChannel('TODO Tracker');
	const treeProvider = new TodoTreeProvider();

	const treeView = vscode.window.createTreeView('todo-tracker.todoView', {
		treeDataProvider: treeProvider,
	});

	const applyFilter = (query: string) => {
		treeProvider.setFilter(query);

		const filter = treeProvider.getFilter();
		treeView.description = filter === '' ? undefined : `поиск: ${filter}`;

		vscode.commands.executeCommand('setContext', 'todo-tracker.filterActive', filter !== '');
	};

	const scanFile = vscode.commands.registerCommand('todo-tracker.scanFile', () => {
		const editor = vscode.window.activeTextEditor;

		if (editor === undefined) {
			vscode.window.showWarningMessage('Нет открытого файла');
			return;
		}

		const todos = findTodos(editor.document.getText());

		output.clear();
		output.appendLine(`Файл: ${editor.document.fileName}`);
		for (const todo of todos) {
			output.appendLine(`  [${todo.tag}] строка ${todo.line + 1}: ${todo.text}`);
		}
		output.show(true);

		vscode.window.showInformationMessage(`Найдено пометок: ${todos.length}`);
	});

	const search = vscode.commands.registerCommand('todo-tracker.search', async () => {
		const query = await vscode.window.showInputBox({
			title: 'Поиск по пометкам',
			prompt: 'Текст или метка, например FIXME. Пустой запрос покажет все пометки',
			value: treeProvider.getFilter(),
		});

		if (query !== undefined) {
			applyFilter(query);
		}
	});

	context.subscriptions.push(
		scanFile,
		search,
		output,
		treeView,
		vscode.commands.registerCommand('todo-tracker.clearSearch', () => applyFilter('')),
		vscode.commands.registerCommand('todo-tracker.refresh', () => treeProvider.refresh()),
		vscode.workspace.onDidSaveTextDocument(() => treeProvider.refresh()),
		treeProvider.onDidScan((fileCount) => {
			const filter = treeProvider.getFilter();
			treeView.message = filter !== '' && fileCount === 0 ? `Ничего не найдено: ${filter}` : undefined;
		}),
	);
}

export function deactivate() {}