
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { UpdateTaskDto } from './update-task.dto';

describe('UpdateTaskDto validation', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const metadata = {
    type: 'body' as const,
    metatype: UpdateTaskDto,
    data: '',
  };

  const validate = (value: unknown) =>
    pipe.transform(value, metadata);

  it('accepts a valid task status', async () => {
    const result = await validate({
      status: 'IN_PROGRESS',
    });

    expect(result).toMatchObject({
      status: 'IN_PROGRESS',
    });
  });

  it('rejects an invalid task status', async () => {
    await expect(
      validate({ status: 'HACKED' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects unexpected ownership fields', async () => {
    await expect(
      validate({
        status: 'DONE',
        projectId: 999,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts a valid title update', async () => {
    const result = await validate({
      title: 'Updated task title',
    });

    expect(result).toMatchObject({
      title: 'Updated task title',
    });
  });
});
