import './index.css';
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Visualizer, { tree } from './core/visualizer';
import { AiOutlineLink } from "react-icons/ai";
import Markdown from 'react-markdown';
import 'katex/dist/katex.min.css'

function getPickInfo(state) {
  const pick = state.graph?.pick;
  if(!pick) return;
  if(Array.isArray(pick) && pick.length > 0) {
    const node = state.graph.nodes[pick[0]]
    return {
      name: node.cat || node.name,
      cat: `${pick.length} elems`,
      path: node.path.replace(/\/[^/]+$/, '')
    }
  }
  if(pick.name) {
    return {
      ...pick,
      cat: `${pick.cat} | ${pick.from.length} ref | ${pick.to.length} use`
    }
  }
}

export default () => {
  const [state, setState] = useState({});
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

  const { labels, cats, pick } = useMemo(() => {
    const visualizerCurrent = visualizer.current;
    if (visualizerCurrent) {
      const set = new Set();
      const labelsize = 30 / state.camera.scale;
      state.graph.nodes.forEach((n) => {
        if (n.size > labelsize) set.add(n);
      });
      const setArray = Array.from(set);
      const hit = state.graph.hit && state.graph.nodes[state.graph.hit];
      if (hit) setArray.push(hit);
      if (state.graph.pick && !Array.isArray(state.graph.pick)) setArray.push(state.graph.pick);
      const cats = state.graph.cats;
      return {
        labels: setArray.map((v) => {
          if (!v) return;
          const pos = visualizerCurrent.scene.camera.project([v.x, v.y, 0]);
          if (pos[0] < 0 || pos[1] < 0 || pos[0] > state.camera.width || pos[1] > state.camera.height) return;
          return {
            cat: v.cat,
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
        }),
        pick: getPickInfo(state)
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
            <div key={cat.name} className='label cat' style={{
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
            >{cat.name}</div>
          ))}
        {labels && labels.map((hit, i) => (
          <div key={i} className='label node' style={{
            left: `${Math.round(hit.pos[0])}px`,
            top: `${Math.round(hit.pos[1])}px`,
          }}>
            <div>{hit.name}</div>
            <div className='infocat'>{hit.cat}</div>
          </div>
        ))}
      </div>
      {
        pick && (
          <div className='info'>
            <a href={`https://github.com/leanprover-community/mathlib4/blob/${tree}/${pick.path}`} target='_blank'>
              <div className='infofunc'><AiOutlineLink />{pick.name}</div>
            </a>
            <div className='infocat'>{pick.cat}</div>
            <div className='infomd'>
              <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {pick.markdown}
              </Markdown>
            </div>
          </div>
        )
      }
    </>
  );
};