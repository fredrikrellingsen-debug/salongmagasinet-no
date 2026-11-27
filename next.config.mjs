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

  // Next 16: serverComponentsExternalPackages er flyttet ut av experimental.
  serverExternalPackages: ['@prisma/client'],

  images: {
    unoptimized: true,
  },

  async rewrites() {
    const mediaOrigin = (
      process.env.HUB_INTERNAL_URL || 'http://digitalpr.railway.internal:8080'
    ).replace(/\/+$/, '');
    return [
      {
        source: '/images/media/:id',
        destination: `${mediaOrigin}/api/media/:id`,
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
          // Transporten og dokumentet (politikk § 33). HSTS med ett års varighet,
          // og en håndhevet CSP — ikke Report-Only, som ikke blokkerer noe.
          // Policyen er den samme som de andre DigitalPR-magasinene bruker: GA4
          // hentes fra googletagmanager.com og snakker med google-analytics.com,
          // fontene serveres fra eget opphav (next/font), og annonsebildene kan
          // ligge på en ekstern https-adresse — derfor `https:` i img-src.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://region1.google-analytics.com https://stats.g.doubleclick.net; frame-src 'self' https://www.googletagmanager.com https://td.doubleclick.net; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
        ],
      },
    ];
  },

};

export default nextConfig;
