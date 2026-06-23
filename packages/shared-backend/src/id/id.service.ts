import { Injectable, Inject } from '@nestjs/common'
import { SnowflakeGenerator } from './snowflake'
import { generateBusinessId, generateShortId } from './nanoid'

export const ID_SERVICE = Symbol('ID_SERVICE')

export interface IdGenerator {
  userId(): string
  businessId(): string
  shortId(): string
}

@Injectable()
export class IdService implements IdGenerator {
  constructor(
    @Inject(SnowflakeGenerator) private readonly snowflake: SnowflakeGenerator,
  ) {}

  userId(): string {
    return this.snowflake.generate()
  }

  businessId(): string {
    return generateBusinessId()
  }

  shortId(): string {
    return generateShortId()
  }
}
