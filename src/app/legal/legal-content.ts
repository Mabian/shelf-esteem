export type Language = 'de' | 'en';

export const LANGUAGES: readonly { readonly code: Language; readonly label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
];

export interface LegalSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
}

export const IMPRINT = {
  address: [
    'Mabian - Fabian Manz',
    'c/o Online-Impressum.de #32298',
    'Europaring 90',
    '53757 Sankt Augustin',
  ],
  email: 'mabian@mein.online-impressum.de',
  secondContactUrl: 'https://mein.online-impressum.de/mabian/#zweiterkontaktweg',
  text: {
    de: {
      title: 'Impressum',
      secondContact: 'Zweiter Kontaktweg',
      note: 'Angaben gemäß § 5 DDG und § 18 Abs. 1 MStV.',
    },
    en: {
      title: 'Legal Notice',
      secondContact: 'Second contact option',
      note: 'Information pursuant to § 5 DDG and § 18 (1) MStV of German law.',
    },
  },
} as const;

const GITHUB_PRIVACY =
  'https://docs.github.com/site-policy/privacy-policies/github-privacy-statement';
const CLOUDFLARE_PRIVACY = 'https://www.cloudflare.com/privacypolicy/';
const GOODREADS_PRIVACY = 'https://www.goodreads.com/about/privacy';

export const PRIVACY: Readonly<
  Record<Language, { readonly title: string; readonly sections: readonly LegalSection[] }>
