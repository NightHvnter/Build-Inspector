import { createContext, useContext, useState } from "react";
import type { ProviderProps, UserContextType } from "../interfaces";

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: ProviderProps) => {
  
    const [open, setOpen] = useState<boolean>(false);

    const HandleOpen = () => setOpen(true);
    const HandleClose = () => setOpen(false);

  return (
    <UserContext.Provider value={{Open: open, HandleClose, HandleOpen}}>
        {children}
    </UserContext.Provider>
  );
};

// 6. Il Custom Hook da esportare e usare nei componenti
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error(
      "useUser deve essere usato all'interno di un UserProvider",
    );
  }
  return context;
};
