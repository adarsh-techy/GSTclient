import { apiClient } from '../core/client';
import type {
  AddUserRoleCommand,
  CarolEmployee,
  LoginRequest,
  LoginResponse,
  UserRole,
} from '../../types/api';

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function listCarolEmployees(): Promise<CarolEmployee[]> {
  const { data } = await apiClient.get<CarolEmployee[]>('/user-roles/employees');
  return data;
}

export async function listUserRoles(): Promise<UserRole[]> {
  const { data } = await apiClient.get<UserRole[]>('/user-roles');
  return data;
}

export async function addUserRole(payload: AddUserRoleCommand): Promise<UserRole> {
  const { data } = await apiClient.post<UserRole>('/user-roles', payload);
  return data;
}

export async function removeUserRole(userRoleId: number): Promise<void> {
  await apiClient.delete(`/user-roles/${userRoleId}`);
}
