import { useRef, useState } from "react";

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.start();
    recorderRef.current = recorder;

    setSeconds(0);
    setIsRecording(true);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  function stopTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    clearInterval(timerRef.current);
  }

  function stop() {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const duration = seconds;
        stopTracks();
        setIsRecording(false);
        resolve({ blob, duration });
      };
      recorder.stop();
    });
  }

  function cancel() {
    recorderRef.current?.stop();
    stopTracks();
    setIsRecording(false);
    chunksRef.current = [];
  }

  return { isRecording, seconds, start, stop, cancel };
}
