'use client';

import { useState } from 'react';
import { BarChart3, Download, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { wordGenerationService, GenerateReportCardPayload } from '@/services/word-generation.service';
import { useToast } from '@/hooks/use-toast';

interface GenerateReportCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  termId?: string;
  termName?: string;
  onSuccess?: () => void;
}

export function GenerateReportCardDialog({
  isOpen,
  onClose,
  studentId,
  studentName,
  termId,
  termName,
  onSuccess,
}: GenerateReportCardDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [columnLayout, setColumnLayout] = useState<'single' | 'double'>('single');

  const handleGenerate = async () => {
    if (!termId) {
      toast({
        title: 'Error',
        description: 'Please select a term',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const payload: GenerateReportCardPayload = {
        studentId,
        termId,
        columnLayout,
      };

      const blob = await wordGenerationService.generateReportCard(payload);

      // Create filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `ReportCard_${studentName.replace(/\s+/g, '_')}_${termName || 'Term'}_${timestamp}.docx`;

      // Download the file
      wordGenerationService.downloadFile(blob, filename);

      toast({
        title: 'Success',
        description: 'Report card generated and downloaded successfully!',
        variant: 'default',
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Generate error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report card',
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
            <BarChart3 className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold">Generate Report Card</h2>
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
          {/* Student Info */}
          <div className="rounded-md bg-green-50 p-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Student:</span> {studentName}
            </p>
            {termName && (
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Term:</span> {termName}
              </p>
            )}
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

          {/* Info */}
          <div className="flex gap-2 rounded-md bg-green-50 p-3">
            <AlertCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-green-600">
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
            disabled={loading || !termId}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md',
              'bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
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
