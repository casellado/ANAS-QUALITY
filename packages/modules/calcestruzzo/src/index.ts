import type { VerbaleModule } from '@verbali/shared'
import { stepsVAG } from './steps/stepsVAG'
import { generaPdfVAG } from '@verbali/pdf-engine'

export const ModuleCalcestruzzo: VerbaleModule = {
  id:     'calcestruzzo',
  nome:   'Calcestruzzo',
  icona:  '🏗️',
  colore: '#1D6FD8',

  tipiVerbale: [
    {
      sigla:       'VAG',
      nome:        'Autorizzazione al Getto',
      descrizione: "Verbale di sopralluogo e autorizzazione all'esecuzione del getto di cls.",
      icona:       '✅',
      colore:      '#1D6FD8',
      normativa:   'art. 8 CSA — par. 1.7.3, 1.10',
      firme:       ['contraente_generale', 'impresa_affidataria', 'direzione_lavori'],
      steps:       stepsVAG,
      generaPdf:   generaPdfVAG,
    },
    // Futuro: VPC (Prelievo Calcestruzzo)
  ],
}

