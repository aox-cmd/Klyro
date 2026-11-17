import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';


describe('Klyro App', () => {
  it('renders the login screen', () => {
    render(<App />);

    expect(
      screen.getByRole('button', { name: /log in|login|sign in/i }),
    ).toBeInTheDocument();
  });

  it('renders an email input', () => {
    render(<App />);

    expect(
      screen.getByLabelText(/email/i),
    ).toBeInTheDocument();
  });

  it('renders a password input', () => {
    render(<App />);

    expect(
      screen.getByLabelText(/password/i),
    ).toBeInTheDocument();
  });

it('logs in successfully and loads the dashboard', async () => {
  const user = userEvent.setup();

  const fetchMock = vi.spyOn(globalThis, 'fetch');

  fetchMock
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'fake-jwt-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
        },
      }),
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

  render(<App />);

  await user.type(
    screen.getByLabelText(/email/i),
    'test@example.com',
  );

  await user.type(
    screen.getByLabelText(/password/i),
    'password123',
  );

  await user.click(
    screen.getByRole('button', {
      name: /log in|login|sign in/i,
    }),
  );

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/projects'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer fake-jwt-token',
        }),
      }),
    );
  });
});

it('shows an error when login credentials are invalid', async () => {
  const user = userEvent.setup();

  const fetchMock = vi.spyOn(globalThis, 'fetch');

  fetchMock.mockResolvedValueOnce({
    ok: false,
    status: 401,
    json: async () => ({
      statusCode: 401,
      message: 'Invalid credentials',
      error: 'Unauthorized',
    }),
  } as Response);

  render(<App />);

  await user.type(
    screen.getByLabelText(/email/i),
    'wrong@example.com',
  );

  await user.type(
    screen.getByLabelText(/password/i),
    'wrongpassword',
  );

  await user.click(
    screen.getByRole('button', {
      name: /log in|login|sign in/i,
    }),
  );

  expect(
    await screen.findByText(/invalid credentials/i),
  ).toBeInTheDocument();
});



it('loads projects after successful login', async () => {
  const user = userEvent.setup();

  const fetchMock = vi.spyOn(globalThis, 'fetch');

  fetchMock.mockImplementation(async (input) => {
    const url = String(input);

    if (url.endsWith('/auth/login')) {
      return {
        ok: true,
        json: async () => ({
          accessToken: 'test-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
          },
        }),
      } as Response;
    }

    if (url.endsWith('/projects')) {
      return {
        ok: true,
        json: async () => [
          {
            id: 10,
            name: 'Portfolio Website',
            description: 'My personal portfolio',
            status: 'active',
          },
        ],
      } as Response;
    }

    throw new Error(`Unexpected request: ${url}`);
  });

  render(<App />);

  await user.type(
    screen.getByLabelText(/email/i),
    'test@example.com',
  );

  await user.type(
    screen.getByLabelText(/password/i),
    'password123',
  );

  await user.click(
    screen.getByRole('button', {
      name: /log in|login|sign in/i,
    }),
  );

  expect(
    await screen.findByText('Portfolio Website'),
  ).toBeInTheDocument();

  expect(
    screen.getByText('My personal portfolio'),
  ).toBeInTheDocument();
});



it('loads tasks when a project is selected', async () => {
  const user = userEvent.setup();

  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);

    if (url.endsWith('/auth/login')) {
      return {
        ok: true,
        json: async () => ({
          accessToken: 'test-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
          },
        }),
      } as Response;
    }

    if (url.endsWith('/projects')) {
      return {
        ok: true,
        json: async () => [
          {
            id: 10,
            name: 'Portfolio Website',
            description: 'My personal portfolio',
            status: 'active',
          },
        ],
      } as Response;
    }

    if (url.endsWith('/projects/10/tasks')) {
      return {
        ok: true,
        json: async () => [
          {
            id: 100,
            title: 'Design homepage',
            description: 'Create homepage layout',
            status: 'TODO',
            projectId: 10,
          },
        ],
      } as Response;
    }

    throw new Error(`Unexpected request: ${url}`);
  });

  render(<App />);

  await user.type(
    screen.getByLabelText(/email/i),
    'test@example.com',
  );

  await user.type(
    screen.getByLabelText(/password/i),
    'password123',
  );

  await user.click(
    screen.getByRole('button', {
      name: /log in|login|sign in/i,
    }),
  );

  await user.click(
    await screen.findByText('Portfolio Website'),
  );

  expect(
    await screen.findByText('Design homepage'),
  ).toBeInTheDocument();

  expect(
    screen.getByText('Create homepage layout'),
  ).toBeInTheDocument();
});



it('creates a task in the selected project', async () => {
  const user = userEvent.setup();

  const fetchMock = vi.spyOn(globalThis, 'fetch');

  fetchMock.mockImplementation(async (input, options) => {
    const url = String(input);
    const method = options?.method ?? 'GET';

    if (url.endsWith('/auth/login')) {
      return {
        ok: true,
        json: async () => ({
          accessToken: 'test-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
          },
        }),
      } as Response;
    }

    if (url.endsWith('/projects') && method === 'GET') {
      return {
        ok: true,
        json: async () => [
          {
            id: 10,
            name: 'Portfolio Website',
            description: 'My personal portfolio',
            status: 'active',
          },
        ],
      } as Response;
    }

    if (url.endsWith('/projects/10/tasks') && method === 'GET') {
      return {
        ok: true,
        json: async () => [],
      } as Response;
    }

    if (url.endsWith('/projects/10/tasks') && method === 'POST') {
      return {
        ok: true,
        json: async () => ({
          id: 101,
          title: 'Write unit tests',
          description: '',
          status: 'TODO',
          projectId: 10,
        }),
      } as Response;
    }

    throw new Error(`Unexpected request: ${method} ${url}`);
  });

  render(<App />);

  await user.type(
    screen.getByLabelText(/email/i),
    'test@example.com',
  );

  await user.type(
    screen.getByLabelText(/password/i),
    'password123',
  );

  await user.click(
    screen.getByRole('button', {
      name: /log in|login|sign in/i,
    }),
  );

  await user.click(
    await screen.findByText('Portfolio Website'),
  );

  // Adjust this selector if your task input has a different label.
  await user.type(
    screen.getByPlaceholderText(/task title/i),
    'Write unit tests',
  );

  await user.click(
    screen.getByRole('button', {
      name: /add task|create task/i,
    }),
  );

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/projects/10/tasks'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Write unit tests'),
      }),
    );
  });

  expect(
    await screen.findByText('Write unit tests'),
  ).toBeInTheDocument();
});




});
