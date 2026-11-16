import { ThemeProvider } from "./hooks";
import { UserProvider } from "./hooks/useUser";
import Router from "./Router";

function App() {
  return (
    <>
      <UserProvider>
        <ThemeProvider>
          <Router />
        </ThemeProvider>
      </UserProvider>
    </>
  );
}

export default App;
