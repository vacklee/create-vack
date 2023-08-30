import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import bodyParser from 'body-parser';
import { parse as urlParse } from 'node:url';
import { debounce } from 'lodash';
import * as kolorist from 'kolorist';
import * as mockConfig from './config';

const MOCK_DIR = path.resolve('mock');
const MOCK_MAP = {};
const METHOD_COLOR = {
  GET: kolorist.green,
  POST: kolorist.yellow,
};

const getMockFilePaths = (dir, paths = []) => {
  const stat = fs.statSync(dir);
  if (stat.isDirectory()) {
    fs.readdirSync(dir).forEach((filePath) => {
      getMockFilePaths(path.join(dir, filePath), paths);
    });
    return paths;
  }

  if (/\.mock\.js$/.test(dir)) {
    paths.push(dir);
  }

  return paths;
};

const loadMockFiles = debounce((event) => {
  // 清除缓存
  Object.keys(require.cache || {}).forEach((key) => {
    if (key.includes(MOCK_DIR)) {
      delete require.cache[require.resolve(key)];
    }
  });

  const entries = getMockFilePaths(MOCK_DIR, []);

  entries.forEach((filePath) => {
    const module = require(filePath);
    Object.entries(module).forEach(([apiUrl, mockItem]) => {
      MOCK_MAP[apiUrl] = mockItem;
    });
  });

  console.log(kolorist.blue(kolorist.bold('[MOCK]')), kolorist.reset(event === 'change' ? '服务重启' : '服务启动'));
  console.log(kolorist.blue(kolorist.bold('[MOCK]')), kolorist.reset('接口列表:'));
  Object.keys(MOCK_MAP).forEach((url) => {
    const { method } = MOCK_MAP[url];
    console.log(`    ${kolorist.bold(METHOD_COLOR[method](method))} ${url}`);
  });

  return entries;
});

chokidar.watch('mock/**/*.mock.js')
  .on('all', (event, path) => {
    if (['add', 'change'].includes(event)) {
      if (event === 'change') {
        console.log(kolorist.blue(kolorist.bold('[MOCK]')), kolorist.reset('文件变更'), kolorist.gray(path));
      }

      loadMockFiles(event, path);
    }
  });

export default function mockServerPlugin() {
  return {
    name: 'vite-plugin-mock-server',
    enforce: 'pre',
    apply: 'serve',
    async configureServer({ middlewares }) {
      middlewares.use(bodyParser.urlencoded({ extended: false }));
      middlewares.use(bodyParser.json());
      middlewares.use(async (req, res, next) => {
        const { query, pathname: url } = urlParse(req.url, true);
        const method = req.method.toUpperCase();
        const mockItem = MOCK_MAP[url];

        if (mockItem && mockItem.method === method) {
          const context = {
            url,
            query,
            body: req.body,
            headers: req.headers,
          };

          let code = mockConfig.codeOK;
          let msg = '请求成功';
          let data = null;

          try {
            data = await mockItem.content(context, res);
            if (data === 'stop') {
              return;
            }

            if (data instanceof Error) {
              throw data;
            }
          } catch (err) {
            code = err.code || mockConfig.codeFail;
            msg = err.message;
            data = null;
          }

          res.setHeader('content-type', 'application/json;charset=utf-8');
          res.end(JSON.stringify(mockConfig.responseTransfer({ code, data, msg })));
          return;
        }
        await next();
      });
    },
  };
}
