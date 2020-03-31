const Path = require('path');
const readDependencies = require('./src/readDependencies');
const glob = require('glob');
const _ = require('lodash');

async function readAll(files) {
    const missing = {};

    while (files.length > 0) {
        const file = files.shift();
        //console.log('# Reading file: ', file);
        const results = await readDependencies(file);
        results.forEach((result) => {
            if (result.missing) {
                if (!missing[result.path]) {
                    missing[result.path] = result;
                    missing[result.path].sources = [];
                }
                missing[result.path].sources.push(file);
            }
        });
    }

    return _.values(missing);
}

const files = glob.sync('./**/*.js')
    .filter((file) => file.indexOf('/node_modules/') === -1)
    .map(file => Path.resolve(process.cwd(), file));

if (files.length < 1) {
    console.log('No JS files found in current folder or subfolders');
} else {
    console.log('Scanning %s files', files.length);

    readAll(files).then(function(missing) {
        if (missing.length < 1) {
            console.log('No missing dependencies found', files.length);
            return;
        }

        console.log('\n\n\n---- RESULTS: %s missing\n', missing.length);;

        missing.forEach((dep) => {
            console.log('- missing %s: "%s" ', dep.type, dep.path);
            console.log('-- sources:\n    %s\n\n', dep.sources.join('\n    '));
        });
    })

}


