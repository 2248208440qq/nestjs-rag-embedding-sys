import { Injectable } from '@nestjs/common';

import type { TextChunk } from './chunking.types';

const NUMBER_PATTERN = '[零一二三四五六七八九十百千万\\d]+';
const ARTICLE_PATTERN = new RegExp(
  `^第${NUMBER_PATTERN}条(?=[\\s\\u3000])`,
  'gm',
);
const HEADING_PATTERN = new RegExp(
  `^第${NUMBER_PATTERN}(编|章|节)[\\s\\u3000]*[^\\n]*`,
  'gm',
);
const MAX_CHUNK_LENGTH = 900;
const MIN_CHUNK_LENGTH = 120;

type HeadingLevel = '编' | '章' | '节';

interface HeadingMarker {
  index: number;
  level: HeadingLevel;
  text: string;
}

@Injectable()
export class LegalChunkingService {
  chunk(text: string): TextChunk[] {
    const normalized = this.normalize(text);
    if (!normalized) {
      return [];
    }

    const articleChunks = this.chunkByArticles(normalized);
    if (articleChunks.length > 0) {
      return articleChunks;
    }

    return this.chunkByParagraphs(normalized);
  }

  private chunkByArticles(text: string): TextChunk[] {
    const matches = Array.from(text.matchAll(ARTICLE_PATTERN));
    if (matches.length === 0) {
      return [];
    }

    const headings = this.collectHeadings(text);
    const articles = matches.map((match, index) => {
      const start = match.index ?? 0;
      const end = matches[index + 1]?.index ?? text.length;
      const content = text.slice(start, end).trim();
      const articleNo = match[0];
      const sectionPath = this.resolveSectionPath(headings, start);
      const previousArticleNo = matches[index - 1]?.[0];
      const nextArticleNo = matches[index + 1]?.[0];

      return {
        content,
        sectionPath,
        articleNo,
        chunkIndex: index,
        metadata: {
          strategy: 'article',
          articleIndex: index,
          sectionPath,
          articleNo,
          previousArticleNo,
          nextArticleNo,
        },
      };
    });

    return articles
      .flatMap((chunk) => this.splitOversizedArticleChunk(chunk))
      .map((chunk, chunkIndex) => ({
        ...chunk,
        chunkIndex,
        metadata: {
          ...chunk.metadata,
          chunkIndex,
        },
      }));
  }

  private collectHeadings(text: string): HeadingMarker[] {
    return Array.from(text.matchAll(HEADING_PATTERN))
      .map((match) => ({
        index: match.index ?? 0,
        level: match[1] as HeadingLevel,
        text: this.normalizeHeading(match[0]),
      }))
      .filter((heading) => !this.isTocLine(text, heading.index));
  }

  private resolveSectionPath(headings: HeadingMarker[], articleIndex: number) {
    const current: Partial<Record<HeadingLevel, string>> = {};

    for (const heading of headings) {
      if (heading.index >= articleIndex) {
        break;
      }

      if (heading.level === '编') {
        current['编'] = heading.text;
        delete current['章'];
        delete current['节'];
      }

      if (heading.level === '章') {
        current['章'] = heading.text;
        delete current['节'];
      }

      if (heading.level === '节') {
        current['节'] = heading.text;
      }
    }

    return [current['编'], current['章'], current['节']]
      .filter(Boolean)
      .join(' / ') || undefined;
  }

  private isTocLine(text: string, index: number) {
    const before = text.slice(Math.max(0, index - 120), index);
    return before.includes('目录');
  }

  private normalizeHeading(heading: string) {
    return heading.replace(/[\u3000\s]+/g, ' ').trim();
  }

  private chunkByParagraphs(text: string): TextChunk[] {
    const paragraphs = text
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean);
    const chunks: TextChunk[] = [];
    let buffer = '';

    for (const paragraph of paragraphs) {
      const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;

      if (
        candidate.length > MAX_CHUNK_LENGTH &&
        buffer.length >= MIN_CHUNK_LENGTH
      ) {
        chunks.push(this.createParagraphChunk(buffer, chunks.length));
        buffer = paragraph;
      } else {
        buffer = candidate;
      }
    }

    if (buffer) {
      chunks.push(this.createParagraphChunk(buffer, chunks.length));
    }

    return chunks.flatMap((chunk) => this.splitOversizedChunk(chunk));
  }

  private createParagraphChunk(content: string, chunkIndex: number): TextChunk {
    return {
      content,
      chunkIndex,
      metadata: {
        strategy: 'paragraph',
      },
    };
  }

  private splitOversizedChunk(chunk: TextChunk): TextChunk[] {
    if (chunk.content.length <= MAX_CHUNK_LENGTH) {
      return [chunk];
    }

    const chunks: TextChunk[] = [];
    for (let start = 0; start < chunk.content.length; start += MAX_CHUNK_LENGTH) {
      chunks.push({
        ...chunk,
        content: chunk.content.slice(start, start + MAX_CHUNK_LENGTH).trim(),
        chunkIndex: chunk.chunkIndex + chunks.length,
        metadata: {
          ...chunk.metadata,
          strategy: 'fixed-window',
        },
      });
    }

    return chunks;
  }

  private splitOversizedArticleChunk(chunk: TextChunk): TextChunk[] {
    if (chunk.content.length <= MAX_CHUNK_LENGTH) {
      return [
        {
          ...chunk,
          metadata: {
            ...chunk.metadata,
            partIndex: 0,
            partCount: 1,
            articleTextLength: chunk.content.length,
          },
        },
      ];
    }

    const articleHeader = chunk.articleNo ?? '';
    const body = articleHeader
      ? chunk.content.slice(articleHeader.length).trim()
      : chunk.content;
    const paragraphs = body
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean);
    const parts: string[] = [];
    let buffer = articleHeader;

    for (const paragraph of paragraphs) {
      const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;

      if (
        candidate.length > MAX_CHUNK_LENGTH &&
        buffer.length > articleHeader.length
      ) {
        parts.push(buffer.trim());
        buffer = articleHeader ? `${articleHeader}\n\n${paragraph}` : paragraph;
      } else {
        buffer = candidate;
      }
    }

    if (buffer.trim()) {
      parts.push(buffer.trim());
    }

    const normalizedParts = parts.flatMap((part) =>
      part.length <= MAX_CHUNK_LENGTH
        ? [part]
        : this.splitTextWindow(part, MAX_CHUNK_LENGTH),
    );

    return normalizedParts.map((content, partIndex) => ({
      ...chunk,
      content,
      metadata: {
        ...chunk.metadata,
        strategy: 'article-paragraph',
        partIndex,
        partCount: normalizedParts.length,
        articleTextLength: chunk.content.length,
      },
    }));
  }

  private splitTextWindow(text: string, maxLength: number) {
    const parts: string[] = [];

    for (let start = 0; start < text.length; start += maxLength) {
      const part = text.slice(start, start + maxLength).trim();
      if (part) {
        parts.push(part);
      }
    }

    return parts;
  }

  private normalize(text: string) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
