import React, { useState, useEffect } from 'react';
import './VoiceAssistantComponent.css';

export default function VoiceAssistantComponent({ onVoiceCommand }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setAssistantResponse('Listening for voice commands...');
      };

      rec.onresult = (event) => {
        const spokenText = event.results[0][0].transcript.toLowerCase();
        setTranscript(spokenText);
        handleProcessCommand(spokenText);
      };

      rec.onerror = (err) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
        setAssistantResponse('Voice recognition error or not permitted.');
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

  const handleProcessCommand = (command) => {
    let reply = `Processed command: "${command}"`;

    if (command.includes('thunderstorm') || command.includes('storm')) {
      reply = 'Setting airport weather condition to Severe Thunderstorm.';
      onVoiceCommand && onVoiceCommand('SET_WEATHER_THUNDERSTORM');
    } else if (command.includes('clear') || command.includes('sun')) {
      reply = 'Setting airport weather condition to Clear and Fair.';
      onVoiceCommand && onVoiceCommand('SET_WEATHER_CLEAR');
    } else if (command.includes('fog')) {
      reply = 'Setting airport weather condition to Dense Fog.';
      onVoiceCommand && onVoiceCommand('SET_WEATHER_FOG');
    } else if (command.includes('refresh') || command.includes('reload')) {
      reply = 'Refreshing all operational data.';
      onVoiceCommand && onVoiceCommand('REFRESH_DATA');
    } else if (command.includes('incident') || command.includes('log')) {
      reply = 'Navigating to Incidents Management.';
      onVoiceCommand && onVoiceCommand('NAVIGATE_INCIDENTS');
    } else {
      reply = `Recognized command: "${command}". Executing request.`;
    }

    setAssistantResponse(reply);
    speakText(reply);
  };

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech Recognition is not supported by your browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setTranscript('');
      recognition.start();
    }
  };

  return (
    <div className="voice-assistant-card">
      <div className="voice-header">
        <div className="voice-title">
          <span className="ai-icon">🤖</span>
          <div>
            <h4>AeroSync AI Voice Operations Assistant</h4>
            <span className="voice-subtext">Say: "Set weather to thunderstorm", "Set weather to clear", "Refresh data"</span>
          </div>
        </div>

        <button
          className={`mic-btn ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          title="Click to activate voice commands"
        >
          <span className="mic-icon">🎙️</span>
          <span>{isListening ? 'Listening...' : 'Push to Talk'}</span>
        </button>
      </div>

      {(transcript || assistantResponse) && (
        <div className="voice-output-box">
          {transcript && <p className="user-transcript">🗣️ You said: <i>"{transcript}"</i></p>}
          {assistantResponse && <p className="ai-reply">🤖 AI Reply: <strong>{assistantResponse}</strong></p>}
        </div>
      )}
    </div>
  );
}
