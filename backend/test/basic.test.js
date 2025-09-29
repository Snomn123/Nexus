const assert = require('assert');
const { test } = require('node:test');
const fs = require('fs');
const path = require('path');

// Set NODE_ENV to test to prevent any database connections
process.env.NODE_ENV = 'test';

test('Package.json exists and has correct structure', () => {
  const packageFile = path.join(__dirname, '../package.json');
  assert.ok(fs.existsSync(packageFile), 'Package.json exists');
  
  const packageData = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  assert.ok(packageData.name, 'Package has name');
  assert.ok(packageData.version, 'Package has version');
});

test('Server file exists', () => {
  const serverFile = path.join(__dirname, '../src/server.js');
  assert.ok(fs.existsSync(serverFile), 'Server.js file exists');
});

test('Essential directories exist', () => {
  const dirs = ['src', 'src/config', 'src/controllers', 'src/routes', 'src/utils'];
  
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    assert.ok(fs.existsSync(dirPath), `Directory ${dir} exists`);
  });
});

test('Basic JavaScript functionality', () => {
  // Simple test to ensure Node.js environment works
  assert.strictEqual(2 + 2, 4, 'Addition works');
  assert.strictEqual('test'.toUpperCase(), 'TEST', 'String operations work');
});

test('Environment can load modules', () => {
  // Test that we can require built-in modules
  const fs = require('fs');
  const path = require('path');
  
  assert.ok(fs, 'fs module loads');
  assert.ok(path, 'path module loads');
});