'use client';

import { useState } from 'react';
import { Award, Download, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { wordGenerationService, GenerateCertificatePayload } from '@/services/word-generation.service';
import { useToast } from '@/hooks/use-toast';

interface GenerateCertificateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  onSuccess?: () => void;
}

interface CertificateType {
  value: string;
  label: string;
  description: string;
}

const certificateTypes: CertificateType[] = [
  {
    value: 'Participation',
    label: 'Participation',
    description: 'For participation in activities',
  },
  {
    value: 'Excellence',
    label: 'Academic Excellence',
    description: 'For outstanding academic performance',
  },
  {
    value: 'Attendance',
    label: 'Perfect Attendance',
    description: 'For perfect attendance record',
  },
  {
    value: 'Sports',
    label: 'Sports Achievement',
    description: 'For sports achievement',
  },
  {
    value: 'Cultural',
    label: 'Cultural Achievement',
    description: 'For cultural achievement',
  },
  {
    value: 'Leadership',
    label: 'Leadership',
    description: 'For leadership qualities',
  },
];

export function GenerateCertificateDialog({
  isOpen,
  onClose,
  studentId,
  studentName,
  onSuccess,
}: GenerateCertificateDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [certificateType, setCertificateType] = useState<string>('Participation');
  const [achievement, setAchievement] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleGenerate = async () => {
    try {
      setLoading(true);

      const payload: GenerateCertificatePayload = {
        studentId,
        certificateType,
        achievement: achievement || undefined,
        date,
      };

      const blob = await wordGenerationService.generateCertificate(payload);

      // Create filename
      const filename = `Certificate_${studentName.replace(/\s+/g, '_')}_${certificateType.replace(/\s+/g, '_')}_${date}.docx`;

      // Download the file
      wordGenerationService.downloadFile(blob, filename);

      toast({
        title: 'Success',
        description: 'Certificate generated and downloaded successfully!',
        variant: 'default',
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Generate error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate certificate',
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
            <Award className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Generate Certificate</h2>
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
          <div className="rounded-md bg-purple-50 p-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Student:</span> {studentName}
            </p>
          </div>

          {/* Certificate Type */}
          <div className="space-y-3">
            <label htmlFor="cert-type" className="block text-sm font-medium text-gray-700">
              Certificate Type
            </label>
            <select
              id="cert-type"
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value)}
              disabled={loading}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-50"
            >
              {certificateTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {certificateTypes.find((t) => t.value === certificateType) && (
              <p className="text-xs text-gray-500">
                {certificateTypes.find((t) => t.value === certificateType)?.description}
              </p>
            )}
          </div>

          {/* Achievement Text */}
          <div className="space-y-2">
            <label htmlFor="achievement" className="block text-sm font-medium text-gray-700">
              Achievement Description (Optional)
            </label>
            <textarea
              id="achievement"
              value={achievement}
              onChange={(e) => setAchievement(e.target.value)}
              disabled={loading}
              placeholder="Add specific achievement details (e.g., 'For outstanding performance in Mathematics')"
              className="h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-50"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={loading}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-50"
            />
          </div>

          {/* Info */}
          <div className="flex gap-2 rounded-md bg-purple-50 p-3">
            <AlertCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-purple-600">
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
              'bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
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
