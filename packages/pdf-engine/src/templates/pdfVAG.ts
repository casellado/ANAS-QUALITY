import { jsPDF } from 'jspdf'
import type { Verbale } from '@verbali/shared'
import { verbaleToVAG, formatDataEstesa } from '@verbali/shared'

// Dimensioni A4 in mm
const W  = 210
const H  = 297
const ML = 15   // margin left
const MR = 15   // margin right
const TW = W - ML - MR  // text width

/**
 * Genera il PDF del VAG — fedele al prestampato ANAS.
 * - Logo ANAS nelle celle header
 * - Checkbox corretti (basati sui testi selezionati)
 * - Foto allegate in fondo
 * - Firme nelle 3 colonne
 * - Progressivi automatici
 */
export async function generaPdfVAG(verbale: Verbale): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const vag = verbaleToVAG(verbale)
  const lineH = 5

  doc.setFont('helvetica')

  // ── HEADER: 4 colonne con loghi ────────────────────────────
  drawHeader(doc, vag.impresa_esecutrice)

  // ── Titolo lavori ──────────────────────────────────────────
  let y = 28
  doc.setFont('helvetica', 'bold').setFontSize(8)
  doc.text('Oggetto dei Lavori: LAVORI DI COSTRUZIONE', W / 2, y, { align: 'center' })
  y += 4
  doc.text('3° MEGALOTTO DELLA S.S. 106 JONICA', W / 2, y, { align: 'center' })
  y += 4
  doc.setFontSize(7)
  doc.text(
    'DA INNESTO CON LA S.S. 534 (KM 365+150) A ROSETO CAPO SPULICO (KM 400+000)',
    W / 2, y, { align: 'center' },
  )

  // ── Riga PCQ / Numero documento / Rev / Pagina ─────────────
  y += 6
  doc.line(ML, y, W - MR, y)
  y += 1
  const progStr = String(verbale.progressivo).padStart(3, '0')
  doc.setFont('helvetica', 'bold').setFontSize(8)
  doc.text(`PCQ F.JETCLS N° ${progStr}`, ML, y + 4)
  doc.text(`Rev. ${vag.revisione}`, ML + 80, y + 4)
  y += 5
  doc.setFont('helvetica', 'normal').setFontSize(7)
  doc.text('Sk.CONTR3   Pag. 1 di 1', ML, y + 3)
  y += 6
  doc.line(ML, y, W - MR, y)

  // ── Impresa esecutrice ─────────────────────────────────────
  y += 5
  doc.setFont('helvetica', 'bold').setFontSize(8)
  doc.text('IMPRESA ESECUTRICE:', ML, y)
  doc.setFont('helvetica', 'normal')
  doc.text(vag.impresa_esecutrice || '_______________', ML + 40, y)

  // ── Titolo verbale con numero scheda ───────────────────────
  y += 6
  doc.setFont('helvetica', 'bold').setFontSize(9)
  doc.text('OPERE IN CEMENTO ARMATO', ML, y)
  y += 5
  doc.setFontSize(8)
  doc.text(`Verbale di Autorizzazione al Getto    Scheda n° ${progStr}`, ML, y)
  y += 4
  doc.setFont('helvetica', 'normal').setFontSize(7)
  doc.text(`Piano Controllo Qualità di cantiere: ${vag.pcq_codice}`, ML, y)
  y += 5
  doc.line(ML, y, W - MR, y)

  // ── Dati opera ─────────────────────────────────────────────
  y += 5
  doc.setFont('helvetica', 'normal').setFontSize(8)
  doc.text(`Opera: ${vag.opera}`, ML, y)
  doc.text(`SCHEDA DI CONTROLLO N° ${progStr}`, W - MR, y, { align: 'right' })
  y += 5
  doc.text(`WBS: ${vag.wbs}`, ML, y)
  y += 5
  doc.text(`Elaborati di riferimento: ${vag.elaborati_riferimento || '—'}`, ML, y)
  y += 5
  doc.text(`Da progr.: ${vag.progr_da}`, ML, y)
  doc.text(`A progr.: ${vag.progr_a}`, ML + 60, y)
  doc.text(`Data: ${formatDataEstesa(verbale.data)}`, ML + 120, y)
  y += 5
  doc.line(ML, y, W - MR, y)

  // ── Titolo sezione principale ──────────────────────────────
  y += 6
  doc.setFont('helvetica', 'bold').setFontSize(10)
  doc.text('VERBALE DI AUTORIZZAZIONE AL GETTO', W / 2, y, { align: 'center' })
  y += 4
  doc.setFont('helvetica', 'italic').setFontSize(8)
  doc.text('(art. 8 CSA - par. 1.7.3, 1.10)', W / 2, y, { align: 'center' })
  y += 7

  // ── Corpo testo ────────────────────────────────────────────
  doc.setFont('helvetica', 'normal').setFontSize(8.5)

  const introText = `Il sottoscritto ${vag.nome_dl || '___'}, componente dell'Ufficio di Direzione Lavori, in data odierna, acquisita la dichiarazione del Direttore Tecnico di Cantiere (DTC) del CG attestante che la posa in opera degli apprestamenti, dei ponteggi e delle impalcature per la casseratura dei getti di calcestruzzo sono conformi:`
  const introLines = doc.splitTextToSize(introText, TW)
  doc.text(introLines, ML, y)
  y += introLines.length * lineH + 2

  // ── Checkbox conformità casserature (basati sul testo reale) ─
  const isManuale  = vag.conformita_tipo === 'manuale'  || vag.conformita_tipo === 'entrambi'
  const isProgetto = vag.conformita_tipo === 'progetto' || vag.conformita_tipo === 'entrambi'

  y = drawCheckLine(doc, isManuale,
    "agli schemi del manuale d'uso o delle istruzioni di montaggio;", ML, y, TW)
  y = drawCheckLine(doc, isProgetto,
    "al progetto predisposto dall'impresa ed allegato al presente verbale;", ML, y, TW)
  y += 3

  const cgText = `in contraddittorio con il Contraente Generale rappresentato da ${vag.nome_cg || '___'}, ha proceduto ad effettuare il sopralluogo per:`
  const cgLines = doc.splitTextToSize(cgText, TW)
  doc.text(cgLines, ML, y)
  y += cgLines.length * lineH + 2

  // ── Checkbox sopralluogo (basati sui testi reali selezionati) ─
  const sopNonArmata   = vag.sopralluogo_tipo.includes('non_armata')
  const sopDimensionale = vag.sopralluogo_tipo.includes('dimensionale')
  const sopFerri        = vag.sopralluogo_tipo.includes('ferri')

  y = drawCheckLine(doc, sopNonArmata,
    "verificare che il getto interessa una parte d'opera non armata;", ML, y, TW)
  y = drawCheckLine(doc, sopDimensionale,
    "verificare la rispondenza dimensionale della parte d'opera da realizzare al progetto approvato;", ML, y, TW)
  y = drawCheckLine(doc, sopFerri,
    "la verifica dei ferri d'armatura messi in opera, rilevando che:", ML, y, TW)

  if (sopFerri) {
    y += 2
    doc.setFontSize(8)
    doc.text("     1) l'armatura posta in opera risulta pulita ed esente da materiali terrosi;", ML, y)
    y += lineH
    doc.text('     2) le posizioni, il numero ed i diametri dei ferri corrispondono al progetto approvato;', ML, y)
    y += lineH
    doc.text('     3) gli spessori dei copriferri sono conformi al Progetto Approvato', ML, y)
    y += lineH
  }

  y += 3
  doc.text(`Tavole di riferimento: ${vag.elaborati_riferimento || 'VEDI SOPRA'}`, ML, y)
  y += lineH + 4

  // ── Esito ──────────────────────────────────────────────────
  y = drawEsito(doc, vag.esito === 'autorizzato', y, lineH)

  // ── Sezione firme: 3 colonne ───────────────────────────────
  y = drawFirme(doc, verbale, y)

  // ── Foto allegate ──────────────────────────────────────────
  if (vag.foto.length > 0) {
    y = drawFoto(doc, vag.foto, y)
  }

  // ── Footer codice verbale ──────────────────────────────────
  const lastPageH = doc.internal.pages.length > 1 ? H : H
  doc.setFont('helvetica', 'normal').setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(verbale.codice, W / 2, lastPageH - 8, { align: 'center' })
  doc.text(
    `Generato il ${new Date().toLocaleDateString('it-IT')} · PWA ANAS QUALITY`,
    W / 2, lastPageH - 4, { align: 'center' },
  )

  return doc.output('blob')
}

