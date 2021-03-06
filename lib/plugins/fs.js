/* global process */

/**
 * Module dependencies
 */

var dirname = require('path').dirname
var mkdirp = require('mkdirp')
var fs = require('fs')

/**
 * Serializers and deserializers
 */

var serializers = {}
var deserializers = {}

/**
 * Read file
 */

function read (path, format, options) {
  var data = fs.readFileSync(path, 'utf8')
  if (format) {
    return deserialize(data, format, options)
  } else {
    return data
  }
}

/**
 * Write file
 */

function write (path, data, format, options) {
  if (format) {
    data = serialize(data, format, options)
  }
  mkdirp.sync(dirname(path))
  fs.writeFileSync(path, data, 'utf8')
}

/**
 * Delete file
 */

function del (path) {
  try {
    if (exists(path, 'directory')) {
      fs.rmdirSync(path)
    } else {
      fs.unlinkSync(path)
    }
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }
  }
}

/**
 * Check if path exists
 */

function exists (path, pathType) {
  try {
    var stats

    if (pathType === 'symlink') {
      stats = fs.lstatSync(path)
    } else {
      stats = fs.statSync(path)
    }

    if (!pathType) {
      return true
    } else if (pathType === 'file') {
      return stats.isFile()
    } else if (pathType === 'directory') {
      return stats.isDirectory()
    } else if (pathType === 'symlink') {
      return stats.isSymbolicLink()
    } else {
      throw new Error('Unknown path type ' + pathType)
    }
  } catch (e) {
    if (e.code === 'ENOENT') {
      return false
    } else {
      throw e
    }
  }
}

/**
 * Serialize object for saving to filesystem
 */

function serialize (obj, format, options) {
  var serializer = getSerializer(format)
  if (!serializer) {
    throw new Error('No serializer registered for format ' + format)
  }
  return serializer(obj, options)
}

/**
 * Get serializer
 */

function getSerializer (format) {
  return serializers[format.toLowerCase()]
}

/**
 * Register serializer
 */

function registerSerializer (format, func) {
  serializers[format.toLowerCase()] = func
}

/**
 * Deserialize object after reading from filesystem
 */

function deserialize (data, format, options) {
  var deserializer = getDeserializer(format)
  if (!deserializer) {
    throw new Error('No deserializer registered for format ' + format)
  }
  return deserializer(data, options)
}

/**
 * Get deserializer
 */

function getDeserializer (format) {
  return deserializers[format.toLowerCase()]
}

/**
 * Register deserializer
 */

function registerDeserializer (format, func) {
  deserializers[format.toLowerCase()] = func
}

/**
 * Register fs functions
 */

function registerFS (cli, options, done) {
  cli.fs = {
    read: read,
    write: write,
    del: del,
    exists: exists,

    serialize: serialize,
    getSerializer: getSerializer,
    registerSerializer: registerSerializer,

    deserialize: deserialize,
    getDeserializer: getDeserializer,
    registerDeserializer: registerDeserializer
  }

  done()
}

/**
 * Exports
 */

module.exports = registerFS
