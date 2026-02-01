
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AppScreen, Asset, Signal, UserStatus, SignalStatus, Language } from './types';
import Header from './components/Header';
import MainScreen from './components/MainScreen';
import AssetSelection from './components/AssetSelection';
import TimeframeSelection from './components/TimeframeSelection';
import AnalysisScreen from './components/AnalysisScreen';
import SignalResult from './components/SignalResult';
import { TRANSLATIONS, ASSETS } from './constants';
import { Shield, X } from 'lucide-react';

const PASSWORDS = {
  [UserStatus.VERIFIED]: '2741520',
  [UserStatus.VIP]: '1448135'
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.MAIN);
  const [lang, setLang] = useState<Language>('RU');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string | null>(null);
  const [currentSignalId, setCurrentSignalId] = useState<string | null>(null);
  const [history, setHistory] = useState<Signal[]>([]);
  const [userStatus, setUserStatus] = useState<UserStatus>(UserStatus.STANDARD);
  const [assetFeedbackBonus, setAssetFeedbackBonus] = useState<Record<string, number>>({});
  
  // Live Assets State
  const [liveAssets, setLiveAssets] = useState<Asset[]>(ASSETS);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const t = TRANSLATIONS[lang];

  // Price Simulation Logic (Quantum Feed Sync)
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveAssets(prevAssets => prevAssets.map(asset => {
        const currentPrice = parseFloat(asset.price);
        // Volatility factors to keep it realistic and matching the "Quantum Feed" table feel
        const volatility = asset.id.startsWith('c') ? 0.0005 : 0.0001; 
        const changeVal = (Math.random() - 0.5) * currentPrice * volatility;
        const newPrice = currentPrice + changeVal;
        
        const currentChangePercent = parseFloat(asset.change.replace('%', ''));
        const newChangePercent = currentChangePercent + (Math.random() - 0.5) * 0.02;

        return {
          ...asset,
          price: newPrice.toFixed(asset.id.startsWith('f') ? 5 : 2),
          change: (newChangePercent > 0 ? '+' : '') + newChangePercent.toFixed(2) + '%',
          lastTick: changeVal >= 0 ? 'up' : 'down'
        };
      }));
    }, 2000); 

    return () => clearInterval(interval);
  }, []);

  const signalsInWindowCount = useMemo(() => {
    const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
    return history.filter(s => s.timestamp > twelveHoursAgo).length;
  }, [history]);

  const currentSignal = useMemo(() => 
    history.find(s => s.id === currentSignalId) || null,
  [history, currentSignalId]);

  const limits = {
    [UserStatus.STANDARD]: 20,
    [UserStatus.VERIFIED]: 50,
    [UserStatus.VIP]: Infinity
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('infinity_history');
    const savedStatus = localStorage.getItem('infinity_status');
    const savedLang = localStorage.getItem('infinity_lang');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedStatus) setUserStatus(savedStatus as UserStatus);
    if (savedLang) setLang(savedLang as Language);
  }, []);

  useEffect(() => {
    localStorage.setItem('infinity_history', JSON.stringify(history));
    localStorage.setItem('infinity_status', userStatus);
    localStorage.setItem('infinity_lang', lang);
  }, [history, userStatus, lang]);

  const handleStart = useCallback(() => {
    if (signalsInWindowCount >= limits[userStatus]) {
      alert(t.limitReached);
      return;
    }
    setScreen(AppScreen.ASSET_SELECTION);
  }, [userStatus, signalsInWindowCount, t, limits]);

  const handleAssetSelect = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
    setScreen(AppScreen.TIMEFRAME_SELECTION);
  }, []);

  const handleTimeframeSelect = useCallback((timeframe: string) => {
    setSelectedTimeframe(timeframe);
    setScreen(AppScreen.ANALYSIS);
  }, []);

  const handleAnalysisComplete = useCallback(() => {
    if (!selectedAsset || !selectedTimeframe) return;
    const bonus = assetFeedbackBonus[selectedAsset.id] || 0;
    const baseProb = 78 + Math.random() * 15;
    const finalProb = Math.min(99, Math.max(70, baseProb + bonus));
    const newSignal: Signal = {
      id: `INF-${Math.floor(Math.random() * 90000) + 10000}`,
      asset: selectedAsset,
      timeframe: selectedTimeframe,
      direction: Math.random() > 0.5 ? 'BUY' : 'SELL',
      probability: Math.round(finalProb),
      timestamp: Date.now(),
      status: 'PENDING'
    };
    setHistory(prev => [newSignal, ...prev].slice(0, 100));
    setCurrentSignalId(newSignal.id);
    setScreen(AppScreen.RESULT);
  }, [selectedAsset, selectedTimeframe, assetFeedbackBonus]);

  const handleSignalFeedback = useCallback((id: string, status: SignalStatus) => {
    setHistory(prev => prev.map(s => {
      if (s.id === id) {
        const impact = status === 'CONFIRMED' ? 5 : -5;
        setAssetFeedbackBonus(prevBonus => ({ ...prevBonus, [s.asset.id]: (prevBonus[s.asset.id] || 0) + impact }));
        return { ...s, status };
      }
      return s;
    }));
  }, []);

  const handleBackToMain = useCallback(() => {
    setScreen(AppScreen.MAIN);
    setSelectedAsset(null);
    setSelectedTimeframe(null);
    setCurrentSignalId(null);
  }, []);

  const openStatusChange = useCallback(() => {
    setPasswordInput('');
    setIsPasswordModalOpen(true);
  }, []);

  const confirmPassword = () => {
    const matchedStatus = Object.entries(PASSWORDS).find(([_, pw]) => pw === passwordInput);
    if (matchedStatus) {
      setUserStatus(matchedStatus[0] as UserStatus);
      setIsPasswordModalOpen(false);
    } else {
      alert(t.wrongPw);
    }
  };

  const renderScreen = () => {
    switch (screen) {
      case AppScreen.MAIN:
        return <MainScreen 
          onStart={handleStart} 
          history={history} 
          userStatus={userStatus} 
          onStatusToggle={openStatusChange}
          signalsUsed={signalsInWindowCount}
          limit={limits[userStatus]}
          t={t}
          lang={lang}
        />;
      case AppScreen.ASSET_SELECTION:
        return <AssetSelection assets={liveAssets} onSelect={handleAssetSelect} onBack={handleBackToMain} userStatus={userStatus} t={t} />;
      case AppScreen.TIMEFRAME_SELECTION:
        return selectedAsset ? (
          <TimeframeSelection asset={selectedAsset} onSelect={handleTimeframeSelect} onBack={handleBackToMain} t={t} />
        ) : null;
      case AppScreen.ANALYSIS:
        return selectedAsset && selectedTimeframe ? (
          <AnalysisScreen asset={selectedAsset} timeframe={selectedTimeframe} onComplete={handleAnalysisComplete} t={t} />
        ) : null;
      case AppScreen.RESULT:
        return currentSignal ? (
          <SignalResult signal={currentSignal} onBack={handleBackToMain} onFeedback={(status) => handleSignalFeedback(currentSignal.id, status)} onNewCycle={() => setScreen(AppScreen.ANALYSIS)} t={t} />
        ) : null;
      default:
        return <MainScreen onStart={handleStart} history={history} userStatus={userStatus} onStatusToggle={openStatusChange} signalsUsed={signalsInWindowCount} limit={limits[userStatus]} t={t} lang={lang} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col relative overflow-hidden">
      <Header lang={lang} setLang={setLang} />
      <main className="flex-1 z-10">
        {renderScreen()}
      </main>

      {/* Professional Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-[#0b0e11] border border-[#2d3139] rounded-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Shield className="text-[#10b981]" size={20} />
                <h3 className="text-lg font-bold text-white tracking-tight uppercase">{t.modalTitle}</h3>
              </div>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-[#848e9c] hover:text-white transition-colors p-1">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[#848e9c] text-[10px] font-bold uppercase tracking-widest">{t.enterPw}</p>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1e2329] border border-[#2d3139] rounded h-14 px-5 text-white focus:outline-none focus:border-[#10b981] transition-all font-mono text-2xl tracking-[0.2em]"
                  autoFocus
                />
              </div>
              <button 
                onClick={confirmPassword}
                className="w-full h-14 bt-button-primary text-sm uppercase tracking-[0.2em]"
              >
                {t.modalConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
