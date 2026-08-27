export interface UserDto {
  id: number;
  email: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: UserDto;
}

export interface MeResponse {
  user: UserDto;
}