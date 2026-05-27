import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'

const walk = (dir) => {
  const files = []
  for (const name of readdirSync(dir)) {
    const filepath = join(dir, name)
    const stat = statSync(filepath)
    if (stat.isDirectory()) files.push(...walk(filepath))
    else if (filepath.endsWith('.vue')) files.push(filepath)
  }
  return files
}

let failed = false
for (const file of walk('src')) {
  const source = readFileSync(file, 'utf8')
  const { descriptor, errors } = parse(source, { filename: file })
  if (errors.length) {
    failed = true
    console.error('PARSE', file, errors.map((error) => error.message || error))
  }

  try {
    if (descriptor.scriptSetup) compileScript(descriptor, { id: file })
    if (descriptor.template) {
      const result = compileTemplate({ source: descriptor.template.content, filename: file, id: file })
      if (result.errors?.length) {
        failed = true
        console.error('TEMPLATE', file, result.errors.map((error) => error.message || error))
      }
    }
  } catch (error) {
    failed = true
    console.error('COMPILE', file, error.message)
  }
}

if (failed) process.exit(1)
console.log('SFC_CHECK_OK')
