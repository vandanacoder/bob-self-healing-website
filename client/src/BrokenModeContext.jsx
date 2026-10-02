import { createContext, useContext, useState } from 'react';

const BrokenModeContext = createContext(null);

export function BrokenModeProvider({ children }) {
  const [brokenMode, setBrokenMode] = useState(
    () => localStorage.getItem('brokenMode') === 'true'
  );

  function toggle(value) {
    const next = typeof value === 'boolean' ? value : !brokenMode;
    setBrokenMode(next);
    localStorage.setItem('brokenMode', String(next));
  }

  return (
    <BrokenModeContext.Provider value={{ brokenMode, setBrokenMode: toggle }}>
      {children}
    </BrokenModeContext.Provider>
  );
}

export function useBrokenMode() {
  return useContext(BrokenModeContext);
}
