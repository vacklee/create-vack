# create-vack

vue3前端进阶架构脚手架

## 创建项目

使用 NPM：
```shell
$ npm create vack@latest
```

使用 Yarn：
```shell
$ yarn create vack
```

使用 PNPM：
```shell
$ pnpm create vack
```

跟随指引即可完成项目创建。

也可以在指令后面添加选项，以指定项目名称和预设：
```shell
# npm 6.x
$ npm create vack@latest my-app --preset git,mock,i18n

# npm 7+
$ npm create vack@latest my-app -- --preset git,mock,i18n

# yarn
$ yarn create vack my-app --preset git,mock,i18n

# pnpm
$ pnpm create vack my-app --preset git,mock,i18n
```

目前支持的预设：
+ `git` 初始化 git 仓库
+ `mock` 附加接口Mock能力
+ `i18n` 附件多语言能力
+ `eslint-airbnb` / `eslint-standard` / `eslint-prettier` 附加 eslint 配置
+ `lint-on-commit` 提交代码时检查代码格式
+ `commit-lint` 规范commit提交信息
