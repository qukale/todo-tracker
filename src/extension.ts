import * as vscode from 'vscode';
import { findTodos } from './scanner';
import { TodoTreeProvider } from './todoTree';

export function activate(context: vscode.ExtensionContext) {
	const output = vscode.window.createOutputChannel('TODO Tracker');
	const treeProvider = new TodoTreeProvider();

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

	context.subscriptions.push(
		scanFile,
		output,
		vscode.window.registerTreeDataProvider('todo-tracker.todoView', treeProvider),
	);
}

export function deactivate() {}