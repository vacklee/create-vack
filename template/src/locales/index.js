import { createI18n } from 'vue-i18n';
import { camelCase, set } from 'lodash';

const messages = {};
const entries = import.meta.globEager('./*/*.json');
Object.keys(entries).forEach((key) => {
  const [, lk, nk] = key.match(/^\.\/([\w-]+)\/([\w-]+)\.json$/);
  set(messages, `${lk}.${camelCase(nk)}`, entries[key].default);
});

const i18n = createI18n({
  legacy: false,
  messages,
  missingWarn: false,
  fallbackWarn: false,
});

export function translateLang(lang) {
  i18n.global.locale.value = lang;
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('class', lang);
  localStorage.setItem('locale', lang);
  return lang;
}

export function initLocale() {
  const lang = localStorage.getItem('locale') || import.meta.env.VITE_LOCALE_DEFAULT;
  if (lang) {
    translateLang(lang);
  }
}

export default i18n;
