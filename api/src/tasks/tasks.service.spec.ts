
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TasksService', () => {
  let service: TasksService;

  // Fake Prisma database
  const prismaMock = {
    project: {
      findFirst: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      findFirstOrThrow: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list tasks belonging to an owned project', async () => {
    prismaMock.project.findFirst.mockResolvedValue({ id: 1 });

    prismaMock.task.findMany.mockResolvedValue([
      {
        id: 10,
        title: 'Build Kanban board',
        status: 'TODO',
        projectId: 1,
      },
    ]);

    const tasks = await service.findAll(1, 5);

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Build Kanban board');

    expect(prismaMock.project.findFirst).toHaveBeenCalledWith({
      where: {
        id: 1,
        ownerId: 5,
      },
      select: { id: true },
    });
  });

  it('should reject access to another users project', async () => {
    prismaMock.project.findFirst.mockResolvedValue(null);

    await expect(service.findAll(1, 99)).rejects.toThrow(
      NotFoundException,
    );

    expect(prismaMock.task.findMany).not.toHaveBeenCalled();
  });

  it('should create a task in an owned project', async () => {
    prismaMock.project.findFirst.mockResolvedValue({ id: 1 });

    prismaMock.task.create.mockResolvedValue({
      id: 20,
      title: 'Write tests',
      description: '',
      status: 'TODO',
      projectId: 1,
    });

    const result = await service.create(1, 5, {
      title: 'Write tests',
    });

    expect(result.id).toBe(20);

    expect(prismaMock.task.create).toHaveBeenCalledWith({
      data: {
        title: 'Write tests',
        description: '',
        projectId: 1,
      },
    });
  });

  it('should reject creating tasks in another users project', async () => {
    prismaMock.project.findFirst.mockResolvedValue(null);

    await expect(
      service.create(1, 99, {
        title: 'Unauthorized task',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.task.create).not.toHaveBeenCalled();
  });

  it('should reject updating a task outside the project', async () => {
    prismaMock.project.findFirst.mockResolvedValue({ id: 1 });
    prismaMock.task.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.update(1, 999, 5, { status: 'DONE' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should reject deleting a task outside the project', async () => {
    prismaMock.project.findFirst.mockResolvedValue({ id: 1 });
    prismaMock.task.deleteMany.mockResolvedValue({ count: 0 });

    await expect(
      service.remove(1, 999, 5),
    ).rejects.toThrow(NotFoundException);
  });

it('prevents reading tasks from another users project', async () => {
  prismaMock.project.findFirst.mockResolvedValue(null);

  await expect(
    service.findAll(10, 99),
  ).rejects.toThrow(NotFoundException);

  expect(prismaMock.project.findFirst).toHaveBeenCalledWith({
    where: {
      id: 10,
      ownerId: 99,
    },
    select: { id: true },
  });

  expect(prismaMock.task.findMany).not.toHaveBeenCalled();
});

it('prevents deleting tasks from another users project', async () => {
  prismaMock.project.findFirst.mockResolvedValue(null);

  await expect(
    service.remove(10, 25, 99),
  ).rejects.toThrow(NotFoundException);

  expect(prismaMock.task.deleteMany).not.toHaveBeenCalled();
});

it('prevents updating tasks from another users project', async () => {
  prismaMock.project.findFirst.mockResolvedValue(null);

  await expect(
    service.update(10, 25, 99, {
      status: 'DONE',
    }),
  ).rejects.toThrow(NotFoundException);

  expect(prismaMock.task.updateMany).not.toHaveBeenCalled();
});

});
