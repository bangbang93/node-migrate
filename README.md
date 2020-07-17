## Simple umzug cli wrapper

Thanks to https://github.com/xinix-technology/node-migrate/blob/master/cli.js

## Enchantment
Support async config for nestjs to init
```typescript
import migrate from '@bangbang93/migrate'

const app = await NestFactory.createApplicationContext(AppModule)
const opts: umzug.UmzugOptions = {
  migrations: {
    params: [app],
  }
}
await migrate(opts, process.argv)
```
