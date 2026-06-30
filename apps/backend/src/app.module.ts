import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from '@repo/shared-backend';

import { AppConfigModule } from '@/config/config.module';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AgentModule } from '@/modules/agent/agent.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { DeptsModule } from '@/modules/depts/depts.module';
import { DocumentsModule } from '@/modules/documents/documents.module';
import { EvaluationModule } from '@/modules/evaluation/evaluation.module';
import { FilesModule } from '@/modules/files/files.module';
import { HealthModule } from '@/modules/health/health.module';
import { IndexJobsModule } from '@/modules/index-jobs/index-jobs.module';
import { KnowledgeBaseModule } from '@/modules/knowledge-base/knowledge-base.module';
import { MenusModule } from '@/modules/menus/menus.module';
import { QaModule } from '@/modules/qa/qa.module';
import { RolesModule } from '@/modules/roles/roles.module';
import { SearchModule } from '@/modules/search/search.module';
import { UsersModule } from '@/modules/users/users.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { RedisModule } from '@/redis/redis.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    RolesModule,
    MenusModule,
    DeptsModule,
    HealthModule,
    AgentModule,
    FilesModule,
    DocumentsModule,
    IndexJobsModule,
    EvaluationModule,
    KnowledgeBaseModule,
    QaModule,
    SearchModule,
  ],
  controllers: [],
  providers: [
    // Global guards: authentication first, then authorization
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
