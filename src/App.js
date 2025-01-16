import { HashRouter, Routes, Route } from 'react-router-dom';
import routers from './routers';

function App() {
  return (
    <HashRouter>
      <Routes>
        {routers.map((p) => (
          <Route key={p} {...p} />
        ))}
      </Routes>
    </HashRouter>
  );
}

export default App;