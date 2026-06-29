import { Body, Controller, Get, Post } from '@nestjs/common';

import { CreateEvaluationCaseDto, RunEvaluationDto } from '@/modules/evaluation/dto/evaluation.dto';
import { EvaluationService } from '@/modules/evaluation/evaluation.service';

@Controller('evaluation')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Get('cases')
  listCases() {
    return this.evaluationService.listCases();
  }

  @Post('cases')
  createCase(@Body() dto: CreateEvaluationCaseDto) {
    return this.evaluationService.createCase(dto);
  }

  @Get('runs')
  listRuns() {
    return this.evaluationService.listRuns();
  }

  @Post('runs')
  run(@Body() dto: RunEvaluationDto) {
    return this.evaluationService.run(dto);
  }
}
