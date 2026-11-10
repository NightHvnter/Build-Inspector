export interface Game {
  id: number
  title: string
  image: string
  genre: string[]
  description: string
  reqCpu: string
  reqGpu: string
  reqRam: number
  baseFps: number
}

// Catalogo dimostrativo: i requisiti e i punteggi esistenti non sono benchmark verificati.
export const STEAM_GAMES: Game[] = [
  {
    id: 1,
    title: 'Counter-Strike 2',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg',
    genre: ['FPS', 'Azione', 'Competitivo'],
    description: 'Il più famoso sparatutto tattico al mondo.',
    reqCpu: 'Intel Core i5-750 / AMD FX-6300',
    reqGpu: 'NVIDIA GTX 1060 / AMD RX 580',
    reqRam: 8,
    baseFps: 180
  },
  {
    id: 2,
    title: 'Dota 2',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/570/header.jpg',
    genre: ['MOBA', 'Strategia', 'Multigiocatore'],
    description: 'Un capolavoro di strategicità profonda.',
    reqCpu: 'Dual core Intel / AMD a 2.8 GHz',
    reqGpu: 'NVIDIA GeForce 8600/9600GT',
    reqRam: 4,
    baseFps: 120
  },
  {
    id: 3,
    title: 'Cyberpunk 2077',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg',
    genre: ['RPG', 'Open World', 'Cyberpunk'],
    description: "Un RPG d'azione a mondo aperto ambientato a Night City.",
    reqCpu: 'Intel Core i7-12700 / AMD Ryzen 7 7800X3D',
    reqGpu: 'NVIDIA RTX 3070 / AMD RX 6800 XT',
    reqRam: 16,
    baseFps: 65
  },
  {
    id: 4,
    title: 'Elden Ring',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg',
    genre: ['Souls-like', 'RPG', 'Open World'],
    description: "Esplora l'Interregno e scopri i segreti dell'Anello Anziano.",
    reqCpu: 'Intel Core i7-8700K / AMD Ryzen 5 3600X',
    reqGpu: 'NVIDIA GTX 1070 / AMD RX Vega 56',
    reqRam: 12,
    baseFps: 75
  },
  {
    id: 5,
    title: "Baldur's Gate 3",
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg',
    genre: ['RPG', 'Turni', 'Scelte tattiche'],
    description: "Un ricco RPG ambientato nell'universo di Dungeons & Dragons.",
    reqCpu: 'Intel i7 8700k / AMD r5 3600',
    reqGpu: 'NVIDIA RTX 2060 Super',
    reqRam: 16,
    baseFps: 70
  },
  {
    id: 6,
    title: 'Helldivers 2',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/553850/header.jpg',
    genre: ['Azione', 'Co-op', 'Spara e Fuggi'],
    description: 'Lotta per la libertà in una galassia ostile.',
    reqCpu: 'Intel Core i7-9700K',
    reqGpu: 'NVIDIA RTX 2060',
    reqRam: 16,
    baseFps: 80
  }
]
