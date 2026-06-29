import { Injectable } from '@nestjs/common';

@Injectable()
export class LongTermMemoryService {
  async retrieve(): Promise<[]> {
    return [];
  }
}
