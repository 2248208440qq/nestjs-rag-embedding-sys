import { Module, DynamicModule } from '@nestjs/common'
import { SnowflakeGenerator, SNOWFLAKE_MACHINE_ID } from './snowflake'
import { IdService } from './id.service'
import { LoggerModule } from '../logger/logger.module'

export interface IdModuleOptions {
  machineId: number
}

@Module({})
export class IdModule {
  static register(options: IdModuleOptions): DynamicModule {
    return {
      module: IdModule,
      imports: [LoggerModule],
      providers: [
        {
          provide: SNOWFLAKE_MACHINE_ID,
          useValue: options.machineId,
        },
        SnowflakeGenerator,
        IdService,
      ],
      exports: [IdService, SnowflakeGenerator],
      global: true,
    }
  }
}
