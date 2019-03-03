'use strict';
import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {

	const collection = vscode.languages.createDiagnosticCollection('test');
	let activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		updateDiagnostics(vscode.window.activeTextEditor.document, collection);
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			updateDiagnostics(editor.document, collection)
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			updateDiagnostics(event.document, collection)
		}
	}, null, context.subscriptions);


}

function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
	if (document && path.basename(document.uri.fsPath) === 'sample-demo.rs') {
		let text = document.getText();
		const { exec } = require('child_process');
		const fs = require('fs');
		fs.writeFileSync('.issuesCheckTemp', text);
		exec('./issueIdentifier .issuesCheckTemp', (err, stdout, stderr) => {
			if (err) {
				return;
			}
			let issues = stdout.split( "\n" );
			var issueList = [];
			for( var i = 0; i < issues.length && issues[i]; ++i ) {
				var issue=issues[i].split(',');
				var lineNo=parseInt(issue[0].trim());
				var issueName=issue[1].trim();
				var issueDescription=issue[2].trim();
				var issueObject={
					code: '',
					message: issueName,
					range: new vscode.Range(new vscode.Position(lineNo, 0), new vscode.Position(lineNo+1, 0)),
					severity: vscode.DiagnosticSeverity.Error,
					source: '',
					relatedInformation: [ new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, new vscode.Range(new vscode.Position(lineNo, 0), new vscode.Position(lineNo+1, 0))), issueDescription) ]
				}
				issueList.push(issueObject);
			}
			collection.set(document.uri, issueList);
			fs.unlinkSync('.issuesCheckTemp');
		});
	} else {
		collection.clear();
	}
}

// this method is called when your extension is deactivated
export function deactivate() {
}
