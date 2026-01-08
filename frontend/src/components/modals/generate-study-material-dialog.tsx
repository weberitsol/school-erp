'use client';

import { useState } from 'react';
import { BookOpen, Download, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { wordGenerationService, GenerateStudyMaterialPayload } from '@/services/word-generation.service';
import { useToast } from '@/hooks/use-toast';

interface GenerateStudyMaterialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  chapterName: string;
  subjectName?: string;
  onSuccess?: () => void;
}

export function GenerateStudyMaterialDialog({
  isOpen,
  onClose,
  chapterId,
  chapterName,
  subjectName,
  onSuccess,
}: GenerateStudyMaterialDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [columnLayout, setColumnLayout] = useState<'single' | 'double'>('double');
  const [includeQuestions, setIncludeQuestions] = useState(true);

  const handleGenerate = async () => {
    try {
      setLoading(true);

      const payload: GenerateStudyMaterialPayload = {
        chapterId,
        includeQuestions,
        columnLayout,
      };

      const blob = await wordGenerationService.generateStudyMaterial(payload);

      // Create filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `StudyMaterial_${chapterName.replace(/\s+/g, '_')}_${columnLayout}_${timestamp}.docx`;

      // Download the file
      wordGenerationService.downloadFile(blob, filename);

      toast({
        title: 'Success',
        description: 'Study material generated and downloaded successfully!',
        variant: 'default',
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Generate error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate study material',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold">Generate Study Material</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 px-6 py-4">
          {/* Chapter Info */}
          <div className="rounded-md bg-amber-50 p-3">
            {subjectName && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Subject:</span> {subjectName}
              </p>
            )}
            <p className="text-sm text-gray-600">
              <span className="font-medium">Chapter:</span> {chapterName}
            </p>
          </div>

          {/* Column Layout */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Column Layout
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="single"
                  name="layout"
                  value="single"
                  checked={columnLayout === 'single'}
                  onChange={(e) => setColumnLayout(e.target.value as 'single')}
                  disabled={loading}
                  className="h-4 w-4 cursor-pointer"
                />
                <label htmlFor="single" className="cursor-pointer text-sm text-gray-700">
                  Single Column (Traditional)
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="double"
                  name="layout"
                  value="double"
                  checked={columnLayout === 'double'}
                  onChange={(e) => setColumnLayout(e.target.value as 'double')}
                  disabled={loading}
                  className="h-4 w-4 cursor-pointer"
                />
                <label htmlFor="double" className="cursor-pointer text-sm text-gray-700">
                  Double Column (Compact) - Recommended
                </label>
              </div>
            </div>
          </div>

          {/* Include Questions */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="questions"
              checked={includeQuestions}
              onChange={(e) => setIncludeQuestions(e.target.checked)}
              disabled={loading}
              className="h-4 w-4 cursor-pointer rounded border-gray-300"
            />
            <label htmlFor="questions" className="cursor-pointer text-sm text-gray-700">
              Include practice questions from this chapter
            </label>
          </div>

          {/* Info */}
          <div className="flex gap-2 rounded-md bg-amber-50 p-3">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600">
              Document will be generated and automatically downloaded to your computer.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 rounded-md border border-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md',
              'bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Generate & Download
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
