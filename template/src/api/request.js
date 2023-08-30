import axios from 'axios';
import * as config from './config';

/**
 * @param {typeof import('./config')} config
 */
export function createRequestInstance(config) {
  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout,
    responseType: 'json',
    withCredentials: true,
    paramsSerializer: {
      serialize: params => Object.keys(params)
        .filter(key => ![
          '',
          null,
          undefined,
        ].includes(params[key]))
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&'),
    },
  });

  instance.interceptors.request.use((reqConfig) => {
    Object.assign(reqConfig.headers, config.injectHeaders());
    return reqConfig;
  });

  instance.interceptors.response.use((res) => {
    res.config.setResponse(res);

    // 不处理二进制数据
    if (res.data instanceof Blob) {
      return res.data;
    }

    const data = config.responseTransfer(res.data);
    if (data.code === config.codeOK) {
      return data.data;
    }

    const err = new Error(data.msg);
    err.code = data.code;
    throw err;
  });

  const get = (url, params, headers, opts = {}) => instance.get(url, { params, headers, ...opts });
  const post = (url, data, headers, opts = {}) => instance.post(url, data, { headers, ...opts });

  return {
    get,
    post,
    instance,
  };
}

export default createRequestInstance(config);
