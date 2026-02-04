import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'http://localhost:8000';
const serviceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Cliente admin com service role para operações privilegiadas
// Usa service role se disponível, senão usa anon key
let supabaseAdmin: SupabaseClient;

if (serviceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  console.warn('Service key não disponível. Usando anon key (algumas funcionalidades podem não funcionar).');
  supabaseAdmin = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}

interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'patient' | 'provider' | 'admin';
}

interface CreateProviderData extends CreateUserData {
  specialty: string;
  bio?: string;
  is_active?: boolean;
}

/**
 * Cria um novo usuário com o service role
 */
export async function createUser(data: CreateUserData) {
  // Criar usuário no Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      first_name: data.first_name,
      last_name: data.last_name,
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('Erro ao criar usuário');
  }

  // Criar perfil
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone || null,
      role: data.role,
      patient_type: data.role === 'patient' ? 'new' : null,
    });

  if (profileError) {
    // Se falhar ao criar perfil, deletar o usuário auth
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw new Error(profileError.message);
  }

  return authData.user;
}

/**
 * Cria um novo médico (usuário + provider)
 */
export async function createProvider(data: CreateProviderData) {
  // Gerar senha temporária
  const tempPassword = generateTempPassword();

  // Criar usuário
  const user = await createUser({
    email: data.email,
    password: tempPassword,
    first_name: data.first_name,
    last_name: data.last_name,
    phone: data.phone,
    role: 'provider',
  });

  // Criar registro na tabela providers
  const { error: providerError } = await supabaseAdmin
    .from('providers')
    .insert({
      user_id: user.id,
      specialty: data.specialty,
      bio: data.bio || null,
      is_active: data.is_active ?? true,
    });

  if (providerError) {
    // Se falhar, deletar o usuário
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    throw new Error(providerError.message);
  }

  return { user, tempPassword };
}

/**
 * Busca perfil por email (usando service role)
 */
export async function getProfileByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, first_name, last_name')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Atualiza perfil para provider
 */
export async function promoteToProvider(
  userId: string,
  data: {
    first_name: string;
    last_name: string;
    phone?: string;
    specialty: string;
    bio?: string;
    is_active?: boolean;
  }
) {
  // Atualizar role no perfil
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      role: 'provider',
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  // Criar registro na tabela providers
  const { error: providerError } = await supabaseAdmin
    .from('providers')
    .insert({
      user_id: userId,
      specialty: data.specialty,
      bio: data.bio || null,
      is_active: data.is_active ?? true,
    });

  if (providerError) {
    throw new Error(providerError.message);
  }
}

/**
 * Gera senha temporária
 */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export { supabaseAdmin };
