// 接口基础路径
export const baseURL = import.meta.env.VITE_API_BASEURL;
// 超时时间，为0则不限制
export const timeout = 0;

// 请求成功状态码
export const codeOK = '0';

// 转换响应数据格式
export const responseTransfer = res => ({
  msg: res?.msg,
  data: res?.data,
  code: res?.code,
});

// 注入请求头
export const injectHeaders = () => ({

});

// 全局API Hooks
export const globalHooks = [];

// 接口定义
export const apiUrls = {

};
