import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Send, CheckCircle, List, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import './VoiceCommandCenter.css';

export default function VoiceCommandCenter({ onRunCommand, selectedAirport }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [commandHistory, setCommandHistory] = useState([
    { id: 1, text: 'System Initialized', action: 'AeroSync Voice Dispatch Online', time: new Date().toLocaleTimeString(), status: 'ONLINE' }
  ]);
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      setFeedback('Speech recognition is not supported in this browser environment. Type command below.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setFeedback('Listening for ops commands...');
      recognition.start();
      setIsListening(true);
    }
  };

  const handleExecuteCommand = (cmdText) => {
    const rawQuery = cmdText || transcript;
    const query = rawQuery.toLowerCase().trim();
    if (!query) return;

    let resMsg = '';
    let actionType = 'custom';
    let payload = null;

    // Airport switching voice commands
    if (query.includes('delhi') || query.includes('del')) {
      resMsg = 'Switched Airport Hub to Delhi (DEL — Indira Gandhi Intl)';
      actionType = 'switch_airport';
      payload = 'DEL';
    } else if (query.includes('mumbai') || query.includes('bom')) {
      resMsg = 'Switched Airport Hub to Mumbai (BOM — Chhatrapati Shivaji Maharaj Intl)';
      actionType = 'switch_airport';
      payload = 'BOM';
    } else if (query.includes('bengaluru') || query.includes('bangalore') || query.includes('blr')) {
      resMsg = 'Switched Airport Hub to Bengaluru (BLR — Kempegowda Intl)';
      actionType = 'switch_airport';
      payload = 'BLR';
    } else if (query.includes('chennai') || query.includes('maa')) {
      resMsg = 'Switched Airport Hub to Chennai (MAA — Chennai Intl)';
      actionType = 'switch_airport';
      payload = 'MAA';
    } else if (query.includes('hyderabad') || query.includes('hyd')) {
      resMsg = 'Switched Airport Hub to Hyderabad (HYD — Rajiv Gandhi Intl)';
      actionType = 'switch_airport';
      payload = 'HYD';
    } else if (query.includes('kolkata') || query.includes('ccu')) {
      resMsg = 'Switched Airport Hub to Kolkata (CCU — Netaji Subhash Chandra Bose Intl)';
      actionType = 'switch_airport';
      payload = 'CCU';
    } else if (query.includes('goa') || query.includes('goi')) {
      resMsg = 'Switched Airport Hub to Goa (GOI — Manohar Intl)';
      actionType = 'switch_airport';
      payload = 'GOI';
    } else if (query.includes('ahmedabad') || query.includes('amd')) {
      resMsg = 'Switched Airport Hub to Ahmedabad (AMD — Sardar Vallabhbhai Patel Intl)';
      actionType = 'switch_airport';
      payload = 'AMD';

    // AI Disruption
    } else if (query.includes('disruption') || query.includes('recovery') || query.includes('ai')) {
      resMsg = 'Executing AI Automated Disruption Management algorithm to reallocate gate stands';
      actionType = 'ai_disruption';

    // Navigation & Viewport Switching
    } else if (query.includes('roster') || query.includes('staff')) {
      resMsg = 'Navigating to Staff Roster & Aircraft Assignment Matrix';
      actionType = 'nav_staff_roster';
    } else if (query.includes('analytics') || query.includes('report') || query.includes('executive')) {
      resMsg = 'Navigating to Executive Airport Performance Analytics';
      actionType = 'nav_analytics';
    } else if (query.includes('incident') || query.includes('incidents')) {
      resMsg = 'Navigating to Tarmac Incident Operations';
      actionType = 'nav_incidents';
    } else if (query.includes('radar') || query.includes('live map')) {
      resMsg = 'Switching viewport to Live Airspace Radar Map';
      actionType = 'switch_radar';
    } else if (query.includes('gate') || query.includes('status')) {
      resMsg = 'Switching viewport to Gate Stand Occupancy Matrix';
      actionType = 'switch_gates';
    } else if (query.includes('gantt') || query.includes('schedule')) {
      resMsg = 'Switching viewport to Gantt Turnaround Schedule Timeline';
      actionType = 'switch_gantt';
    } else if (query.includes('refresh') || query.includes('reload')) {
      resMsg = 'Refreshing live flight telemetry, gates, and weather data';
      actionType = 'refresh_data';
    } else {
      resMsg = `Executed dispatch command: "${rawQuery}"`;
      actionType = 'custom';
      payload = rawQuery;
    }

    // Update feedback, speech synthesizer & trigger action callback
    setFeedback(`✓ ${resMsg}`);
    speakText(resMsg);

    const newLogItem = {
      id: Date.now(),
      text: rawQuery,
      action: resMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'EXECUTED'
    };

    setCommandHistory((prev) => [newLogItem, ...prev]);

    if (onRunCommand) {
      onRunCommand(actionType, payload);
    }
  };

  return (
    <div className="voice-command-card shadcn-card font-mono">
      <div className="voice-card-header">
        <div className="voice-header-title">
          <Sparkles size={16} className="text-cyan" />
          <span>🎙️ AI NATURAL LANGUAGE VOICE COMMAND CENTER</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className="history-toggle-btn"
            onClick={() => setShowHistory(!showHistory)}
          >
            <Terminal size={13} />
            <span>Executed Console ({commandHistory.length})</span>
            {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <span className="badge-online">ONLINE</span>
        </div>
      </div>

      <div className="voice-card-body">
        <div className="mic-container">
          <button
            type="button"
            className={`mic-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleListening}
            title="Click to activate mic voice recognition"
          >
            {isListening ? <Mic size={24} className="spin-pulse" /> : <MicOff size={24} />}
          </button>
          
          <div className="waveform-bar-wrapper">
            <span className={`bar ${isListening ? 'animating' : ''}`}></span>
            <span className={`bar ${isListening ? 'animating' : ''}`}></span>
            <span className={`bar ${isListening ? 'animating' : ''}`}></span>
            <span className={`bar ${isListening ? 'animating' : ''}`}></span>
            <span className={`bar ${isListening ? 'animating' : ''}`}></span>
          </div>

          <div className="voice-quick-chips">
            <button className="voice-chip" onClick={() => handleExecuteCommand('Run AI disruption recovery')}>
              🤖 Run AI Disruption
            </button>
            <button className="voice-chip" onClick={() => handleExecuteCommand('Switch to Delhi')}>
              ✈️ Switch Delhi (DEL)
            </button>
            <button className="voice-chip" onClick={() => handleExecuteCommand('Switch to Mumbai')}>
              ✈️ Switch Mumbai (BOM)
            </button>
            <button className="voice-chip" onClick={() => handleExecuteCommand('Open staff roster')}>
              👷 Staff Roster
            </button>
          </div>
        </div>

        <div className="command-input-row">
          <input
            type="text"
            className="command-text-input font-mono"
            placeholder="Speak or type command (e.g., 'Switch to Delhi', 'Run AI disruption recovery', 'Open staff roster')..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecuteCommand()}
          />
          <button
            type="button"
            className="shadcn-btn-primary btn-compact"
            onClick={() => handleExecuteCommand()}
          >
            <Send size={13} />
            <span>Execute Action</span>
          </button>
        </div>

        {feedback && (
          <div className="voice-feedback-msg font-mono">
            <Volume2 size={13} className="text-cyan" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Live Executed Action Log Console Drawer */}
        {showHistory && (
          <div className="voice-history-console">
            <div className="history-console-header">
              <Terminal size={13} className="text-cyan" />
              <span>LIVE EXECUTED VOICE DISPATCH CONSOLE</span>
            </div>
            <div className="history-log-list">
              {commandHistory.map((item) => (
                <div key={item.id} className="history-log-item font-mono">
                  <span className="log-time">{item.time}</span>
                  <span className="log-badge-executed">[{item.status}]</span>
                  <span className="log-query">"{item.text}"</span>
                  <span className="log-arrow">➔</span>
                  <span className="log-action-res">{item.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
