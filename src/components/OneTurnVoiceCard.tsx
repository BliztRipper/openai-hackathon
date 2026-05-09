import { useEffect, useMemo, useRef, useState } from 'react';
import type { PersonaId } from '../data/personas';
import { createWavRecorder, type CapturedWavAudio } from '../lib/audioCapture';
import { getVoicePrompt, requestVoicePrompt, requestVoiceTurn } from '../lib/voiceTurn';
import { CheckIcon, PulseIcon } from './Icons';

type Props = {
  personaId: PersonaId;
  personaName: string;
};

type VoiceStatus = 'ready' | 'greeting' | 'listening' | 'processing' | 'replying' | 'complete' | 'error';
type RecorderHandle = Awaited<ReturnType<typeof createWavRecorder>>;

function dataAudioUrl(audioData: string, audioFormat = 'wav') {
  return `data:audio/${audioFormat};base64,${audioData}`;
}

function fallbackSpeak(text: string, voiceHint: 'male' | 'female') {
  return new Promise<void>((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Voice playback is not available in this browser.'));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = voiceHint === 'female' ? 1.05 : 0.9;
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error('Voice playback stopped before finishing.'));
    window.speechSynthesis.speak(utterance);
  });
}

export function OneTurnVoiceCard({ personaId, personaName }: Props) {
  const prompt = useMemo(() => getVoicePrompt(personaId), [personaId]);
  const [status, setStatus] = useState<VoiceStatus>('ready');
  const [transcript, setTranscript] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [supportsMicrophone, setSupportsMicrophone] = useState(true);
  const [activeVoice, setActiveVoice] = useState(prompt.audioVoice);
  const recorderRef = useRef<RecorderHandle | null>(null);
  const listeningTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoStartedRef = useRef<PersonaId | null>(null);

  const stopActiveAudio = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
  };

  const clearListeningTimer = () => {
    if (listeningTimerRef.current) window.clearTimeout(listeningTimerRef.current);
    listeningTimerRef.current = null;
  };

  const playGeneratedAudio = async (audioData: string | undefined, audioFormat: string | undefined, fallbackText: string, phase: VoiceStatus) => {
    setStatus(phase);
    stopActiveAudio();
    if (!audioData) {
      await fallbackSpeak(fallbackText, prompt.voiceGender);
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const audio = new Audio(dataAudioUrl(audioData, audioFormat || 'wav'));
      audioRef.current = audio;
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Generated voice could not be played.'));
      void audio.play().catch(reject);
    });
  };

  useEffect(() => {
    setStatus('ready');
    setTranscript('');
    setTypedAnswer('');
    setReply('');
    setError('');
    setActiveVoice(prompt.audioVoice);
    autoStartedRef.current = null;
  }, [personaId, prompt.audioVoice]);

  useEffect(() => () => {
    clearListeningTimer();
    recorderRef.current?.cancel();
    stopActiveAudio();
  }, []);

  const processAnswer = async (answer: CapturedWavAudio | string) => {
    setStatus('processing');
    setError('');
    const answerTranscript = typeof answer === 'string' ? answer.trim() : 'Spoken answer captured.';
    setTranscript(answerTranscript);
    try {
      const result = await requestVoiceTurn(personaId, typeof answer === 'string' ? answer : { ...answer, transcript: answerTranscript });
      setReply(result.reply);
      setActiveVoice(result.audioVoice || prompt.audioVoice);
      await playGeneratedAudio(result.audioData, result.audioFormat, result.reply, 'replying');
      setStatus('complete');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to process this voice answer.');
      setStatus('error');
    }
  };

  const finishListening = async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;
    clearListeningTimer();
    try {
      const captured = await recorder.stop();
      await processAnswer(captured);
    } catch (caught) {
      setSupportsMicrophone(false);
      setError(caught instanceof Error ? caught.message : 'Microphone capture is unavailable. Type one answer instead.');
      setStatus('listening');
    }
  };

  const startListening = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setSupportsMicrophone(false);
      setStatus('listening');
      return;
    }
    try {
      const recorder = await createWavRecorder();
      recorderRef.current = recorder;
      setSupportsMicrophone(true);
      setStatus('listening');
      listeningTimerRef.current = window.setTimeout(() => {
        void finishListening();
      }, 6500);
    } catch {
      setSupportsMicrophone(false);
      setStatus('listening');
      setError('Microphone permission is needed. Type one answer if you prefer.');
    }
  };

  const startTurn = async () => {
    setReply('');
    setTranscript('');
    setTypedAnswer('');
    setError('');
    clearListeningTimer();
    recorderRef.current?.cancel();
    recorderRef.current = null;
    try {
      const generatedPrompt = await requestVoicePrompt(personaId);
      setActiveVoice(generatedPrompt.audioVoice || prompt.audioVoice);
      await playGeneratedAudio(generatedPrompt.audioData, generatedPrompt.audioFormat, prompt.question, 'greeting');
      await startListening();
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
    greeting: 'Asking with a natural generated voice…',
    listening: supportsMicrophone ? 'Listening now. Answer in one sentence…' : 'Type one answer below…',
    processing: 'Processing the spoken answer…',
    replying: 'Answering back with the same voice…',
    complete: 'One-turn voice check complete',
    error: 'Voice check needs one more try',
  }[status];

  return (
    <article className={`voice-turn-card ${status}`} aria-label={`${personaName} one-turn voice support`}>
      <div className="voice-turn-header">
        <PulseIcon />
        <div>
          <span className="eyebrow">One-turn voice support</span>
          <strong>{personaName} · consistent {activeVoice} voice</strong>
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

      {!supportsMicrophone && status === 'listening' && (
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
        {status === 'listening' && supportsMicrophone && (
          <button className="secondary-action" onClick={() => void finishListening()}>
            Finish answer
          </button>
        )}
        <button className="secondary-action" onClick={() => { clearListeningTimer(); recorderRef.current?.cancel(); recorderRef.current = null; stopActiveAudio(); setStatus('ready'); setError(''); }}>
          Stop voice
        </button>
      </div>
    </article>
  );
}
