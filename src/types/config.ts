import { z } from 'zod'

import { DnsProviderKeys } from '../providers/index.ts'

export const DeployConfigSchema = z.record(
  z.string(),
  z.object({
    provider: DnsProviderKeys,
    names: z.array(z.string().min(1)),
    maxRecords: z.number().min(1).optional(),
    ttl: z.number().min(1).default(600),
    env: z.record(z.string(), z.string()).default({}),
  }),
)
