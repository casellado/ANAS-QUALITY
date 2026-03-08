import { Configuration, LogLevel } from '@azure/msal-browser'
import { ENV } from './env'

/**
 * Configurazione MSAL.js per Azure AD ANAS.
 *
 * SICUREZZA CRITICA:
 * - cacheLocation: 'sessionStorage' → token NON persistono tra sessioni
 * - piiLoggingEnabled: false → GDPR compliance
 * - MAI usare 'localStorage' per i token MSAL
 */
export const msalConfig: Configuration = {
  auth: {
    clientId:    ENV.AZURE_CLIENT_ID,
    authority:   `https://login.microsoftonline.com/${ENV.AZURE_TENANT_ID}`,
    redirectUri: ENV.AZURE_REDIRECT_URI,
    postLogoutRedirectUri: ENV.AZURE_REDIRECT_URI,
  },

  cache: {
    cacheLocation:          'sessionStorage', // ← OBBLIGATORIO — MAI 'localStorage'
    storeAuthStateInCookie: false,
  },

  system: {
    loggerOptions: {
      logLevel:          ENV.IS_PRODUCTION ? LogLevel.Warning : LogLevel.Info,
      loggerCallback:    (level, message, containsPii) => {
        if (containsPii) return // MAI loggare PII
        if (ENV.IS_PRODUCTION && level === LogLevel.Error) {
          console.error('[MSAL]', message)
        } else if (!ENV.IS_PRODUCTION) {
          console.debug(`[MSAL ${LogLevel[level]}]`, message)
        }
      },
      piiLoggingEnabled: false, // SEMPRE false — GDPR
    },
  },
}

/**
 * Scopes Microsoft Graph necessari alla PWA.
 * Principio di minimo privilegio: solo gli scopes strettamente necessari.
 */
export const graphScopes = {
  /** Lettura profilo utente e gruppi Azure AD */
  user:         ['User.Read', 'GroupMember.Read.All'],

  /** OneDrive read/write per archiviazione verbali */
  files:        ['Files.ReadWrite'],

  /** Scope combinato per login iniziale */
  loginRequest: ['User.Read', 'GroupMember.Read.All', 'Files.ReadWrite'],
}
