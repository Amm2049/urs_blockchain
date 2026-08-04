import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { WalletProvider } from './hooks/useWallet';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Activities from './pages/Activities';
import Dashboard from './pages/Dashboard';
import RewardStore from './pages/RewardStore';
import Voting from './pages/Voting';
import NFTGallery from './pages/NFTGallery';
import AdminPanel from './pages/AdminPanel';

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
      <div className="text-8xl font-black text-gradient opacity-40 mb-4">404</div>
      <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
      <p className="text-white/40 text-sm mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <button onClick={() => navigate('/')} className="btn-primary">
        ← Back to Home
      </button>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
            <Routes>
              <Route path="/"           element={<Landing />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/dashboard"  element={<Dashboard />} />
              <Route path="/store"      element={<RewardStore />} />
              <Route path="/voting"     element={<Voting />} />
              <Route path="/gallery"    element={<NFTGallery />} />
              <Route path="/admin"      element={<AdminPanel />} />
              <Route path="*"           element={<NotFound />} />
            </Routes>
          </main>
          <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-white/20">
            University Reward System · Sepolia Testnet · Built with Solidity + React
          </footer>
        </div>
      </BrowserRouter>
    </WalletProvider>
  );
}
