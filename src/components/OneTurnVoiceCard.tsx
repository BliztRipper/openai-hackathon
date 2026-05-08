import { useEffect, useMemo, useRef, useState } from 'react';
import type { PersonaId } from '../data/personas';
import { getVoicePrompt, requestVoiceTurn, type VoiceGender } from '../lib/voiceTurn';
import { CheckIcon, PulseIcon } from './Icons';

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type BrowserWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type Props = {
  personaId: PersonaId;
  personaName: string;
};

type VoiceStatus = 'ready' | 'greeting' | 'listening' | 'processing' | 'replying' | 'complete' | 'error';

function personaSeed(personaId: PersonaId) {
  return personaId.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
}

function genderScore(voice: SpeechSynthesisVoice, gender: VoiceGender) {
  const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  const femaleNames = ['female', 'samantha', 'victoria', 'karen', 'zira', 'susan', 'joanna', 'aria'];
  const maleNames = ['male', 'daniel', 'alex', 'david', 'mark', 'george', 'guy', 'ryan'];
  const list = gender === 'female' ? femaleNames : maleNames;
  return list.some((item) => name.includes(item)) ? 2 : voice.lang?.toLowerCase().startsWith('en') ? 1 : 0;
}

function chooseVoice(voices: SpeechSynthesisVoice[], gender: VoiceGender, personaId: PersonaId) {
  if (voices.length === 0) return undefined;
  const ranked = [...voices].sort((a, b) => genderScore(b, gender) - genderScore(a, gender));
  const topScore = genderScore(ranked[0], gender);
  const pool = ranked.filter((voice) => genderScore(voice, gender) === topScore);
  return pool[personaSeed(personaId) % pool.length];
}

export function OneTurnVoiceCard({ personaId, personaName }: Props) {
  const prompt = useMemo(() => getVoicePrompt(personaId), [personaId]);
  const [status, setStatus] = useState<VoiceStatus>('ready');
  const [transcript, setTranscript] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [supportsSpeechRecognition, setSupportsSpeechRecognition] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const autoStartedRef = useRef<PersonaId | null>(null);

  useEffect(() => {
    setStatus('ready');
    setTranscript('');
    setTypedAnswer('');
    setReply('');
    setError('');
    autoStartedRef.current = null;
  }, [personaId]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
  }, []);

  const speak = (text: string, phase: VoiceStatus) => new Promise<void>((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Voice playback is not available in this browser.'));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = chooseVoice(voices, prompt.voiceGender, personaId);
    if (voice) utterance.voice = voice;
    utterance.rate = 0.92;
    utterance.pitch = prompt.voiceGender === 'female' ? 1.08 : 0.9;
    utterance.onstart = () => setStatus(phase);
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error('Voice playback stopped before finishing.'));
    window.speechSynthesis.speak(utterance);
  });

  const processAnswer = async (spokenText: string) => {
    const answer = spokenText.trim();
    if (!answer) return;
    setTranscript(answer);
    setStatus('processing');
    setError('');
    try {
      const result = await requestVoiceTurn(personaId, answer);
      setReply(result.reply);
      await speak(result.reply, 'replying');
      setStatus('complete');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to process this voice answer.');
      setStatus('error');
    }
  };

  const listenOnce = () => {
    const browserWindow = window as BrowserWindow;
    const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setSupportsSpeechRecognition(false);
      setStatus('listening');
      return;
    }
    setSupportsSpeechRecognition(true);
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    let heardResult = false;
    let hadError = false;
    recognition.onstart = () => setStatus('listening');
    recognition.onerror = () => {
      hadError = true;
      setError('I could not hear the answer clearly. Please try once more or type the answer.');
      setStatus('error');
    };
    recognition.onresult = (event) => {
      heardResult = true;
      const text = event.results?.[0]?.[0]?.transcript ?? '';
      void processAnswer(text);
    };
    recognition.onend = () => {
      if (!heardResult && !hadError) setStatus('ready');
    };
    recognition.start();
  };

  const startTurn = async () => {
    setReply('');
    setTranscript('');
    setError('');
    recognitionRef.current?.abort();
    try {
      await speak(prompt.question, 'greeting');
      listenOnce();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Voice playback is unavailable.');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (autoStartedRef.current === personaId) return;
    if (navigator.webdriver) return;
    autoStartedRef.current = personaId;
    const timer = window.setTimeout(() => {
      void startTurn();
    }, 450);
    return () => window.clearTimeout(timer);
  }, [personaId]);

  const statusText = {
    ready: 'Ready for a one-turn voice check',
    greeting: 'Asking the first question…',
    listening: supportsSpeechRecognition ? 'Listening for one answer…' : 'Type one answer below…',
    processing: 'Processing the spoken answer…',
    replying: 'Answering back…',
    complete: 'One-turn voice check complete',
    error: 'Voice check needs one more try',
  }[status];

  return (
    <article className={`voice-turn-card ${status}`} aria-label={`${personaName} one-turn voice support`}>
      <div className="voice-turn-header">
        <PulseIcon />
        <div>
          <span className="eyebrow">One-turn voice support</span>
          <strong>{personaName} · {prompt.voiceGender === 'female' ? 'Warm voice' : 'Steady voice'}</strong>
          <p>{statusText}</p>
        </div>
      </div>

      <div className="voice-script">
        <span>AGI asks first</span>
        <p>{prompt.question}</p>
      </div>

      {transcript && (
        <div className="voice-script user-voice-line">
          <span>{personaName} answered</span>
          <p>{transcript}</p>
        </div>
      )}

      {reply && (
        <div className="voice-script voice-reply-line">
          <span><CheckIcon /> Second Brain answered</span>
          <p>{reply}</p>
        </div>
      )}

      {!supportsSpeechRecognition && status === 'listening' && (
        <div className="voice-type-row">
          <input
            value={typedAnswer}
            onChange={(event) => setTypedAnswer(event.target.value)}
            placeholder="Type the one answer here"
            aria-label="Type voice answer"
          />
          <button className="secondary-action" onClick={() => processAnswer(typedAnswer)} disabled={!typedAnswer.trim()}>
            Send answer
          </button>
        </div>
      )}

      {error && <p className="voice-error" role="alert">{error}</p>}

      <div className="button-row wrap">
        <button className="secondary-action" onClick={startTurn} disabled={status === 'greeting' || status === 'processing' || status === 'replying'}>
          {status === 'complete' ? 'Run voice check again' : 'Start voice check'}
        </button>
        <button className="secondary-action" onClick={() => { window.speechSynthesis?.cancel(); recognitionRef.current?.abort(); setStatus('ready'); setError(''); }}>
          Stop voice
        </button>
      </div>
    </article>
  );
}
