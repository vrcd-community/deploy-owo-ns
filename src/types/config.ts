import { z } from 'zod'

import { DnsProviderKeys } from '../providers/index.ts'

export default interface DeployConfig {
  [domain: string]: {
    provider: string
    names: string[]
    env: Record<string, string>
  }
}

export const DeployConfigSchema = z.record(
  z.string(),
  z.object({
    provider: DnsProviderKeys,
    names: z.array(z.string().min(1)),
    env: z.record(z.string(), z.string()).default({}),
  }),
)
