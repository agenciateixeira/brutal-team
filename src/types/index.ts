export type UserRole = 'coach' | 'aluno';
export type PaymentStatus = 'active' | 'pending' | 'overdue' | 'suspended';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  role: UserRole;
  payment_status: PaymentStatus | null;
  payment_due_date: string | null;
  monthly_fee: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProgressPhoto {
  id: string;
  aluno_id: string;
  photo_url: string;
  week_number: number;
  notes: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  aluno_id: string;
  sender_id: string;
  message: string;
  read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface Dieta {
  id: string;
  aluno_id: string;
  title: string;
  content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Treino {
  id: string;
  aluno_id: string;
  title: string;
  content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlunoWithDetails extends Profile {
  progress_photos: ProgressPhoto[];
  messages: Message[];
  dietas: Dieta[];
  treinos: Treino[];
  unread_messages_count?: number;
}

export interface PaymentHistory {
  id: string;
  aluno_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference_month: string;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  aluno?: Profile;
}
