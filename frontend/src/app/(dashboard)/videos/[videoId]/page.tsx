'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { videosApi } from '@/lib/api';
import {
  ArrowLeft,
  Clock,
  BookOpen,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Loader2,
} from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface Video {
  id: string;
  youtubeVideoId: string;
  title: string;
  description: string | null;
  duration: number | null;
  subject: { id: string; name: string } | null;
}

interface WatchSession {
  id: string;
  totalWatchTimeSeconds: number;
  lastPositionSeconds: number;
  verificationsCompleted: number;
  questionsAnswered: number;
  isCompleted: boolean;
}

interface VerificationData {
  verificationId: string;
  word: string;
  atSeconds: number;
}

interface QuestionData {
  id: string;
  questionText: string;
  options: string[];
}

export default function VideoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params.videoId as string;
  const { user, accessToken, isLoading: authLoading } = useAuthStore();

  // Video state
  const [video, setVideo] = useState<Video | null>(null);
  const [session, setSession] = useState<WatchSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Player state
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);

  // Verification state
  const [showVerification, setShowVerification] = useState(false);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [verificationInput, setVerificationInput] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [lastVerificationTime, setLastVerificationTime] = useState(0);

  // Question state
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [questionResults, setQuestionResults] = useState<{ [key: string]: boolean }>({});
  const [questionsCompleted, setQuestionsCompleted] = useState(false);
  const [hasShownQuestions, setHasShownQuestions] = useState(false);

  // Tracking intervals
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const verificationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const VERIFICATION_INTERVAL = 300; // 5 minutes in seconds
  const QUESTION_TRIGGER_TIME = 1800; // 30 minutes in seconds

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Fetch video and start session
  useEffect(() => {
    if (!authLoading && accessToken && videoId) {
      fetchVideoAndStartSession();
    }

    return () => {
      // Cleanup
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (verificationIntervalRef.current) {
        clearInterval(verificationIntervalRef.current);
      }
      // End session on unmount
      if (accessToken && session?.id) {
        endSession();
      }
    };
  }, [authLoading, accessToken, videoId]);

  const fetchVideoAndStartSession = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch video for watching (returns youtubeVideoId only, not full URL)
      const videoResponse = await videosApi.getForWatching(videoId, accessToken);
      if (!videoResponse.data) {
        throw new Error('Video not found');
      }
      setVideo(videoResponse.data as Video);

      // Start watch session
      const sessionResponse = await videosApi.startWatch(videoId, accessToken);
      if (!sessionResponse.data) {
        throw new Error('Failed to start watch session');
      }
      setSession(sessionResponse.data as WatchSession);
      setLastVerificationTime(sessionResponse.data.totalWatchTimeSeconds || 0);

      // Initialize player
      initializePlayer(videoResponse.data.youtubeVideoId);
    } catch (err: any) {
      console.error('Error loading video:', err);
      setError(err.message || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const initializePlayer = (youtubeVideoId: string) => {
    const initPlayer = () => {
      if (!containerRef.current) return;

      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: youtubeVideoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 0,
          controls: 1,
          disablekb: 0,
          enablejsapi: 1,
          fs: 1,
          iv_load_policy: 3, // Hide annotations
          modestbranding: 1,
          playsinline: 1,
          rel: 0, // No related videos
          origin: window.location.origin,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  };

  const onPlayerReady = (event: any) => {
    setPlayerReady(true);
    // Resume from last position if available
    if (session?.lastPositionSeconds && session.lastPositionSeconds > 0) {
      event.target.seekTo(session.lastPositionSeconds, true);
    }
  };

  const onPlayerStateChange = (event: any) => {
    const state = event.data;

    if (state === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      startProgressTracking();
    } else if (state === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      stopProgressTracking();
    } else if (state === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      stopProgressTracking();
      handleVideoEnded();
    }
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current) {
        const time = Math.floor(playerRef.current.getCurrentTime());
        setCurrentTime(time);
        updateProgress(time);
        checkForVerification(time);
        checkForQuestions(time);
      }
    }, 1000);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const updateProgress = async (seconds: number) => {
    if (!accessToken || !session?.id) return;

    try {
      await videosApi.updateProgress(videoId, session.id, seconds, accessToken);
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  const checkForVerification = (currentSeconds: number) => {
    // Check if 5 minutes have passed since last verification
    const timeSinceLastVerification = currentSeconds - lastVerificationTime;

    if (timeSinceLastVerification >= VERIFICATION_INTERVAL && !showVerification && !showQuestions) {
      triggerVerification();
    }
  };

  const triggerVerification = async () => {
    if (!accessToken || !session?.id) return;

    // Pause video
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }

    try {
      const response = await videosApi.getVerification(videoId, session.id, accessToken);
      if (response.data) {
        setVerificationData(response.data);
        setShowVerification(true);
        setVerificationInput('');
        setVerificationError(null);
        setVerificationSuccess(false);
      } else {
        // No verification needed
        setLastVerificationTime(currentTime);
      }
    } catch (err) {
      console.error('Error getting verification:', err);
      // Allow continuing without verification if API fails
      setLastVerificationTime(currentTime);
    }
  };

  const handleVerificationSubmit = async () => {
    if (!accessToken || !verificationData || !session?.id) return;

    try {
      const response = await videosApi.submitVerification(
        videoId,
        {
          sessionId: session.id,
          verificationId: verificationData.verificationId,
          word: verificationInput,
        },
        accessToken
      );

      if (response.data?.isCorrect) {
        setVerificationSuccess(true);
        setVerificationError(null);

        // Update last verification time
        const newTime = playerRef.current?.getCurrentTime() || currentTime;
        setLastVerificationTime(newTime);

        // Close modal after short delay
        setTimeout(() => {
          setShowVerification(false);
          setVerificationData(null);

          // Resume playback
          if (playerRef.current) {
            playerRef.current.playVideo();
          }
        }, 1500);
      } else {
        setVerificationError('Incorrect word. Please try again.');
        setVerificationInput('');
      }
    } catch (err: any) {
      setVerificationError(err.message || 'Failed to verify. Please try again.');
    }
  };

  const checkForQuestions = (currentSeconds: number) => {
    // Check if 30 minutes reached and questions not yet shown
    if (currentSeconds >= QUESTION_TRIGGER_TIME && !hasShownQuestions && !showQuestions && !showVerification) {
      triggerQuestions();
    }
  };

  const triggerQuestions = async () => {
    if (!accessToken || !session?.id) return;

    // Pause video
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }

    try {
      const response = await videosApi.getSessionQuestions(videoId, session.id, accessToken);
      const questionsData = response.data || [];

      if (questionsData.length > 0) {
        // Map questions to the expected format
        const mappedQuestions = questionsData.map((q: any) => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options?.map((opt: any) =>
            typeof opt === 'string' ? opt : opt.text
          ) || [],
        }));
        setQuestions(mappedQuestions);
        setShowQuestions(true);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setQuestionResults({});
        setQuestionsCompleted(false);
      } else {
        // No questions available, mark as shown
        setHasShownQuestions(true);
      }
    } catch (err) {
      console.error('Error getting questions:', err);
      setHasShownQuestions(true);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleQuestionSubmit = async () => {
    if (!accessToken || !session?.id) return;

    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswer = selectedAnswers[currentQuestion.id];

    if (!selectedAnswer) return;

    try {
      const response = await videosApi.submitAnswer(
        videoId,
        {
          sessionId: session.id,
          questionId: currentQuestion.id,
          answer: selectedAnswer,
        },
        accessToken
      );

      setQuestionResults((prev) => ({
        ...prev,
        [currentQuestion.id]: response.data?.isCorrect || false,
      }));

      // Move to next question or finish
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setQuestionsCompleted(true);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    }
  };

  const handleQuestionsClose = () => {
    setShowQuestions(false);
    setHasShownQuestions(true);

    // Resume playback
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  };

  const handleVideoEnded = async () => {
    await endSession();
  };

  const endSession = async () => {
    if (!accessToken || !session?.id) return;

    try {
      await videosApi.endWatch(videoId, session.id, accessToken);
    } catch (err) {
      console.error('Error ending session:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    endSession();
    router.push('/videos');
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleBack}
            className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
          >
            Back to Video Library
          </button>
        </div>
      </div>
    );
  }

  const correctAnswers = Object.values(questionResults).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-medium text-lg">{video?.title}</h1>
            {video?.subject && (
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {video.subject.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <Clock className="h-4 w-4" />
            <span>{formatTime(currentTime)}</span>
            {video?.duration && (
              <span className="text-gray-500">/ {formatTime(video.duration)}</span>
            )}
          </div>

          {isPlaying ? (
            <div className="flex items-center gap-1 text-green-400">
              <Play className="h-4 w-4" />
              <span>Playing</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
              <Pause className="h-4 w-4" />
              <span>Paused</span>
            </div>
          )}
        </div>
      </div>

      {/* Video Player Container */}
      <div className="relative" ref={containerRef}>
        <div className="aspect-video bg-black max-w-6xl mx-auto">
          <div id="youtube-player" className="w-full h-full" />
        </div>

        {/* Overlay to prevent right-click */}
        <div
          className="absolute inset-0 pointer-events-none"
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      {/* Video Description */}
      {video?.description && (
        <div className="max-w-6xl mx-auto p-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Description</h3>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{video.description}</p>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerification && verificationData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Attention Check</h2>
              <p className="text-gray-600 mt-2">
                Please type the word below to continue watching
              </p>
            </div>

            <div className="bg-gray-100 rounded-lg p-6 mb-6 text-center">
              <span className="text-3xl font-bold text-gray-900 tracking-wider">
                {verificationData.word}
              </span>
            </div>

            <input
              type="text"
              value={verificationInput}
              onChange={(e) => setVerificationInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerificationSubmit()}
              placeholder="Type the word here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-lg"
              autoFocus
            />

            {verificationError && (
              <div className="mt-3 flex items-center gap-2 text-red-600 justify-center">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">{verificationError}</span>
              </div>
            )}

            {verificationSuccess && (
              <div className="mt-3 flex items-center gap-2 text-green-600 justify-center">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Verified! Resuming video...</span>
              </div>
            )}

            <button
              onClick={handleVerificationSubmit}
              disabled={!verificationInput.trim() || verificationSuccess}
              className="w-full mt-4 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {verificationSuccess ? 'Verified!' : 'Submit'}
            </button>
          </div>
        </div>
      )}

      {/* Questions Modal */}
      {showQuestions && questions.length > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            {!questionsCompleted ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Comprehension Check</h2>
                  <p className="text-gray-600 mt-2">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {questions[currentQuestionIndex].questionText}
                  </h3>

                  <div className="space-y-3">
                    {questions[currentQuestionIndex].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          handleAnswerSelect(questions[currentQuestionIndex].id, option)
                        }
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                          selectedAnswers[questions[currentQuestionIndex].id] === option
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="font-medium text-gray-900">
                          {String.fromCharCode(65 + index)}.
                        </span>{' '}
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleQuestionSubmit}
                  disabled={!selectedAnswers[questions[currentQuestionIndex].id]}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Submit'}
                </button>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      correctAnswers >= questions.length / 2
                        ? 'bg-green-100'
                        : 'bg-yellow-100'
                    }`}
                  >
                    {correctAnswers >= questions.length / 2 ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-yellow-600" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Results</h2>
                  <p className="text-gray-600 mt-2">
                    You answered {correctAnswers} out of {questions.length} correctly
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className={`p-4 rounded-lg ${
                        questionResults[question.id]
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {questionResults[question.id] ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            Q{index + 1}: {question.questionText}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Your answer: {selectedAnswers[question.id]}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleQuestionsClose}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Continue Watching
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
