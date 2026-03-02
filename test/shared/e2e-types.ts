/** Response types for e2e tests to satisfy @typescript-eslint/no-unsafe-* rules */

export interface AuthRegisterResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    username: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface AuthLoginResponse {
  accessToken: string;
  user: { email: string; username: string };
}

export interface ChatResponse {
  id: number;
  type: string;
  name?: string;
  participants: unknown[];
}

export interface MessageResponse {
  id: number;
  content: string;
  chatId: number;
  sender: unknown;
  createdAt: string;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}
