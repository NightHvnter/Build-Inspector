// Where the app is published: the GitHub release built by .github/workflows/release.yml.
// The files keep the same name in every release, so "latest" always points to the newest.
export const REPO_URL = "https://github.com/NightHvnter/Build-Inspector";
export const RELEASES_URL = `${REPO_URL}/releases`;
const latest = (file: string) => `${RELEASES_URL}/latest/download/${file}`;

export type Platform = "windows" | "macos" | "linux";

export interface Download {
  platform: Platform;
  name: string;
  file: string;
  url: string;
  requirements: string;
  // What to do the first time: the app isn't signed with a paid certificate.
  firstLaunch: string;
  extra?: { label: string; url: string };
}

export const DOWNLOADS: Download[] = [
  {
    platform: "windows",
    name: "Windows",
    file: "Build-Inspector-Setup.exe",
    url: latest("Build-Inspector-Setup.exe"),
    requirements: "Windows 10 o 11, 64 bit",
    firstLaunch:
      "Se Windows mostra “PC protetto da Windows”, scegli “Ulteriori informazioni” e poi “Esegui comunque”.",
  },
  {
    platform: "macos",
    name: "macOS",
    file: "Build-Inspector-macOS.dmg",
    url: latest("Build-Inspector-macOS.dmg"),
    requirements: "macOS 12 o successivo, Intel e Apple Silicon",
    firstLaunch:
      "Trascina l’app in Applicazioni. Al primo avvio fai clic destro sull’app e scegli “Apri”, oppure consentila da Impostazioni di Sistema › Privacy e sicurezza.",
  },
  {
    platform: "linux",
    name: "Linux",
    file: "Build-Inspector-Linux.AppImage",
    url: latest("Build-Inspector-Linux.AppImage"),
    requirements: "Distribuzioni a 64 bit (x86_64)",
    firstLaunch:
      "Rendi eseguibile il file (chmod +x Build-Inspector-Linux.AppImage) e avvialo. Su Debian e Ubuntu puoi usare anche il pacchetto .deb.",
    extra: { label: "Pacchetto .deb", url: latest("Build-Inspector-Linux.deb") },
  },
];

// The visitor's system, from the browser's user agent; null on phones and unknown systems.
export function detectPlatform(userAgent: string): Platform | null {
  if (/Android|iPhone|iPad|iPod/i.test(userAgent)) return null;
  if (/Windows/i.test(userAgent)) return "windows";
  if (/Mac OS X|Macintosh/i.test(userAgent)) return "macos";
  if (/Linux|X11/i.test(userAgent)) return "linux";
  return null;
}
