import kebabCase from 'lodash/kebabCase';

/**
 * 基于 localStorage 封装的存储类
 * ## 向外部提供三个可用函数：
 * Storage.set - 设置任意命名字段的值，支持设置过期时间
 * Storage.get - 获取指定命名字段的值
 * Storage.del - 删除指定命名字段
 * ## 读写解析器
 * 读写解析器默认使用 ./parsers/default.js，
 * 支持根据值类型编写自定义解析器
 * 解析器编写在 ./parsers/ 目录下，会被自动读取
 * 解析器命名规范，以值类型的 kebabCase 形式命名，如：ArrayBuffer 的解析器应命名为：array_buffer.js
 * 值的类型取决于 Object.prototype.toString 返回的结果，即可以针对自定义的 class 编写对应的解析器
 * * 解析器定义为一个静态类，可向外暴露两个函数：
 * get - 获取值时解析，支持异步
 * set - 设置值时解析，支持异步
 * 解析器编写示例：
 * ```js
 * export default class ArrayBufferParser {
 *   static get() {}
 *   static set() {}
 * }
 * ```
 */
export default class Storage {
  static parsers = import.meta.glob('./parsers/*.js');
  static prefix = 'cxy_';

  static async loadParserByType(type) {
    const parserPath = `./parsers/${kebabCase(type)}.js`;
    const parserLoader = this.parsers[parserPath] || this.parsers['./parsers/default.js'];
    const { default: parser } = await parserLoader();
    return parser;
  }

  static async loadParser(value) {
    const [, type] = Object.prototype.toString.call(value).match(/^\[object (\S+)\]$/);
    const parser = await this.loadParserByType(type);
    return { type, parser };
  }

  /**
   * @param {string} key 标识符
   * @param {any} val 值
   * @param {number} expires 过期时间，单位：秒
   */
  static async set(key, val, expires) {
    const { type, parser } = await this.loadParser(val);
    const value = await Promise.resolve(typeof parser.set === 'function' ? parser.set(val) : val);
    const expiresTime = expires > 0 ? (Date.now() + expires * 1000) : null;
    localStorage.setItem(`${this.prefix}${key}`, JSON.stringify({ type, value, expiresTime }));
  }

  /**
   * @param {string} key 标识符
   * @param {any} defaultValue 默认值
   */
  static async get(key, defaultValue) {
    const info = (() => {
      try {
        const data = JSON.parse(localStorage.getItem(`${this.prefix}${key}`));
        if (!data || Object.keys(data).join('_') !== 'type_value_expiresTime') {
          return null;
        }

        if (typeof data.type !== 'string') {
          return null;
        }

        return data;
      } catch (e) {
        return null;
      }
    })();

    if (!info) {
      return defaultValue;
    }

    if (info.expiresTime && info.expiresTime <= Date.now()) {
      return defaultValue;
    }

    const parser = await this.loadParserByType(info.type);
    const value = await Promise.resolve(typeof parser.get === 'function' ? parser.get(info.value) : info.value);

    return value;
  }

  static del(key) {
    localStorage.removeItem(`${this.prefix}${key}`);
  }
}
