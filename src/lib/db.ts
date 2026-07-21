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
  autoSmsEnabled: boolean;
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

export interface PaymentSlip {
  id: string;
  tenantType: 'OWNER' | 'MEMBER';
  referenceId: string; // gymId (for owner) or memberId (for member)
  amount: number;
  bankName: string;
  slipImage: string; // File name or description
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface SmsLog {
  id: string;
  gymId: string;
  receiverPhone: string;
  message: string;
  triggerType: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  gymId: string;
  name: string;
  stock: number;
  unitCost: number;
  sellingPrice: number;
}

export interface SaleItem {
  itemId: string;
  name: string;
  qty: number;
  price: number;
}

export interface Sale {
  id: string;
  gymId: string;
  memberId: string; // 'Guest' or memberId
  memberName: string; // member name or 'Guest'
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'Cash' | 'LANKAQR' | 'Credit';
  createdAt: string;
}

export interface ReengagementAttempt {
  id: string;
  gymId: string;
  memberId: string;
  memberName: string;
  message: string;
  sentAt: string;
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

  const initialized = localStorage.getItem('fitpulse_initialized_v3');
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
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      autoSmsEnabled: true,
    },
    {
      id: 'GYM-202',
      gymName: 'Powerhouse Gym (Kandy)',
      ownerName: 'Sarah Owner',
      email: 'owner@powerhouse.com',
      phone: '+94 77 987 6543',
      location: 'Kandy, LK',
      subscriptionStatus: 'Expired',
      trialEndsAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      autoSmsEnabled: false,
    }
  ];

  // 2. Seed Users
  const mockUsers: User[] = [
    {
      id: 'USR-ADMIN',
      gymId: null,
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
      email: 'admin@fitpulse.ai',
      phone: '+94 77 000 0000',
      createdAt: new Date().toISOString(),
    },
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
    {
      id: 'MBR-103',
      gymId: 'GYM-101',
      role: 'MEMBER',
      name: 'James Member',
      email: 'james@gmail.com',
      phone: '+94 77 888 9999',
      age: 35,
      gender: 'male',
      height: 175,
      weight: 90,
      targetWeight: 80,
      goal: 'weight-loss',
      streak: 0,
      createdAt: new Date().toISOString(),
    },
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
    }
  ];

  // Seeding checkins for inactivity tests
  const mockAttendance: Attendance[] = [
    // Ryan Member - active today
    { id: 'ATT-1', gymId: 'GYM-101', memberId: 'MBR-101', timestamp: new Date().toISOString() },
    
    // Jessica Member - last checked in 6 days ago (At-Risk)
    { id: 'ATT-2', gymId: 'GYM-101', memberId: 'MBR-102', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
    
    // James Member - last checked in 12 days ago (Critical)
    { id: 'ATT-3', gymId: 'GYM-101', memberId: 'MBR-103', timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },

    // Oliver Member - checked in 7 days ago
    { id: 'ATT-4', gymId: 'GYM-202', memberId: 'MBR-201', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
  ];

  // 5. Seed Payment Slips
  const mockSlips: PaymentSlip[] = [
    {
      id: 'SLIP-001',
      tenantType: 'MEMBER',
      referenceId: 'MBR-101',
      amount: 4500,
      bankName: 'Commercial Bank',
      slipImage: 'ryan_july_slip.jpg',
      status: 'Pending',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'SLIP-002',
      tenantType: 'OWNER',
      referenceId: 'GYM-202',
      amount: 29000,
      bankName: 'Sampath Bank',
      slipImage: 'powerhouse_renewal_receipt.png',
      status: 'Pending',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  // 6. Seed SMS logs
  const mockSmsLogs: SmsLog[] = [
    {
      id: 'SMS-1',
      gymId: 'GYM-101',
      receiverPhone: '+94 77 444 5555',
      message: "Welcome to Gold's Gym (Colombo)! Your workout session started at 10:15 AM. Work hard! 🔥",
      triggerType: 'Check-in',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  // 7. Seed Inventory Items LKR
  const mockInventory: InventoryItem[] = [
    { id: 'INV-101', gymId: 'GYM-101', name: 'Whey Protein (1kg)', stock: 15, unitCost: 11000, sellingPrice: 14500 },
    { id: 'INV-102', gymId: 'GYM-101', name: 'Micronized Creatine (250g)', stock: 25, unitCost: 4000, sellingPrice: 6500 },
    { id: 'INV-103', gymId: 'GYM-101', name: 'Pre-Workout Energizer', stock: 12, unitCost: 7500, sellingPrice: 9500 },
    { id: 'INV-104', gymId: 'GYM-101', name: 'Mineral Water (1L)', stock: 60, unitCost: 80, sellingPrice: 150 },
    { id: 'INV-105', gymId: 'GYM-101', name: 'Oatmeal Protein Bar', stock: 45, unitCost: 300, sellingPrice: 480 },
    
    // Gym 202
    { id: 'INV-201', gymId: 'GYM-202', name: 'Whey Protein (1kg)', stock: 8, unitCost: 11000, sellingPrice: 15000 },
    { id: 'INV-202', gymId: 'GYM-202', name: 'Micronized Creatine (250g)', stock: 15, unitCost: 4000, sellingPrice: 7000 }
  ];

  const mockSales: Sale[] = [];
  const mockReengageLogs: ReengagementAttempt[] = [];

  setStorageItem('fitpulse_gyms', mockGyms);
  setStorageItem('fitpulse_users', mockUsers);
  setStorageItem('fitpulse_plans', mockPlans);
  setStorageItem('fitpulse_attendance', mockAttendance);
  setStorageItem('fitpulse_slips', mockSlips);
  setStorageItem('fitpulse_sms_logs', mockSmsLogs);
  setStorageItem('fitpulse_inventory', mockInventory);
  setStorageItem('fitpulse_sales', mockSales);
  setStorageItem('fitpulse_reengage', mockReengageLogs);
  
  localStorage.setItem('fitpulse_initialized', 'true');
  localStorage.setItem('fitpulse_initialized_v2', 'true');
  localStorage.setItem('fitpulse_initialized_v3', 'true');
};

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
    if (status === 'Active') {
      gyms[gymIndex].trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    setStorageItem('fitpulse_gyms', gyms);
  }
};

export const updateGymSmsToggle = (gymId: string, enabled: boolean): void => {
  const gyms = getGyms();
  const gymIndex = gyms.findIndex((g) => g.id === gymId);
  if (gymIndex > -1) {
    gyms[gymIndex].autoSmsEnabled = enabled;
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

  const users = getUsers();
  const memberIndex = users.findIndex((u) => u.id === memberId && u.gymId === gymId);
  if (memberIndex > -1) {
    const currentStreak = users[memberIndex].streak || 0;
    users[memberIndex].streak = currentStreak + 1;
    setStorageItem('fitpulse_users', users);
  }

  return newLog;
};

// Payment Slips APIs
export const getPaymentSlips = (tenantType: 'OWNER' | 'MEMBER', referenceId?: string): PaymentSlip[] => {
  const slips = getStorageItem<PaymentSlip[]>('fitpulse_slips', []);
  const filteredByType = slips.filter((s) => s.tenantType === tenantType);
  if (referenceId) {
    return filteredByType.filter((s) => s.referenceId === referenceId);
  }
  return filteredByType;
};

export const addPaymentSlip = (slipData: Omit<PaymentSlip, 'id' | 'status' | 'createdAt'>): PaymentSlip => {
  const slips = getStorageItem<PaymentSlip[]>('fitpulse_slips', []);
  const newSlip: PaymentSlip = {
    ...slipData,
    id: `SLIP-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };
  slips.push(newSlip);
  setStorageItem('fitpulse_slips', slips);
  return newSlip;
};

export const updatePaymentSlipStatus = (slipId: string, status: 'Approved' | 'Rejected'): void => {
  const slips = getStorageItem<PaymentSlip[]>('fitpulse_slips', []);
  const index = slips.findIndex((s) => s.id === slipId);
  if (index > -1) {
    slips[index].status = status;
    const slip = slips[index];
    setStorageItem('fitpulse_slips', slips);

    if (slip.tenantType === 'OWNER' && status === 'Approved') {
      updateGymSubscription(slip.referenceId, 'Active');
    }
  }
};

// SMS logs APIs
export const getSmsLogs = (gymId: string): SmsLog[] => {
  const logs = getStorageItem<SmsLog[]>('fitpulse_sms_logs', []);
  return logs.filter((l) => l.gymId === gymId);
};

export const addSmsLog = (gymId: string, receiverPhone: string, message: string, triggerType: string): SmsLog => {
  const logs = getStorageItem<SmsLog[]>('fitpulse_sms_logs', []);
  const newLog: SmsLog = {
    id: `SMS-${Math.floor(1000 + Math.random() * 9000)}`,
    gymId,
    receiverPhone,
    message,
    triggerType,
    createdAt: new Date().toISOString(),
  };
  logs.push(newLog);
  setStorageItem('fitpulse_sms_logs', logs);
  return newLog;
};

// --- Inventory & Catalog APIs ---
export const getInventory = (gymId: string): InventoryItem[] => {
  const inventory = getStorageItem<InventoryItem[]>('fitpulse_inventory', []);
  return inventory.filter((item) => item.gymId === gymId);
};

export const addInventoryItem = (gymId: string, itemData: Omit<InventoryItem, 'id' | 'gymId'>): InventoryItem => {
  const inventory = getStorageItem<InventoryItem[]>('fitpulse_inventory', []);
  const newItem: InventoryItem = {
    ...itemData,
    id: `INV-${Math.floor(100 + Math.random() * 900)}`,
    gymId,
  };
  inventory.push(newItem);
  setStorageItem('fitpulse_inventory', inventory);
  return newItem;
};

export const updateStock = (itemId: string, qtyChange: number): void => {
  const inventory = getStorageItem<InventoryItem[]>('fitpulse_inventory', []);
  const idx = inventory.findIndex((item) => item.id === itemId);
  if (idx > -1) {
    const newStock = Math.max(0, inventory[idx].stock + qtyChange);
    inventory[idx].stock = newStock;
    setStorageItem('fitpulse_inventory', inventory);
  }
};

// --- Sales & POS Billing APIs ---
export const getSales = (gymId: string): Sale[] => {
  const sales = getStorageItem<Sale[]>('fitpulse_sales', []);
  return sales.filter((s) => s.gymId === gymId);
};

export const addSale = (saleData: Omit<Sale, 'id' | 'createdAt'>): Sale => {
  const sales = getStorageItem<Sale[]>('fitpulse_sales', []);
  const newSale: Sale = {
    ...saleData,
    id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
  };
  sales.push(newSale);
  setStorageItem('fitpulse_sales', sales);

  // Decrement stock levels for each item purchased
  newSale.items.forEach((itm) => {
    updateStock(itm.itemId, -itm.qty);
  });

  return newSale;
};

// --- Reengagement Logs APIs ---
export const getReengagementLogs = (gymId: string): ReengagementAttempt[] => {
  const logs = getStorageItem<ReengagementAttempt[]>('fitpulse_reengage', []);
  return logs.filter((l) => l.gymId === gymId);
};

export const addReengagementLog = (gymId: string, memberId: string, message: string): void => {
  const logs = getStorageItem<ReengagementAttempt[]>('fitpulse_reengage', []);
  const users = getUsers();
  const member = users.find(u => u.id === memberId);
  const memberName = member ? member.name : 'Unknown Member';

  const newLog: ReengagementAttempt = {
    id: `RE-${Math.floor(1000 + Math.random() * 9000)}`,
    gymId,
    memberId,
    memberName,
    message,
    sentAt: new Date().toISOString(),
  };

  logs.push(newLog);
  setStorageItem('fitpulse_reengage', logs);
};
