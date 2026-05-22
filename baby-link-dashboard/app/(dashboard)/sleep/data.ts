import { createClient } from '@/utils/supabase/server';

export async function getSleepData(babyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('baby_events')
    .select('*')
    .eq('baby_id', babyId)
    .eq('category', 'Sleep')
    .order('start_time', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}