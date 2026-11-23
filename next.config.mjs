import fs from 'node:fs';
import fsPromises from 'node:fs/promises';

// Patch for Windows drives where fs.readlink on regular files returns EISDIR instead of EINVAL.
// Webpack expects EINVAL for non-symlink files; on some Windows drives, libuv/Windows returns EISDIR.
function wrapError(err, path) {
  if (err && (err.code === 'EISDIR' || err.code === 'UNKNOWN')) {
    const einval = new Error(`EINVAL: invalid argument, readlink '${path}'`);
    einval.code = 'EINVAL';
    einval.errno = -4071;
    einval.syscall = 'readlink';
    return einval;
  }
  return err;
}

const origReadlink = fs.readlink;
fs.readlink = function (path, options, callback) {
  const cb = typeof options === 'function' ? options : callback;
  const opt = typeof options === 'function' ? undefined : options;

  return origReadlink.call(fs, path, opt, (err, linkString) => {
    return cb(wrapError(err, path), linkString);
  });
};

const origReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function (path, options) {
  try {
    return origReadlinkSync.call(fs, path, options);
  } catch (err) {
    throw wrapError(err, path);
  }
};

const origPromisesReadlink = fsPromises.readlink;
const patchedPromisesReadlink = async function (path, options) {
  try {
    return await origPromisesReadlink.call(fsPromises, path, options);
  } catch (err) {
    throw wrapError(err, path);
  }
};
fsPromises.readlink = patchedPromisesReadlink;
if (fs.promises) {
  fs.promises.readlink = patchedPromisesReadlink;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  images: {
    unoptimized: true,
  },

  async rewrites() {
    return [
      {
        source: '/images/media/:id',
        destination: 'https://digitalpr.no/api/media/:id',
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
