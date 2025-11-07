import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173', // allow your React app
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // allow all HTTP methods
    credentials: true, // allow cookies or auth headers if needed
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
