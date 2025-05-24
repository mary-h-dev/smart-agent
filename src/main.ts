import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
 
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));


  app.enableCors();


  const config = new DocumentBuilder()
    .setTitle('Deep Research API')
    .setDescription('AI-powered deep research engine')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3051;
  
  await app.listen(port);
  
  console.log(`
╔════════════════════════════════════════════╗
║     🚀 Deep Research API v2.0              ║
║     Port: ${port}                              ║
║     Features:                              ║
║     ✓ Professional Questions               ║
║     ✓ Auto Parameter Estimation           ║
║     ✓ Source Citations                     ║
║     ✓ Progress Tracking                    ║
╚════════════════════════════════════════════╝
  `);
}
bootstrap();