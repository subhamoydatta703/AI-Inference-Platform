import { initAutterServer } from '@autter/runtime-node';
import dotenv from 'dotenv';



initAutterServer({
  apiKey: process.env.AUTTER_RUNTIME_KEY as string,
  endpoint: process.env.AUTTER_ENDPOINT ?? 'https://otlp.autter.dev',
  service: 'ai-inference-backend',
  environment: process.env.NODE_ENV ?? 'development',
});


import app from './app'

const PORT = process.env.PORT ?? 5000;
app.listen(PORT, () => {
  console.log(`Backend is listening on port ${PORT}`);
});