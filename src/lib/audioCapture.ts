export type CapturedWavAudio = {
  audioData: string;
  audioFormat: 'wav';
};

type ActiveRecorder = {
  stop: () => Promise<CapturedWavAudio>;
  cancel: () => void;
};

function mergeBuffers(buffers: Float32Array[], totalLength: number) {
  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    merged.set(buffer, offset);
    offset += buffer.length;
  }
  return merged;
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
}

export function encodeWav(samples: Float32Array, sampleRate: number) {
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * bytesPerSample, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1, offset += 2) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return new Blob([view], { type: 'audio/wav' });
}

export async function blobToBase64(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function createWavRecorder(): Promise<ActiveRecorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContextCtor();
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  const buffers: Float32Array[] = [];
  let totalLength = 0;
  let stopped = false;

  processor.onaudioprocess = (event) => {
    if (stopped) return;
    const channel = event.inputBuffer.getChannelData(0);
    buffers.push(new Float32Array(channel));
    totalLength += channel.length;
  };
  source.connect(processor);
  processor.connect(audioContext.destination);

  const cleanup = async () => {
    stopped = true;
    processor.disconnect();
    source.disconnect();
    stream.getTracks().forEach((track) => track.stop());
    await audioContext.close();
  };

  return {
    stop: async () => {
      await cleanup();
      const blob = encodeWav(mergeBuffers(buffers, totalLength), audioContext.sampleRate);
      return { audioData: await blobToBase64(blob), audioFormat: 'wav' };
    },
    cancel: () => {
      void cleanup();
    },
  };
}
