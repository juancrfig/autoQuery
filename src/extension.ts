import * as vscode from 'vscode';

// Helper function to generate the selector
function generateQuerySelector(html: string): string | null {
    const idMatch = html.match(/id=["']([^"']+)["']/);
    if (idMatch) {
        const id = idMatch[1];
        return `#${id}`;
    }

    const classMatch = html.match(/class=["']([^"']+)["']/);
    if (classMatch) {
        const className = classMatch[1].split(' ')[0];
        return `.${className}`;
    }

    return null;
}

// Helper to get open JS/TS files
function getJsTsFiles(): vscode.TextDocument[] {
    return vscode.workspace.textDocuments.filter(doc =>
        doc.languageId.match(/javascript|typescript/)
    );
}

// Helper to get JS/TS files in the workspace
async function getWorkspaceJsTsFiles(): Promise<vscode.Uri[]> {
    return await vscode.workspace.findFiles('**/*.{js,ts}', '**/node_modules/**');
}

// Custom QuickPickItem interface with uri
interface FileQuickPickItem extends vscode.QuickPickItem {
    uri: vscode.Uri;
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('autoquery.runQuery', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found!');
                return;
            }

            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);

            if (selection.isEmpty) {
                vscode.window.showErrorMessage('Please select some HTML first!');
                return;
            }

            const selector = generateQuerySelector(selectedText);
            if (!selector) {
                vscode.window.showErrorMessage('No ID or class found. Please add one to your HTML!');
                return;
            }

            const variableName = await vscode.window.showInputBox({
                prompt: 'Enter the variable name for your querySelector',
                placeHolder: 'e.g., myElement',
                validateInput: (value) => {
                    if (!value || value.trim() === '') {
                        return 'Variable name cannot be empty!';
                    }
                    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value)) {
                        return 'Invalid variable name! Use letters, numbers, _, or $ (no spaces).';
                    }
                    return null;
                }
            });

            if (!variableName) {
                vscode.window.showInformationMessage('Variable creation cancelled.');
                return;
            }

            const jsVariable = `const ${variableName} = document.querySelector('${selector}');\n`;

            const jsTsFiles = getJsTsFiles();
            let targetDocument: vscode.TextDocument | undefined;

            if (jsTsFiles.length === 1) {
                targetDocument = jsTsFiles[0];
            } else {
                const workspaceFiles = await getWorkspaceJsTsFiles();
                if (workspaceFiles.length === 0) {
                    vscode.window.showErrorMessage('No JavaScript/TypeScript files found in the workspace!');
                    return;
                }

                const baseUri = editor.document.uri.fsPath.split('/').slice(0, -1).join('/') || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

                const fileItems: FileQuickPickItem[] = workspaceFiles.map(file => ({
                    label: baseUri ? vscode.workspace.asRelativePath(file.fsPath, false) : file.fsPath,
                    description: file.fsPath,
                    uri: file
                }));

                const quickPick = vscode.window.createQuickPick<FileQuickPickItem>();
                quickPick.placeholder = 'Type a relative or absolute path to a JS/TS file';
                quickPick.items = fileItems;
                quickPick.matchOnDescription = true;

                quickPick.onDidChangeValue((value) => {
                    if (value) {
                        quickPick.items = fileItems.filter(item =>
                            item.label.toLowerCase().includes(value.toLowerCase()) ||
                            (item.description?.toLowerCase() || '').includes(value.toLowerCase())
                        );
                    } else {
                        quickPick.items = fileItems;
                    }
                });

                const selectedItem = await new Promise<FileQuickPickItem | undefined>(resolve => {
                    quickPick.onDidAccept(() => {
                        resolve(quickPick.selectedItems[0]);
                        quickPick.hide();
                    });
                    quickPick.onDidHide(() => resolve(undefined));
                    quickPick.show();
                });

                if (!selectedItem) {
                    vscode.window.showInformationMessage('No file selected. Variable creation cancelled.');
                    return;
                }

                targetDocument = await vscode.workspace.openTextDocument(selectedItem.uri);
            }

            if (!targetDocument) {
                vscode.window.showErrorMessage('Could not find a suitable file to insert the variable!');
                return;
            }

            const targetEditor = await vscode.window.showTextDocument(targetDocument);
            await targetEditor.edit(editBuilder => {
                editBuilder.insert(new vscode.Position(0, 0), jsVariable);
            });

            // Switch back to the original editor to keep the user there
            if (editor.document !== targetDocument) {
                await vscode.window.showTextDocument(editor.document);
            }

            vscode.window.showInformationMessage(`Added: ${jsVariable.trim()} to ${vscode.workspace.asRelativePath(targetDocument.uri)}`);
        })
    );
}

export function deactivate() {}