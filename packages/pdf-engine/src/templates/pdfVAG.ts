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
 * Client-side con jsPDF — funziona anche offline.
 */
export async function generaPdfVAG(verbale: Verbale): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const vag = verbaleToVAG(verbale)
  const lineH = 5

  doc.setFont('helvetica')

  // ── HEADER: 4 colonne loghi ─────────────────────────────
  drawHeader(doc)

  // ── Titolo lavori ───────────────────────────────────────
  let y = 28
  doc.setFont('helvetica', 'bold').setFontSize(8)
  doc.text('LAVORI DI COSTRUZIONE', W / 2, y, { align: 'center' })
  y += 4
  doc.text('3° MEGALOTTO DELLA S.S. 106 JONICA', W / 2, y, { align: 'center' })
  y += 4
  doc.setFontSize(7)
  doc.text(
    'DA INNESTO CON LA S.S. 534 (KM 365+150) A ROSETO CAPO SPULICO (KM 400+000)',
    W / 2, y, { align: 'center' },
  )

  // ── Riga PCQ / Numero documento ─────────────────────────
  y += 6
  doc.line(ML, y, W - MR, y)
  y += 1
  doc.setFont('helvetica', 'bold').setFontSize(8)
  doc.text('PCQ F.JETCLS', ML, y + 4)
  const numStr = `N° ${String(verbale.progressivo).padStart(3, '0')}   Rev. ${vag.revisione}`
  doc.text(numStr, W - MR, y + 4, { align: 'right' })
  y += 5
  doc.setFont('helvetica', 'normal').setFontSize(7)
  doc.text('Sk.CONTR3   Pag. 1 di 1', ML, y + 3)
  y += 6
  doc.line(ML, y, W - MR, y)

  // ── Impresa esecutrice ──────────────────────────────────
  y += 5
  doc.setFont('helvetica', 'bold').setFontSize(8)
  doc.text('IMPRESA ESECUTRICE:', ML, y)
  doc.setFont('helvetica', 'normal')
  doc.text(vag.impresa_esecutrice || '_______________', ML + 40, y)

  // ── Titolo verbale ──────────────────────────────────────
  y += 5
  doc.setFont('helvetica', 'bold').setFontSize(9)
  doc.text('OPERE IN CEMENTO ARMATO', ML, y)
  doc.setFontSize(8)
  const schedaNum = vag.scheda_numero || String(vag.progressivo).padStart(3, '0')
  doc.text(`Verbale di Autorizzazione al Getto    Scheda n° ${schedaNum}`, ML, y + 5)
  y += 9
  doc.line(ML, y, W - MR, y)

  // ── Dati opera ──────────────────────────────────────────
  y += 5
  doc.setFont('helvetica', 'normal').setFontSize(8)
  doc.text(`Piano Controllo Qualità di cantiere: ${vag.pcq_codice}`, ML, y)
  y += 5
  doc.text(`Opera: ${vag.opera}`, ML, y)
  doc.text('SCHEDA DI CONTROLLO N° 3', W - MR, y, { align: 'right' })
  y += 5
  doc.text(`WBS: ${vag.wbs}`, ML, y)
  y += 5
  doc.text(`Elaborati di riferimento: ${vag.elaborati_riferimento}`, ML, y)
  y += 5
  doc.text(`Da progr.: ${vag.progr_da}`, ML, y)
  doc.text(`A progr.: ${vag.progr_a}`, ML + 60, y)
  doc.text(`Data: ${formatDataEstesa(verbale.data)}`, ML + 120, y)
  y += 5
  doc.line(ML, y, W - MR, y)

  // ── Titolo sezione principale ───────────────────────────
  y += 6
  doc.setFont('helvetica', 'bold').setFontSize(10)
  doc.text('VERBALE DI AUTORIZZAZIONE AL GETTO', W / 2, y, { align: 'center' })
  y += 4
  doc.setFont('helvetica', 'italic').setFontSize(8)
  doc.text('(art. 8 CSA - par. 1.7.3, 1.10)', W / 2, y, { align: 'center' })
  y += 7

  // ── Corpo testo ─────────────────────────────────────────
  doc.setFont('helvetica', 'normal').setFontSize(8.5)

  const introText = `Il sottoscritto ${vag.nome_dl || '___'}, componente dell'Ufficio di Direzione Lavori, in data odierna, acquisita la dichiarazione del Direttore Tecnico di Cantiere (DTC) del CG attestante che la posa in opera degli apprestamenti, dei ponteggi e delle impalcature per la casseratura dei getti di calcestruzzo sono conformi:`
  const introLines = doc.splitTextToSize(introText, TW)
  doc.text(introLines, ML, y)
  y += introLines.length * lineH + 2

  // Checkbox conformità casserature
  const isManuale  = vag.conformita_tipo === 'manuale'  || vag.conformita_tipo === 'entrambi'
  const isProgetto = vag.conformita_tipo === 'progetto' || vag.conformita_tipo === 'entrambi'
  doc.text(`  ( ${isManuale ? '✓' : ' '} )  agli schemi del manuale d'uso o delle istruzioni di montaggio;`, ML, y)
  y += lineH
  doc.text(`  ( ${isProgetto ? '✓' : ' '} )  al progetto predisposto dall'impresa ed allegato al presente verbale;`, ML, y)
  y += lineH + 3

  const cgText = `in contraddittorio con il Contraente Generale rappresentato da ${vag.nome_cg || '___'}, ha proceduto ad effettuare il sopralluogo per:`
  const cgLines = doc.splitTextToSize(cgText, TW)
  doc.text(cgLines, ML, y)
  y += cgLines.length * lineH + 2

  // Checkbox sopralluogo
  const sop = vag.sopralluogo_tipo
  doc.text(`  ( ${sop.includes('non_armata')   ? '✓' : ' '} )  verificare che il getto interessa una parte d'opera non armata;`, ML, y)
  y += lineH
  doc.text(`  ( ${sop.includes('dimensionale') ? '✓' : ' '} )  verificare la rispondenza dimensionale della parte d'opera da`, ML, y)
  y += lineH
  doc.text('                       realizzare al progetto approvato;', ML, y)
  y += lineH
  doc.text(`  ( ${sop.includes('ferri')        ? '✓' : ' '} )  la verifica dei ferri d'armatura messi in opera, rilevando che:`, ML, y)
  y += lineH

  doc.text("     1) l'armatura posta in opera risulta pulita ed esente da materiali terrosi;", ML, y)
  y += lineH
  doc.text('     2) le posizioni, il numero ed i diametri dei ferri corrispondono a quanto', ML, y)
  y += lineH
  doc.text('        indicato nel progetto approvato;', ML, y)
  y += lineH
  doc.text('     3) gli spessori dei copriferri sono conformi a quelli indicati nel Progetto Approvato', ML, y)
  y += lineH + 3

  doc.text('Tavole di riferimento: VEDI SOPRA', ML, y)
  y += lineH + 4

  // ── Esito ───────────────────────────────────────────────
  y = drawEsito(doc, vag.esito === 'autorizzato', y, lineH)

  // ── Sezione firme: 3 colonne ────────────────────────────
  y = drawFirme(doc, verbale, y)

  // ── Footer codice verbale ───────────────────────────────
  doc.setFont('helvetica', 'normal').setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(verbale.codice, W / 2, H - 8, { align: 'center' })
  doc.text(
    `Generato il ${new Date().toLocaleDateString('it-IT')} · PWA Verbali ANAS`,
    W / 2, H - 4, { align: 'center' },
  )

  return doc.output('blob')
}

