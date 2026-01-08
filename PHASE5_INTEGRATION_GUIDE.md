# Phase 5: Frontend Integration Guide

**Date**: January 8, 2025
**Status**: ✅ FRONTEND COMPONENTS CREATED & READY FOR INTEGRATION

---

## 🎯 What's Completed in Phase 5

### ✅ Frontend Service Layer
- **`frontend/src/services/word-generation.service.ts`** (300+ lines)
  - All API methods implemented
  - Error handling with proper messages
  - File download functionality
  - Token management for authentication

### ✅ React Dialog Components (4 Components)
- **`GenerateQuestionPaperDialog`** - For generating question papers
- **`GenerateReportCardDialog`** - For generating report cards
- **`GenerateCertificateDialog`** - For generating certificates
- **`GenerateStudyMaterialDialog`** - For generating study materials

### ✅ Component Features
- ✅ Modal dialog with backdrop
- ✅ Loading states with spinners
- ✅ Toast notifications for success/error
- ✅ Proper form validation
- ✅ Column layout selection (single/double)
- ✅ Automatic file download
- ✅ TypeScript support with interfaces
- ✅ Consistent styling with Tailwind CSS

---

## 📁 File Structure

```
frontend/src/
├── services/
│   └── word-generation.service.ts          [✅ CREATED]
│
└── components/
    └── modals/
        ├── generate-question-paper-dialog.tsx    [✅ CREATED]
        ├── generate-report-card-dialog.tsx       [✅ CREATED]
        ├── generate-certificate-dialog.tsx       [✅ CREATED]
        ├── generate-study-material-dialog.tsx    [✅ CREATED]
        ├── index.ts                              [✅ CREATED]
        └── question-modal.tsx                    [Existing]
```

---

## 🔧 How to Integrate

### Step 1: Import the Components

```tsx
import {
  GenerateQuestionPaperDialog,
  GenerateReportCardDialog,
  GenerateCertificateDialog,
  GenerateStudyMaterialDialog,
} from '@/components/modals';
```

### Step 2: Add State Management

```tsx
'use client';

import { useState } from 'react';

export function TestDetailsPage() {
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  // ... rest of component
}
```

### Step 3: Use the Component

```tsx
<GenerateQuestionPaperDialog
  isOpen={showGenerateDialog}
  onClose={() => setShowGenerateDialog(false)}
  testId={test.id}
  testName={test.title}
  onSuccess={() => {
    // Refresh data if needed
  }}
/>
```

---

## 📝 Integration Examples

### Example 1: Tests Page Integration

**File**: `frontend/src/app/(dashboard)/tests/page.tsx` or similar

```tsx
'use client';

import { useState } from 'react';
import { GenerateQuestionPaperDialog } from '@/components/modals';

export function TestDetailsPage() {
  const [test, setTest] = useState<any>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  return (
    <div>
      {/* Existing test details */}

      {/* Add Generate Button */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setShowGenerateDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FileText className="h-4 w-4" />
          Generate Question Paper
        </button>
      </div>

      {/* Add Dialog */}
      <GenerateQuestionPaperDialog
        isOpen={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
        testId={test?.id || ''}
        testName={test?.title || ''}
        onSuccess={() => {
          // Optional: Refresh test data
          // loadTestDetails();
        }}
      />
    </div>
  );
}
```

### Example 2: Student Profile Integration

**File**: `frontend/src/app/(dashboard)/students/[id]/page.tsx` or similar

```tsx
'use client';

import { useState } from 'react';
import {
  GenerateReportCardDialog,
  GenerateCertificateDialog,
} from '@/components/modals';
import { BarChart3, Award } from 'lucide-react';

export function StudentProfilePage() {
  const [student, setStudent] = useState<any>(null);
  const [showReportCardDialog, setShowReportCardDialog] = useState(false);
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);

  return (
    <div>
      {/* Student Info */}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setShowReportCardDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <BarChart3 className="h-4 w-4" />
          Generate Report Card
        </button>

        <button
          onClick={() => setShowCertificateDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          <Award className="h-4 w-4" />
          Generate Certificate
        </button>
      </div>

      {/* Dialogs */}
      <GenerateReportCardDialog
        isOpen={showReportCardDialog}
        onClose={() => setShowReportCardDialog(false)}
        studentId={student?.id || ''}
        studentName={student?.name || ''}
        termId={student?.currentTermId}
        termName={student?.currentTerm?.name}
      />

      <GenerateCertificateDialog
        isOpen={showCertificateDialog}
        onClose={() => setShowCertificateDialog(false)}
        studentId={student?.id || ''}
        studentName={student?.name || ''}
      />
    </div>
  );
}
```

### Example 3: Chapters/Study Materials Integration

**File**: `frontend/src/app/(dashboard)/chapters/[id]/page.tsx` or similar

```tsx
'use client';

import { useState } from 'react';
import { GenerateStudyMaterialDialog } from '@/components/modals';
import { BookOpen } from 'lucide-react';

export function ChapterDetailsPage() {
  const [chapter, setChapter] = useState<any>(null);
  const [showStudyMaterialDialog, setShowStudyMaterialDialog] = useState(false);

  return (
    <div>
      {/* Chapter Info */}

      {/* Action Buttons */}
      <button
        onClick={() => setShowStudyMaterialDialog(true)}
        className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
      >
        <BookOpen className="h-4 w-4" />
        Generate Study Material
      </button>

      {/* Dialog */}
      <GenerateStudyMaterialDialog
        isOpen={showStudyMaterialDialog}
        onClose={() => setShowStudyMaterialDialog(false)}
        chapterId={chapter?.id || ''}
        chapterName={chapter?.name || ''}
        subjectName={chapter?.subject?.name}
      />
    </div>
  );
}
```

