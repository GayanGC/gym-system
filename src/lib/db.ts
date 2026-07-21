export interface Gym {
  id: string;
  gymName: string;
  ownerName: string;
  email: string;
  phone: string;
  location: string;
  createdAt: string;
}

export interface Trainer {
  id: string;
  gymId: string;
  name: string;
  specialization: string;
  phone: string;
}

export interface Member {
  id: string;
  gymId: string;
  fullName: string;
  phone: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  targetWeight: number;
  goal: string;
  createdAt: string;
}

const isClient = () => typeof window !== 'undefined';

const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (!isClient()) return defaultValue;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

const setStorageItem = <T>(key: string, value: T): void => {
  if (!isClient()) return;
  localStorage.setItem(key, JSON.stringify(value));
};

export const getGyms = (): Gym[] => {
  return getStorageItem<Gym[]>('fitpulse_gyms', []);
};

export const getGym = (gymId: string): Gym | null => {
  const gyms = getGyms();
  return gyms.find((g) => g.id === gymId) || null;
};

export const saveGym = (gym: Gym): void => {
  const gyms = getGyms();
  // Remove if exists and add new
  const filtered = gyms.filter((g) => g.id !== gym.id);
  filtered.push(gym);
  setStorageItem('fitpulse_gyms', filtered);
  // Set as last active gym
  if (isClient()) {
    localStorage.setItem('fitpulse_active_gym_id', gym.id);
  }
};

export const getActiveGymId = (): string | null => {
  if (!isClient()) return null;
  return localStorage.getItem('fitpulse_active_gym_id');
};

export const getTrainers = (gymId: string): Trainer[] => {
  const allTrainers = getStorageItem<Trainer[]>('fitpulse_trainers', []);
  return allTrainers.filter((t) => t.gymId === gymId);
};

export const addTrainer = (gymId: string, trainerData: Omit<Trainer, 'id' | 'gymId'>): Trainer => {
  const allTrainers = getStorageItem<Trainer[]>('fitpulse_trainers', []);
  const newTrainer: Trainer = {
    ...trainerData,
    id: `TRN-${Math.floor(1000 + Math.random() * 9000)}`,
    gymId,
  };
  allTrainers.push(newTrainer);
  setStorageItem('fitpulse_trainers', allTrainers);
  return newTrainer;
};

export const deleteTrainer = (trainerId: string): void => {
  const allTrainers = getStorageItem<Trainer[]>('fitpulse_trainers', []);
  const filtered = allTrainers.filter((t) => t.id !== trainerId);
  setStorageItem('fitpulse_trainers', filtered);
};

export const getMembers = (gymId: string): Member[] => {
  const allMembers = getStorageItem<Member[]>('fitpulse_members', []);
  return allMembers.filter((m) => m.gymId === gymId);
};

export const addMember = (gymId: string, memberData: Omit<Member, 'id' | 'gymId' | 'createdAt'>): Member => {
  const allMembers = getStorageItem<Member[]>('fitpulse_members', []);
  const newMember: Member = {
    ...memberData,
    id: `MBR-${Math.floor(10000 + Math.random() * 90000)}`,
    gymId,
    createdAt: new Date().toISOString(),
  };
  allMembers.push(newMember);
  setStorageItem('fitpulse_members', allMembers);
  return newMember;
};
