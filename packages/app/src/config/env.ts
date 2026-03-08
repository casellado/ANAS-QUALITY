/**
 * @file env.ts
 *
 * ⚠️  REGOLA ASSOLUTA: questo è l'UNICO file che differisce tra
 *     ambiente test (GitHub Pages) e produzione ANAS (IIS).
 *     Non hardcodare MAI altrove valori presenti qui.
 *
 * Per passare da test a produzione: modifica SOLO questo file.
 */
export const ENV = {
  // ── Azure AD — MSAL.js ───────────────────────────────────────
  /** App Registration ID in Azure AD */
  AZURE_CLIENT_ID:    'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  /** 'common' per test con account personali; '<tenant-id>' per ANAS */
  AZURE_TENANT_ID:    'common',
  /** URI di reindirizzamento dopo login */
  AZURE_REDIRECT_URI: 'https://casellado.github.io/ANAS-QUALITY/',

  // ── OneDrive — Microsoft Graph ───────────────────────────────
  /**
   * Cartella root su OneDrive.
   * Test: 'Verbali_Cantiere_TEST' (OneDrive personale)
   * Prod: '' (root OneDrive cantiere ANAS — già isolato per utente)
   */
  ONEDRIVE_ROOT: 'Verbali_Cantiere_TEST',

  // ── Azure AD Groups ──────────────────────────────────────────
  /**
   * Prefisso dei gruppi Azure AD che identificano i cantieri.
   * Esempio: 'cantiere-' → gruppo 'cantiere-CAN-001' → cantiere 'CAN-001'
   */
  AZURE_GROUP_PREFIX: 'cantiere-',

  // ── Polling ──────────────────────────────────────────────────
  /** Intervallo polling prove in millisecondi (default: 30 secondi) */
  POLLING_INTERVAL: 30_000,

  // ── Flag ambiente ────────────────────────────────────────────
  IS_PRODUCTION: false,

} as const

// ─────────────────────────────────────────────────────────────
// Per produzione ANAS — modificare SOLO questi valori:
//
// AZURE_CLIENT_ID:    '<client-id-app-anas>',
// AZURE_TENANT_ID:    '<tenant-id-anas>',
// AZURE_REDIRECT_URI: 'https://verbali.anas.it',
// ONEDRIVE_ROOT:      '',
// IS_PRODUCTION:      true,
// ─────────────────────────────────────────────────────────────
