#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import prompts from 'prompts'
import minimist from 'minimist'
import * as kolorist from 'kolorist'
import { fileURLToPath } from 'node:url'
import { globSync } from 'glob'
import ejs from 'ejs'

const argv = minimist(process.argv.slice(2), { string: ['_'] })
const cwd = process.cwd()
const templateDir = path.resolve(fileURLToPath(import.meta.url), '..', 'template')
const renameFiles = {
  _gitignore: '.gitignore'
}

const PRESETS = [
  {
    name: 'git',
    type: 'confirm',
    message: '是否初始化git',
    default: true
  },
  {
    name: 'mock',
    type: 'confirm',
    message: '是否需要接口Mock',
    default: true
  },
  {
    name: 'i18n',
    type: 'confirm',
    message: '是否需要多语言',
    default: true
  },
  {
    name: 'eslint',
    type: 'select',
    message: '是否需要eslint',
    choices: [
      {
        name: false,
        display: '不需要'
      },
      {
        name: 'eslint-airbnb',
        display: 'ESLint + Airbnb config'
      },
      {
        name: 'eslint-standard',
        display: 'ESLint + Standard config'
      },
      {
        name: 'eslint-prettier',
        display: 'ESLint + Prettier'
      }
    ]
  },
  {
    name: 'lint-on-commit',
    type: 'confirm',
    message: '提交代码时检查代码格式',
    depends: ['git', 'eslint'],
    default: true
  },
  {
    name: 'commit-lint',
    type: 'confirm',
    message: '是否规范commit提交信息',
    depends: ['git'],
    default: true
  },
  // {
  //   name: 'example',
  //   type: 'select',
  //   message: '是否需要示例代码',
  //   choices: [
  //     {
  //       name: false,
  //       display: '不需要'
  //     },
  //     {
  //       name: 'example-hello',
  //       display: 'Hello Vack'
  //     }
  //   ]
  // }
]

const getPresetIds = (p) => (p.choices && p.choices.map(v => v.name).filter(Boolean)) || [p.name]
const PRESET_ITEMS = PRESETS.map(getPresetIds).reduce((a, b) => a.concat(b), [])

const defaultTargetDir = 'vack-project'

init().catch((e) => {
  console.error(e)
})

async function init() {
  const argTargetDir = formatTargetDir(argv._[0])
  const argPresets = (argv.preset || argv.p)?.split(',')?.filter(p => PRESET_ITEMS.includes(p)) || []

  let targetDir = argTargetDir || defaultTargetDir
  let targetPresets = new Set(argPresets)
  const getProjectName = () => targetDir === '.' ? path.basename(path.resolve()) : targetDir
  const checkDepand = (d) => getPresetIds(PRESETS.find(item => item.name === d)).some(p => targetPresets.has(p))

  let result
  try {
    result = await prompts([
      {
        type: argTargetDir ? null : 'text',
        name: 'projectName',
        message: kolorist.reset('项目名称：'),
        initial: defaultTargetDir,
        onState: (state) => {
          targetDir = formatTargetDir(state.value) || defaultTargetDir
        },
      },
      {
        type: () => !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'confirm',
        name: 'overwrite',
        message: () => `${targetDir === '.' ? '当前目录' : `${targetDir}目录`}存在文件。是否清空以继续？`
      },
      {
        type: (_, { overwrite }) => {
          if (overwrite === false) {
            throw new Error(kolorist.red('✖') + ' 已取消操作')
          }
          return null
        },
        name: 'overwriteChecker'
      },
      {
        type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
        name: 'packageName',
        message: kolorist.reset('包名(package.json name)：'),
        initial: () => toValidPackageName(getProjectName()),
        validate: (dir) => isValidPackageName(dir) || '格式错误',
      },
      ...PRESETS.map((preset) => [
        {
          type: () =>  {
            if (preset.depends && !preset.depends.every(checkDepand)) {
              getPresetIds(preset).forEach(p => targetPresets.delete(p))
              return null
            }
            if (getPresetIds(preset).some(p => targetPresets.has(p))) {
              return null
            }

            if (
              preset.name === 'git' &&
              fs.existsSync(`${targetDir}/.git`) &&
              fs.statSync(`${targetDir}/.git`).isDirectory()
            ) {
              targetPresets.add(preset.name)
              return null
            }

            return preset.type
          },
          name: preset.name,
          initial: preset.default,
          message: kolorist.reset(`${preset.message}：`),
          choices: preset.choices?.map((choice) => ({
            title: choice.display || choice.name,
            value: choice.name
          }))
        },
        {
          type: (_, { [preset.name]: value }) => {
            if (value === true) {
              targetPresets.add(preset.name)
            } else if (value === false) {
              getPresetIds(preset).forEach(p => targetPresets.delete(p))
            } else if (value) {
              targetPresets.add(value)
            }
            return null
          }
        }
      ]).flat(),
      {
        onCancel: () => {
          throw new Error(kolorist.red('✖') + ' 已取消操作')
        }
      }
    ])
  } catch (cancelled) {
    console.log(cancelled.message)
    return
  }

  const env = {
    projectName: targetDir,
    packageName: result.packageName || toValidPackageName(getProjectName()),
    presets: {},
    enable: (key) => Object.keys(env.presets)
      .some((k) => (key instanceof RegExp ? key.test(k) : k === key))
  }

  targetPresets.forEach((p) => {
    env.presets[p] = true
  })

  const root = path.join(cwd, targetDir)
  const { overwrite } = result
  
  if (overwrite) {
    emptyDir(root)
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true })
  }

  const ignore = []
  const ignoreFile = path.join(templateDir, '.vackignore.ejs')
  if (fs.existsSync(ignoreFile)) {
    ignore.push(...ejs.render(fs.readFileSync(ignoreFile, 'utf-8'), env).split('\n').filter(Boolean))
  }

  const matchFiles = globSync('**', {
    dot: true,
    cwd: templateDir,
    maxDepth: Number.MAX_VALUE,
    ignore: ['.vackignore.ejs', ...ignore],
  })

  const generate = (entry) => {
    const entryPath = path.join(templateDir, entry)
    const targetPath = path.join(root, renameFiles[entry] || entry)
    const entryStat = fs.statSync(entryPath)

    if (entryStat.isDirectory()) {
      return
    }

    if (!fs.existsSync(path.dirname(targetPath))) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    }

    if (/\.vackkeep$/.test(entryPath)) {
      return
    }

    if (!/\.ejs$/.test(entryPath)) {
      fs.copyFileSync(entryPath, targetPath)
      return
    }

    const content = fs.readFileSync(entryPath, { encoding: 'utf-8' })
    const ejsContent = ejs.render(content, env)
    fs.writeFileSync(targetPath.replace(/\.ejs$/, ''), ejsContent);
  };

  matchFiles.forEach(entry => generate(entry))
}

function formatTargetDir(targetDir) {
  return targetDir?.trim().replace(/\/+$/g, '')
}

function isEmpty(path) {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

function isValidPackageName(projectName) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName,
  )
}

function toValidPackageName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-')
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue
    }
    fs.rmSync(path.resolve(dir, file), {
      force: true,
      recursive: true
    })
  }
}
