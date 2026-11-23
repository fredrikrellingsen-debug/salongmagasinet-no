const fs = require("node:fs");

const patchError = (err, path) => {
  if (err && (err.code === "EISDIR" || (err.message && err.message.includes("illegal operation on a directory")))) {
    const fakeErr = new Error(`EINVAL: invalid argument, readlink '${path}'`);
    fakeErr.code = "EINVAL";
    fakeErr.errno = -4071;
    fakeErr.syscall = "readlink";
    return fakeErr;
  }
  return err;
};

const origReadlink = fs.readlink;
fs.readlink = function (path, ...args) {
  const cb = args[args.length - 1];
  if (typeof cb === "function") {
    const newArgs = [...args.slice(0, -1), (err, linkString) => {
      return cb(patchError(err, path), linkString);
    }];
    return origReadlink.call(fs, path, ...newArgs);
  }
  return origReadlink.call(fs, path, ...args);
};

const origReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function (path, options) {
  try {
    return origReadlinkSync.call(fs, path, options);
  } catch (err) {
    throw patchError(err, path);
  }
};

if (fs.promises && fs.promises.readlink) {
  const origPromisesReadlink = fs.promises.readlink;
  fs.promises.readlink = async function (path, options) {
    try {
      return await origPromisesReadlink.call(fs.promises, path, options);
    } catch (err) {
      throw patchError(err, path);
    }
  };
}

try {
  const fsPromises = require("node:fs/promises");
  if (fsPromises && fsPromises.readlink) {
    const origPromisesReadlink2 = fsPromises.readlink;
    fsPromises.readlink = async function (path, options) {
      try {
        return await origPromisesReadlink2.call(fsPromises, path, options);
      } catch (err) {
        throw patchError(err, path);
      }
    };
  }
} catch (_) {}
