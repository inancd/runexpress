const fs = require('fs');
const path = require('path');

// Function to recursively build the folder structure
function buildTree(dir, depth = 0) {
    const indent = '  '.repeat(depth);
    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);

        // Skip node_modules and images folders
        if (item === 'node_modules' || item === 'images' || item === '.git') {
            return;
        }

        if (stats.isDirectory()) {
            console.log(`${indent}📁 ${item}/`);
            buildTree(fullPath, depth + 1); // Recurse into the directory
        } else {
            console.log(`${indent}📄 ${item}`);
        }
    });
}

// Run the function starting from the current working directory
const rootDir = path.resolve('.');
console.log(`📁 Root folder: ${rootDir}`);
buildTree(rootDir);
