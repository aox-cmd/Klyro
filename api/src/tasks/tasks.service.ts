
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyProject(
    projectId: number,
    ownerId: number,
  ) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId,
      },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  async findAll(projectId: number, ownerId: number) {
    await this.verifyProject(projectId, ownerId);

    return this.prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    projectId: number,
    ownerId: number,
    dto: CreateTaskDto,
  ) {
    await this.verifyProject(projectId, ownerId);

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description ?? '',
        projectId,
      },
    });
  }

  async update(
    projectId: number,
    taskId: number,
    ownerId: number,
    dto: UpdateTaskDto,
  ) {
    await this.verifyProject(projectId, ownerId);

    const result = await this.prisma.task.updateMany({
      where: {
        id: taskId,
        projectId,
      },
      data: dto,
    });

    if (result.count === 0) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.task.findFirstOrThrow({
      where: { id: taskId, projectId },
    });
  }

  async remove(
    projectId: number,
    taskId: number,
    ownerId: number,
  ) {
    await this.verifyProject(projectId, ownerId);

    const result = await this.prisma.task.deleteMany({
      where: {
        id: taskId,
        projectId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Task not found');
    }

    return { message: 'Task deleted successfully' };
  }
}
