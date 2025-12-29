#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VERSION_FILE = path.join(ROOT, 'version.json');
const PACKAGES = [
  path.join(ROOT, 'package.json'),
  path.join(ROOT, 'frontend', 'package.json'),
  path.join(ROOT, 'backend', 'package.json'),
];

function readVersion() {
  const data = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
  return data.version;
}

function writeVersion(version) {
  fs.writeFileSync(VERSION_FILE, JSON.stringify({ version }, null, 2) + '\n');
}

function bumpVersion(current, type) {
  const [major, minor, patch] = current.split('.').map(Number);
  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    default: throw new Error(`Invalid bump type: ${type}`);
  }
}

function syncPackages(version) {
  PACKAGES.forEach(pkgPath => {
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkg.version = version;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`  ✓ ${path.relative(ROOT, pkgPath)}`);
    }
  });
}

function main() {
  const [,, command, arg] = process.argv;
  
  switch (command) {
    case 'bump': {
      const type = arg || 'patch';
      const current = readVersion();
      const next = bumpVersion(current, type);
      writeVersion(next);
      console.log(`\n版本更新: ${current} → ${next}\n`);
      console.log('同步 package.json:');
      syncPackages(next);
      console.log(`\n完成! 新版本: ${next}\n`);
      break;
    }
    case 'sync': {
      const version = readVersion();
      console.log(`\n同步版本 ${version} 到所有 package.json:\n`);
      syncPackages(version);
      console.log('\n完成!\n');
      break;
    }
    case 'get': {
      console.log(readVersion());
      break;
    }
    default: {
      console.log(`
用法: node scripts/version.js <command> [type]

命令:
  bump [type]  升级版本 (type: patch|minor|major, 默认 patch)
  sync         同步版本到所有 package.json
  get          获取当前版本号

示例:
  node scripts/version.js bump patch   # 1.0.0 → 1.0.1
  node scripts/version.js bump minor   # 1.0.0 → 1.1.0
  node scripts/version.js bump major   # 1.0.0 → 2.0.0
  node scripts/version.js sync         # 同步到所有 package.json
`);
    }
  }
}

main();
