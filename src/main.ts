import { CdnIpItem, CdnIpResult } from './types/cdn-ip-result.ts'
import { DeployConfigSchema } from './types/config.ts'
import { createDnsProvider } from './types/dns-provider.ts'
import { DnsRecord, DnsRecordType } from './types/dns-record.ts'

console.log(
  String.raw`
    ___           _                   __  __         ___            ___ 
   /   \___ _ __ | | ___  _   _    /\ \ \/ _\       /___\__      __/___\
  / /\ / _ \ '_ \| |/ _ \| | | |  /  \/ /\ \ _____ //  //\ \ /\ / //  //
 / /_//  __/ |_) | | (_) | |_| | / /\  / _\ \_____/ \_//  \ V  V / \_// 
/___,' \___| .__/|_|\___/ \__, | \_\ \/  \__/     \___/    \_/\_/\___/  
           |_|            |___/                                         
  `,
)
console.log('Learn More: https://cf.owonet.work')
console.log('Github: https://github.com/vrcd-community/deploy-owo-ns\n')

const config = await DeployConfigSchema.parseAsync(
  JSON.parse(await Deno.readTextFile('config.json')),
)

const cdnInfo = await fetchCdnInfo()

printCdnInfo(cdnInfo)

const denoEnv = Deno.env.toObject()
for (
  const [domain, { provider, names, env, maxRecords }] of Object.entries(config)
) {
  console.log(`# Deploying NS-OwO for ${domain} (${provider})`)
  console.log(`SubDomain to deploy:`)
  names.forEach((name) => {
    console.log(`\t- ${name}.${domain}`)
  })

  const { default: dnsProviderType } = await import(
    `./providers/${provider}.ts`
  )

  const dnsProvider = createDnsProvider(dnsProviderType, { ...denoEnv, ...env })

  console.log('Checking existing records...')

  const currentTypeARecords = await dnsProvider.getRecords(
    domain,
    'A',
    undefined,
    name,
  )
  const currentTypeAAAARecords = await dnsProvider.getRecords(
    domain,
    'AAAA',
    undefined,
    name,
  )

  const recordsToRemove = currentTypeARecords.concat(currentTypeAAAARecords)

  if (recordsToRemove.length > 0) {
    console.log(
      'A/AAAA Records to remove:\n',
      recordsToRemove.map((record) =>
        `\t- ${record.id} - ${record.name}.${domain} ${record.line} ${record.type} ${record.value}`
      ).join('\n'),
    )

    console.log('Removing existing records...')
    await dnsProvider.removeRecords(
      domain,
      recordsToRemove.map((record) => record.id),
    )
  } else {
    console.log('No A/AAAA records to remove')
  }

  console.log('Adding new records...')

  const recordToAdd: DnsRecord[] = []
  names.forEach((name) => {
    cdnInfo.forEach((item) => {
      pushRecords(item.v4, name, 'A', item.isp, recordToAdd, maxRecords)
      pushRecords(item.v6, name, 'AAAA', item.isp, recordToAdd, maxRecords)
    })
  })

  console.log(
    'A/AAAA Records to add:\n',
    recordToAdd.map((record) =>
      `\t- ${record.name}.${domain} ${record.line} ${record.type} ${record.value}`
    ).join('\n'),
  )

  await dnsProvider.addRecords(domain, recordToAdd)

  console.log('Deployed NS-OwO for', domain)
}

console.log('All domains deployed!')

function pushRecords(
  items: CdnIpItem[],
  name: string,
  type: DnsRecordType,
  line: string,
  recordToAdd: DnsRecord[],
  maxRecords?: number,
) {
  items.forEach((ip, index) => {
    if (maxRecords && index >= maxRecords) {
      return
    }

    recordToAdd.push({
      name,
      type,
      value: ip.ip,
      line: line,
    })
  })
}

function printCdnInfo(cdnInfo: CdnIpResult[]) {
  cdnInfo.forEach((item) => {
    console.log(`ISP: ${item.isp}`)
    console.log('IPv4:')
    printCdnIps(item.v4)
    console.log('IPv6:')
    printCdnIps(item.v6)
  })
}

function printCdnIps(items: CdnIpItem[]) {
  items.forEach((ip) => {
    console.log(
      `\tIP: ${ip.ip}\tTCP Latency: ${
        ip.tcp_latency.toFixed(2)
      }ms\tCreated At: ${ip.created_at}`,
    )
  })
}

async function fetchCdnInfo() {
  const cdnInfoUrl = Deno.env.get('CDN_INFO_URL')

  if (!cdnInfoUrl) {
    throw new Error('CDN_INFO_URL is required')
  }

  const cdnInfo: CdnIpResult[] = await (await fetch(cdnInfoUrl, {
    headers: {
      'User-Agent': 'deploy-ns-owo/dev',
    },
  })).json()

  return cdnInfo
}
