import kebabCase from 'lodash/kebabCase';

const hooks = {};
const entries = import.meta.glob('@/api/hooks/*.js', { eager: true });
Object.entries(entries).forEach(([key, value]) => {
  const [, name] = key.match(/^\/src\/api\/hooks\/([\w-]+)\.js$/);
  const id = kebabCase(name)
    .toUpperCase()
    .replace(/-/g, '_');

  if (typeof value.default === 'function') {
    hooks[id] = value.default;
  }
});

export default hooks;