// ── Helper: header 4 colonne loghi ────────────────────────
function drawHeader(doc: jsPDF) {
  doc.setFontSize(7).setFont('helvetica', 'bold')

  doc.rect(ML, 8, 40, 16)
  doc.text('ALTA SORVEGLIANZA', ML + 20, 14, { align: 'center' })
  doc.setFont('helvetica', 'normal').setFontSize(6)
  doc.text('(logo)', ML + 20, 19, { align: 'center' })

  doc.rect(ML + 42, 8, 40, 16)
  doc.setFont('helvetica', 'bold').setFontSize(7)
  doc.text('DIREZIONE LAVORI', ML + 62, 14, { align: 'center' })

  doc.rect(ML + 84, 8, 55, 16)
  doc.setFont('helvetica', 'bold').setFontSize(7)
  doc.text('SIRJO S.C.P.A', ML + 111, 12, { align: 'center' })
  doc.setFont('helvetica', 'normal').setFontSize(6)
  doc.text('Contraente Generale', ML + 111, 16, { align: 'center' })

  doc.rect(ML + 141, 8, 39, 16)
  doc.setFont('helvetica', 'bold').setFontSize(9)
  doc.setTextColor(255, 180, 0)
  doc.text('ANAS', ML + 160, 18, { align: 'center' })
  doc.setTextColor(0, 0, 0)
}

// ── Helper: esito autorizzazione ──────────────────────────
function drawEsito(doc: jsPDF, autorizzato: boolean, y: number, lineH: number): number {
  const esitoTesto = autorizzato
    ? "Ha AUTORIZZATO l'esecuzione dei getti di calcestruzzo"
    : "NON ha autorizzato l'esecuzione dei getti di calcestruzzo"

  doc.setFont('helvetica', 'bold').setFontSize(8.5)
  const esitoLines = doc.splitTextToSize(
    `A seguito delle risultanze della suddetta constatazione, i sottoscritti: ${esitoTesto}`,
    TW,
  )
  doc.text(esitoLines, ML, y)
  return y + esitoLines.length * lineH + 10
}

// ── Helper: sezione firme 3 colonne ───────────────────────
function drawFirme(doc: jsPDF, verbale: Verbale, y: number): number {
  const colW   = TW / 3
  const firmaH = 30

  doc.rect(ML,            y, colW, firmaH)
  doc.rect(ML + colW,     y, colW, firmaH)
  doc.rect(ML + colW * 2, y, colW, firmaH)

  doc.setFont('helvetica', 'bold').setFontSize(7.5)
  doc.text('per il CONTRAENTE GENERALE:',  ML + colW / 2,   y + 5, { align: 'center' })
  doc.text("per l'IMPRESA AFFIDATARIA:",   ML + colW * 1.5, y + 5, { align: 'center' })
  doc.text('per la DIREZIONE LAVORI:',     ML + colW * 2.5, y + 5, { align: 'center' })

  // Incolla firme base64
  const firme: Record<string, string> = verbale.firma_data_url
    ? JSON.parse(verbale.firma_data_url) as Record<string, string>
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

