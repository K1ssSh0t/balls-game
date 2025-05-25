import { useEffect, useRef } from 'react';
import Matter from 'matter-js';

export function useMatter(onUpdate: (engine: Matter.Engine) => void) {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const engine = Matter.Engine.create();
    const render = Matter.Render.create({
      element: sceneRef.current!,
      engine,
      options: {
        width: 600,
        height: 800,
        wireframes: false,
        background: '#fff',
      },
    });

    Matter.Engine.run(engine);
    Matter.Render.run(render);

    onUpdate(engine);

    // Cleanup
    return () => {
      Matter.Render.stop(render);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      render.canvas.remove();
    };
  }, [onUpdate]);

  return sceneRef;
}
