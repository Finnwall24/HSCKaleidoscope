// Minimal stand-in for the real @vercel/oidc package. This app never uses
// Vercel's OIDC-based auth (it always authenticates to Blob storage with a
// plain BLOB_READ_WRITE_TOKEN), but @vercel/blob unconditionally requires
// @vercel/oidc at load time to check for an OIDC token first. The real
// package pulls in a large, unrelated CLI dependency tree (execa, zod,
// xdg-app-paths, jose) just to support that one code path. @vercel/blob
// itself wraps every call to getVercelOidcToken() in a try/catch that
// treats any failure as "no OIDC token available" and falls back to
// BLOB_READ_WRITE_TOKEN -- so a stub that always signals "not available"
// is safe and behaves identically to the real package for this app.
exports.getVercelOidcToken = async function getVercelOidcToken() {
  throw new Error('OIDC not available (stub) -- falls back to BLOB_READ_WRITE_TOKEN');
};
