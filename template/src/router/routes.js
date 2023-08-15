import loadPageRoutes from './utils/loadPageRoutes';

/**
 * meta属性说明
 * @property {string} path 覆盖默认路由，对自动加载的页面有效
 * @property {boolean} suspense 组件在setup中使用了await语法时，需要配置该字段为true，对自动加载的页面有效
 * @property {Function} extendRoute 扩展路由属性，对自动加载的页面有效
 */
const routes = [];

// 加载页面路由
routes.push(...loadPageRoutes());

export default routes;
