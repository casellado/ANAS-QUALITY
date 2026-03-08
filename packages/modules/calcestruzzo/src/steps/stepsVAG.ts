import type { WizardStep } from '@verbali/shared'

export const stepsVAG: WizardStep[] = [
  // ── STEP 1–7: Dati identificativi opera ──────────────────
  {
    key: 'opera',
    domanda: "Qual è l'opera di riferimento?",
    hint: "Inserisci il nome completo dell'opera come indicato nel progetto.",
    tipo: 'text',
    obbligatorio: true,
    placeholder: 'es. Viadotto Vallo di Diano',
    max: 100,
  },
  {
    key: 'wbs',
    domanda: "Inserisci il codice WBS dell'opera",
    hint: 'Formato: WBS.XX.XXX.XXXX — seleziona dalla lista o inserisci manualmente.',
    tipo: 'text',
    obbligatorio: true,
    placeholder: 'es. WBS.SS.001.0010',
  },
  {
    key: 'parte_opera',
    domanda: "Quale parte dell'opera verrà gettata?",
    hint: 'Specifica la parte strutturale oggetto del getto.',
    tipo: 'radio',
    obbligatorio: true,
    opzioni: [
      'Pila',
      'Spalla',
      'Pulvino',
      'Impalcato',
      'Platea di fondazione',
      'Muro di sottoscarpa',
      'Altro (vedi note)',
    ],
  },
  {
    key: 'v6',
    domanda: 'Quali elaborati di progetto sono stati verificati?',
    hint: 'Indica i numeri di tavola o elaborati grafici di riferimento.',
    tipo: 'text',
    obbligatorio: true,
    placeholder: 'es. TAV. S-045, TAV. S-046',
    max: 200,
  },
  {
    key: 'v7',
    domanda: 'Progressiva chilometrica DA (inizio tratto)',
    hint: 'Formato: km+m — es. 12+400',
    tipo: 'text',
    obbligatorio: true,
    placeholder: 'es. 12+400',
    max: 10,
  },
  {
    key: 'v8',
    domanda: 'Progressiva chilometrica A (fine tratto)',
    hint: 'Formato: km+m — es. 12+850',
    tipo: 'text',
    obbligatorio: true,
    placeholder: 'es. 12+850',
    max: 10,
  },
  {
    key: 'data',
    domanda: 'Data del sopralluogo',
    hint: 'Seleziona la data in cui viene effettuato il sopralluogo.',
    tipo: 'date',
    obbligatorio: true,
  },

  // ── STEP 8–11: Parti coinvolte ───────────────────────────
  {
    key: 'v1',
    domanda: "Nome del componente dell'Ufficio Direzione Lavori",
    hint: 'Inserisci il nome completo del tecnico DL che firma il verbale.',
    tipo: 'text',
    obbligatorio: true,
    placeholder: 'es. Ing. Mario Rossi',
    max: 100,
  },
  {
    key: 'v2',
    domanda: 'Nome del rappresentante del Contraente Generale',
    hint: 'Tecnico del CG presente al sopralluogo.',
    tipo: 'text',
    obbligatorio: true,
    placeholder: 'es. Geom. Luigi Bianchi',
    max: 100,
  },
  {
    key: 'v3',
    domanda: 'Impresa esecutrice',
    hint: "Ragione sociale dell'impresa esecutrice delle opere in cemento armato.",
    tipo: 'text',
    obbligatorio: true,
    placeholder: 'es. Costruzioni Srl',
    max: 150,
  },
  {
    key: 'v4',
    domanda: 'Codice Piano Controllo Qualità (PCQ)',
    hint: 'Massimo 22 caratteri — es. PCQ-A3-CLS-2025-001',
    tipo: 'text',
    obbligatorio: true,
    placeholder: 'PCQ-XXXX-XXXX-XXXX',
    max: 22,
  },

  // ── STEP 12: Conformità casserature ──────────────────────
  {
    key: 'v9',
    domanda: 'Le casserature e gli apprestamenti sono conformi a:',
    hint: 'Seleziona la tipologia di conformità delle casserature e ponteggi.',
    tipo: 'radio',
    obbligatorio: true,
    opzioni: [
      "Schemi del manuale d'uso o istruzioni di montaggio",
      "Progetto predisposto dall'impresa allegato al verbale",
      'Entrambi',
    ],
  },

  // ── STEP 13: Tipo sopralluogo ────────────────────────────
  {
    key: 'v10',
    domanda: 'Il sopralluogo ha verificato: (seleziona tutto ciò che si applica)',
    hint: 'Puoi selezionare più voci. Seleziona almeno una.',
    tipo: 'checkbox',
    obbligatorio: true,
    opzioni: [
      "Parte d'opera non armata",
      'Rispondenza dimensionale al progetto approvato',
      "Verifica dei ferri d'armatura messi in opera",
    ],
  },

  // ── STEP 14: Esito autorizzazione ────────────────────────
  {
    key: 'v11',
    domanda: "Esito dell'autorizzazione al getto",
    hint: "Il responsabile DL autorizza o NON autorizza l'esecuzione del getto.",
    tipo: 'radio',
    obbligatorio: true,
    opzioni: [
      "Ha AUTORIZZATO l'esecuzione dei getti di calcestruzzo",
      "NON ha autorizzato l'esecuzione dei getti di calcestruzzo",
    ],
  },

  // ── STEP 15: Firme digitali ──────────────────────────────
  {
    key: 'firma_data_url',
    domanda: 'Firme digitali delle parti',
    hint: 'Ogni firmatario deve apporre la propria firma. Procedere in ordine.',
    tipo: 'firme',
    obbligatorio: true,
    opzioni: [
      'Contraente Generale',
      'Impresa Affidataria',
      'Direzione Lavori',
    ],
  },
]

