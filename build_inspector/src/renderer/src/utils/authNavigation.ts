// Accettiamo solo destinazioni interne conosciute dopo l'accesso.
export function getAuthDestination(search: string): string {
  const next = new URLSearchParams(search).get('next')
  return next === '/configurazione' || next === '/preferiti' ? next : '/libreria'
}
export function authLink(path: string, destination: string): string {
  return path + '?next=' + encodeURIComponent(destination)
}
