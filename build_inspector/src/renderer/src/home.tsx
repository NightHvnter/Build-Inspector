import type { JSX } from 'react'
import { useAuth } from './hooks/useAuth'
import { Library } from './library'
import { HomeIntro } from './components/home/HomeIntro'
import { RecentComparisons } from './components/home/RecentComparisons'

// /home: the app's start page. A short intro, the latest comparisons once signed in, and
// the game catalog itself, so the first screen is already where games are chosen.
export function HomePage(): JSX.Element {
  const { user } = useAuth()
  return (
    <>
      <HomeIntro user={user} />
      {user && <RecentComparisons />}
      <Library embedded />
    </>
  )
}
