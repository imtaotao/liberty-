'use strict';

var config = {
  init: false,
  defaultType: 'js',
};

const cacheModules = Object.create(null);
function cacheModule (url, Module) {
  Object.defineProperty(cacheModules, url, {
    get () { return Module }
  });
}
function getModule (url) {
  return cacheModules[url]
}

const warn = (msg, isWarn) => {
  throw Error(msg)
};
const convertToReadOnly = obj => {
  const newObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      Object.defineProperty(newObj, key, {
        get () { return obj[key] }
      });
    }
  }
  return newObj
};
const getExname = path => {
  const index = path.lastIndexOf('.');
  return path.substr(index + 1)
};

function check (filepath, url) {
  if (filepath === url) {
    warn('can\'t import self.');
    return false
  }
  return true
}
function getRegisterParams (filepath) {
  const Module = { exports: {} };
  const require = url => {
    if (check(filepath, url)) {
      return importModule(url, false)
    }
  };
  const requireAsync = url => {
    if (check(filepath, url)) {
      return importModule(url, true)
    }
  };
  return { Module, require, requireAsync }
}
function run (code, url) {
  code = "'use strict';\n" + code;
  const { Module, require, requireAsync } = getRegisterParams(url);
  const fn = new Function('require', 'requireAsync', 'module', 'exports', '__filename', code);
  fn(require, requireAsync, Module, Module.exports, url);
  return Module
}

function request (url, async) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, async);
  xhr.send();
  if (async) {
    return new Promise((resolve, reject) => {
      xhr.onload = resolve;
      xhr.onerror = reject;
    })
  }
  return xhr
}
function dealWithResponse (url, xhr) {
  if (xhr.readyState === 4) {
    if (xhr.status === 200) {
      if (typeof xhr.response === 'string') {
        return run(xhr.response, url)
      }
    } else if (xhr.status === 404) {
      throw Error(`${url} is not found.`)
    }
  }
}
async function asyncRequest (url) {
  const { target: xhr } = await request(url, true);
  return dealWithResponse(url, xhr)
}
function syncRequest (url) {
  const xhr = request(url, false);
  return dealWithResponse(url, xhr)
}

function init (url, config = {}) {
  if (this.config.init) {
    warn('can\'t repeat init');
  }
  if (typeof url !== 'string') {
    warn('error');
  }
  config.init = true;
  config.baseURL = url;
  this.config = convertToReadOnly({...this.config, ...config});
  importModule(url, true);
}
function importModule (url, async) {
  if (typeof url !== 'string') {
    warn('url must be a string');
  }
  let exname = getExname(url);
  if (!exname) {
    exname = this.config.defaultType;
    url += ('.' + this.config.defaultType);
  }
  const Module = getModule(url);
  if (Module) {
    return async
      ? Promise.resolve(Module.exports)
      : Module.exports
  }
  if (async) {
    return asyncRequest(url).then(Module => {
      cacheModule(url, Module);
      return Module.exports
    })
  } else {
    const Module = syncRequest(url);
    cacheModule(url, Module);
    return Module.exports
  }
}

const rustleModule = {
  init,
  config: convertToReadOnly(config),
};

module.exports = rustleModule;
