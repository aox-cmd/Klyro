
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { CreateTaskDto } from './create-task.dto';

describe('CreateTaskDto validation', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const metadata = {
    type: 'body' as const,
    metatype: CreateTaskDto,
    data: '',
  };

  const validate = (value: unknown) =>
    pipe.transform(value, metadata);

  it('accepts a valid task', async () => {
    const result = await validate({
      title: 'Write documentation',
      description: 'Document the API',
    });

    expect(result).toMatchObject({
      title: 'Write documentation',
      description: 'Document the API',
    });
  });

  it('rejects an empty title', async () => {
    await expect(
      validate({ title: '' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects titles shorter than 3 characters', async () => {
    await expect(
      validate({ title: 'Hi' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects titles longer than 150 characters', async () => {
    await expect(
      validate({ title: 'A'.repeat(151) }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects unexpected properties', async () => {
    await expect(
      validate({
        title: 'Valid task',
        ownerId: 999,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a numeric title', async () => {
    await expect(
      validate({ title: 12345 }),
    ).rejects.toThrow(BadRequestException);
  });
});
