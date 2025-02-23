// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const welcomeMessage = vscode.commands.registerCommand('autoquery.welcomeMessage', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Welcome to autoQuery!');
	});

	const queryCommand = vscode.commands.registerCommand('autoquery.runQuery', () => {
		
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found!');
			return;
		}
		vscode.window.showInformationMessage('An active editor has been detected!');
	});

	context.subscriptions.push(welcomeMessage);
	context.subscriptions.push(queryCommand);


}

// This method is called when your extension is deactivated
export function deactivate() {}
