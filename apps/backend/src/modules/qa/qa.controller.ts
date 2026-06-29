import { Body, Controller, Post } from '@nestjs/common';

import { QaRequestDto } from '@/modules/qa/dto/qa.dto';
import { QaService } from '@/modules/qa/qa.service';

@Controller('qa')
export class QaController {
  constructor(private readonly qaService: QaService) {}

  @Post('ask')
  ask(@Body() dto: QaRequestDto) {
    return this.qaService.ask(dto);
  }
}
