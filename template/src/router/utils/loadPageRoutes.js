import set from 'lodash/set';
import camelCase from 'lodash/camelCase';
import kebabCase from 'lodash/kebabCase';
import createPageComponent from './createPageComponent';
import merge from '@/utils/common/merge';

export default function loadPageRoutes() {
  const routes = [];

  const metaEntries = import.meta.glob('@/pages/**/index.js', { eager: true });
  const pageEntries = import.meta.glob('@/pages/**/index.vue');
  const entries = {};

  Object.entries(metaEntries).forEach(([key, value]) => {
    const [, idPath] = key.match(/^\/src\/pages\/([\w-/]+)\/index\.js$/);
    set(entries, `${idPath}.meta`, value.default);
  });

  Object.entries(pageEntries).forEach(([key, value]) => {
    const [, idPath] = key.match(/^\/src\/pages\/([\w-/]+)\/index\.vue$/);
    set(entries, `${idPath}.component`, value);
  });

  Object.entries(entries).forEach(([key, value]) => {
    const meta = { ...(value.meta || {}) };
    const { extendRoute, path: metaPath } = meta;
    delete meta.extendRoute;
    delete meta.path;

    const paths = key.split('/').map(item => kebabCase(item));
    const name = camelCase(paths.join('-')).replace(/^\w/, re => re.toUpperCase());
    const path = metaPath || `/${paths.join('/')}`.replace(/\/index$/, '');
    const opts = { name, path, meta };

    const routeConfig = {
      ...opts,
      component: createPageComponent(value.component, opts),
    };

    if (typeof extendRoute === 'function') {
      merge(routeConfig, extendRoute(routeConfig));
    }

    routes.push(routeConfig);
  });

  return routes;
}
