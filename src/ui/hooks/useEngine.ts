import { Engine } from '@babylonjs/core/Engines/engine';
import { useEffect, useState } from 'react';
import { useCanvas } from '../context/CanvasContext';

// for handle strict mode
let globalEngine: Engine | undefined = undefined;

export default function useEngine(): Engine | undefined {
  const [engine, setEngine] = useState<Engine>();

  const canvas = useCanvas();

  useEffect(() => {
    if (canvas === null) {
      return;
    }

    if (globalEngine !== undefined) {
      return;
    }

    setEngine(() => {
      if (globalEngine !== undefined) {
        return globalEngine;
      }

      const newEngine = new Engine(
        canvas,
        false,
        {
          preserveDrawingBuffer: false,
          stencil: false,
          antialias: false,
          alpha: false,
          premultipliedAlpha: false,
          powerPreference: 'high-performance',
          audioEngine: false,
          disableWebGL2Support: false,
        },
        true,
      );
      // newEngine.setHardwareScalingLevel(1.2);

      window.addEventListener('resize', () => newEngine.resize());

      globalEngine = newEngine;
      return newEngine;
    });
  }, [canvas, engine]);

  return engine;
}
