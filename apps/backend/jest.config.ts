import { nestConfig } from '@repo/jest-config';

export default {
  ...nestConfig,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