> = {
  de: {
    title: 'Datenschutzerklärung',
    sections: [
      {
        heading: 'Verantwortlicher',
        paragraphs: [
          'Verantwortlich für die Datenverarbeitung auf dieser Seite ist die im Impressum genannte Person.',
        ],
      },
      {
        heading: 'Hosting',
        paragraphs: [
          'Diese Seite wird über GitHub Pages bereitgestellt, einen Dienst der GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA.',
          'Beim Abruf der Seite erhebt GitHub technisch notwendige Zugriffsdaten in Server-Logfiles, darunter die IP-Adresse des abrufenden Geräts. Auf Umfang und Dauer dieser Verarbeitung habe ich keinen Einfluss. Rechtsgrundlage ist das berechtigte Interesse an einer sicheren und zuverlässigen Bereitstellung der Seite nach Art. 6 Abs. 1 lit. f DSGVO.',
          `Einzelheiten dazu finden sich in der Datenschutzerklärung von GitHub unter ${GITHUB_PRIVACY}.`,
        ],
      },
      {
        heading: 'Abruf des Goodreads-Regals',
        paragraphs: [
          'Wenn Sie eine Goodreads-Nutzer-ID eingeben, lädt die Seite das öffentliche „Read“-Regal dieses Profils von Goodreads. Weil Goodreads keine direkten Abrufe aus dem Browser zulässt, läuft die Anfrage über einen Cloudflare Worker, einen Dienst der Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA.',
          'Dabei verarbeitet Cloudflare die IP-Adresse Ihres Geräts und die eingegebene Nutzer-ID, um die Anfrage an Goodreads weiterzuleiten. An Goodreads wird nur die Nutzer-ID weitergegeben, nicht Ihre IP-Adresse. Der Worker selbst speichert und protokolliert nichts. Rechtsgrundlage ist das berechtigte Interesse an der Bereitstellung der von Ihnen angefragten Funktion nach Art. 6 Abs. 1 lit. f DSGVO.',
          `Einzelheiten finden sich in der Datenschutzerklärung von Cloudflare unter ${CLOUDFLARE_PRIVACY}.`,
        ],
      },
      {
        heading: 'Buchcover',
        paragraphs: [
          'Die Buchcover lädt Ihr Browser direkt von den Servern von Goodreads (Goodreads LLC, ein Unternehmen von Amazon). Dabei wird die IP-Adresse Ihres Geräts an Goodreads übertragen. Rechtsgrundlage ist das berechtigte Interesse an einer vollständigen Darstellung des Regals nach Art. 6 Abs. 1 lit. f DSGVO.',
          `Einzelheiten finden sich in der Datenschutzerklärung von Goodreads unter ${GOODREADS_PRIVACY}.`,
        ],
      },
      {
        heading: 'Keine Cookies, keine Analyse',
        paragraphs: [
          'Diese Anwendung setzt keine Cookies, legt nichts im Speicher des Browsers ab und bindet keine Analyse-, Tracking- oder Werbedienste ein. Die eingegebene Nutzer-ID und das geladene Regal werden nur so lange im Browser gehalten, wie die Seite geöffnet ist.',
        ],
      },
      {
        heading: 'Keine weiteren Inhalte von Dritten',
        paragraphs: [
          'Die Schriftarten werden von derselben Adresse ausgeliefert wie die Seite selbst. Außer den oben genannten Abrufen über Cloudflare und Goodreads werden keine Inhalte von fremden Servern nachgeladen.',
          'Die Fußzeile und diese Erklärung enthalten Verweise auf fremde Seiten. Eine Verbindung dorthin entsteht erst, wenn ein solcher Verweis angeklickt wird.',
        ],
      },
      {
        heading: 'Ihre Rechte',
        paragraphs: [
          'Sie haben das Recht auf Auskunft über die zu Ihnen gespeicherten Daten sowie auf deren Berichtigung, Löschung oder Einschränkung der Verarbeitung. Wenden Sie sich dafür an die im Impressum genannte Adresse.',
          'Daneben steht Ihnen ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu.',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    sections: [
      {
        heading: 'Controller',
        paragraphs: [
          'The person named in the legal notice is responsible for the data processing on this site.',
        ],
      },
      {
        heading: 'Hosting',
        paragraphs: [
          'This site is served through GitHub Pages, a service of GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA.',
          'When the site is requested, GitHub records technically necessary access data in server log files, including the IP address of the requesting device. I have no influence over the scope or the duration of that processing. The legal basis is the legitimate interest in providing the site securely and reliably, Art. 6(1)(f) GDPR.',
          `The details are set out in GitHub's privacy statement at ${GITHUB_PRIVACY}.`,
        ],
      },
      {
        heading: 'Loading the Goodreads shelf',
        paragraphs: [
          'When you enter a Goodreads user ID, the site loads the public "read" shelf of that profile from Goodreads. Goodreads does not allow such requests directly from the browser, so the request goes through a Cloudflare Worker, a service of Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA.',
          'Cloudflare processes the IP address of your device and the user ID you entered in order to forward the request to Goodreads. Only the user ID is passed on to Goodreads, not your IP address. The worker itself stores and logs nothing. The legal basis is the legitimate interest in providing the function you asked for, Art. 6(1)(f) GDPR.',
          `The details are set out in Cloudflare's privacy policy at ${CLOUDFLARE_PRIVACY}.`,
        ],
      },
      {
        heading: 'Book covers',
        paragraphs: [
          'Your browser loads the book covers directly from the servers of Goodreads (Goodreads LLC, an Amazon company). This transmits the IP address of your device to Goodreads. The legal basis is the legitimate interest in showing the shelf in full, Art. 6(1)(f) GDPR.',
          `The details are set out in Goodreads' privacy notice at ${GOODREADS_PRIVACY}.`,
        ],
      },
      {
        heading: 'No cookies, no analytics',
        paragraphs: [
          'This application sets no cookies, stores nothing in the browser and embeds no analytics, tracking or advertising services. The user ID you enter and the shelf that is loaded are kept in the browser only for as long as the page is open.',
        ],
      },
      {
        heading: 'No other third-party content',
        paragraphs: [
          'The fonts are served from the same address as the site itself. Apart from the requests through Cloudflare and to Goodreads described above, nothing is loaded from outside servers.',
          'The footer and this policy link to external sites. A connection is made only once such a link is followed.',
        ],
      },
      {
        heading: 'Your rights',
        paragraphs: [
          'You have the right to information about the data held about you, and to its correction, deletion or the restriction of its processing. Please write to the address given in the legal notice.',
          'You also have the right to lodge a complaint with a data protection supervisory authority.',
        ],
      },
    ],
  },
};
