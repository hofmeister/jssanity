const _ = require('lodash');

// fix for node.js <= 3, it throws TypeError when value type invalid in weak set
function hasVisited(ast, visited) {
    try {
        return visited.has(ast);
    } catch (e) {
        return false;
    }
}

function recursive(ast, visited) {
    if (!ast || hasVisited(ast, visited)) {
        return [];
    }
    if (Array.isArray(ast)) {
        return _(ast)
            .map((node) => recursive(node, visited))
            .flatten()
            .value();
    }
    if (ast.type) {
        visited.add(ast);
        return _(ast)
            .keys()
            .filter((key) => key !== 'tokens' && key !== 'comments')
            .map((key) => recursive(ast[key], visited))
            .flatten()
            .concat(ast)
            .value();
    }

    return [];
}

module.exports = function getNodes(ast) {
    const visited = new WeakSet();
    return recursive(ast, visited);
};