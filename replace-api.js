const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const adminFiles = walk(path.join(__dirname, 'apps/admin/src'));
const clientFiles = walk(path.join(__dirname, 'apps/client/src'));
const allFiles = [...adminFiles, ...clientFiles];

let replaceCount = 0;
allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Replace single-quoted fetches: 'http://localhost:4000/api/v1/...' -> import.meta.env.VITE_API_URL + '/api/v1/...'
    if (content.match(/'http:\/\/localhost:4000(\/api\/v1[^']*)'/g)) {
        content = content.replace(/'http:\/\/localhost:4000(\/api\/v1[^']*)'/g, "(import.meta.env.VITE_API_URL || '') + '$1'");
        modified = true;
    }
    // Replace backtick fetches: `http://localhost:4000/api/v1/...` -> `${import.meta.env.VITE_API_URL || ''}/api/v1/...`
    if (content.match(/`http:\/\/localhost:4000(\/api\/v1[^`]*)`/g)) {
        content = content.replace(/`http:\/\/localhost:4000(\/api\/v1[^`]*)`/g, "`${import.meta.env.VITE_API_URL || ''}$1`");
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Replaced in:', file);
        replaceCount++;
    }
});
console.log(`Replaced in ${replaceCount} files.`);
