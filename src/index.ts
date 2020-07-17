import path from 'path'
import {sprintf} from 'sprintf-js'
import umzug from 'umzug'

let migrate: umzug.Umzug

const startT = Date.now()

function logMigrateEvent(eventName: string) {
  return (name: string) => {
    const delta = (Date.now() - startT) / 1000
    console.info(sprintf('%06.3f | %9s | %s', delta, eventName, name))
    if (eventName === 'migrated' || eventName === 'reverted') {
      console.info('')
    }
  }
}

interface IStatus {
  current: string
  executed: string[]
  pending: string[]
}
async function getStatus(): Promise<IStatus> {
  const executed = await migrate.executed()
  const pending = await migrate.pending()

  const current = executed.length > 0 ? path.basename(executed[0].file, '.js') : ''
  return {
    current,
    executed: executed.map((m) => path.basename(m.file, '.js')),
    pending: pending.map((m) => path.basename(m.file, '.js')),
  }
}

async function cmdStatus(): Promise<void> {
  const {current, executed, pending} = await getStatus()

  console.info('Current:')
  console.info(' ', current || '(none)')
  console.info('')
  console.info('Executed:')
  if (executed.length) {
    executed.forEach((step) => console.info(' ', step))
  } else {
    console.info('  (none)')
  }
  console.info('')
  console.info('Pending:')
  if (pending.length) {
    pending.forEach((step) => console.info(' ', step))
  } else {
    console.info('  (none)')
  }
  console.info('')
}

async function cmdUp(to: string): Promise<umzug.Migration[]> {
  if (to) {
    return migrate.up({to})
  }

  return migrate.up()
}

async function cmdNext(): Promise<umzug.Migration[]> {
  const {pending} = await getStatus()
  if (pending.length === 0) {
    throw new Error('No pending migrations')
  }
  const next = pending[0]
  return migrate.up({to: next})
}

async function cmdDown(to: string): Promise<umzug.Migration[]> {
  if (to) {
    return migrate.down({to})
  }

  return migrate.down({to: 0})
}

async function cmdPrev(): Promise<umzug.Migration[]> {
  const {executed} = await getStatus()
  if (executed.length === 0) {
    throw new Error('Already at initial state')
  }
  const prev = executed[executed.length - 1]
  return migrate.down({to: prev})
}

export default async function main(opts: umzug.UmzugOptions, argv: string[]): Promise<void> {
  migrate = new umzug(opts)

  migrate.on('migrating', logMigrateEvent('migrating'))
  migrate.on('migrated', logMigrateEvent('migrated'))
  migrate.on('reverting', logMigrateEvent('reverting'))
  migrate.on('reverted', logMigrateEvent('reverted'))

  const cmd = (argv[2] || '').trim()
  try {
    console.info('')

    switch (cmd) {
      case 'status':
        await cmdStatus()
        break

      case 'up':
        await cmdUp(argv[3])
        break

      case 'next':
        await cmdNext()
        process.exit()
        break

      case 'down':
        await cmdDown(argv[3])
        break

      case 'prev':
        await cmdPrev()
        break

      default:
        console.error(`Invalid cmd: ${cmd}`)
        console.error('')
        console.error('Usage: migrate [status|up|down|next|prev]')
        console.error('')
        console.error(':(')
        console.error('')
        process.exit(1)
    }

    console.info(':)')
    console.info('')
    process.exit()
  } catch (err) {
    console.error(`Caught error at command: ${cmd}`)
    console.error(err)
    console.error(':(')
    console.error('')
    process.exit(1)
  }
}
