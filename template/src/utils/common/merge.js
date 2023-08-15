import mergeWith from 'lodash/mergeWith';

/**
 *
 * @param {Object} obj 目标对象
 * @param {Object} source 来源对象
 * @param {Object} opts 配置选项
 * @param {boolean} opts.concatArray 数组采用合并方案
 * @returns
 */
export default function merge(obj, source, opts) {
  const concatArray = opts?.concatArray || false;

  return mergeWith(obj, source, (objValue, srcValue) => {
    if (Array.isArray(objValue)) {
      if (concatArray && Array.isArray(srcValue)) {
        return objValue.concat(srcValue);
      }
      return srcValue;
    }
  });
}
