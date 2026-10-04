import { useAuthStore } from '@/stores/authStore';
import { Role } from '@/types/api';

export type ActorLike = {
  id: number;
  fullName?: string | null;
  username?: string | null;
};

export const isCurrentUserActor = (user?: ActorLike | null): boolean => {
  const authStore = useAuthStore();
  if (!user || !authStore.user) return false;
  return user.id === authStore.user.id;
};

export const getActorDisplayName = (user?: ActorLike | null): string => {
  if (!user) return 'Система';
  if (isCurrentUserActor(user)) return 'Вы';
  return user.fullName || user.username || '';
};

export const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return (first + second || '?').toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const getAvatarColor = (role: Role): string => {
  const colorMap: Record<Role, string> = {
    GUEST: '#8c8c8c',
    SELLER: '#faad14',
    MANAGER: '#52c41a',
    ADMIN: '#1890ff',
  };
  return colorMap[role] || '#8c8c8c';
};
