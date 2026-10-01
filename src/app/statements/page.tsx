"use client";

import Image from "next/image";
import Link from "next/link";
import { IconCheck, IconFileDescription, IconFileTypeCsv, IconShieldCheck } from "@tabler/icons-react";

import { useLanguage } from "@/components/LanguageProvider";
import { PdfStatementReview } from "@/components/statements/PdfStatementReview";

const copy = {
  en: { eyebrow: "Statement import", summary: "Import your CSV statement securely", title: "Turn your statement into transactions", description: "Select a CSV statement, review every detected row and choose exactly what will be added to MoneyPilot.", action: "Select and review CSV", privacy: "The file is parsed locally. Only transactions you confirm are sent to your account.", available: "AVAILABLE NOW", steps: [["Local CSV analysis", "Dates, descriptions, amounts and transaction types are detected in your browser."], ["Review before import", "Correct rows, skip errors and avoid possible duplicates before saving."], ["Atomic account import", "Confirmed rows are saved together; a failed batch does not leave a partial import."]], pdf: "PDF support is the next statement format planned." },
  pt: { eyebrow: "Importação de extrato", summary: "Importe seu extrato CSV com segurança", title: "Transforme seu extrato em transações", description: "Selecione um extrato CSV, revise cada linha detectada e escolha exatamente o que será adicionado ao MoneyPilot.", action: "Selecionar e revisar CSV", privacy: "O arquivo é analisado localmente. Apenas as transações confirmadas são enviadas para sua conta.", available: "DISPONÍVEL AGORA", steps: [["Análise local do CSV", "Datas, descrições, valores e tipos são detectados no seu navegador."], ["Revisão antes da importação", "Corrija linhas, ignore erros e evite possíveis duplicatas antes de salvar."], ["Importação atômica na conta", "As linhas confirmadas são salvas juntas; uma falha não deixa importação parcial."]], pdf: "O suporte a PDF é o próximo formato de extrato planejado." },
  es: { eyebrow: "Importación de extracto", summary: "Importa tu extracto CSV de forma segura", title: "Convierte tu extracto en transacciones", description: "Selecciona un extracto CSV, revisa cada fila detectada y elige exactamente qué se añadirá a MoneyPilot.", action: "Seleccionar y revisar CSV", privacy: "El archivo se analiza localmente. Solo las transacciones confirmadas se envían a tu cuenta.", available: "DISPONIBLE AHORA", steps: [["Análisis CSV local", "Las fechas, descripciones, importes y tipos se detectan en tu navegador."], ["Revisión antes de importar", "Corrige filas, omite errores y evita posibles duplicados."], ["Importación atómica", "Las filas confirmadas se guardan juntas, sin importaciones parciales."]], pdf: "La compatibilidad con PDF es el próximo formato previsto." },
  de: { eyebrow: "Kontoauszug importieren", summary: "CSV-Auszug sicher importieren", title: "Auszug in Transaktionen umwandeln", description: "Wähle einen CSV-Auszug, prüfe jede erkannte Zeile und bestimme, was zu MoneyPilot hinzugefügt wird.", action: "CSV auswählen und prüfen", privacy: "Die Datei wird lokal analysiert. Nur bestätigte Transaktionen werden an dein Konto gesendet.", available: "JETZT VERFÜGBAR", steps: [["Lokale CSV-Analyse", "Datum, Beschreibung, Betrag und Typ werden im Browser erkannt."], ["Prüfung vor Import", "Korrigiere Zeilen, überspringe Fehler und vermeide Duplikate."], ["Atomarer Import", "Bestätigte Zeilen werden gemeinsam und ohne Teilimport gespeichert."]], pdf: "PDF-Unterstützung ist als nächstes Format geplant." },
  fr: { eyebrow: "Import de relevé", summary: "Importez votre relevé CSV en sécurité", title: "Transformez votre relevé en transactions", description: "Sélectionnez un relevé CSV, vérifiez chaque ligne détectée et choisissez ce qui sera ajouté à MoneyPilot.", action: "Sélectionner et vérifier le CSV", privacy: "Le fichier est analysé localement. Seules les transactions confirmées sont envoyées à votre compte.", available: "DISPONIBLE", steps: [["Analyse CSV locale", "Dates, descriptions, montants et types sont détectés dans le navigateur."], ["Vérification avant import", "Corrigez les lignes, ignorez les erreurs et évitez les doublons."], ["Import atomique", "Les lignes confirmées sont enregistrées ensemble, sans import partiel."]], pdf: "La prise en charge PDF est le prochain format prévu." },
  nl: { eyebrow: "Afschrift importeren", summary: "Importeer je CSV-afschrift veilig", title: "Zet je afschrift om in transacties", description: "Selecteer een CSV-afschrift, controleer elke gedetecteerde regel en kies wat aan MoneyPilot wordt toegevoegd.", action: "CSV selecteren en controleren", privacy: "Het bestand wordt lokaal geanalyseerd. Alleen bevestigde transacties worden naar je account gestuurd.", available: "NU BESCHIKBAAR", steps: [["Lokale CSV-analyse", "Datums, beschrijvingen, bedragen en typen worden in je browser herkend."], ["Controle vóór import", "Corrigeer regels, sla fouten over en voorkom duplicaten."], ["Atomaire import", "Bevestigde regels worden samen opgeslagen, zonder gedeeltelijke import."]], pdf: "PDF-ondersteuning is het volgende geplande formaat." },
  it: { eyebrow: "Importazione estratto", summary: "Importa il tuo estratto CSV in sicurezza", title: "Trasforma l’estratto in transazioni", description: "Seleziona un estratto CSV, controlla ogni riga rilevata e scegli cosa aggiungere a MoneyPilot.", action: "Seleziona e rivedi CSV", privacy: "Il file viene analizzato localmente. Solo le transazioni confermate vengono inviate al tuo account.", available: "DISPONIBILE ORA", steps: [["Analisi CSV locale", "Date, descrizioni, importi e tipi vengono rilevati nel browser."], ["Revisione prima dell’importazione", "Correggi le righe, ignora gli errori ed evita duplicati."], ["Importazione atomica", "Le righe confermate vengono salvate insieme, senza importazioni parziali."]], pdf: "Il supporto PDF è il prossimo formato pianificato." },
} as const;

export default function StatementsPage() {
  const { language } = useLanguage();
  const text = copy[language];

  return (
    <main className="statement-flow">
      <section className="statement-card">
        <header className="flow-header">
          <div className="flow-brand"><Image src="/moneypilot/moneypilot-logo.svg" alt="" width={33} height={33} /><span>MoneyPilot</span></div>
          <p>{text.eyebrow}</p>
          <strong>{text.summary}</strong>
        </header>
        <div className="flow-icon" aria-hidden="true"><IconFileDescription /></div>
        <h1>{text.title}</h1>
        <p className="flow-description">{text.description}</p>
        <Link className="flow-primary" href="/transactions?import=1"><IconFileTypeCsv size={20} />{text.action}</Link>
        <p className="flow-reassurance"><IconShieldCheck size={15} aria-hidden="true" /> {text.privacy}</p>
        <section className="flow-panel">
          <h2>{text.available}</h2>
          {text.steps.map(([title, description]) => <TrustPoint key={title} title={title}>{description}</TrustPoint>)}
        </section>
        <p className="flow-reassurance">{text.pdf}</p>
        <PdfStatementReview />
      </section>
    </main>
  );
}

function TrustPoint({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="flow-step"><span className="flow-check"><IconCheck /></span><span><strong>{title}</strong><small>{children}</small></span></div>;
}
