export const createClient = jest.fn(() => ({
    connect: jest.fn(),
    end: jest.fn(),
    sql: jest.fn(),
  }));
  