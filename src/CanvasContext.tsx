import { ReactNode, createContext, useContext } from 'react';

const CanvasContext = createContext<HTMLCanvasElement | null>(null);

interface CanvasContextProviderProps {
  children: ReactNode | ReactNode[];
  canvas: HTMLCanvasElement | null;
}

export function CanvasContextProvider(props: CanvasContextProviderProps) {
  return (
    <CanvasContext.Provider value={props.canvas}>
      {props.children}
    </CanvasContext.Provider>
  );
}

export function useCanvas(): HTMLCanvasElement | null {
  return useContext(CanvasContext);
}
