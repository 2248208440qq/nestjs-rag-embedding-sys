import { Inject, Injectable } from '@nestjs/common'
import { CustomLogger } from '../logger/custom-logger'

export const SNOWFLAKE_MACHINE_ID = Symbol('SNOWFLAKE_MACHINE_ID')

@Injectable()
export class SnowflakeGenerator {
  private readonly epoch = 1704067200000n
  private readonly machineId: bigint
  private sequence = 0n
  private lastTimestamp = -1n

  constructor(
    @Inject(SNOWFLAKE_MACHINE_ID) machineId: number,
    @Inject(CustomLogger) private readonly logger: CustomLogger,
  ) {
    this.machineId = BigInt(machineId & 0x3FF)
  }

  generate(): string {
    const now = BigInt(Date.now())
    const timestamp = now - this.epoch

    if (timestamp < this.lastTimestamp) {
      this.logger.warn(
        `Clock moved backwards. Refusing to generate id for ${this.lastTimestamp - timestamp}ms`,
      )
      throw new Error('Clock moved backwards. Refusing to generate snowflake id')
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & 0xFFFn
      if (this.sequence === 0n) {
        this.waitNextMillis(timestamp)
      }
    } else {
      this.sequence = 0n
    }

    this.lastTimestamp = timestamp

    const id = (timestamp << 22n) | (this.machineId << 12n) | this.sequence
    return id.toString()
  }

  private waitNextMillis(timestamp: bigint) {
    let nextTimestamp = BigInt(Date.now()) - this.epoch

    while (nextTimestamp <= timestamp) {
      nextTimestamp = BigInt(Date.now()) - this.epoch
    }
  }
}
