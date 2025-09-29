// Basic functionality tests for CI pipeline

// Basic arithmetic test
test('basic math works', () => {
  expect(2 + 2).toBe(4);
  expect('hello'.toUpperCase()).toBe('HELLO');
});

// Environment test
test('environment is set up correctly', () => {
  expect(process.env.NODE_ENV).toBeDefined();
});

// Array operations test
test('array operations work', () => {
  const arr = [1, 2, 3];
  expect(arr.length).toBe(3);
  expect(arr.includes(2)).toBe(true);
});

// Object operations test  
test('object operations work', () => {
  const obj = { name: 'test', count: 5 };
  expect(obj.name).toBe('test');
  expect(Object.keys(obj)).toHaveLength(2);
});