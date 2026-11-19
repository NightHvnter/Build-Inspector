// Accettiamo solo destinazioni interne conosciute dopo l'accesso.
export function getAuthDestination(search: string): string {
  const next = new URLSearchParams(search).get('next')
  if (next === '/configurazione' || next === '/preferiti' || next === '/cronologia') return next
  // A game's comparison page: only a numeric Steam app id, never another path.
  if (next && /^\/confronto\/\d{1,10}$/.test(next)) return next
  return '/home'
}
export function authLink(path: string, destination: string): string {
  return path + '?next=' + encodeURIComponent(destination)
}
