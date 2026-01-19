export const sanitizeCredentialForPage = (credential) => {
  if (!credential) return credential
  const { _privateKeyBuffer, _userId, ...safeCredential } = credential
  return safeCredential
}
