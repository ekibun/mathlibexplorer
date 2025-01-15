import './App.css';
import { useState } from 'react';
import Visualizer from './visualizer';

function App() {
  const [state, setState] = useState({});
  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        touchAction: 'none'
      }}
    >
      <div
        id="container"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <Visualizer {...{ state, setState }} />
      </div>
    </div>
  );
}

export default App;
