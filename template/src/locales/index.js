import { createI18n } from 'vue-i18n';
import { camelCase, set } from 'lodash';
import Storage from '@/utils/storage';

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

export async function translateLang(lang) {
  i18n.global.locale.value = lang;
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('class', lang);
  await Storage.set('locale', lang);
  return lang;
}

export async function initLocale() {
  const lang = await Storage.get('locale', import.meta.env.VITE_LOCALE_DEFAULT);
  if (lang) {
    await translateLang(lang);
  }
}

export default i18n;
