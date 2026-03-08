import type { Verbale } from './Verbale'

/**
 * Tipi di step supportati dal WizardStepRenderer.
 * Ogni StepType corrisponde a un componente React in STEP_COMPONENTS.
 * Per aggiungere un nuovo tipo: 1) aggiungi qui 2) crea il componente 3) registra in STEP_COMPONENTS.
 */
export type StepType =
  | 'radio'      // scelta singola da lista di opzioni
  | 'checkbox'   // scelta multipla da lista
  | 'text'       // testo libero (max caratteri opzionale)
  | 'textarea'   // testo lungo
  | 'number'     // numero con validazione range opzionale
  | 'date'       // data con date picker
  | 'wbs'        // WbsSelect con memoria per cantiere
  | 'ddt'        // blocco DDT composito (numero + data + targa + classe resistenza)
  | 'slump'      // slump test (categoria + valore mm)
  | 'cubetti'    // provini NTC 2018 con codici ANAS automatici
  | 'foto'       // step fotografico (facoltativo — non blocca avanzamento)
  | 'firme'      // firme su canvas per multipli ruoli
  | 'figura'     // FiguraSelect con memoria per ruolo (DL, Impresa...)

/**
 * Configurazione di un singolo step del wizard.
 * Leggibile dal WizardStepRenderer per renderizzare il componente corretto.
 */
export interface WizardStep {
  /** Chiave del campo → Verbale[key] o slot generico v1-v20 */
  key:           string
  /** Testo della domanda mostrato nel wizard */
  domanda:       string
  /** Istruzione contestuale sotto la domanda */
  hint:          string
  /** Tipo di input — determina quale componente renderizzare */
  tipo:          StepType
  /** Se true → l'ispettore non può avanzare senza compilare */
  obbligatorio:  boolean
  /** Opzioni per tipo 'radio' | 'checkbox' */
  opzioni?:      string[]
  /** Massimo caratteri per tipo 'text' */
  max?:          number
  /** Testo placeholder */
  placeholder?:  string
  /** Min/max per tipo 'number' */
  min?:          number
  /** Step incremento per tipo 'number' */
  step?:         number
  /** Se true, il campo testo mostra suggerimenti da compilazioni precedenti */
  memoria?:      boolean
  /** Se true, il valore viene precompilato automaticamente dal sistema */
  autofill?:     'data' | 'dl_nome'
  /** Numero massimo di foto per step 'foto' */
  maxFoto?:      number
}

/**
 * Tipo verbale specifico (es: 'VPC', 'VAG').
 * Ogni modulo espone uno o più TipoVerbale.
 */
export interface TipoVerbale {
  /** Sigla unica. Esempi: 'VPC', 'VAG', 'VAC', 'VTE'. MAI hardcodare switch su questo. */
  sigla:        string
  /** Nome leggibile. Esempio: 'Prelievo Calcestruzzo' */
  nome:         string
  /** Descrizione breve per il sottomenu */
  descrizione:  string
  /** Emoji o nome icona Lucide */
  icona:        string
  /** Hex colore per tema card */
  colore:       string
  /** Ruoli che devono firmare. Definiti dal modulo. */
  firme:        string[]
  /** Array di step del wizard — letti dal WizardStepRenderer */
  steps:        WizardStep[]
  /** Normativa di riferimento. Esempio: 'NTC 2018 | UNI EN 12350-2' */
  normativa?:   string
  /**
   * Funzione di generazione PDF specifica del tipo.
   * Chiamata da PdfService dopo il completamento del wizard.
   * Deve restituire un Blob PDF fedele al prestampato ANAS.
   */
  generaPdf:    (verbale: Verbale) => Promise<Blob>
}

/**
 * Interfaccia obbligatoria che OGNI modulo verbale DEVE implementare.
 *
 * Un modulo = un materiale (Calcestruzzo, Acciaio, Terre...).
 * Può contenere più TipoVerbale (es: Calcestruzzo → VPC + VAG).
 *
 * Per registrare: aggiungere UNA riga a MODULE_REGISTRY in moduleRegistry.ts.
 * Zero modifiche al core app, wizard, dashboard, registro.
 */
export interface VerbaleModule {
  /** ID unico lowercase no spazi — usato come URL param */
  id:           string
  /** Nome leggibile per la card dashboard */
  nome:         string
  /** Emoji per la card dashboard */
  icona:        string
  /** Hex colore tema card */
  colore:       string
  /** Lista dei tipi verbale del modulo */
  tipiVerbale:  TipoVerbale[]
}
