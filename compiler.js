/// <reference path="typings/tsd.d.ts" />
var fs = require("fs");
var ts = require("typescript");
function compile(options, inputFiles) {
    var files = {};
    var results = {};
    var fileNames = inputFiles.map(function (file) { return file.path; });
    // initialize the list of files
    inputFiles.forEach(function (file) {
        files[file.path] = {
            data: file.data,
            version: 0
        };
    });
    // Create the language service host to allow the LS to communicate with the host
    var servicesHost = {
        getScriptFileNames: function () { return fileNames; },
        getScriptVersion: function (fileName) { return files[fileName] && files[fileName].version.toString(); },
        getScriptSnapshot: function (fileName) {
            var data;
            if (files[fileName] && files[fileName].data) {
                data = files[fileName].data;
            }
            else {
                if (!fs.existsSync(fileName)) {
                    return undefined;
                }
                data = fs.readFileSync(fileName).toString();
            }
            return ts.ScriptSnapshot.fromString(data);
        },
        getCurrentDirectory: function () { return process.cwd(); },
        getCompilationSettings: function () { return options; },
        getDefaultLibFileName: function (options) { return ts.getDefaultLibFilePath(options); }
    };
    // Create the language service files
    var services = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
    inputFiles.forEach(function (file) {
        if (file.data || fs.existsSync(file.path))
            results[file.path] = emitFile(file.path);
        else {
            throw new Error('No file or data');
        }
    });
    function emitFile(fileName) {
        var result = {};
        var output = services.getEmitOutput(fileName);
        if (output.emitSkipped) {
            throw new Error(logErrors(fileName).join(' '));
        }
        output.outputFiles.forEach(function (o) {
            if (o.name.substr(-3) === 'map') {
                result['map'] = o.text + '\n';
            }
            else {
                result['data'] = o.text + '\n';
            }
        });
        return result;
    }
    function logErrors(fileName) {
        var errors = [];
        var allDiagnostics = services.getCompilerOptionsDiagnostics()
            .concat(services.getSyntacticDiagnostics(fileName))
            .concat(services.getSemanticDiagnostics(fileName));
        allDiagnostics.forEach(function (diagnostic) {
            var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            if (diagnostic.file) {
                var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character;
                errors.push("Error " + diagnostic.file.fileName + " (" + (line + 1) + "," + (character + 1) + "): " + message);
            }
            else {
                errors.push("Error: " + message);
            }
        });
        return errors;
    }
    return results;
}
exports.compile = compile;
//# sourceMappingURL=compiler.js.map