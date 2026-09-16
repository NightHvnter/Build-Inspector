import { ThemeProvider } from "./hooks"
import Router from "./Router"

function App() {
  return (
    <>
      <ThemeProvider>
        <Router />
      </ThemeProvider>
    </>
  )
}

export default App
