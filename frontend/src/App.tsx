import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lobby from './components/Lobby/Lobby';
import GameRoom from './components/Game/GameRoom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/game/:gameId" element={<GameRoom />} />
      </Routes>
    </Router>
  );
}

export default App;


