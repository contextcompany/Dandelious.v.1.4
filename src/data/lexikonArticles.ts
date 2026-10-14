export interface LexikonArticle {
  id: string;
  category: string;
  title: string;
  shortDesc: string;
  iconName: string;
  paragraphs: string[];
}

export interface LexikonCategory {
  id: string;
  title: string;
  description: string;
  articles: LexikonArticle[];
}

export const LEXIKON_DATA: LexikonCategory[] = [
  {
    id: 'models',
    title: 'Modelle & Intelligenz',
    description: 'Architektur, Denkmodus und Parameter der Dandelious KI-Engines.',
    articles: [
      {
        id: 'gemini-38-flash',
        category: 'Modelle & Intelligenz',
        title: 'Dandelious 3.8 Flash Engine',
        shortDesc: 'Die primäre Hochleistungs-Engine für blitzschnelle Antworten und präzises Reasoning.',
        iconName: 'Cpu',
        paragraphs: [
          'Die **Dandelious 3.8 Flash Engine** ist das Herzstück unseres Systems. Sie wurde gezielt für **minimale Latenz** und **maximale logische Präzision** entwickelt. Anfragen werden in Echtzeit analysiert und ohne spürbare Wartezeit direkt gestreamt.',
          'Dank des riesigen Kontextfensters von bis zu **1.000.000 Tokens** kann die Engine hunderte Seiten Text, ganze Quellcode-Dateien oder ausgedehnte Konversationen im aktiven Gedächtnis halten, ohne frühere Details zu vergessen.',
          'Flash verarbeitet **Text**, **Code**, **strukturierte Daten** und **Bildinhalte** nativ multimodal. Sollte ein Server-Endpunkt temporär ausgelastet sein, schützt eine automatische **Fallback-Pipeline** vor Verbindungsabbrüchen.'
        ]
      },
      {
        id: 'pro-reasoning',
        category: 'Modelle & Intelligenz',
        title: 'Dandelious Pro & Denkmodus',
        shortDesc: 'Tiefes logisches Reasoning mit sichtbarem Überlegungs- und Reflexionsprozess.',
        iconName: 'Brain',
        paragraphs: [
          'Im **Dandelious Pro Denkmodus** durchläuft die KI vor der Ausgabe einen internen **Reflexionsprozess**. Anstatt Wörter rein statistisch aneinanderzureihen, plant das Modell die Lösungsstrategie, prüft Randbedingungen und korrigiert logische Widersprüche selbstständig.',
          'Dieser Modus ist ideal für **komplexe Software-Architekturen**, **mathematische Beweise**, **Algorithmen** sowie anspruchsvolle **wissenschaftliche Analysen**, bei denen absolute Exaktheit gefordert ist.',
          'Die internen Zwischenschritte lassen sich in der Benutzeroberfläche transparent einsehen, um die Herleitung der Ergebnisse Schritt für Schritt nachzuvollziehen.'
        ]
      },
      {
        id: 'ultra-nextgen',
        category: 'Modelle & Intelligenz',
        title: 'Dandelious Ultra & Experimental',
        shortDesc: 'Maximale Rechenleistung, 2 Millionen Tokens Kontext und Next-Gen Features.',
        iconName: 'Sparkles',
        paragraphs: [
          '**Dandelious Ultra** repräsentiert die Speerspitze unserer Forschung. Mit einem gigantischen Kontextfenster von **2.000.000 Tokens** lassen sich ganze Bibliotheken, vollständige Repositories und mehrbändige Dokumentationen in einem einzigen Prompt analysieren.',
          'Anfragen an Ultra werden auf **priorisierten Hochleistungs-Clustern** verarbeitet. Selbst zu weltweiten Spitzenzeiten garantiert Ultra höchste Token-Durchsätze ohne Drosselung.',
          'Nutzer der Ultra-Stufe erhalten zudem **Early Access** zu neuen experimentellen Modell-Builds, multimodalen Synthese-Tools und erweiterten Systemfunktionen.'
        ]
      },
      {
        id: 'parameters-tuning',
        category: 'Modelle & Intelligenz',
        title: 'Modell-Parameter (Temperature & Top-P)',
        shortDesc: 'Feinabstimmung zwischen kreativer Freiheit und mathematischer Exaktheit.',
        iconName: 'Sliders',
        paragraphs: [
          'Über die **Temperatur** regulierst du die Kreativität der Antworten. Ein niedriger Wert (z. B. **0.2**) erzeugt präzise, deterministische und faktenbasierte Ergebnisse – perfekt für Programmcode und Datenformate. Ein höherer Wert (z. B. **0.8**) begünstigt metaphorische Sprache und kreatives Brainstorming.',
          '**Top-P (Nucleus Sampling)** schneidet unpassende Wortkombinationen an der Wahrscheinlichkeitsgrenze ab, sodass auch bei kreativen Prompts die grammatikalische und semantische Stimmigkeit gewahrt bleibt.',
          'Alle Parameter lassen sich unter **Einstellungen → Parameter** global oder situativ an deine bevorzugte Arbeitsweise anpassen.'
        ]
      }
    ]
  },
  {
    id: 'limits',
    title: 'Nutzung & Tarife',
    description: 'Wie dynamische Limits, Regenerationszyklen und Access Cards funktionieren.',
    articles: [
      {
        id: 'dynamic-limits',
        category: 'Nutzung & Tarife',
        title: 'Dynamische Nutzungslimits',
        shortDesc: 'Das adaptive Kontingentsystem ohne starre Sperren.',
        iconName: 'Clock',
        paragraphs: [
          'Dandelious setzt auf ein **faires, adaptives Nutzungskontingent**. Statt starrer 24-Stunden-Sperren regenerieren sich deine verfügbaren Anfragen kontinuierlich in regelmäßigen Zeitfenstern.',
          'Das System passt sich deinen Arbeitsgewohnheiten an. Kurze Unterbrechungen füllen das Kontingent automatisch wieder auf. Unter **Einstellungen → Nutzungslimits** kannst du deinen aktuellen Kontingentstand jederzeit transparent ablesen.',
          'Für dringende Projekte steht unter bestimmten Bedingungen ein **manueller Notfall-Reset** zur Verfügung, um ohne Verzögerung weiterarbeiten zu können.'
        ]
      },
      {
        id: 'tarife-plans',
        category: 'Nutzung & Tarife',
        title: 'Tarife: Plus, Pro & Ultra',
        shortDesc: 'Echtes Multiplikatorensystem für Power-User und Entwickler.',
        iconName: 'Zap',
        paragraphs: [
          'Der **Plus-Tarif** verdoppelt dein Kontingent mit einem **2x Multiplikator** und schaltet die optimierte Plus-Modellpipeline frei. Ideal für die tägliche Recherche und Texterstellung.',
          'Der **Pro-Tarif** bietet ein **4x Nutzungskontingent** und aktiviert den vollen **Denkmodus** mit Deep Reasoning für anspruchsvolle Entwickler und Analysten.',
          'Der **Ultra-Tarif** maximiert die Leistung mit einem **6x Kontingent**, **höchster Server-Priorität** und vollem Zugriff auf experimentelle Next-Gen-Modelle.'
        ]
      },
      {
        id: 'access-cards',
        category: 'Nutzung & Tarife',
        title: 'Access Cards aktivieren',
        shortDesc: 'Prepaid-Lizenzschlüssel ohne Kreditkarten-Zwang oder Monatsabo.',
        iconName: 'Key',
        paragraphs: [
          '**Access Cards** sind offizielle Lizenzschlüssel, mit denen du Tarife für **365 Tage** freischaltest – völlig ohne Abo-Fallen oder Kreditkartenpflicht.',
          'Unter **Einstellungen → Abos** gibst du deinen Code (z. B. im Format **PRO-194028471**) in das Feld ein. Ein Klick auf **„Einlösen“** aktiviert deine Vorteile sekundenschnell.',
          'Eingelöste Tarife sind an dein Profil gebunden und gelten geräteübergreifend auf Smartphones, Tablets und PCs.'
        ]
      }
    ]
  },
  {
    id: 'chat',
    title: 'Chat-Steuerung & Prompts',
    description: 'Multiline-Eingaben, Chatverwaltung, Pinnen und Tastaturkürzel.',
    articles: [
      {
        id: 'prompt-editor',
        category: 'Chat-Steuerung & Prompts',
        title: 'Prompt-Eingabe & Multiline-Editor',
        shortDesc: 'Ergonomische Eingabeleiste für mehrzeilige Prompts und strukturierte Befehle.',
        iconName: 'Terminal',
        paragraphs: [
          'Die Eingabekapsel expandiert automatisch, sobald du mehrzeilige Prompts, Markdown oder Code einfügst. So behältst du auch bei langen Eingaben stets den vollen Überblick.',
          'Mit **Enter** sendest du den Prompt ab. Drückst du **Shift + Enter**, fügst du einen sauberen Zeilenumbruch ein, ohne die Nachricht versehentlich abzuschicken.',
          'Drücke im leeren Textfeld die **Pfeiltaste nach oben (↑)**, um deine zuletzt gesendete Nachricht wiederherzustellen und schnell Korrekturen vorzunehmen.'
        ]
      },
      {
        id: 'chat-management',
        category: 'Chat-Steuerung & Prompts',
        title: 'Unterhaltungen organisieren & anpinnen',
        shortDesc: 'Chatverläufe pinnen, umbenennen, durchsuchen und exportieren.',
        iconName: 'FileText',
        paragraphs: [
          'Wichtige Unterhaltungen kannst du mit dem **Stecknadel-Symbol** oben in der Seitenleiste anheften. Angepinnte Chats bleiben permanent an oberster Stelle fixiert.',
          'Dandelious vergibt automatisch passende Titel anhand des Chat-Inhalts. Per Doppelklick oder Kontextmenü kannst du jeden Namen jederzeit manuell editieren.',
          'Über den **Auswahlmodus** in der Seitenleiste lassen sich mehrere Chats markieren, um sie gesammelt zu archivieren oder zu löschen.'
        ]
      },
      {
        id: 'shortcuts-gestures',
        category: 'Chat-Steuerung & Prompts',
        title: 'Tastenkürzel & Gestensteuerung',
        shortDesc: 'Effizientes Arbeiten auf Desktop-Rechnern, Tablets und Smartphones.',
        iconName: 'Laptop',
        paragraphs: [
          'Wichtige Tastenkombinationen für maximale Geschwindigkeit: **Enter** zum Senden, **Shift + Enter** für Zeilenumbrüche und **Pfeiltaste Hoch (↑)** zum Laden des vorherigen Prompts.',
          'Ein Klick auf den abgedunkelten Hintergrund schließt jedes geöffnete Einstellungsfenster und Popup sofort.',
          'Auf Mobilgeräten und Tablets löst sich das **Schließen-Kreuz beim Herunterscrollen** sanft auf, um dir die gesamte Lesehöhe ungestört zur Verfügung zu stellen.'
        ]
      }
    ]
  },
  {
    id: 'tools',
    title: 'Werkzeuge & Studios',
    description: 'Code-Editor, multimodale Bildgenerierung und Sprachausgabe.',
    articles: [
      {
        id: 'mediathek-guide',
        category: 'Werkzeuge & Studios',
        title: 'Die Dandelious Mediathek',
        shortDesc: 'Zentraler Knotenpunkt für Dokumente, Deep Research, Kochbücher, Projekte und Medien.',
        iconName: 'Layers',
        paragraphs: [
          'Die **Dandelious Mediathek** ist dein zentrales, intelligentes Archiv für alle erstellten und gesicherten Medien: **Dokumente**, **Deep Research Dossiers**, **Kochbücher & Rezepte**, **Projekte**, **Videos** und **Bilder**.',
          'Über die beiden oberen Bereiche **Meine** und **Community** wechselst du blitzschnell zwischen deinen eigenen Inhalten und öffentlich freigegebenen Beiträgen der Community.',
          'Jeder Bereich ist als **interaktive Kapsel** aufgebaut. Durch Antippen öffnet sich das Popup, in dem du deine Dokumente, Kochbücher oder Projekte organisieren, ansehen, veröffentlichen oder wieder unveröffentlichen kannst.'
        ]
      },
      {
        id: 'code-workspace',
        category: 'Werkzeuge & Studios',
        title: 'Code-Editor & Skriptausführung',
        shortDesc: 'Integrierte Entwicklungsumgebung mit Syntax-Highlighting und Code-Kopieren.',
        iconName: 'FileCode',
        paragraphs: [
          'Alle Code-Ausgaben von Dandelious verfügen über automatisches **Syntax-Highlighting** für über 40 Programmiersprachen (TypeScript, Python, Rust, Go, SQL, HTML/CSS).',
          'Mit dem **Kopier-Symbol** überträgst du Quelltexte mit einem Klick formatiert in deine Zwischenablage.',
          'Im Menü steht dir zudem ein vollwertiger **Code-Editor** zur Verfügung, um Skripte direkt im Browser zu verfassen und zu modifizieren.'
        ]
      },
      {
        id: 'multimodal-images',
        category: 'Werkzeuge & Studios',
        title: 'Multimodale Analyse & Bildgenerierung',
        shortDesc: 'Visuelle Dokumentenanalyse und fotorealistische Bilder mit Imagen 3.',
        iconName: 'Palette',
        paragraphs: [
          'Über das **Upload-Symbol** kannst du Screenshots, Diagramme oder Dokumente hochladen. Die multimodale Engine erkennt Text, interpretiert Schaubilder und beantwortet Fragen zum Bildinhalt.',
          'Im Kreativ-Studio erstellst du **fotorealistische Bilder**, Mockups und Illustrationen auf Basis deiner Textprompts.',
          'Dabei stehen verschiedene **Seitenverhältnisse** (1:1 Quadrat, 16:9 Querformat, 9:16 Story-Format) zur freien Auswahl.'
        ]
      },
      {
        id: 'audio-voice',
        category: 'Werkzeuge & Studios',
        title: 'Sprachausgabe & Voice Mode',
        shortDesc: 'Lebensechte Sprachsynthese und Audio-Wiedergabe.',
        iconName: 'Volume2',
        paragraphs: [
          'Mit einem Klick auf das **Lautsprecher-Symbol** liest dir Dandelious jede Antwort mit natürlicher Betonung und sauberem Redefluss vor.',
          'Die Sprachsynthese arbeitet mit modernen **neuronalen Sprachmodellen**, die speziell auf deutsche Grammatik und Fachbegriffe trainiert wurden.',
          'Unter **Einstellungen → Audio** kannst du Lesegeschwindigkeit und Tonhöhe nach deinen Wünschen feineinstellen.'
        ]
      }
    ]
  },
  {
    id: 'memory',
    title: 'Gedächtnis & Kontext',
    description: 'Wie Erinnerungen gespeichert werden und wie System-Instruktionen wirken.',
    articles: [
      {
        id: 'memory-system',
        category: 'Gedächtnis & Kontext',
        title: 'Erinnerungen & Langzeitgedächtnis',
        shortDesc: 'Automatisches Merken von Vorlieben und Fakten über Unterhaltungen hinweg.',
        iconName: 'Database',
        paragraphs: [
          'Dandelious kann sich wichtige Fakten über dich merken – etwa deine bevorzugten **Frameworks**, deinen **Arbeitsstil** oder wiederkehrende **Projektkontexte**.',
          'Dadurch musst du wichtige Hintergrundinformationen nicht in jeder neuen Unterhaltung wiederholen.',
          'Unter **Einstellungen → Erinnerungen** behältst du die volle Kontrolle: Hier kannst du alle gespeicherten Fakten einsehen, manuell bearbeiten oder rückstandslos löschen.'
        ]
      },
      {
        id: 'custom-instructions',
        category: 'Gedächtnis & Kontext',
        title: 'Benutzerdefinierte System-Instruktionen',
        shortDesc: 'Rollen, Antwortstile und globale Verhaltensregeln für die KI festlegen.',
        iconName: 'Bot',
        paragraphs: [
          'Unter **Einstellungen → Kontext** kannst du der KI dauerhafte Rollenanweisungen mitgeben (z. B. „Verwende ausschließlich TypeScript“ oder „Antworte in prägnanten Stichpunkten“).',
          'Diese Instruktionen werden unsichtbar vor jeden neuen Chat geschaltet, sodass sich Dandelious stets an deine persönlichen Vorgaben hält.',
          'Du kannst den Kontext jederzeit pausieren oder für unterschiedliche Arbeitsbereiche anpassen.'
        ]
      }
    ]
  },
  {
    id: 'security',
    title: 'Datenschutz & Sicherheit',
    description: 'Eigener API-Key, lokale Datenspeicherung und Backup-Export.',
    articles: [
      {
        id: 'custom-api-key',
        category: 'Datenschutz & Sicherheit',
        title: 'Eigener Google AI Studio Key',
        shortDesc: 'Volle Unabhängigkeit von geteilten Limits mit deinem eigenen API-Schlüssel.',
        iconName: 'Shield',
        paragraphs: [
          'Wenn du deinen eigenen kostenlosen **Google AI Studio API-Key** hinterlegst, laufen alle Anfragen direkt über dein persönliches Kontingent.',
          'Dadurch bist du völlig unabhängig von geteilten Systemressourcen und profitierst dauerhaft von **maximaler Geschwindigkeit**.',
          'Dein API-Key wird **verschlüsselt lokal im Browser** gespeichert und zu keinem Zeitpunkt an externe Server übertragen.'
        ]
      },
      {
        id: 'privacy-backup',
        category: 'Datenschutz & Sicherheit',
        title: 'Lokale Speicherung & Backup-Export',
        shortDesc: '100% Datenschutz: Deine Daten gehören ausschließlich dir.',
        iconName: 'HardDrive',
        paragraphs: [
          'Deine Unterhaltungen verbleiben unter deiner **vollen Kontrolle**. Dandelious verwendet private Chatverläufe nicht zum Trainieren öffentlicher KI-Modelle.',
          'Unter **Einstellungen → Backup** kannst du dein gesamtes Profil – inklusive Chats, Einstellungen und Erinnerungen – als **JSON-Datei exportieren** und auf anderen Geräten wieder einspielen.',
          'Unter **Einstellungen → Aktivitäten** lässt sich der gesamte Zwischenspeicher mit einem Klick sauber bereinigen.'
        ]
      }
    ]
  }
];
