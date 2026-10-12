import type { JSX } from 'react'
import { Button } from '@mui/material'

// Introduzione alla libreria, condivisa da ospiti e utenti registrati.
export function PreRegistrazione({
  onOpenAuth,
  isLoggedIn
}: {
  onOpenAuth: () => void
  isLoggedIn: boolean
}): JSX.Element {
  return (
    <section className="library-intro">
      <h1>Libreria giochi</h1>
      <p>
        Sfoglia i giochi e consulta i requisiti. Nel pannello puoi inserire i componenti del tuo PC.
      </p>
      <Button variant="outlined" onClick={onOpenAuth}>
        {isLoggedIn ? 'Apri la mia configurazione' : 'Registrati per salvare la configurazione'}
      </Button>
    </section>
  )
}
