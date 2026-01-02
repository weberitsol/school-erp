'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  MessageSquare,
  Highlighter,
  Pencil,
  Type,
  Square,
  Circle,
  StickyNote,
  Bookmark,
  BookmarkCheck,
  Eraser,
  Undo,
  Redo,
  Save,
  Send,
  Loader2,
  X,
  Sparkles,
  Clock,
  Info,
  FileText,
  BookOpen,
  MousePointer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { booksApi, Book, BookAnnotation, PopularQuestion } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// PDF.js worker and viewer
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';

type AnnotationTool = 'select' | 'highlight' | 'note' | 'freehand' | 'text' | 'rectangle' | 'circle' | 'eraser';

interface DrawingPath {
  tool: AnnotationTool;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  page: number;
}

interface ShapeAnnotation {
  tool: 'rectangle' | 'circle' | 'highlight';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  page: number;
}

interface TextAnnotation {
  x: number;
  y: number;
  text: string;
  color: string;
  page: number;
}

interface NoteAnnotation {
  x: number;
  y: number;
  content: string;
  page: number;
}

interface PageParams {
  id: string;
}

export default function BookViewerPage({ params }: { params: PageParams }) {
  const bookId = params.id;

  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();

  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Viewer state
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed for plugin
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Page navigation plugin
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { jumpToPage } = pageNavigationPluginInstance;

  // Annotation state
  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [annotations, setAnnotations] = useState<BookAnnotation[]>([]);
  const [highlightColor, setHighlightColor] = useState('#FFFF00');
  const [strokeColor, setStrokeColor] = useState('#FF0000');
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [shapes, setShapes] = useState<ShapeAnnotation[]>([]);
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [notes, setNotes] = useState<NoteAnnotation[]>([]);
  const [tempShape, setTempShape] = useState<ShapeAnnotation | null>(null);

  // Text input state
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputPos, setTextInputPos] = useState({ x: 0, y: 0 });
  const [textInputValue, setTextInputValue] = useState('');

  // Note input state
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteInputPos, setNoteInputPos] = useState({ x: 0, y: 0 });
  const [noteInputValue, setNoteInputValue] = useState('');

  // History for undo/redo
  const [history, setHistory] = useState<{ paths: DrawingPath[]; shapes: ShapeAnnotation[]; texts: TextAnnotation[]; notes: NoteAnnotation[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Annotation panel state
  const [showAnnotationsPanel, setShowAnnotationsPanel] = useState(false);

  // AI Q&A state
  const [showQAPanel, setShowQAPanel] = useState(false);
  const [question, setQuestion] = useState('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [qaHistory, setQaHistory] = useState<{
    id?: string;
    question: string;
    answer: string;
    sourcePages: number[];
    confidence: number;
    cached: boolean;
  }[]>([]);
  const [popularQuestions, setPopularQuestions] = useState<PopularQuestion[]>([]);

  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  // Display page (1-indexed for UI)
  const displayPage = currentPage + 1;

  // Save to history for undo/redo
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      paths: [...paths],
      shapes: [...shapes],
      texts: [...textAnnotations],
      notes: [...notes],
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, paths, shapes, textAnnotations, notes]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setPaths(prevState.paths);
      setShapes(prevState.shapes);
      setTextAnnotations(prevState.texts);
      setNotes(prevState.notes);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setPaths(nextState.paths);
      setShapes(nextState.shapes);
      setTextAnnotations(nextState.texts);
      setNotes(nextState.notes);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  // Fetch book details
  useEffect(() => {
    const fetchBook = async () => {
      if (!accessToken || !bookId) return;
      setIsLoading(true);
      try {
        const response = await booksApi.getById(bookId, accessToken);
        if (response.success && response.data) {
          setBook(response.data);
          setPdfUrl(booksApi.getFileUrl(bookId, accessToken));
        } else {
          toast({
            title: 'Error',
            description: 'Book not found or access denied',
            variant: 'destructive',
          });
          router.push('/library');
        }
      } catch (error) {
        console.error('Error fetching book:', error);
        toast({
          title: 'Error',
          description: 'Failed to load book',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [bookId, accessToken, router, toast]);

  // Fetch annotations and load saved canvas state
  useEffect(() => {
    const fetchAnnotations = async () => {
      if (!accessToken || !bookId) return;
      try {
        const response = await booksApi.getAnnotations(bookId, accessToken);
        if (response.success && response.data) {
          setAnnotations(response.data);
          const bookmark = response.data.find(
            a => a.annotationType === 'BOOKMARK' && a.pageNumber === displayPage
          );
          setIsBookmarked(!!bookmark);

          // Load saved canvas states from annotations
          const canvasAnnotations = response.data.filter(
            a => a.annotationType === 'FREEHAND' && a.canvasState
          );

          if (canvasAnnotations.length > 0) {
            const allPaths: DrawingPath[] = [];
            const allShapes: ShapeAnnotation[] = [];
            const allTexts: TextAnnotation[] = [];
            const allNotes: NoteAnnotation[] = [];

            canvasAnnotations.forEach(annotation => {
              try {
                const canvasData = typeof annotation.canvasState === 'string'
                  ? JSON.parse(annotation.canvasState)
                  : annotation.canvasState;

                if (canvasData.paths) {
                  allPaths.push(...canvasData.paths);
                }
                if (canvasData.shapes) {
                  allShapes.push(...canvasData.shapes);
                }
                if (canvasData.textAnnotations) {
                  allTexts.push(...canvasData.textAnnotations);
                }
                if (canvasData.notes) {
                  allNotes.push(...canvasData.notes);
                }
              } catch (e) {
                console.error('Error parsing canvas state:', e);
              }
            });

            setPaths(allPaths);
            setShapes(allShapes);
            setTextAnnotations(allTexts);
            setNotes(allNotes);

            // Initialize history with loaded state
            if (allPaths.length > 0 || allShapes.length > 0 || allTexts.length > 0 || allNotes.length > 0) {
              setHistory([{
                paths: allPaths,
                shapes: allShapes,
                texts: allTexts,
                notes: allNotes,
              }]);
              setHistoryIndex(0);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching annotations:', error);
      }
    };

    fetchAnnotations();
  }, [bookId, accessToken]); // Load all annotations once when book opens

  // Update bookmark status when page changes
  useEffect(() => {
    const bookmark = annotations.find(
      a => a.annotationType === 'BOOKMARK' && a.pageNumber === displayPage
    );
    setIsBookmarked(!!bookmark);
  }, [displayPage, annotations]);

  // Fetch popular questions
  useEffect(() => {
    const fetchPopularQuestions = async () => {
      if (!accessToken || !bookId) return;
      try {
        const response = await booksApi.getPopularQuestions(bookId, accessToken, 5);
        if (response.success && response.data) {
          setPopularQuestions(response.data);
        }
      } catch (error) {
        console.error('Error fetching popular questions:', error);
      }
    };

    if (showQAPanel) {
      fetchPopularQuestions();
    }
  }, [bookId, accessToken, showQAPanel]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all paths for current page
    paths.filter(p => p.page === displayPage).forEach(path => {
      if (path.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(path.points[0].x, path.points[0].y);
      path.points.forEach((point, i) => {
        if (i > 0) ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });

    // Draw current path being drawn
    if (currentPath && currentPath.points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = currentPath.color;
      ctx.lineWidth = currentPath.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(currentPath.points[0].x, currentPath.points[0].y);
      currentPath.points.forEach((point, i) => {
        if (i > 0) ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }

    // Draw shapes for current page
    shapes.filter(s => s.page === displayPage).forEach(shape => {
      ctx.beginPath();
      if (shape.tool === 'highlight') {
        ctx.fillStyle = shape.color + '40';
        ctx.fillRect(
          Math.min(shape.startX, shape.endX),
          Math.min(shape.startY, shape.endY),
          Math.abs(shape.endX - shape.startX),
          Math.abs(shape.endY - shape.startY)
        );
      } else if (shape.tool === 'rectangle') {
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          Math.min(shape.startX, shape.endX),
          Math.min(shape.startY, shape.endY),
          Math.abs(shape.endX - shape.startX),
          Math.abs(shape.endY - shape.startY)
        );
      } else if (shape.tool === 'circle') {
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 2;
        const centerX = (shape.startX + shape.endX) / 2;
        const centerY = (shape.startY + shape.endY) / 2;
        const radiusX = Math.abs(shape.endX - shape.startX) / 2;
        const radiusY = Math.abs(shape.endY - shape.startY) / 2;
        if (radiusX > 0 && radiusY > 0) {
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    });

    // Draw temp shape
    if (tempShape) {
      ctx.beginPath();
      if (tempShape.tool === 'highlight') {
        ctx.fillStyle = tempShape.color + '40';
        ctx.fillRect(
          Math.min(tempShape.startX, tempShape.endX),
          Math.min(tempShape.startY, tempShape.endY),
          Math.abs(tempShape.endX - tempShape.startX),
          Math.abs(tempShape.endY - tempShape.startY)
        );
      } else if (tempShape.tool === 'rectangle') {
        ctx.strokeStyle = tempShape.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          Math.min(tempShape.startX, tempShape.endX),
          Math.min(tempShape.startY, tempShape.endY),
          Math.abs(tempShape.endX - tempShape.startX),
          Math.abs(tempShape.endY - tempShape.startY)
        );
        ctx.setLineDash([]);
      } else if (tempShape.tool === 'circle') {
        ctx.strokeStyle = tempShape.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const centerX = (tempShape.startX + tempShape.endX) / 2;
        const centerY = (tempShape.startY + tempShape.endY) / 2;
        const radiusX = Math.abs(tempShape.endX - tempShape.startX) / 2;
        const radiusY = Math.abs(tempShape.endY - tempShape.startY) / 2;
        if (radiusX > 0 && radiusY > 0) {
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
    }

    // Draw text annotations for current page
    textAnnotations.filter(t => t.page === displayPage).forEach(text => {
      ctx.font = '16px Arial';
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, text.x, text.y);
    });

    // Draw note markers for current page
    notes.filter(n => n.page === displayPage).forEach(note => {
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.moveTo(note.x, note.y);
      ctx.lineTo(note.x + 20, note.y);
      ctx.lineTo(note.x + 20, note.y + 20);
      ctx.lineTo(note.x + 5, note.y + 20);
      ctx.lineTo(note.x, note.y + 15);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#CC8400';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [paths, currentPath, shapes, tempShape, textAnnotations, notes, displayPage]);

  // Resize canvas to match container
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = canvas?.parentElement;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [totalPages]);

  // Get position relative to canvas
  const getCanvasPosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') return;

    const pos = getCanvasPosition(e);

    if (activeTool === 'freehand' || activeTool === 'eraser') {
      setIsDrawing(true);
      setCurrentPath({
        tool: activeTool,
        points: [pos],
        color: activeTool === 'eraser' ? '#FFFFFF' : strokeColor,
        strokeWidth: activeTool === 'eraser' ? 20 : 3,
        page: displayPage,
      });
    } else if (activeTool === 'highlight' || activeTool === 'rectangle' || activeTool === 'circle') {
      setIsDrawing(true);
      setTempShape({
        tool: activeTool,
        startX: pos.x,
        startY: pos.y,
        endX: pos.x,
        endY: pos.y,
        color: activeTool === 'highlight' ? highlightColor : strokeColor,
        page: displayPage,
      });
    } else if (activeTool === 'text') {
      setTextInputPos(pos);
      setShowTextInput(true);
      setTimeout(() => textInputRef.current?.focus(), 0);
    } else if (activeTool === 'note') {
      setNoteInputPos(pos);
      setShowNoteInput(true);
      setTimeout(() => noteInputRef.current?.focus(), 0);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const pos = getCanvasPosition(e);

    if (activeTool === 'freehand' || activeTool === 'eraser') {
      if (currentPath) {
        setCurrentPath({
          ...currentPath,
          points: [...currentPath.points, pos],
        });
      }
    } else if ((activeTool === 'highlight' || activeTool === 'rectangle' || activeTool === 'circle') && tempShape) {
      setTempShape({
        ...tempShape,
        endX: pos.x,
        endY: pos.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;

    if ((activeTool === 'freehand' || activeTool === 'eraser') && currentPath) {
      setPaths(prev => [...prev, currentPath]);
      setCurrentPath(null);
      saveToHistory();
    } else if ((activeTool === 'highlight' || activeTool === 'rectangle' || activeTool === 'circle') && tempShape) {
      if (Math.abs(tempShape.endX - tempShape.startX) > 5 || Math.abs(tempShape.endY - tempShape.startY) > 5) {
        setShapes(prev => [...prev, tempShape]);
        saveToHistory();
      }
      setTempShape(null);
    }

    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      handleMouseUp();
    }
  };

  // Handle text input submit
  const handleTextSubmit = () => {
    if (textInputValue.trim()) {
      setTextAnnotations(prev => [...prev, {
        x: textInputPos.x,
        y: textInputPos.y,
        text: textInputValue.trim(),
        color: strokeColor,
        page: displayPage,
      }]);
      saveToHistory();
    }
    setTextInputValue('');
    setShowTextInput(false);
  };

  // Handle note input submit
  const handleNoteSubmit = () => {
    if (noteInputValue.trim()) {
      setNotes(prev => [...prev, {
        x: noteInputPos.x,
        y: noteInputPos.y,
        content: noteInputValue.trim(),
        page: displayPage,
      }]);
      saveToHistory();
    }
    setNoteInputValue('');
    setShowNoteInput(false);
  };

  // Save all annotations to backend
  const handleSaveAnnotations = async () => {
    if (!accessToken || !bookId) return;

    try {
      const canvasData = {
        paths,
        shapes,
        textAnnotations,
        notes,
      };

      // Use page 0 as marker for "all pages canvas data" to avoid duplicates
      await booksApi.saveCanvasState(bookId, {
        pageNumber: 0,
        canvasState: JSON.stringify(canvasData)
      }, accessToken);

      toast({
        title: 'Saved',
        description: 'Annotations saved successfully',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save annotations',
        variant: 'destructive',
      });
    }
  };

  // Clear all annotations on current page
  const handleClearPage = () => {
    setPaths(prev => prev.filter(p => p.page !== displayPage));
    setShapes(prev => prev.filter(s => s.page !== displayPage));
    setTextAnnotations(prev => prev.filter(t => t.page !== displayPage));
    setNotes(prev => prev.filter(n => n.page !== displayPage));
    saveToHistory();
    toast({
      title: 'Cleared',
      description: `Cleared all annotations on page ${displayPage}`,
    });
  };

  // Handle zoom
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  // Handle page navigation using plugin
  const goToPage = (page: number) => {
    const targetPage = page - 1; // Convert to 0-indexed
    if (targetPage >= 0 && targetPage < totalPages) {
      jumpToPage(targetPage);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      jumpToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      jumpToPage(currentPage + 1);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle bookmark toggle
  const toggleBookmark = async () => {
    if (!accessToken || !bookId) return;
    try {
      if (isBookmarked) {
        const bookmark = annotations.find(
          a => a.annotationType === 'BOOKMARK' && a.pageNumber === displayPage
        );
        if (bookmark) {
          await booksApi.deleteAnnotation(bookId, bookmark.id, accessToken);
          setAnnotations(prev => prev.filter(a => a.id !== bookmark.id));
        }
      } else {
        const response = await booksApi.createAnnotation(
          bookId,
          {
            pageNumber: displayPage,
            annotationType: 'BOOKMARK',
            noteContent: `Page ${displayPage}`,
            isPrivate: true,
          },
          accessToken
        );
        if (response.success && response.data) {
          setAnnotations(prev => [...prev, response.data!]);
        }
      }
      setIsBookmarked(!isBookmarked);
      toast({
        title: isBookmarked ? 'Bookmark removed' : 'Page bookmarked',
        description: isBookmarked ? `Removed bookmark from page ${displayPage}` : `Bookmarked page ${displayPage}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle bookmark',
        variant: 'destructive',
      });
    }
  };

  // Handle AI question
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !bookId || !question.trim()) return;

    setIsAskingQuestion(true);
    try {
      const response = await booksApi.askQuestion(bookId, question.trim(), accessToken);
      if (response.success && response.data) {
        const answer = response.data;
        setQaHistory(prev => [
          {
            id: answer.id,
            question: question.trim(),
            answer: answer.answer,
            sourcePages: answer.sourcePages || [],
            confidence: answer.confidence || 0,
            cached: answer.cached || false,
          },
          ...prev,
        ]);
        setQuestion('');
      } else {
        toast({
          title: 'AI Q&A',
          description: response.error || 'Failed to get answer. AI service may be unavailable.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('AI Q&A error:', error);
      toast({
        title: 'AI Q&A Error',
        description: error.message || 'Failed to ask question. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const askPopularQuestion = (q: string) => {
    setQuestion(q);
  };

  const goToSourcePage = (page: number) => {
    goToPage(page);
    setShowQAPanel(false);
  };

  const highlightColors = ['#FFFF00', '#90EE90', '#ADD8E6', '#FFB6C1', '#FFA500'];
  const strokeColors = ['#FF0000', '#0000FF', '#008000', '#800080', '#000000'];

  const annotationTools: { id: AnnotationTool; icon: any; label: string }[] = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'highlight', icon: Highlighter, label: 'Highlight' },
    { id: 'note', icon: StickyNote, label: 'Note' },
    { id: 'freehand', icon: Pencil, label: 'Draw' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading book...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Book not found</p>
          <Link href="/library" className="text-emerald-600 hover:underline">
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={viewerContainerRef} className="flex flex-col h-[calc(100vh-100px)] bg-gray-100 dark:bg-gray-900">
      {/* Top Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left - Navigation & Info */}
          <div className="flex items-center gap-4">
            <Link
              href="/library"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Link>
            <div className="hidden md:block">
              <h1 className="font-semibold text-gray-900 dark:text-white truncate max-w-md">
                {book.title}
              </h1>
              {book.author && (
                <p className="text-xs text-gray-500 dark:text-gray-400">by {book.author}</p>
              )}
            </div>
          </div>

          {/* Center - Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 0}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={displayPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                min={1}
                max={totalPages}
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                of {totalPages || '...'}
              </span>
            </div>
            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Right - Tools */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="h-5 w-5 text-gray-500" />
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="h-5 w-5 text-gray-500" />
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5 text-gray-500" />
              ) : (
                <Maximize2 className="h-5 w-5 text-gray-500" />
              )}
            </button>
            <button
              onClick={toggleBookmark}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark page'}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-5 w-5 text-amber-500" />
              ) : (
                <Bookmark className="h-5 w-5 text-gray-500" />
              )}
            </button>
            <button
              onClick={handleSaveAnnotations}
              className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
              title="Save annotations"
            >
              <Save className="h-5 w-5 text-emerald-500" />
            </button>
            <button
              onClick={() => {
                setShowAnnotationsPanel(!showAnnotationsPanel);
                if (!showAnnotationsPanel) setShowQAPanel(false);
              }}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showAnnotationsPanel
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              )}
              title="Annotations"
            >
              <FileText className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                setShowQAPanel(!showQAPanel);
                if (!showQAPanel) setShowAnnotationsPanel(false);
              }}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showQAPanel
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              )}
              title="AI Q&A"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
            {pdfUrl && (
              <a
                href={pdfUrl}
                download={`${book.title}.pdf`}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Download PDF"
              >
                <Download className="h-5 w-5 text-gray-500" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Annotation Toolbar */}
        <div className="w-14 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-2 gap-1">
          {/* Tool Selection */}
          {annotationTools.map(tool => {
            const IconComponent = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-lg transition-all",
                  activeTool === tool.id
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 ring-2 ring-emerald-500"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                )}
                title={tool.label}
              >
                <IconComponent className="h-5 w-5" />
              </button>
            );
          })}

          <div className="w-8 h-px bg-gray-200 dark:bg-gray-700 my-2" />

          {/* Color Picker for Highlight */}
          {activeTool === 'highlight' && (
            <div className="flex flex-col gap-1 p-1">
              {highlightColors.map(color => (
                <button
                  key={color}
                  onClick={() => setHighlightColor(color)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-all",
                    highlightColor === color
                      ? "border-gray-800 dark:border-white scale-110"
                      : "border-transparent hover:scale-110"
                  )}
                  style={{ backgroundColor: color }}
                  title={`Highlight color`}
                />
              ))}
            </div>
          )}

          {/* Color Picker for Stroke */}
          {(activeTool === 'freehand' || activeTool === 'text' || activeTool === 'rectangle' || activeTool === 'circle') && (
            <div className="flex flex-col gap-1 p-1">
              {strokeColors.map(color => (
                <button
                  key={color}
                  onClick={() => setStrokeColor(color)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-all",
                    strokeColor === color
                      ? "border-gray-800 dark:border-white scale-110"
                      : "border-transparent hover:scale-110"
                  )}
                  style={{ backgroundColor: color }}
                  title={`Stroke color`}
                />
              ))}
            </div>
          )}

          {/* Undo/Redo/Save/Clear */}
          <div className="mt-auto flex flex-col gap-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-30"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-30"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </button>
            <button
              onClick={handleClearPage}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-400"
              title="Clear page annotations"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={handleSaveAnnotations}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-emerald-500"
              title="Save annotations"
            >
              <Save className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PDF Viewer with Canvas Overlay */}
        <div className="flex-1 relative overflow-auto">
          <div className="h-full w-full relative" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
            {pdfUrl && (
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer
                  fileUrl={pdfUrl}
                  defaultScale={SpecialZoomLevel.PageFit}
                  plugins={[pageNavigationPluginInstance]}
                  onDocumentLoad={(e) => setTotalPages(e.doc.numPages)}
                  onPageChange={(e) => setCurrentPage(e.currentPage)}
                />
              </Worker>
            )}
            {/* Canvas Overlay for Annotations */}
            <canvas
              ref={canvasRef}
              className={cn(
                "absolute top-0 left-0 w-full h-full",
                activeTool === 'select' ? "pointer-events-none" : "cursor-crosshair"
              )}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />

            {/* Text Input Overlay */}
            {showTextInput && (
              <div
                className="absolute z-50"
                style={{ left: textInputPos.x, top: textInputPos.y }}
              >
                <input
                  ref={textInputRef}
                  type="text"
                  value={textInputValue}
                  onChange={(e) => setTextInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTextSubmit();
                    if (e.key === 'Escape') {
                      setShowTextInput(false);
                      setTextInputValue('');
                    }
                  }}
                  onBlur={handleTextSubmit}
                  className="px-2 py-1 border border-gray-300 rounded shadow-lg text-sm min-w-[150px]"
                  placeholder="Type text..."
                  style={{ color: strokeColor }}
                />
              </div>
            )}

            {/* Note Input Overlay */}
            {showNoteInput && (
              <div
                className="absolute z-50 bg-amber-100 border border-amber-300 rounded-lg shadow-lg p-2"
                style={{ left: noteInputPos.x, top: noteInputPos.y, minWidth: '200px' }}
              >
                <textarea
                  ref={noteInputRef}
                  value={noteInputValue}
                  onChange={(e) => setNoteInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) handleNoteSubmit();
                    if (e.key === 'Escape') {
                      setShowNoteInput(false);
                      setNoteInputValue('');
                    }
                  }}
                  className="w-full px-2 py-1 border border-amber-200 rounded text-sm bg-amber-50 resize-none"
                  placeholder="Add note... (Ctrl+Enter to save)"
                  rows={3}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setShowNoteInput(false);
                      setNoteInputValue('');
                    }}
                    className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNoteSubmit}
                    className="px-2 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Loading indicator */}
          {totalPages === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-900">
              <div className="text-center p-8 max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <Loader2 className="h-10 w-10 text-white animate-spin" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading PDF...</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {book.sourceType === 'EXTERNAL_URL' ? 'Downloading and caching...' : 'Loading viewer...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Annotations Panel (Right) */}
        {showAnnotationsPanel && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500" />
                <h2 className="font-semibold text-gray-900 dark:text-white">My Annotations</h2>
              </div>
              <button
                onClick={() => setShowAnnotationsPanel(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Annotation Stats */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="text-lg font-bold text-amber-600">
                  {annotations.filter(a => a.annotationType === 'BOOKMARK').length}
                </div>
                <div className="text-xs text-amber-600/70">Marks</div>
              </div>
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">
                  {shapes.filter(s => s.tool === 'highlight').length}
                </div>
                <div className="text-xs text-yellow-600/70">Highlights</div>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {notes.length}
                </div>
                <div className="text-xs text-blue-600/70">Notes</div>
              </div>
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-lg font-bold text-red-600">
                  {paths.length + shapes.filter(s => s.tool !== 'highlight').length}
                </div>
                <div className="text-xs text-red-600/70">Drawings</div>
              </div>
            </div>

            {/* Annotations List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {annotations.length === 0 && paths.length === 0 && shapes.length === 0 && notes.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No annotations yet
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Use the tools on the left to annotate
                  </p>
                </div>
              ) : (
                <>
                  {/* Bookmarks */}
                  {annotations.filter(a => a.annotationType === 'BOOKMARK').length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        Bookmarks
                      </h3>
                      <div className="space-y-2">
                        {annotations
                          .filter(a => a.annotationType === 'BOOKMARK')
                          .sort((a, b) => a.pageNumber - b.pageNumber)
                          .map(annotation => (
                            <button
                              key={annotation.id}
                              onClick={() => goToPage(annotation.pageNumber)}
                              className={cn(
                                "w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3",
                                displayPage === annotation.pageNumber
                                  ? "bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800"
                                  : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                              )}
                            >
                              <BookmarkCheck className="h-4 w-4 text-amber-500 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  Page {annotation.pageNumber}
                                </div>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {notes.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 mt-4">
                        Notes
                      </h3>
                      <div className="space-y-2">
                        {notes.map((note, idx) => (
                          <button
                            key={idx}
                            onClick={() => goToPage(note.page)}
                            className={cn(
                              "w-full text-left p-3 rounded-lg transition-colors",
                              displayPage === note.page
                                ? "bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800"
                                : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <StickyNote className="h-3 w-3 text-amber-500" />
                              <span className="text-xs text-gray-500">Page {note.page}</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                              {note.content}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Drawings per page */}
                  {Array.from(new Set([...paths.map(p => p.page), ...shapes.map(s => s.page)])).sort((a, b) => a - b).map(page => (
                    <div key={page}>
                      <button
                        onClick={() => goToPage(page)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-colors",
                          displayPage === page
                            ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                            : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Pencil className="h-3 w-3 text-blue-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Page {page}: {paths.filter(p => p.page === page).length + shapes.filter(s => s.page === page).length} drawings
                          </span>
                        </div>
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* AI Q&A Panel (Right) */}
        {showQAPanel && (
          <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <h2 className="font-semibold text-gray-900 dark:text-white">AI Q&A</h2>
              </div>
              <button
                onClick={() => setShowQAPanel(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Info Banner */}
            {!book.isIndexed && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  This book hasn't been indexed yet. AI Q&A may not work properly.
                </p>
              </div>
            )}

            {/* Popular Questions */}
            {popularQuestions.length > 0 && qaHistory.length === 0 && (
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Popular Questions
                </p>
                <div className="space-y-2">
                  {popularQuestions.map(q => (
                    <button
                      key={q.id}
                      onClick={() => askPopularQuestion(q.question)}
                      className="w-full text-left text-sm text-gray-700 dark:text-gray-300 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {q.question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Q&A History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {qaHistory.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ask a question about this book
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    The AI will answer based on the book content
                  </p>
                </div>
              )}
              {qaHistory.map((qa, index) => (
                <div key={index} className="space-y-3">
                  {/* Question */}
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-gray-500">Q</span>
                    </div>
                    <div className="flex-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                      <p className="text-sm text-gray-800 dark:text-gray-200">{qa.question}</p>
                    </div>
                  </div>

                  {/* Answer */}
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {qa.answer}
                      </p>
                      {qa.sourcePages && qa.sourcePages.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-500">Sources:</span>
                          {qa.sourcePages.map(page => (
                            <button
                              key={page}
                              onClick={() => goToSourcePage(page)}
                              className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-800/30 text-purple-600 dark:text-purple-400 rounded-full hover:bg-purple-200 dark:hover:bg-purple-700/30"
                            >
                              Page {page}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                        {qa.confidence > 0 && (
                          <span className="flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            {Math.round(qa.confidence * 100)}% confidence
                          </span>
                        )}
                        {qa.cached && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Cached
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Question Input */}
            <form onSubmit={handleAskQuestion} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Ask a question about this book..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  disabled={isAskingQuestion}
                />
                <button
                  type="submit"
                  disabled={isAskingQuestion || !question.trim()}
                  className="p-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                >
                  {isAskingQuestion ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
