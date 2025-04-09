export class ThinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ThinkError';
  }
}

export class ThinkAPIError extends ThinkError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: any
  ) {
    super(message);
    this.name = 'ThinkAPIError';
  }
}

export class ThinkNotFoundError extends ThinkAPIError {
  constructor(message: string = 'Agent not found') {
    super(message, 404);
    this.name = 'ThinkNotFoundError';
  }
}

export class ThinkValidationError extends ThinkAPIError {
  constructor(message: string, public readonly errors?: any[]) {
    super(message, 400);
    this.name = 'ThinkValidationError';
  }
} 