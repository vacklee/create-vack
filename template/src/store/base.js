import { defineStore } from 'pinia';

export default class StoreBase {
  constructor(name, opts = {}) {
    const states = {};
    const getters = {};
    const setters = {};
    const actions = {};

    Object.keys(opts).forEach((key) => {
      const desc = Object.getOwnPropertyDescriptor(opts, key);
      if (typeof desc.value === 'function') {
        actions[key] = (...args) => desc.value.call(this, ...args);
        return;
      }

      if (desc.get) {
        getters[key] = desc.get;
        if (desc.set) {
          setters[key] = desc.set;
        }
        return;
      }

      states[key] = desc.value;
    });

    const useStore = defineStore(name, {
      state: () => states,
      getters,
      actions,
    });

    const store = () => useStore();

    Object.keys(states).forEach((key) => {
      Object.defineProperty(this, key, {
        get: () => store()[key],
        set: (val) => {
          store()[key] = val;
        },
      });
    });

    Object.keys(getters).forEach((key) => {
      Object.defineProperty(this, key, {
        get: () => store()[key],
        set: (val) => {
          if (setters[key]) {
            setters[key].call(this, val);
          }
        },
      });
    });

    Object.keys(actions).forEach((key) => {
      Object.defineProperty(this, key, {
        get: () => store()[key].bind(this),
      });
    });
  }
}
