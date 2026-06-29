import { Body, Controller, Post } from '@nestjs/common';
import type { UserInfo } from '@repo/shared-types';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { QaRequestDto } from '@/modules/qa/dto/qa.dto';
import { QaService } from '@/modules/qa/qa.service';

@Controller('qa')
export class QaController {
  constructor(private readonly qaService: QaService) {}

  @Post('ask')
  ask(@CurrentUser() user: UserInfo, @Body() dto: QaRequestDto) {
    return this.qaService.ask(user.id, dto);
  }
}
