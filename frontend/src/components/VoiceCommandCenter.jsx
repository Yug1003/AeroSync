import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Send, CheckCircle, AlertCircle } from 'lucide-react';
import './VoiceCommandCenter.css';

export default function VoiceCommandCenter({ onRunCommand }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [recognition, setRecognition] = useState(null);

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
    const query = (cmdText || transcript).toLowerCase().trim();
    if (!query) return;

    let resMsg = '';
    if (query.includes('disruption') || query.includes('recovery') || query.includes('ai')) {
      resMsg = 'Executing AI Automated Disruption Recovery algorithm for airport gate stands.';
      if (onRunCommand) onRunCommand('ai_disruption');
    } else if (query.includes('radar') || query.includes('live map')) {
      resMsg = 'Switching viewport tab to Live Airspace Radar Map.';
      if (onRunCommand) onRunCommand('switch_radar');
    } else if (query.includes('gate') || query.includes('status')) {
      resMsg = 'Opening Gate Stand Occupancy matrix.';
      if (onRunCommand) onRunCommand('switch_gates');
    } else if (query.includes('gantt') || query.includes('schedule')) {
      resMsg = 'Opening Gantt Turnaround Schedule timeline.';
      if (onRunCommand) onRunCommand('switch_gantt');
    } else {
      resMsg = `Command "${query}" processed by AeroSync Dispatch Intelligence.`;
      if (onRunCommand) onRunCommand('custom', query);
    }

    setFeedback(`✓ ${resMsg}`);
    speakText(resMsg);
  };

  return (
    <div className="voice-command-card shadcn-card font-mono">
      <div className="voice-card-header">
        <div className="voice-header-title">
          <Sparkles size={16} className="text-cyan" />
          <span>🎙️ AI NATURAL LANGUAGE VOICE COMMAND CENTER</span>
        </div>
        <span className="badge-online">ONLINE</span>
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
        </div>

        <div className="command-input-row">
          <input
            type="text"
            className="command-text-input font-mono"
            placeholder="Speak or type command (e.g., 'Run AI disruption recovery', 'Show Gantt schedule')..."
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
            <span>Execute</span>
          </button>
        </div>

        {feedback && (
          <div className="voice-feedback-msg font-mono">
            <Volume2 size={13} className="text-cyan" />
            <span>{feedback}</span>
          </div>
        )}
      </div>
    </div>
  );
}
