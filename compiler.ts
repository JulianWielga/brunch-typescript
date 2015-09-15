/// <reference path="typings/node/node.d.ts" />
/// <reference path="typings/typescript/typescript.d.ts" />

import * as fs from "fs";
import * as ts from "typescript";

interface Result {
	data?: string;
	map?: string;
}

export function compile(options: ts.CompilerOptions, fileNames: string[]): ts.Map<Object> {
	const files: ts.Map<{ version: number, data?: string }> = {};
	const results: ts.Map<Result> = {};

	// initialize the list of files
	fileNames.forEach(fileName => {
		files[fileName] = {
			version: 0
		};
	});

	// Create the language service host to allow the LS to communicate with the host
	const servicesHost: ts.LanguageServiceHost = <ts.LanguageServiceHost>{
		getScriptFileNames: () => fileNames,
		getScriptVersion: (fileName) => files[fileName] && files[fileName].version.toString(),
		getScriptSnapshot: (fileName) => {
			let data:string;

			if (files[fileName] && files[fileName].data) {
				data = files[fileName].data
			} else {
				if (!fs.existsSync(fileName)) {
					return undefined;
				}
				data = fs.readFileSync(fileName).toString();
			}

			return ts.ScriptSnapshot.fromString(data);
		},
		getCurrentDirectory: () => process.cwd(),
		getCompilationSettings: () => options,
		getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
	};

	// Create the language service files
	const services = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());

	fileNames.forEach(fileName => {
		if (fs.existsSync(fileName) || files[fileName].data)
			results[fileName] = emitFile(fileName);
		else {
			throw new Error('No file or data');
		}
	});

	function emitFile(fileName: string) {
		let result:Result = {};
		let output = services.getEmitOutput(fileName);

		if (output.emitSkipped) {
			throw new Error(logErrors(fileName).join(', '));
		}

		output.outputFiles.forEach(o => {
			if (o.name.substr(-3) === 'map') {
				result['map'] = o.text;
			} else {
				result['data'] = o.text;
			}
		});
		return result;
	}

	function logErrors(fileName: string):string[] {
		let errors:string[] = [];

		let allDiagnostics = services.getCompilerOptionsDiagnostics()
			.concat(services.getSyntacticDiagnostics(fileName))
			.concat(services.getSemanticDiagnostics(fileName));

		allDiagnostics.forEach(diagnostic => {
			let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
			if (diagnostic.file) {
				let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
				errors.push(`Error ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
			} else {
				errors.push(`Error: ${message}`);
			}
		});
		return errors;
	}

	return results;
}