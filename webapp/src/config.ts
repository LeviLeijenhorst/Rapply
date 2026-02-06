const ENTRA_OPENID_CONFIGURATION_URL =
  process.env.EXPO_PUBLIC_ENTRA_OPENID_CONFIGURATION_URL ||
  'https://coachscribe.ciamlogin.com/24536746-bb4f-40c5-8197-96fe36a2eb59/v2.0/.well-known/openid-configuration?appid=53488fd1-6c3e-4ab0-ab76-81e15ec2f948'
const ENTRA_CLIENT_ID = process.env.EXPO_PUBLIC_ENTRA_CLIENT_ID || '53488fd1-6c3e-4ab0-ab76-81e15ec2f948'
const ENTRA_API_SCOPE = process.env.EXPO_PUBLIC_ENTRA_API_SCOPE || 'api://e817f1f3-3eb8-41b8-8b44-695f0b946721/access-as-user'
const ENTRA_ACCOUNT_PORTAL_URL = process.env.EXPO_PUBLIC_ENTRA_ACCOUNT_PORTAL_URL || 'https://myaccount.microsoft.com/'
const ENTRA_REDIRECT_BASE_URL = process.env.EXPO_PUBLIC_ENTRA_REDIRECT_BASE_URL || ''
const API_BASE_URL = process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL || 'http://127.0.0.1:8787'

export const config = {
  entra: {
    openIdConfigurationUrl: ENTRA_OPENID_CONFIGURATION_URL,
    clientId: ENTRA_CLIENT_ID,
    apiScope: ENTRA_API_SCOPE,
    accountPortalUrl: ENTRA_ACCOUNT_PORTAL_URL,
    redirectBaseUrl: ENTRA_REDIRECT_BASE_URL,
  },
  api: {
    baseUrl: API_BASE_URL,
  },
}
