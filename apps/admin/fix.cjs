const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'features');
const filesToUpdate = [
  'ui-elements/index.tsx',
  'patterns/index.tsx',
  'screens/index.tsx',
  'flows/index.tsx',
  'categories/index.tsx',
  'apps/index.tsx',
];

for (const relPath of filesToUpdate) {
  const filePath = path.join(baseDir, relPath);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Fix the apps and others that have `}),` or `})) as any,`
  
  content = content.replace(
    /const handleSearch = \(e: ChangeEvent<HTMLInputElement>\) => \{\s*setSearchTerm\(e\.target\.value\)\s*\}\),\s*\}\)\s*\}/,
    `const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }`
  );
  
  content = content.replace(
    /const handleSearch = \(e: ChangeEvent<HTMLInputElement>\) => \{\s*setSearchTerm\(e\.target\.value\)\s*\}\)\) as any,\s*\}\)\s*\}/,
    `const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }`
  );

  content = content.replace(
    /const handleSearch = \(e: ChangeEvent<HTMLInputElement>\) => \{\s*setSearchTerm\(e\.target\.value\)\s*setCurrentPage\(1\)\s*\}\)\) as any,\s*\}\)\s*\}/,
    `const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }`
  );
  
  // A catch all for weird closing brackets after handleSearch
  content = content.replace(
    /const handleSearch = \(e: ChangeEvent<HTMLInputElement>\) => \{\s*setSearchTerm\(e\.target\.value\)\s*(\}\)[^}]*\}\s*\})?/,
    `const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }`
  );

  fs.writeFileSync(filePath, content, 'utf8');
}
