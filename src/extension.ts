import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('todo-tracker.scanFile', () => {
		const editor = vscode.window.activeTextEditor;

		if (editor === undefined) {
			vscode.window.showWarningMessage('Нет открытого файла');
			return;
		}

		const fileName = editor.document.fileName;
		vscode.window.showInformationMessage(`Открыт файл: ${fileName}`);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
