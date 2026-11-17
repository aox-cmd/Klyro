
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(ownerId: number) {
    return this.prisma.project.findMany({
      where: {
        ownerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(
    ownerId: number,
    name: string,
    description: string,
  ) {
    return this.prisma.project.create({
      data: {
        name,
        description,
        ownerId,
      },
    });
  }
}
