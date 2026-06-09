import { env } from './config/env.js';
import { createApp } from './app.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`API rodando em http://localhost:${env.PORT}`);
});
