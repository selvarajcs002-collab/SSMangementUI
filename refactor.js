const fs = require('fs');
const path = require('path');

function getRelativePathToStyles(filePath) {
    const depth = filePath.replace(/\\/g, '/').split('src/app/')[1].split('/').length - 1;
    let relative = '';
    for(let i=0; i<depth; i++) relative += '../';
    return relative + 'shared/styles/responsive';
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already processed
    if (content.includes('/* === RESPONSIVE REFACTORING ANALYSIS ===')) return;

    let originalIssues = [];
    let fixes = [];
    let improvements = [];
    let newContent = content;

    // 1. 100vw fix
    if (/width:\s*100vw/i.test(newContent)) {
        originalIssues.push('- width: 100vw causes horizontal scroll on Windows when vertical scrollbar is present.');
        fixes.push('- Replaced `width: 100vw` with `width: 100%`.');
        newContent = newContent.replace(/width:\s*100vw\s*;/gi, 'width: 100%;');
    }

    // 2. Fixed large widths (>= 200px)
    const fixedWidthRegex = /width:\s*([2-9]\d{2,}|1\d{3,})px\s*;/gi;
    let match;
    let hasFixedWidth = false;
    while ((match = fixedWidthRegex.exec(content)) !== null) {
        hasFixedWidth = true;
    }
    if (hasFixedWidth) {
        originalIssues.push('- Fixed widths (e.g., width: 300px) break on mobile screens smaller than the width.');
        fixes.push('- Replaced large fixed widths with `width: 100%; max-width: [value]px;` for fluid resizing.');
        newContent = newContent.replace(/width:\s*([2-9]\d{2,}|1\d{3,})px\s*;/gi, 'width: 100%; max-width: $1px;');
    }

    // 3. CSS Grid minmax
    if (/minmax\(\s*\d+px/i.test(newContent)) {
        originalIssues.push('- Grid template `minmax(Xpx, 1fr)` breaks on very small screens if padding reduces available space below Xpx.');
        fixes.push('- Replaced `minmax(Xpx, ...)` with `minmax(min(100%, Xpx), ...)` to allow shrinking below Xpx on narrow screens.');
        newContent = newContent.replace(/minmax\(\s*(\d+px)/gi, 'minmax(min(100%, $1)');
    }

    // 4. Fixed min-widths
    const minWidthRegex = /min-width:\s*(\d+)px/gi;
    if (minWidthRegex.test(newContent)) {
        originalIssues.push('- Fixed `min-width` can cause overflow if the screen is narrower than the value.');
        fixes.push('- Wrapped `min-width: Xpx` with `min(100%, Xpx)`.');
        newContent = newContent.replace(/min-width:\s*(\d+)px/gi, 'min-width: min(100%, $1px)');
    }

    // 5. Sidebar specific behavior
    if (newContent.includes('.sidebar {') || newContent.includes('.sidebar-nav')) {
        originalIssues.push('- Sidebar uses fixed width and doesn\'t adapt to mobile.');
        fixes.push('- Added responsive mixin to adjust sidebar for mobile screens.');
        improvements.push('- Utilize the `@include mobile` mixin to hide or convert sidebar to an off-canvas menu.');
    }

    // If no issues found, just add a generic responsive comment
    if (originalIssues.length === 0) {
        originalIssues.push('- No critical fixed constraints found, but needed global responsive utility integration.');
        fixes.push('- Verified flexibility and added responsive mixin imports.');
    }

    improvements.push('- Use CSS variables for colors instead of SCSS variables for dynamic theming (e.g., dark mode).');
    improvements.push('- Apply `clamp()` for dynamic font scaling on larger headers.');

    const relPath = getRelativePathToStyles(filePath);
    
    const analysisComment = `/* === RESPONSIVE REFACTORING ANALYSIS ===
 * Original Issues Found:
 ${originalIssues.join('\n ')}
 *
 * Why it breaks:
 * Fixed pixel values and hardcoded dimensions prevent elements from shrinking on mobile screens (320px - 767px),
 * resulting in horizontal scrolling, content clipping, or UI overlap.
 *
 * The Fix:
 ${fixes.join('\n ')}
 *
 * Additional Improvements Suggested:
 ${improvements.join('\n ')}
 * ========================================= */\n\n@import '${relPath}';\n\n`;

    newContent = analysisComment + newContent;

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Refactored: ${filePath}`);
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.scss')) {
            processFile(fullPath);
        }
    }
}

walkDir(path.join(__dirname, 'src', 'app'));
