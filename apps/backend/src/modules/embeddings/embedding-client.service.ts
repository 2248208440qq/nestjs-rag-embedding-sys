import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EmbeddingResponse {
  data?: Array<{
    embedding?: number[];
    index?: number;
  }>;
}

@Injectable()
export class EmbeddingClientService {
  constructor(private readonly config: ConfigService) {}

  async embed(input: string | string[]): Promise<number[][]> {
    const endpoint = this.config.getOrThrow<string>('EMBEDDING_BASE_URL');
    const model = this.config.getOrThrow<string>('EMBEDDING_MODEL');

    const response = await fetch(`${endpoint}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input,
      }),
    }).catch((error: unknown) => {
      throw new ServiceUnavailableException(
        `Embedding service unavailable: ${String(error)}`,
      );
    });

    if (!response.ok) {
      const message = await response.text();
      throw new ServiceUnavailableException(
        `Embedding service failed with ${response.status}: ${message}`,
      );
    }

    const payload = (await response.json()) as EmbeddingResponse;
    const embeddings = payload.data
      ?.sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
      .map((item) => item.embedding)
      .filter((item): item is number[] => Array.isArray(item));

    if (!embeddings?.length) {
      throw new ServiceUnavailableException('Embedding service returned no vectors');
    }

    return embeddings;
  }
}
