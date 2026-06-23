export interface TextChunk {
  content: string;
  sectionPath?: string;
  articleNo?: string;
  chunkIndex: number;
  metadata: Record<string, unknown>;
}
