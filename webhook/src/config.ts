export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  supabaseUrl: process.env.SUPABASE_URL || 'http://kong:8000',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  evolutionApiUrl: process.env.EVOLUTION_API_URL || 'http://evolution-api:8080',
  evolutionApiKey: process.env.EVOLUTION_API_KEY || '',
  webhookPath: '/webhook/messages',
  // Public URLs (accessible from doctor's phone browser)
  panelBaseUrl: process.env.PANEL_BASE_URL || 'http://localhost:3000',
  supabasePublicUrl: process.env.SUPABASE_PUBLIC_URL || 'http://localhost:8000',
};
