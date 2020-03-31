const Path = require('path');
const FS = require('fs');
const BuiltIn = require('module').builtinModules;

const _ = require('lodash');
const { parse } = require('@babel/parser');

const getNodes = require('./getNodes');

async function readFile(filename) {
    const content = FS.readFileSync(filename).toString();
    return parse(content, {
        sourceType: 'module',
        allowAwaitOutsideFunction: true,
        allowReturnOutsideFunction: true,
        allowUndeclaredExports: true,
        errorRecovery: true,
        strictMode: false
    });
}

function asString(node) {
    if (['StringLiteral', 'NumericLiteral', 'BooleanLiteral'].indexOf(node.type) > -1) {
        return '' + node.value;
    }

    if (node.type === 'BinaryExpression' &&
        node.operator === '+') {
        return asString(node.left) + asString(node.right);
    }

    throw new Error('Node can not turned to string: ' + JSON.stringify(node));
}

module.exports = async function readDependencies(filePath) {
    let parsed;
    try {
        parsed = await readFile(filePath);
    } catch(e) {
        console.error('Failed to parse file: %s', filePath, e);
    }
    const nodes = getNodes(parsed);
    const filtered = nodes.filter(node => ['ImportDeclaration', 'CallExpression'].indexOf(node.type) > -1)

    return filtered.map((node) => {
        try {
            switch (node.type) {
                case 'CallExpression':
                    if (!node.callee ||
                        !node.arguments ||
                        node.arguments.length < 1 ||
                        node.callee.name !== 'require') {
                        return;
                    }
                    return asString(node.arguments[0]);
                case 'ImportDeclaration':
                    return asString(node.source);
            }
        } catch(e) {
            console.warn('Could not resolve dependency in file: %s', filePath, node);
            return null;
        }
    }).filter((moduleName) => !!moduleName)
        .map((moduleName) => {
            if (BuiltIn.indexOf(moduleName) > -1) {
                return {
                    type: 'builtin',
                    name: moduleName,
                    path: moduleName,
                    missing: false
                };
            }
            let path,
                type,
                missing;

            if (moduleName.indexOf('.') === 0) {
                type = 'local';
                try {
                    path = require.resolve(moduleName, {
                        paths: [
                            Path.dirname(filePath)
                        ]
                    });
                } catch (e) {
                    path = Path.resolve(Path.dirname(filePath), moduleName);
                }
            } else {
                type = 'package';
                try {
                    path = require.resolve(moduleName, {
                        paths: [
                            Path.dirname(filePath)
                        ]
                    });
                } catch (e) {
                    path = moduleName;
                }
            }

            missing = !FS.existsSync(path);

            return {
                type,
                path,
                missing,
                name: moduleName
            };
        });
};
