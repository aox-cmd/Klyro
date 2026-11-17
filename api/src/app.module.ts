import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectsModule } from './projects/projects.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [PrismaModule, ProjectsModule, AuthModule, TasksModule,ThrottlerModule.forRoot([
  {
    ttl: 60_000,
    limit: 60,
  },
]),],
  controllers: [AppController],
  providers: [AppService,{provide: APP_GUARD,useClass: ThrottlerGuard,},],


})
export class AppModule {}
