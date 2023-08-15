export const codeOK = '0';
export const codeFail = '-1';

export const responseTransfer = ({ code, data, msg }) => ({
  msg,
  code,
  data,
});
