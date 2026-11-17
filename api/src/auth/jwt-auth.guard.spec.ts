
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const jwtMock = {
    verifyAsync: jest.fn(),
  };

  const createContext = (authorization?: string) => {
    const request = {
      headers: authorization
        ? { authorization }
        : {},
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    return {
      context: context as any,
      request,
    };
  };

  beforeEach(() => {
    jest.resetAllMocks();

    guard = new JwtAuthGuard(
      jwtMock as unknown as JwtService,
    );
  });

  it('rejects requests without a token', async () => {
    const { context } = createContext();

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(UnauthorizedException);

    expect(jwtMock.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects invalid JWT tokens', async () => {
    const { context } = createContext(
      'Bearer invalid-token',
    );

    jwtMock.verifyAsync.mockRejectedValue(
      new Error('invalid signature'),
    );

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects expired JWT tokens', async () => {
    const { context } = createContext(
      'Bearer expired-token',
    );

    jwtMock.verifyAsync.mockRejectedValue(
      new Error('jwt expired'),
    );

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('allows requests with valid JWT tokens', async () => {
    const { context, request } = createContext(
      'Bearer valid-token',
    );

    jwtMock.verifyAsync.mockResolvedValue({
      sub: 5,
      email: 'user@example.com',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);

    expect(request).toHaveProperty('user', {
      id: 5,
      email: 'user@example.com',
    });
  });
});
