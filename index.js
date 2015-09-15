var typescript = require('./compiler');
var TypeScriptCompiler;

module.exports = TypeScriptCompiler = (function () {

	TypeScriptCompiler.prototype.brunchPlugin = true;
	TypeScriptCompiler.prototype.type = 'javascript';
	TypeScriptCompiler.prototype.extension = 'ts';

	function TypeScriptCompiler(config) {
		if (config == null) config = {};
		var plugin = config.plugins && config.plugins.coffeescript;
		this.sourceMaps = !!config.sourceMaps;
	}

	TypeScriptCompiler.prototype.parseMap = function(compiled) {
		var fileName, file;

		for (fileName in compiled) {
			file = compiled[fileName];
			if (file.map) {
				map = JSON.parse(file.map);
				map.sources = [fileName];
				map.file = '';
				file.map = JSON.stringify(map);
			}
		}
		return compiled
	};

	TypeScriptCompiler.prototype.compile = function (params, callback) {
		var result, compiled;

		var options = {
			noEmitOnError: true,
			noImplicitAny: false,
			target: 1 /* ES5 */,
			module: 1 /* CommonJS */,
			removeComments: true,
			sourceMap: this.sourceMaps
		};

		try {
			compiled = typescript.compile(options, [params.path]);
			result = this.parseMap(compiled)[params.path];
		} catch (error) {
			return callback(error);
		}

		return callback(null, result);
	};

	return TypeScriptCompiler;

})();
