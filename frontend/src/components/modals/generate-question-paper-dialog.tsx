'use client';

import { useState } from 'react';
import { FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { wordGenerationService, GenerateQuestionPaperPayload } from '@/services/word-generation.service';
import { useToast } from '@/hooks/use-toast';

interface GenerateQuestionPaperDialogProps {
  isOpen: boolean;
  onClose: () => void;
  testId: string;
  testName: string;
  onSuccess?: () => void;
}

export function GenerateQuestionPaperDialog({
  isOpen,
  onClose,
  testId,
  testName,
  onSuccess,
}: GenerateQuestionPaperDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [columnLayout, setColumnLayout] = useState<'single' | 'double'>('single');
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const [instructions, setInstructions] = useState('');

  const handleGenerate = async () => {
    try {
      setLoading(true);

      const payload: GenerateQuestionPaperPayload = {
        testId,
        title: testName,
        instructions: instructions || undefined,
        columnLayout,
        includeAnswers,
      };

      const blob = await wordGenerationService.generateQuestionPaper(payload);

      // Create filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${testName.replace(/\s+/g, '_')}_${columnLayout}_${timestamp}.docx`;

      // Download the file
      wordGenerationService.downloadFile(blob, filename);

      toast({
        title: 'Success',
        description: 'Question paper generated and downloaded successfully!',
        variant: 'default',
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Generate error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate question paper',
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
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Generate Question Paper</h2>
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
          {/* Test Info */}
          <div className="rounded-md bg-blue-50 p-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Test:</span> {testName}
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
                  Double Column (Compact)
                </label>
              </div>
            </div>
          </div>

          {/* Include Answers */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="answers"
              checked={includeAnswers}
              onChange={(e) => setIncludeAnswers(e.target.checked)}
              disabled={loading}
              className="h-4 w-4 cursor-pointer rounded border-gray-300"
            />
            <label htmlFor="answers" className="cursor-pointer text-sm text-gray-700">
              Include answers and explanations
            </label>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
              Instructions (Optional)
            </label>
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={loading}
              placeholder="Add instructions for the question paper..."
              className="h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          {/* Info */}
          <div className="flex gap-2 rounded-md bg-blue-50 p-3">
            <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-600">
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
              'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
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
