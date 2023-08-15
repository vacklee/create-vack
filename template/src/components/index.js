import kebabCase from 'lodash/kebabCase';
import { defineAsyncComponent } from 'vue';

const entries = import.meta.glob('./*/index.vue');
const components = {};

Object.entries(entries).forEach(([key, value]) => {
  const [, id] = key.match(/^\.\/([\w-]+)\/index\.vue$/);
  const name = `app-${kebabCase(id)}`;
  components[name] = defineAsyncComponent(value);
});

export default {
  install(app) {
    Object.entries(components).forEach(([key, value]) => {
      app.component(key, value);
    });
  },
};
