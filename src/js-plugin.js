import cacheModule from './cache'
import { importModule } from './api'
import { warn, readOnly } from './utils'

function run (fn, require, requireAsync, _module, _exports, filename) {
  try {
    return fn(require, requireAsync, _module, _exports, filename)
  } catch (error) {
    throw new Error(error)
  }
}

function getRegisterParams (config) {
  const Module = { exports: {} }
  readOnly(Module, '__rustleModule', true)

  const require = path => importModule(path, config, false)
  const requireAsync = path => importModule(path, config, true)

  return { Module, require, requireAsync }
}

function runInThisContext (code, path, config) {
  code = "'use strict';\n" + code

  const { Module, require, requireAsync } = getRegisterParams(config)
  const fn = new Function('require', 'requireAsync', 'module', 'exports', '__filename', code)

  // cache js module，because allow circulation import. like cjs
  cacheModule.cache(path, Module)

  // run code
  run(fn, require, requireAsync, Module, Module.exports, path)

  return Module
}

export default function jsPlugin ({resource, path, config, responseURL}) {
  return runInThisContext(resource, path, config)
}