// ── Helper: riga con checkbox ─────────────────────────────────
function drawCheckLine(doc: jsPDF, checked: boolean, testo: string, x: number, y: number, maxW: number): number {
  const check = checked ? '☑' : '☐'
  doc.setFontSize(8.5)
  const fullText = `  ${check}  ${testo}`
  const lines = doc.splitTextToSize(fullText, maxW)
  doc.text(lines, x, y)
  return y + lines.length * 5
}

// ── Helper: header 4 colonne con loghi ANAS ───────────────────
function drawHeader(doc: jsPDF, contraenteGenerale: string) {
  const colW = TW / 4

  // Celle
  doc.rect(ML,              8, colW, 16)
  doc.rect(ML + colW,       8, colW, 16)
  doc.rect(ML + colW * 2,   8, colW, 16)
  doc.rect(ML + colW * 3,   8, colW, 16)

  // 1. Alta Sorveglianza + logo ANAS
  doc.setFont('helvetica', 'bold').setFontSize(6.5)
  doc.text('Alta Sorveglianza', ML + colW / 2, 13, { align: 'center' })
  // Logo ANAS testuale (brand)
  doc.setFontSize(9).setTextColor(253, 185, 19) // giallo ANAS
  doc.text('ANAS', ML + colW / 2, 20, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // 2. Direzione Lavori + logo ANAS
  doc.setFont('helvetica', 'bold').setFontSize(6.5)
  doc.text('Direzione Lavori', ML + colW * 1.5, 13, { align: 'center' })
  doc.setFontSize(9).setTextColor(253, 185, 19)
  doc.text('ANAS', ML + colW * 1.5, 20, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // 3. Contraente Generale (editabile)
  doc.setFont('helvetica', 'bold').setFontSize(6.5)
  const cgNome = contraenteGenerale || 'SIRJO S.C.P.A'
  doc.text(cgNome, ML + colW * 2.5, 13, { align: 'center', maxWidth: colW - 4 })
  doc.setFont('helvetica', 'normal').setFontSize(5.5)
  doc.text('Contraente Generale', ML + colW * 2.5, 20, { align: 'center' })

  // 4. ANAS Logo (brand)
  doc.setFont('helvetica', 'bold').setFontSize(12)
  doc.setTextColor(253, 185, 19) // giallo ANAS
  doc.text('ANAS', ML + colW * 3.5, 18, { align: 'center' })
  doc.setTextColor(0, 61, 165) // blu ANAS
  doc.setFontSize(5)
  doc.text('S.p.A.', ML + colW * 3.5, 22, { align: 'center' })
  doc.setTextColor(0, 0, 0)
}

// ── Helper: esito autorizzazione ──────────────────────────────
function drawEsito(doc: jsPDF, autorizzato: boolean, y: number, lineH: number): number {
  doc.setFont('helvetica', 'bold').setFontSize(8.5)

  const prefisso = 'A seguito delle risultanze della suddetta constatazione, il sottoscritto:'
  const prefLines = doc.splitTextToSize(prefisso, TW)
  doc.text(prefLines, ML, y)
  y += prefLines.length * lineH + 2

  // Checkbox esito
  y = drawCheckLine(doc, autorizzato,
    "Ha AUTORIZZATO l'esecuzione dei getti di calcestruzzo", ML, y, TW)
  y = drawCheckLine(doc, !autorizzato,
    "NON ha autorizzato l'esecuzione dei getti di calcestruzzo", ML, y, TW)

  return y + 6
}

// ── Helper: sezione firme 3 colonne ───────────────────────────
function drawFirme(doc: jsPDF, verbale: Verbale, y: number): number {
  // Check se c'è spazio, altrimenti nuova pagina
  if (y > H - 55) {
    doc.addPage()
    y = 20
  }

  const colW   = TW / 3
  const firmaH = 30

  doc.rect(ML,            y, colW, firmaH)
  doc.rect(ML + colW,     y, colW, firmaH)
  doc.rect(ML + colW * 2, y, colW, firmaH)

  doc.setFont('helvetica', 'bold').setFontSize(7.5)
  doc.text('per il CONTRAENTE GENERALE:', ML + colW / 2,   y + 5, { align: 'center' })
  doc.text("per l'IMPRESA AFFIDATARIA:", ML + colW * 1.5, y + 5, { align: 'center' })
  doc.text('per la DIREZIONE LAVORI:',   ML + colW * 2.5, y + 5, { align: 'center' })

  // Incolla firme base64
  const firme: Record<string, string> = verbale.firma_data_url
    ? (() => { try { return JSON.parse(verbale.firma_data_url) as Record<string, string> } catch { return {} } })()
    : {}

  const embed = (key: string, x: number) => {
    const dataUrl = firme[key]
    if (!dataUrl) return
    try {
      doc.addImage(dataUrl, 'PNG', x + 2, y + 9, colW - 4, firmaH - 16)
    } catch { /* firma non valida — lascia bianco */ }
  }

  embed('contraente_generale', ML)
  embed('impresa_affidataria', ML + colW)
  embed('direzione_lavori',    ML + colW * 2)

  return y + firmaH + 5
}

// ── Helper: sezione foto allegate ─────────────────────────────
function drawFoto(doc: jsPDF, foto: string[], y: number): number {
  // Nuova pagina per le foto se non c'è spazio
  if (y > H - 80) {
    doc.addPage()
    y = 20
  }

  doc.setFont('helvetica', 'bold').setFontSize(9)
  doc.text('ALLEGATI FOTOGRAFICI', W / 2, y, { align: 'center' })
  y += 6

  const fotoW = (TW - 10) / Math.min(foto.length, 3)
  const fotoH = 60

  for (let i = 0; i < foto.length && i < 3; i++) {
    const x = ML + i * (fotoW + 5)
    try {
      // Determina formato dall'header base64
      const format = foto[i]?.includes('image/png') ? 'PNG' : 'JPEG'
      doc.addImage(foto[i] ?? '', format, x, y, fotoW, fotoH)
    } catch {
      // Foto non valida — rettangolo vuoto
      doc.rect(x, y, fotoW, fotoH)
      doc.setFont('helvetica', 'normal').setFontSize(7)
      doc.text('Foto non disponibile', x + fotoW / 2, y + fotoH / 2, { align: 'center' })
    }
    // Didascalia
    doc.setFont('helvetica', 'normal').setFontSize(7)
    doc.text(`Foto ${i + 1}`, x + fotoW / 2, y + fotoH + 4, { align: 'center' })
  }

  return y + fotoH + 10
}
