import '@babylonjs/core/Materials/PBR/pbrSubSurfaceConfiguration';
import ReactDOM from 'react-dom/client';
import { JSX, StrictMode, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { CanvasContextProvider } from './context/CanvasContext';
import PCCUIRoot from './component/PCCUIRoot';

await new Promise(resolve => (window.onload = resolve));

export const verticalUiSize = 'min(120mm, 45%)';
export const horizontalUiSize = 'min(100mm, 35%)';

const AppRootDiv = styled.div`
  width: 100%;
  height: 100%;
  display: flex;

  flex-direction: row;
  @media screen and (orientation: portrait) {
    flex-direction: column;
  }
  font-family: 'Arial', sans-serif;
`;

const RenderCanvas = styled.canvas`
  @media screen and (orientation: portrait) {
    width: 100%;
    height: calc(100% - ${() => verticalUiSize});
  }
  @media screen and (orientation: landscape) {
    width: calc(100% - ${() => horizontalUiSize});
    height: 100%;
  }
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
rootDiv.style.width = '100%';
rootDiv.style.height = '100%';
rootDiv.style.margin = '0';
rootDiv.style.padding = '0';
document.body.appendChild(rootDiv);

const reactRoot = ReactDOM.createRoot(rootDiv);
reactRoot.render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
