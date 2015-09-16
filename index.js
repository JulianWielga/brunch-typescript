/// <reference path="typings/tsd.d.ts" />
/// <reference path="compiler.ts" />
var ts = require("typescript");
var compiler = require("./compiler");
var TypeScriptCompiler = (function () {
    function TypeScriptCompiler(config) {
        this.brunchPlugin = true;
        this.type = 'javascript';
        this.extension = 'ts';
        if (config == null)
            config = {};
        var plugin = config.plugins && config.plugins.typescript;
        this.sourceMaps = !!config.sourceMaps;
        if (plugin && !!plugin.useTsdBundle) {
            try {
                var path = process.cwd();
                var tsd = require(path + '/tsd.json');
                this.referenceBundle = '/// <reference path="' + path + '/' + tsd.bundle + '" />';
            }
            catch (error) {
                console.log(error);
            }
        }
    }
    TypeScriptCompiler.prototype.parseMap = function (compiled) {
        var fileName, file;
        for (fileName in compiled) {
            file = compiled[fileName];
            if (file.map) {
                var map = JSON.parse(file.map);
                map.sources = [fileName];
                map.file = '';
                file.map = JSON.stringify(map);
            }
        }
        return compiled;
    };
    TypeScriptCompiler.prototype.compile = function (params, callback) {
        var result;
        var compiled;
        var options = {
            noEmitOnError: true,
            noImplicitAny: false,
            target: 1 /* ES5 */,
            module: 0 /* None */,
            removeComments: true,
            sourceMap: this.sourceMaps
        };
        if (this.referenceBundle) {
            params.data = this.referenceBundle + '\n' + params.data;
        }
        try {
            compiled = compiler.compile(options, [params]);
            result = this.parseMap(compiled)[params.path];
        }
        catch (error) {
            return callback(error);
        }
        return callback(null, result);
    };
    return TypeScriptCompiler;
})();
exports.TypeScriptCompiler = TypeScriptCompiler;
//# sourceMappingURL=index.js.map