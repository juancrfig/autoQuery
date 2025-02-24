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

	const queryCommand = vscode.commands.registerCommand('autoquery.runQuery', async () => {
		
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found!');
			return;
		}
		
		const selection = editor.selection;
		if (selection.isEmpty) {
			vscode.window.showErrorMessage('Select some HTML first!');
			return;
		}
		const selectedText = editor.document.getText(selection);

		vscode.window.showInformationMessage(`You selected: ${selectedText}`);

		// Generate the querySelector selector
		const selector = await generateQuerySelector(selectedText);
		if (!selector) {
			vscode.window.showErrorMessage('No ID or class found. Please add one to your HTML!');
			return;
		}

		const variableName = await promptVariableName();


		// Create the JavaScript variable
		const jsVariable = `const ${variableName} = document.querySelector('${selector}');`;
		// Show it for now (we’ll insert it in Step 5)
		vscode.window.showInformationMessage(`Generated: ${jsVariable}`);






	});

	context.subscriptions.push(welcomeMessage);
	context.subscriptions.push(queryCommand);


}

// HELPER FUNCTIONS

async function promptVariableName() {
	const variableName = await vscode.window.showInputBox({
		prompt: 'Name for the variable',
		placeHolder: 'myElement',
		validateInput: (value) => {
			if (!value || value.trim() === '') {
				return 'Variable name cannot be empty!';
			}
			if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value)) {
				return 'Invalid variable name! Use letters, numbers, _, or $ (no spaces).';
			}
			return null; // No error
		}
	});

	// If the user cancels (undefined) or doesn’t enter a name, exit
	if (!variableName) {
		vscode.window.showInformationMessage('Variable creation cancelled.');
		return;
	}


	vscode.window.showInformationMessage(
		`You typed ${variableName}`
	);

	return variableName;
}

// Helper function to generate the selector (no variable name here)
function generateQuerySelector(html: string): string | null {
    // Simple regex to find id or class
    const idMatch = html.match(/id=["']([^"']+)["']/);
    if (idMatch) {
        const id = idMatch[1]; // e.g., "myDiv"
        return `#${id}`; // e.g., "#myDiv"
    }

    const classMatch = html.match(/class=["']([^"']+)["']/);
    if (classMatch) {
        const className = classMatch[1].split(' ')[0]; // Take the first class if multiple
        return `.${className}`; // e.g., ".container"
    }

    return null; // No ID or class found
}



// This method is called when your extension is deactivated
export function deactivate() {}
