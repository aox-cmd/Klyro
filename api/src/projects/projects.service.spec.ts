
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const prismaMock = {
    project: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should retrieve projects belonging to a user', async () => {
    const mockProjects = [
      {
        id: 1,
        name: 'Klyro',
        description: 'Project management SaaS',
        ownerId: 5,
      },
    ];

    prismaMock.project.findMany.mockResolvedValue(mockProjects);

    const result = await service.findAll(5);

    expect(result).toEqual(mockProjects);

    expect(prismaMock.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerId: 5,
        },
      }),
    );
  });

  it('should not return another users projects', async () => {
    prismaMock.project.findMany.mockResolvedValue([]);

    const result = await service.findAll(99);

    expect(result).toEqual([]);

    expect(prismaMock.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerId: 99,
        },
      }),
    );
  });
});
