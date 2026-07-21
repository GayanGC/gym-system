export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'TRAINER' | 'MEMBER';

export interface Gym {
  id: string; // e.g. GYM-101
  gymName: string;
  ownerName: string;
  email: string;
  phone: string;
  location: string;
  subscriptionStatus: 'Trial' | 'Active' | 'Expired';
  trialEndsAt: string;
  createdAt: string;
}

export interface User {
  id: string;
  gymId: string | null; // null for SUPER_ADMIN
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  // Specific for member stats
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  targetWeight?: number;
  goal?: string;
  streak?: number;
  // Specific for trainer specialization
  specialization?: string;
  createdAt: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
}

export interface WorkoutPlan {
  id: string;
  gymId: string;
  memberId: string;
  exercises: Exercise[];
  assignedBy: string; // Trainer ID
  createdAt: string;
}

export interface Attendance {
  id: string;
  gymId: string;
  memberId: string;
  timestamp: string;
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

// Seed Mock Data if empty
export const initializeDatabase = () => {
  if (!isClient()) return;

  const initialized = localStorage.getItem('fitpulse_initialized');
  if (initialized) return;

  // 1. Seed Gyms
  const mockGyms: Gym[] = [
    {
      id: 'GYM-101',
      gymName: "Gold's Gym (Colombo)",
      ownerName: 'John Owner',
      email: 'owner@golds.com',
      phone: '+94 77 123 4567',
      location: 'Colombo, LK',
      subscriptionStatus: 'Trial',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      createdAt: new Date().toISOString(),
    },
    {
      id: 'GYM-202',
      gymName: 'Powerhouse Gym (Kandy)',
      ownerName: 'Sarah Owner',
      email: 'owner@powerhouse.com',
      phone: '+94 77 987 6543',
      location: 'Kandy, LK',
      subscriptionStatus: 'Active',
      trialEndsAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Expired
      createdAt: new Date().toISOString(),
    }
  ];

  // 2. Seed Users
  const mockUsers: User[] = [
    // Super Admin
    {
      id: 'USR-ADMIN',
      gymId: null,
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
      email: 'admin@fitpulse.ai',
      phone: '+94 77 000 0000',
      createdAt: new Date().toISOString(),
    },
    // Gym Owners
    {
      id: 'USR-OWNER-1',
      gymId: 'GYM-101',
      role: 'OWNER',
      name: 'John Owner',
      email: 'owner@golds.com',
      phone: '+94 77 123 4567',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'USR-OWNER-2',
      gymId: 'GYM-202',
      role: 'OWNER',
      name: 'Sarah Owner',
      email: 'owner@powerhouse.com',
      phone: '+94 77 987 6543',
      createdAt: new Date().toISOString(),
    },
    // Trainers Gold's Gym
    {
      id: 'TRN-101',
      gymId: 'GYM-101',
      role: 'TRAINER',
      name: 'Alex Trainer',
      email: 'alex@fitpulse.com',
      phone: '+94 77 111 2222',
      specialization: 'Strength & Conditioning',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'TRN-102',
      gymId: 'GYM-101',
      role: 'TRAINER',
      name: 'David Trainer',
      email: 'david@fitpulse.com',
      phone: '+94 77 222 3333',
      specialization: 'Fat Loss & Cardio',
      createdAt: new Date().toISOString(),
    },
    // Trainers Powerhouse Gym
    {
      id: 'TRN-201',
      gymId: 'GYM-202',
      role: 'TRAINER',
      name: 'Emma Trainer',
      email: 'emma@fitpulse.com',
      phone: '+94 77 333 4444',
      specialization: 'Yoga & Flexibility',
      createdAt: new Date().toISOString(),
    },
    // Members Gold's Gym
    {
      id: 'MBR-101',
      gymId: 'GYM-101',
      role: 'MEMBER',
      name: 'Ryan Member',
      email: 'ryan@gmail.com',
      phone: '+94 77 444 5555',
      age: 24,
      gender: 'male',
      height: 180,
      weight: 82,
      targetWeight: 75,
      goal: 'weight-loss',
      streak: 5,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'MBR-102',
      gymId: 'GYM-101',
      role: 'MEMBER',
      name: 'Jessica Member',
      email: 'jessica@gmail.com',
      phone: '+94 77 555 6666',
      age: 28,
      gender: 'female',
      height: 165,
      weight: 58,
      targetWeight: 62,
      goal: 'muscle-building',
      streak: 12,
      createdAt: new Date().toISOString(),
    },
    // Members Powerhouse Gym
    {
      id: 'MBR-201',
      gymId: 'GYM-202',
      role: 'MEMBER',
      name: 'Oliver Member',
      email: 'oliver@gmail.com',
      phone: '+94 77 666 7777',
      age: 31,
      gender: 'male',
      height: 172,
      weight: 70,
      targetWeight: 70,
      goal: 'general-health',
      streak: 2,
      createdAt: new Date().toISOString(),
    }
  ];

  // 3. Seed Workout Plans
  const mockPlans: WorkoutPlan[] = [
    {
      id: 'PLN-1',
      gymId: 'GYM-101',
      memberId: 'MBR-101',
      assignedBy: 'TRN-101',
      createdAt: new Date().toISOString(),
      exercises: [
        { name: 'Bench Press', sets: 4, reps: 10 },
        { name: 'Dumbbell Flyes', sets: 3, reps: 12 },
        { name: 'Pushups', sets: 3, reps: 15 }
      ]
    },
    {
      id: 'PLN-2',
      gymId: 'GYM-101',
      memberId: 'MBR-102',
      assignedBy: 'TRN-102',
      createdAt: new Date().toISOString(),
      exercises: [
        { name: 'Barbell Squats', sets: 4, reps: 12 },
        { name: 'Romanian Deadlifts', sets: 4, reps: 10 },
        { name: 'Plank Hold', sets: 3, reps: 60 }
      ]
    }
  ];

  // 4. Seed Attendance
  const mockAttendance: Attendance[] = [
    { id: 'ATT-1', gymId: 'GYM-101', memberId: 'MBR-101', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'ATT-2', gymId: 'GYM-101', memberId: 'MBR-101', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'ATT-3', gymId: 'GYM-101', memberId: 'MBR-101', timestamp: new Date().toISOString() },
    { id: 'ATT-4', gymId: 'GYM-101', memberId: 'MBR-102', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'ATT-5', gymId: 'GYM-101', memberId: 'MBR-102', timestamp: new Date().toISOString() }
  ];

  setStorageItem('fitpulse_gyms', mockGyms);
  setStorageItem('fitpulse_users', mockUsers);
  setStorageItem('fitpulse_plans', mockPlans);
  setStorageItem('fitpulse_attendance', mockAttendance);
  localStorage.setItem('fitpulse_initialized', 'true');
};

// Auto-run if running on client
if (isClient()) {
  initializeDatabase();
}

// Gym APIs
export const getGyms = (): Gym[] => {
  return getStorageItem<Gym[]>('fitpulse_gyms', []);
};

export const getGym = (gymId: string): Gym | null => {
  const gyms = getGyms();
  return gyms.find((g) => g.id === gymId) || null;
};

export const saveGym = (gym: Gym): void => {
  const gyms = getGyms();
  const filtered = gyms.filter((g) => g.id !== gym.id);
  filtered.push(gym);
  setStorageItem('fitpulse_gyms', filtered);
  if (isClient()) {
    localStorage.setItem('fitpulse_active_gym_id', gym.id);
  }
};

export const updateGymSubscription = (gymId: string, status: 'Trial' | 'Active' | 'Expired'): void => {
  const gyms = getGyms();
  const gymIndex = gyms.findIndex((g) => g.id === gymId);
  if (gymIndex > -1) {
    gyms[gymIndex].subscriptionStatus = status;
    setStorageItem('fitpulse_gyms', gyms);
  }
};

export const getActiveGymId = (): string | null => {
  if (!isClient()) return null;
  return localStorage.getItem('fitpulse_active_gym_id');
};

// User APIs (Generic)
export const getUsers = (): User[] => {
  return getStorageItem<User[]>('fitpulse_users', []);
};

export const getUser = (userId: string): User | null => {
  const users = getUsers();
  return users.find((u) => u.id === userId) || null;
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  const filtered = users.filter((u) => u.id !== user.id);
  filtered.push(user);
  setStorageItem('fitpulse_users', filtered);
};

// Trainer APIs
export const getTrainers = (gymId: string): User[] => {
  const users = getUsers();
  return users.filter((u) => u.gymId === gymId && u.role === 'TRAINER');
};

export const addTrainer = (gymId: string, trainerData: { name: string; specialization: string; phone: string; email?: string }): User => {
  const newUser: User = {
    id: `TRN-${Math.floor(100 + Math.random() * 900)}`,
    gymId,
    role: 'TRAINER',
    name: trainerData.name,
    email: trainerData.email || `${trainerData.name.toLowerCase().replace(/\s+/g, '')}@fitpulse.com`,
    phone: trainerData.phone,
    specialization: trainerData.specialization,
    createdAt: new Date().toISOString(),
  };
  saveUser(newUser);
  return newUser;
};

export const deleteTrainer = (trainerId: string): void => {
  const users = getUsers();
  const filtered = users.filter((u) => u.id !== trainerId);
  setStorageItem('fitpulse_users', filtered);
};

// Member APIs
export const getMembers = (gymId: string): User[] => {
  const users = getUsers();
  return users.filter((u) => u.gymId === gymId && u.role === 'MEMBER');
};

export const getMember = (gymId: string, memberId: string): User | null => {
  const users = getUsers();
  return users.find((u) => u.gymId === gymId && u.id === memberId && u.role === 'MEMBER') || null;
};

export const addMember = (gymId: string, memberData: Omit<User, 'id' | 'gymId' | 'role' | 'createdAt'>): User => {
  const newUser: User = {
    ...memberData,
    id: `MBR-${Math.floor(100 + Math.random() * 900)}`,
    gymId,
    role: 'MEMBER',
    streak: 0,
    createdAt: new Date().toISOString(),
  };
  saveUser(newUser);
  return newUser;
};

// Workout Plan APIs
export const getWorkoutPlans = (): WorkoutPlan[] => {
  return getStorageItem<WorkoutPlan[]>('fitpulse_plans', []);
};

export const getMemberWorkoutPlan = (gymId: string, memberId: string): WorkoutPlan | null => {
  const plans = getWorkoutPlans();
  return plans.find((p) => p.gymId === gymId && p.memberId === memberId) || null;
};

export const saveWorkoutPlan = (plan: Omit<WorkoutPlan, 'id' | 'createdAt'>): WorkoutPlan => {
  const plans = getWorkoutPlans();
  // check if member already has plan, replace or add
  const existing = plans.find((p) => p.gymId === plan.gymId && p.memberId === plan.memberId);
  
  const newPlan: WorkoutPlan = {
    ...plan,
    id: existing ? existing.id : `PLN-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
  };

  const filtered = plans.filter((p) => !(p.gymId === plan.gymId && p.memberId === plan.memberId));
  filtered.push(newPlan);
  setStorageItem('fitpulse_plans', filtered);
  return newPlan;
};

// Attendance APIs
export const getAttendanceLogs = (): Attendance[] => {
  return getStorageItem<Attendance[]>('fitpulse_attendance', []);
};

export const getMemberAttendance = (gymId: string, memberId: string): Attendance[] => {
  const logs = getAttendanceLogs();
  return logs.filter((l) => l.gymId === gymId && l.memberId === memberId);
};

export const logAttendance = (gymId: string, memberId: string): Attendance => {
  const logs = getAttendanceLogs();
  const newLog: Attendance = {
    id: `ATT-${Math.floor(1000 + Math.random() * 9000)}`,
    gymId,
    memberId,
    timestamp: new Date().toISOString(),
  };
  logs.push(newLog);
  setStorageItem('fitpulse_attendance', logs);

  // Update member streak
  const users = getUsers();
  const memberIndex = users.findIndex((u) => u.id === memberId && u.gymId === gymId);
  if (memberIndex > -1) {
    const currentStreak = users[memberIndex].streak || 0;
    users[memberIndex].streak = currentStreak + 1;
    setStorageItem('fitpulse_users', users);
  }

  return newLog;
};
