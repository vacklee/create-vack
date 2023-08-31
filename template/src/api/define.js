import merge from '@/utils/common/merge';
import mapValues from 'lodash/mapValues';
import hooks from './hooks';
import request from './request';
import { globalHooks } from './config';

function parseUrl(apiUrl) {
  const hooksArgs = [...globalHooks.map(hookName => ({ hookName }))];
  const url = apiUrl.replace(/<(.*?)>/g, (re, $1) => {
    const [hookName, ...hookParamsStrArr] = $1.split(':');
    const hookParamStr = hookParamsStrArr.join(':');
    const hookParams = Object.fromEntries(hookParamStr.split(/,\s*/)
      .filter(item => item)
      .map((paramValueStr) => {
        const [paramKey, ...paramValueArr] = paramValueStr.split(/\s*=\s*/);
        return [paramKey, paramValueArr.join('=')];
      }));

    hooksArgs.push({
      hookName,
      hookParams,
    });

    return '';
  });

  return {
    url,
    hooksArgs,
  };
}

export default function defineApi(apiUrl) {
  if (typeof apiUrl === 'object') {
    return mapValues(apiUrl, value => defineApi(value));
  }

  const { url, hooksArgs } = parseUrl(apiUrl);
  const config = {
    method: 'GET',
    beforeHooks: [],
    afterHooks: [],
    errorHooks: [],
  };

  hooksArgs.forEach((item) => {
    const hookItem = hooks[item.hookName];
    merge(config, hookItem(item.hookParams, config), {
      concatArray: true,
    });
  });

  async function apiHandle(data, headers, opts) {
    const requestConfig = {
      url,
      data,
      headers,
      response: null,
      opts: Object.assign({
        setResponse: (res) => {
          requestConfig.response = res;
        },
      }, opts),
      apiHandle,
    };

    let next = Promise.resolve(requestConfig);

    config.beforeHooks.forEach((item) => {
      next = next.then(reqConfig => merge(reqConfig, item(reqConfig)));
    });

    next = next.then(reqConfig => request[config.method.toLowerCase()](
      reqConfig.url,
      reqConfig.data,
      reqConfig.headers,
      reqConfig.opts,
    ));

    config.afterHooks.forEach((item) => {
      next = next.then(res => item(res, requestConfig));
    });

    config.errorHooks.forEach((item) => {
      next = next.catch(err => item(err, requestConfig));
    });

    return next;
  }

  apiHandle.$url = url;
  apiHandle.$config = config;
  apiHandle.$hookArgs = hooksArgs;

  return apiHandle;
}
