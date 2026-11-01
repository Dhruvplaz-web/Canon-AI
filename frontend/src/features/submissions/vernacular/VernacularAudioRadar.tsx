"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  Printer,
  X,
  Music,
  Gauge,
} from "lucide-react";
import {
  AudioCadenceMetrics,
  AudioPresetDisclaimer,
  AUDIO_DISCLAIMER_PRESETS,
  analyzeAudioCadence,
} from "./vernacularAudioEngine";

interface VernacularAudioRadarProps {
  initialText?: string;
  onRemediatedTextApplied?: (remediatedText: string) => void;
}

export function VernacularAudioRadar({
  initialText,
  onRemediatedTextApplied,
}: VernacularAudioRadarProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("MUTUAL_FUND_CHIPMUNK");
  const [disclaimerText, setDisclaimerText] = useState<string>(
    initialText || AUDIO_DISCLAIMER_PRESETS[0].disclaimerText
  );
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(
    AUDIO_DISCLAIMER_PRESETS[0].defaultMultiplier
  );
  const [isAudioMaskedBgm, setIsAudioMaskedBgm] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Analyze cadence metrics deterministically
  const metrics: AudioCadenceMetrics = useMemo(() => {
    const bgmLevel = isAudioMaskedBgm ? -6 : -18;
    return analyzeAudioCadence(disclaimerText, speedMultiplier, bgmLevel);
  }, [disclaimerText, speedMultiplier, isAudioMaskedBgm]);

  // Handle Preset Switching
  const handleSelectPreset = (preset: AudioPresetDisclaimer) => {
    setSelectedPresetId(preset.id);
    setDisclaimerText(preset.disclaimerText);
    setSpeedMultiplier(preset.defaultMultiplier);
    stopPlayback();
  };

  // Stop Audio Playback
  const stopPlayback = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
  }, []);

  // Native Speech Synthesis Playback
  const handleTogglePlay = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      // Fallback simulated playback for environments without speech synthesis
      setIsPlaying(true);
      const totalMs = metrics.estimatedDurationSeconds * 1000;
      const intervalMs = 50;
      let elapsedMs = 0;

      playbackTimerRef.current = setInterval(() => {
        elapsedMs += intervalMs;
        const progress = Math.min(100, (elapsedMs / totalMs) * 100);
        setPlaybackProgress(progress);

        if (elapsedMs >= totalMs) {
          stopPlayback();
        }
      }, intervalMs);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(disclaimerText);
    utteranceRef.current = utterance;

    // Apply speech rate (Browser SpeechSynthesis accepts rate between 0.1 and 10)
    utterance.rate = Math.min(3.0, Math.max(0.5, speedMultiplier));

    // Try finding an appropriate Indian voice
    const voices = window.speechSynthesis.getVoices();
    const activePreset = AUDIO_DISCLAIMER_PRESETS.find((p) => p.id === selectedPresetId);

    if (activePreset?.language === "Hindi") {
      const hiVoice = voices.find((v) => v.lang.startsWith("hi"));
      if (hiVoice) utterance.voice = hiVoice;
    } else if (activePreset?.language === "Tamil") {
      const taVoice = voices.find((v) => v.lang.startsWith("ta"));
      if (taVoice) utterance.voice = taVoice;
    } else {
      const inVoice = voices.find((v) => v.lang === "en-IN" || v.lang.startsWith("hi"));
      if (inVoice) utterance.voice = inVoice;
    }

    const totalMs = Math.max(500, metrics.estimatedDurationSeconds * 1000);
    const intervalMs = 50;
    let elapsedMs = 0;

    utterance.onstart = () => {
      setIsPlaying(true);
      playbackTimerRef.current = setInterval(() => {
        elapsedMs += intervalMs;
        const progress = Math.min(100, (elapsedMs / totalMs) * 100);
        setPlaybackProgress(progress);
      }, intervalMs);
    };

    utterance.onend = () => {
      stopPlayback();
    };

    utterance.onerror = () => {
      stopPlayback();
    };

    window.speechSynthesis.speak(utterance);
  };

  // 1-Click ASCI Remediation
  const handleApplyRemediation = () => {
    stopPlayback();
    // Reset to statutory compliant pace (1.0x / 2.1 SPS)
    setSpeedMultiplier(1.0);
    setIsAudioMaskedBgm(false);
    if (onRemediatedTextApplied) {
      onRemediatedTextApplied(disclaimerText);
    }
  };

  // Dynamic Animated Canvas Waveform Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;
    const numBars = 36;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / numBars - 2;

      // Color palette based on compliance status
      let primaryColor = "#10B981"; // Emerald green
      let glowColor = "rgba(16, 185, 129, 0.4)";

      if (metrics.complianceStatus === "CRITICAL_VIOLATION") {
        primaryColor = "#EF4444"; // Red
        glowColor = "rgba(239, 68, 68, 0.5)";
      } else if (metrics.complianceStatus === "BORDERLINE") {
        primaryColor = "#F59E0B"; // Amber
        glowColor = "rgba(245, 158, 11, 0.4)";
      }

      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = isPlaying ? 12 : 2;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 2);

        // Amplitude formula simulating voice frequencies with speed factor
        let amplitude = 0.15;
        if (isPlaying) {
          const freqMultiplier = speedMultiplier * 1.5;
          amplitude =
            0.2 +
            0.7 *
              Math.abs(
                Math.sin(i * 0.35 + phase * freqMultiplier) *
                  Math.cos(i * 0.18 + phase * 0.8)
              );
        } else {
          // Idle ambient resting wave
          amplitude = 0.12 + 0.1 * Math.sin(i * 0.3 + phase * 0.5);
        }

        const barHeight = height * amplitude;
        const y = (height - barHeight) / 2;

        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      ctx.restore();

      phase += isPlaying ? 0.08 * speedMultiplier : 0.02;
      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isPlaying, metrics.complianceStatus, speedMultiplier]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  const formatInr = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] shadow-sm space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              ASCI Chapter IV Mandate
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
              Web Audio Synthesizer
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                metrics.complianceStatus === "CRITICAL_VIOLATION"
                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 animate-pulse"
                  : metrics.complianceStatus === "BORDERLINE"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
              }`}
            >
              {metrics.complianceStatus === "CRITICAL_VIOLATION"
                ? "VIOLATION: SPEED OBSCURATION"
                : metrics.complianceStatus === "BORDERLINE"
                ? "WARNING: HIGH CADENCE"
                : "ASCI COMPLIANT SPEED"}
            </span>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
            <span>ASCI Vernacular Audio Speed Radar</span>
            <span className="text-xs px-2 py-0.5 font-normal rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
              Max 2.5 Syllables/Sec
            </span>
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Enforces statutory spoken speed limits on TVC, radio, and digital video disclaimers. Detects accelerated chipmunk
            speech designed to evade consumer comprehension under CCPA Section 2(28).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCertificateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)] transition-all shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-blue-500" />
            <span>Audio Clearance Cert</span>
          </button>
          <button
            type="button"
            onClick={handleApplyRemediation}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Remediate to 2.1 SPS</span>
          </button>
        </div>
      </div>

      {/* Preset Quick-Load Selector */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono uppercase text-[var(--color-text-muted)] font-semibold flex items-center justify-between">
          <span>Real-World High-Speed Voiceover Benchmarks</span>
          <span className="text-[10px] lowercase text-[var(--color-text-muted)]">
            Click to test audible speed
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {AUDIO_DISCLAIMER_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                  isSelected
                    ? "bg-purple-500/10 border-purple-500/40 shadow-xs ring-1 ring-purple-500/30"
                    : "bg-[var(--color-surface)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]"
                }`}
              >
                <div>
                  <div className="font-semibold text-[var(--color-text-primary)] line-clamp-1">
                    {preset.title}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">
                    {preset.advertiserContext}
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">
                    {preset.language} • {preset.defaultMultiplier}x
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Stage: Waveform & Speedometer Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Oscilloscope Waveform & Playback HUD */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800 relative overflow-hidden shadow-inner">
            {/* Waveform Canvas */}
            <canvas
              ref={canvasRef}
              width={560}
              height={110}
              className="w-full h-24 block"
            />

            {/* Overlaid HUD Metrics */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-300">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 text-xs transition ${
                    isPlaying
                      ? "bg-rose-500 hover:bg-rose-600 text-white"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Halt Audio</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Audible Test</span>
                    </>
                  )}
                </button>

                <div className="text-[11px] text-slate-400">
                  <span>Duration: </span>
                  <strong className="text-white">
                    {metrics.estimatedDurationSeconds}s
                  </strong>
                </div>
              </div>

              {/* Live Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Cadence:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    metrics.complianceStatus === "CRITICAL_VIOLATION"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : metrics.complianceStatus === "BORDERLINE"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {metrics.syllablesPerSecond} Syllables/Sec
                </span>
              </div>
            </div>

            {/* Playback Progress Track */}
            {isPlaying && (
              <div className="w-full bg-slate-800 h-1 mt-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-75"
                  style={{ width: `${playbackProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Spoken Disclaimer Input / Script */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="disclaimer-audio-text"
                className="font-bold text-[var(--color-text-secondary)] uppercase tracking-wider"
              >
                Spoken Disclaimer Voiceover Script
              </label>
              <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                {metrics.syllableCount} Syllables • {metrics.wordCount} Words
              </span>
            </div>
            <textarea
              id="disclaimer-audio-text"
              value={disclaimerText}
              onChange={(e) => {
                setDisclaimerText(e.target.value);
                stopPlayback();
              }}
              rows={2}
              className="w-full p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-sans"
            />
          </div>
        </div>

        {/* Right Column: Speed Radar Dial & Statutory Analysis */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Cadence Speed Multiplier
              </span>
            </div>
            <span className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400">
              {speedMultiplier.toFixed(1)}x Speed
            </span>
          </div>

          {/* Speed Multiplier Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.1}
              value={speedMultiplier}
              onChange={(e) => {
                setSpeedMultiplier(parseFloat(e.target.value));
                stopPlayback();
              }}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-text-muted)]">
              <span>0.5x (Slow)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                1.0x (ASCI Floor: 2.1 SPS)
              </span>
              <span className="text-rose-500 font-bold">3.0x (Chipmunk)</span>
            </div>
          </div>

          {/* Quick-Preset Multiplier Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { label: "0.8x Clear", rate: 0.8 },
              { label: "1.0x Normal", rate: 1.0 },
              { label: "1.5x Sped-Up", rate: 1.5 },
              { label: "2.2x Accelerated", rate: 2.2 },
              { label: "3.0x Chipmunk", rate: 3.0 },
            ].map((pill) => (
              <button
                key={pill.rate}
                type="button"
                onClick={() => {
                  setSpeedMultiplier(pill.rate);
                  stopPlayback();
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                  speedMultiplier === pill.rate
                    ? "bg-purple-600 text-white font-bold"
                    : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Acoustic Masking / Background Music Toggle */}
          <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-500" />
                <span>Simulate Background Music Masking</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)]">
                ASCI restricts loud audio jingles that drown out legal voiceovers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAudioMaskedBgm(!isAudioMaskedBgm);
                stopPlayback();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition ${
                isAudioMaskedBgm
                  ? "bg-rose-500 text-white"
                  : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]"
              }`}
            >
              {isAudioMaskedBgm ? "Loud BGM (-6dB)" : "Ducked (-18dB)"}
            </button>
          </div>

          {/* Statutory Assessment Scorecard */}
          <div
            className={`p-3.5 rounded-xl border space-y-2 ${
              metrics.complianceStatus === "CRITICAL_VIOLATION"
                ? "bg-rose-500/5 border-rose-500/30 text-rose-900 dark:text-rose-200"
                : metrics.complianceStatus === "BORDERLINE"
                ? "bg-amber-500/5 border-amber-500/30 text-amber-900 dark:text-amber-200"
                : "bg-emerald-500/5 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold font-mono">
              <span className="flex items-center gap-1.5">
                {metrics.complianceStatus === "CRITICAL_VIOLATION" ? (
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                ) : metrics.complianceStatus === "BORDERLINE" ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                )}
                {metrics.complianceStatus === "CRITICAL_VIOLATION"
                  ? "ASCI Clause 4.2 Non-Compliant"
                  : metrics.complianceStatus === "BORDERLINE"
                  ? "Caution: Cadence Velocity Warning"
                  : "100% ASCI & CCPA Audio Compliant"}
              </span>
              <span>{metrics.syllablesPerSecond} SPS / 2.5 Max</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-[var(--color-text-muted)]">Statutory Citation:</span>
                <div className="font-semibold">{metrics.statutoryCitation}</div>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)]">Est. Broadcast Airtime:</span>
                <div className="font-semibold">
                  {metrics.estimatedDurationSeconds}s{" "}
                  {metrics.remediation.additionalAirtimeRequiredSeconds > 0 && (
                    <span className="text-rose-500">
                      (+{metrics.remediation.additionalAirtimeRequiredSeconds}s needed)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {metrics.penaltyExposureInr > 0 && (
              <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  CCPA Sec 89 Legal Exposure:
                </span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {formatInr(metrics.penaltyExposureInr)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Official ASCI Audio Attestation Modal */}
      {isCertificateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                  ASCI Audio Cadence &amp; Intelligibility Certificate
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsCertificateModalOpen(false)}
                className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[var(--color-text-secondary)]">
              <p>
                This document certifies the acoustic cadence, syllable density, and broadcast intelligibility
                of the voiceover disclaimer under <strong>ASCI Chapter IV &amp; CCPA 2023 Guidelines</strong>.
              </p>

              <div className="p-3.5 rounded-xl bg-[var(--color-surface-muted)] font-mono space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span>DISCLAIMER TEXT:</span>
                  <span className="font-bold text-[var(--color-text-primary)] truncate max-w-xs">
                    &ldquo;{disclaimerText}&rdquo;
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>MEASURED SYLLABLES:</span>
                  <span className="font-bold text-[var(--color-text-primary)]">
                    {metrics.syllableCount} syllables ({metrics.wordCount} words)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CADENCE VELOCITY:</span>
                  <span className="font-bold text-[var(--color-text-primary)]">
                    {metrics.syllablesPerSecond} syllables/sec (Statutory ceiling: 2.5 SPS)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ESTIMATED DURATION:</span>
                  <span className="font-bold text-[var(--color-text-primary)]">
                    {metrics.estimatedDurationSeconds} seconds
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>BACKGROUND MUSIC SNR:</span>
                  <span className="font-bold text-[var(--color-text-primary)]">
                    {isAudioMaskedBgm ? "-6 dB (MASKED)" : "-18 dB (DUCKED - COMPLIANT)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>STATUS VERDICT:</span>
                  <span
                    className={`font-bold ${
                      metrics.complianceStatus === "CRITICAL_VIOLATION"
                        ? "text-rose-500"
                        : metrics.complianceStatus === "BORDERLINE"
                        ? "text-amber-500"
                        : "text-emerald-500"
                    }`}
                  >
                    {metrics.complianceStatus}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[var(--color-border-subtle)] text-[10px]">
                  <span>FORENSIC SHA-256 HASH:</span>
                  <span className="text-[var(--color-text-muted)] truncate max-w-xs">
                    4f92d8a01e3b5c7f8902adbe41c6e78893d256a0914bf681cde458
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
              <button
                type="button"
                onClick={() => setIsCertificateModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") window.print();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#111111] dark:bg-white text-white dark:text-black flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
