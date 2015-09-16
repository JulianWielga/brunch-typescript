/// <reference path="typings/tsd.d.ts" />
/// <reference path="compiler.ts" />

import ts = require("typescript");
import compiler = require("./compiler");

export class TypeScriptCompiler {

	brunchPlugin: boolean = true;
	type: string = 'javascript';
	extension: string = 'ts';
	sourceMaps: boolean;
	referenceBundle: string;

	constructor(config) {
		if (config == null) config = {};
		var plugin = config.plugins && config.plugins.typescript;
		this.sourceMaps = !!config.sourceMaps;
		if (plugin && !!plugin.useTsdBundle) {
			try {
				var path = process.cwd();
				var tsd = require(path + '/tsd.json');
				this.referenceBundle = '/// <reference path="' + path + '/' + tsd.bundle + '" />';
			} catch (error) {
				console.log(error);
			}
		}
	}

	parseMap(compiled:ts.Map<compiler.Result>):ts.Map<compiler.Result> {
		var fileName, file;
		for (fileName in compiled) {
			file = compiled[fileName];
			if (file.map) {
				let map = JSON.parse(file.map);
				map.sources = [fileName];
				map.file = '';
				file.map = JSON.stringify(map);
			}
		}
		return compiled
	}

	compile(params, callback:Function) {
		var result:compiler.Result;
		var compiled:ts.Map<compiler.Result>;

		var options:ts.CompilerOptions = {
			noEmitOnError: true,
			noImplicitAny: false,
			target: ts.ScriptTarget.ES5,
			module: ts.ModuleKind.None,
			removeComments: true,
			sourceMap: this.sourceMaps
		};

		if (this.referenceBundle) {
			params.data = this.referenceBundle + '\n' + params.data;
		}

		try {
			compiled = compiler.compile(options, [params]);
			result = this.parseMap(compiled)[params.path];
		} catch (error) {
			return callback(error);
		}

		return callback(null, result);
	}

}
