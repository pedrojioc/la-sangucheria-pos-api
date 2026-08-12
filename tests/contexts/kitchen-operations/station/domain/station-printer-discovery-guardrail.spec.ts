import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { PrinterDeviceLookupAdapter } from '@contexts/kitchen-operations/printer-discovery/infrastructure/adapters/printer-device-lookup.adapter'

// Guardrail: the Station <-> printer-discovery dependency stays strictly
// one-way. Station consumes a read-only port; printer-discovery MUST NEVER
// import anything from the Station module (mirrors the existing
// record-discovered-device-station-guardrail.spec.ts, which asserts the
// opposite direction: printer-discovery's write side never touches Station).
function listTsFiles(dir: string): string[] {
  const entries = readdirSync(dir)
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stats = statSync(fullPath)
    if (stats.isDirectory()) {
      files.push(...listTsFiles(fullPath))
    } else if (entry.endsWith('.ts') && !entry.endsWith('.spec.ts')) {
      files.push(fullPath)
    }
  }
  return files
}

describe('Station <-> printer-discovery guardrail (one-way, read-only)', () => {
  it('printer-discovery source files never import from the station module', () => {
    const printerDiscoveryRoot = join(
      process.cwd(),
      'src/contexts/kitchen-operations/printer-discovery'
    )
    const printerDiscoveryFiles = listTsFiles(printerDiscoveryRoot)

    expect(printerDiscoveryFiles.length).toBeGreaterThan(0)

    const offendingImports: string[] = []
    for (const file of printerDiscoveryFiles) {
      const content = readFileSync(file, 'utf-8')
      const importLines = content
        .split('\n')
        .filter(line => /^\s*import\s.*from\s+['"]/.test(line))
        .filter(line => /kitchen-operations\/station\b/.test(line))
        // The only allowed exception is importing the read-only port
        // TYPE/INTERFACE, which lives under station/domain/ports/ — this is
        // the intentional one-way seam the port exists for.
        .filter(line => !/station\/domain\/ports\/printer-device-lookup\.port/.test(line))

      if (importLines.length > 0) {
        offendingImports.push(`${file}: ${importLines.join(' | ')}`)
      }
    }

    expect(offendingImports).toEqual([])
  })

  it('the lookup port exposes only a read method (findById), no save/delete/mutation method', () => {
    const adapter = new PrinterDeviceLookupAdapter({
      save: () => {
        throw new Error('write method must not exist on the port contract')
      }
    } as never)

    expect(typeof adapter.findById).toBe('function')
    expect((adapter as unknown as { save?: unknown }).save).toBeUndefined()
    expect((adapter as unknown as { delete?: unknown }).delete).toBeUndefined()
    expect((adapter as unknown as { update?: unknown }).update).toBeUndefined()
  })
})