---

## 🎨 Styling & Theming

All components use:
- **Tailwind CSS** for styling
- **Consistent color scheme**:
  - Question Paper: Blue (`blue-600`)
  - Report Card: Green (`green-600`)
  - Certificate: Purple (`purple-600`)
  - Study Material: Amber (`amber-600`)
- **Lucide React** icons for visual consistency
- **Responsive design** that works on all screen sizes

### Customizing Colors

If you want to change colors, modify the className in each dialog component:

```tsx
// Change button color
className="bg-your-color hover:bg-your-color-darker"

// Change icon color
className="h-5 w-5 text-your-color"

// Change background color
className="rounded-md bg-your-color-50 p-3"
```

---

## 🔌 Using the Service Directly

If you need to call the API directly without using the dialog components:

```tsx
import { wordGenerationService } from '@/services/word-generation.service';

// Generate question paper
const blob = await wordGenerationService.generateQuestionPaper({
  testId: 'test-123',
  columnLayout: 'double',
  includeAnswers: true,
});

// Download file
wordGenerationService.downloadFile(blob, 'question_paper.docx');
```

---

## 📋 Integration Checklist

### Phase 5 - Frontend Components
- ✅ Create word-generation.service.ts
- ✅ Create GenerateQuestionPaperDialog
- ✅ Create GenerateReportCardDialog
- ✅ Create GenerateCertificateDialog
- ✅ Create GenerateStudyMaterialDialog
- ✅ Create components index.ts

### Phase 5 - Integration (To be done by user)
- [ ] Add GenerateQuestionPaperDialog to tests page
- [ ] Add GenerateReportCardDialog to student profile page
- [ ] Add GenerateCertificateDialog to student profile page
- [ ] Add GenerateStudyMaterialDialog to chapters page
- [ ] Test all dialogs with real data
- [ ] Verify downloads work correctly

---

## 🧪 Testing the Integration

### Test Scenario 1: Generate Question Paper
1. Navigate to a test details page
2. Click "Generate Question Paper" button
3. Select column layout and options
4. Click "Generate & Download"
5. Verify Word document is downloaded
6. Open document and verify formatting

### Test Scenario 2: Generate Report Card
1. Navigate to a student profile page
2. Click "Generate Report Card" button
3. Select term (if needed)
4. Click "Generate & Download"
5. Verify Word document with grades is downloaded

### Test Scenario 3: Generate Certificate
1. Navigate to a student profile page
2. Click "Generate Certificate" button
3. Select certificate type
4. Add achievement description (optional)
5. Click "Generate & Download"
6. Verify certificate Word document is downloaded

### Test Scenario 4: Generate Study Material
1. Navigate to a chapter details page
2. Click "Generate Study Material" button
3. Select column layout and options
4. Click "Generate & Download"
5. Verify Word document is downloaded

---

## 🐛 Troubleshooting

### Issue: "Failed to generate..." error
**Solution**:
- Check if backend server is running
- Verify JWT token is valid
- Check browser console for detailed error message

### Issue: File not downloading
**Solution**:
- Check browser download settings
- Verify popup blocker isn't preventing download
- Try a different browser

### Issue: Dialog not opening
**Solution**:
- Ensure state is properly managed with `useState`
- Check that `isOpen` prop is boolean
- Verify button is properly wired to set state

### Issue: Form validation errors
**Solution**:
- Verify all required fields are filled
- Check field values in browser console
- Ensure IDs/UUIDs are valid and exist in database

---

## 🚀 Next Steps After Integration

After integrating the components into your pages:

1. **Test thoroughly** with real data
2. **Gather user feedback** on document formatting
3. **Monitor performance** of generation endpoints
4. **Optimize** as needed based on usage patterns

### Potential Enhancements
- Add document preview before download
- Implement batch generation for multiple documents
- Add templates for customized certificates
- Store generation history for easy re-download
- Add analytics for document generation usage

---

## 📚 Component API Reference

### GenerateQuestionPaperDialog Props

```tsx
interface GenerateQuestionPaperDialogProps {
  isOpen: boolean;              // Dialog open/closed state
  onClose: () => void;          // Callback when dialog closes
  testId: string;               // Test ID from database
  testName: string;             // Test name for display
  onSuccess?: () => void;       // Callback after successful generation
}
```

### GenerateReportCardDialog Props

```tsx
interface GenerateReportCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  termId?: string;              // Optional term ID
  termName?: string;            // Optional term name
  onSuccess?: () => void;
}
```

### GenerateCertificateDialog Props

```tsx
interface GenerateCertificateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  onSuccess?: () => void;
}
```

### GenerateStudyMaterialDialog Props

```tsx
interface GenerateStudyMaterialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  chapterName: string;
  subjectName?: string;         // Optional subject name
  onSuccess?: () => void;
}
```

---

## 🔐 Security Considerations

- ✅ All requests include JWT token
- ✅ API validates user authorization
- ✅ User can only access their own data
- ✅ No sensitive data in URLs
- ✅ HTTPS recommended for production

---

## 📞 Support

If you encounter issues:
1. Check browser console for error messages
2. Verify backend is running: `npm run dev` in backend directory
3. Check network tab to see API responses
4. Review server logs for detailed errors
5. Refer to QUICK_SETUP_GUIDE.md for API testing with curl

---

## 📊 Summary

**Frontend Phase 5 Status**: ✅ COMPLETE

- ✅ Service layer fully implemented
- ✅ 4 React dialog components created
- ✅ All components ready for integration
- ✅ Comprehensive documentation provided

**Ready for**: User to integrate components into their existing pages

**Estimated Integration Time**: 30 minutes per page

---

Generated: January 8, 2025
Next: Integrate components into your application pages
