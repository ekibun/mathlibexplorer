import React, { useRef, useEffect, useMemo } from 'react';
import Visualizer from './core/visualizer';
import { round } from 'three/tsl';

export default (props) => {
  const { state, setState } = props;
  /** @type { MutableRefObject<HTMLCanvasElement> } */ const canvas = useRef();
  /** @type { MutableRefObject<Visualizer> } */ const visualizer = useRef();
  useEffect(() => {
    canvas.current.oncontextmenu = () => false; // 屏蔽右键菜单
    const current = new Visualizer(canvas.current, setState);
    visualizer.current = current;
    return () => {
      current.destroy();
    };
  }, [setState]);

  const { labels, cats } = useMemo(() => {
    const visualizerCurrent = visualizer.current;
    if (visualizerCurrent) {
      const hit = state.graph.hit && state.graph.nodes[state.graph.hit];
      const pick = Array.isArray(state.graph.pick) || state.graph.pick === hit ? undefined : state.graph.pick;
      const cats = state.graph.cats;
      return {
        labels: [hit, pick].map((v) => {
          if (v) return {
            name: v.name,
            pos: visualizerCurrent.scene.camera.project([v.x, v.y, 0])
          };
        }).filter(v => v),
        cats: Object.keys(cats ?? {}).map((key) => {
          const cat = cats[key];
          return {
            name: key,
            nodes: cat.nodes,
            pos: visualizerCurrent.scene.camera.project([cat.sumx / cat.sumsize, cat.sumy / cat.sumsize, 0])
          }
        })
      }
    }
    return {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visualizer.current, state]);

  return (
    <>
      <canvas
        ref={canvas}
      />
      <div
        {...Object.assign({}, ...['onWheel', 'onClick', 'onPointerMove'].map((key) => ({
          [key]: (event) => {
            const current = visualizer.current;
            if (current && current[key]) return current[key](event);
          },
        })))}
        style={{
          position: 'absolute',
          left: '0px',
          top: '0px',
          width: '100%',
          height: '100%',
          userSelect: 'none',
        }}>
        {cats &&
          cats.map((cat) => (
            <pre key={cat.name} style={{
              position: 'absolute',
              left: `${Math.round(cat.pos[0])}px`,
              top: `${Math.round(cat.pos[1])}px`,
              transform: 'translate(-50%, -50%)',
              fontFamily: 'Arial',
              margin: '0',
              color: 'white',
              backgroundColor: '#000c',
            }} onClick={(event) => {
              const current = visualizer.current;
              console.log(cat);
              if (current) {
                current.toggleHit(cat.nodes);
              }
              event.stopPropagation();
            }}>{cat.name}</pre>
          ))}
        {labels && labels.map((hit) => (
          <pre style={{
            position: 'absolute',
            pointerEvents: 'none',
            left: `${Math.round(hit.pos[0])}px`,
            top: `${Math.round(hit.pos[1])}px`,
            transform: 'translateY(-50%)',
            fontFamily: 'Arial',
            margin: '0',
            color: 'white',
            backgroundColor: '#000c',
          }}>{hit.name}</pre>
        ))}

      </div>
    </>
  );
};
