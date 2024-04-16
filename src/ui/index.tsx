import '@babylonjs/core/Materials/PBR/pbrSubSurfaceConfiguration';
import ReactDOM from 'react-dom/client';
import { JSX, StrictMode, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { CanvasContextProvider } from './context/CanvasContext';
import PCCUIRoot from './component/PCCUIRoot';

await new Promise(resolve => (window.onload = resolve));

const AppRootDiv = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'Arial', sans-serif;
`;

const RenderCanvas = styled.canvas`
  width: 100%;
  flex-grow: 1;
  display: block;
  outline: none;
`;

function Root(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current === null) {
      return;
    }

    setCanvas(canvasRef.current);
  }, [canvasRef.current]);

  return (
    <AppRootDiv>
      <RenderCanvas ref={canvasRef} />
      <CanvasContextProvider canvas={canvas}>
        <PCCUIRoot />
      </CanvasContextProvider>
    </AppRootDiv>
  );
}

const rootDiv = document.createElement('div');
rootDiv.style.width = '100vw';
rootDiv.style.height = '100vh';
rootDiv.style.margin = '0';
rootDiv.style.padding = '0';
document.body.appendChild(rootDiv);

const reactRoot = ReactDOM.createRoot(rootDiv);
reactRoot.render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
