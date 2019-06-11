const DOT_RE = /\/\.\//g // /./ -> /
const DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//  // /../ -> /
const MULTI_SLASH_RE = /([^:/])\/+\//g // a/../ => /

export const readOnly = (obj, key, value) => {
  Object.defineProperty(obj, key, {
    value: value,
    writable: false,
  })
}

export const readOnlyMap = obj => {
  const newObj = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      readOnly(newObj, key, obj[key])
    }
  }
  return newObj
}

export const getLegalName = name => {
  if (!window[name]) return name
  return getLegalName(name + '1')
}

// export const realpath = path => {
//   // /a/b/./c/./d ==> /a/b/c/d
//   path = path.replace(DOT_RE, "/")

//   /*
//     a//b/c ==> a/b/c
//     a///b/////c ==> a/b/c
//   */
//   path = path.replace(MULTI_SLASH_RE, "$1/")

//   // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
//   while (path.match(DOUBLE_DOT_RE)) {
//     path = path.replace(DOUBLE_DOT_RE, "/")
//   }

//   return path
// }