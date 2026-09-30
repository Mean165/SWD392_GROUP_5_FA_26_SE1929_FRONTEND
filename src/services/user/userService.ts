import apiClient from '../api/apiClient';
import type { UserProfile } from '../../types/user';

export const getUsers = async (): Promise<UserProfile[]> => {
  // TODO: connect to backend /user
  return Promise.resolve([]);
};

export const getUserById = async (id: number): Promise<UserProfile | null> => {
  // TODO: connect to backend /user/:id
  return Promise.resolve(null);
};

export const createUser = async (payload: Partial<UserProfile>): Promise<UserProfile> => {
  // TODO: connect to backend /user
  return Promise.resolve({} as UserProfile);
};

export const updateUser = async (id: number, payload: Partial<UserProfile>): Promise<UserProfile> => {
  // TODO: connect to backend /user/:id
  return Promise.resolve({} as UserProfile);
};

export const deleteUser = async (id: number): Promise<void> => {
  // TODO: connect to backend /user/:id
};
