import './index.css';
import React, { useRef, useEffect, useMemo } from 'react';
import Visualizer from './core/visualizer';

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
      const set = new Set();
      const hit = state.graph.hit && state.graph.nodes[state.graph.hit];
      if(hit) set.add(hit);
      if(state.graph.pick && !Array.isArray(state.graph.pick)) set.add(state.graph.pick);
      const labelsize = 30 / state.camera.scale;
      state.graph.nodes.forEach((n) => {
        if(n.size > labelsize) set.add(n);
      });
      const cats = state.graph.cats;
      return {
        labels: set.values().map((v) => {
          if (!v) return;
          const pos = visualizerCurrent.scene.camera.project([v.x, v.y, 0]);
          if(pos[0] < 0 || pos[1] < 0 || pos[0] > state.camera.width || pos[1] > state.camera.height) return;
          return {
            name: v.name,
            pos: pos
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
        {...Object.assign({}, ...[
          'onWheel', 
          'onClick', 
          'onPointerMove',
          'onTouchStart',
          'onTouchMove',
          'onTouchEnd'
        ].map((key) => ({
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
            <pre key={cat.name} className='label cat' style={{
              left: `${Math.round(cat.pos[0])}px`,
              top: `${Math.round(cat.pos[1])}px`,
            }} onClick={(event) => {
              const current = visualizer.current;
              if (current) {
                current.toggleHit(cat.nodes);
              }
              event.stopPropagation();
            }}
            onMouseMove={(() => {
              const current = visualizer.current;
              current?.scene.updateStatus({ graph: { hit: undefined } });
            })}
            >{cat.name}</pre>
          ))}
        {labels && labels.map((hit, i) => (
          <pre key={i} className='label node' style={{
            left: `${Math.round(hit.pos[0])}px`,
            top: `${Math.round(hit.pos[1])}px`,
          }}>{hit.name}</pre>
        ))}

      </div>
    </>
  );
};
