import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PDFParse } = require('pdf-parse');

const prisma = new PrismaClient();

// Cache directory for downloaded PDFs
const cacheDir = path.join(process.cwd(), 'uploads', 'books', 'cache');

// Ensure cache directory exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

export interface IndexingResult {
  bookId: string;
  success: boolean;
  pageCount?: number;
  characterCount?: number;
  error?: string;
}

class PDFIndexingService {
  // Download file from URL to local path
  private async downloadFile(url: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(destPath);

      const request = protocol.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
            this.downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          file.close();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      });

      request.on('error', (err) => {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(err);
      });

      request.setTimeout(120000, () => {
        request.destroy();
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(new Error('Download timeout'));
      });
    });
  }

  // Get PDF file path (download if external URL)
  private async getPDFPath(book: { id: string; sourceType: string; storagePath: string | null; externalUrl: string | null }): Promise<string> {
    if (book.sourceType === 'LOCAL_FILE' && book.storagePath) {
      if (!fs.existsSync(book.storagePath)) {
        throw new Error('Local file not found');
      }
      return book.storagePath;
    }

    if (book.sourceType === 'EXTERNAL_URL' && book.externalUrl) {
      const cachedPath = path.join(cacheDir, `${book.id}.pdf`);

      // Download if not cached
      if (!fs.existsSync(cachedPath)) {
        console.log(`Downloading PDF for indexing: ${book.id}`);
        await this.downloadFile(book.externalUrl, cachedPath);
      }

      return cachedPath;
    }

    throw new Error('No valid PDF source');
  }

  // Extract text from PDF using pdf-parse 2.x API
  async extractText(pdfPath: string): Promise<{ text: string; pageCount: number }> {
    const dataBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ verbosity: 0, data: dataBuffer });

    const doc = await parser.load();
    const textResult = await parser.getText();

    // Combine all page texts
    const allText = textResult.pages.map((page: { text: string }) => page.text).join('\n\n');

    return {
      text: allText,
      pageCount: doc.numPages,
    };
  }

  // Index a single book
  async indexBook(bookId: string): Promise<IndexingResult> {
    try {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        select: {
          id: true,
          title: true,
          sourceType: true,
          storagePath: true,
          externalUrl: true,
          isIndexed: true,
        },
      });

      if (!book) {
        return { bookId, success: false, error: 'Book not found' };
      }

      console.log(`Indexing book: ${book.title}`);

      // Get PDF path
      const pdfPath = await this.getPDFPath(book);

      // Extract text
      const { text, pageCount } = await this.extractText(pdfPath);

      if (!text || text.trim().length === 0) {
        return { bookId, success: false, error: 'No text could be extracted from PDF' };
      }

      // Update book with extracted text
      await prisma.book.update({
        where: { id: bookId },
        data: {
          textContent: text,
          pageCount: pageCount,
          isIndexed: true,
          indexedAt: new Date(),
        },
      });

      console.log(`✅ Indexed book: ${book.title} (${pageCount} pages, ${text.length} chars)`);

      return {
        bookId,
        success: true,
        pageCount,
        characterCount: text.length,
      };
    } catch (error: any) {
      console.error(`❌ Failed to index book ${bookId}:`, error.message);
      return {
        bookId,
        success: false,
        error: error.message,
      };
    }
  }

  // Index multiple books
  async indexBooks(bookIds: string[]): Promise<IndexingResult[]> {
    const results: IndexingResult[] = [];

    for (const bookId of bookIds) {
      const result = await this.indexBook(bookId);
      results.push(result);
    }

    return results;
  }

  // Index all unindexed books
  async indexAllUnindexed(): Promise<IndexingResult[]> {
    const unindexedBooks = await prisma.book.findMany({
      where: {
        isIndexed: false,
        isActive: true,
      },
      select: { id: true },
    });

    console.log(`Found ${unindexedBooks.length} unindexed books`);

    return this.indexBooks(unindexedBooks.map(b => b.id));
  }

  // Re-index a book (force re-extraction)
  async reindexBook(bookId: string): Promise<IndexingResult> {
    // Clear existing index
    await prisma.book.update({
      where: { id: bookId },
      data: {
        textContent: null,
        isIndexed: false,
        indexedAt: null,
      },
    });

    return this.indexBook(bookId);
  }

  // Get indexing status for all books
  async getIndexingStatus(): Promise<{
    total: number;
    indexed: number;
    unindexed: number;
    books: { id: string; title: string; isIndexed: boolean; indexedAt: Date | null; characterCount: number }[];
  }> {
    const books = await prisma.book.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        isIndexed: true,
        indexedAt: true,
        textContent: true,
      },
      orderBy: { title: 'asc' },
    });

    const indexed = books.filter(b => b.isIndexed).length;

    return {
      total: books.length,
      indexed,
      unindexed: books.length - indexed,
      books: books.map(b => ({
        id: b.id,
        title: b.title,
        isIndexed: b.isIndexed,
        indexedAt: b.indexedAt,
        characterCount: b.textContent?.length || 0,
      })),
    };
  }
}

export const pdfIndexingService = new PDFIndexingService();
