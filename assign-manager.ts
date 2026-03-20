import { supabase } from './src/integrations/supabase/client';

async function assignManagerRole() {
  const userId = 'fad6cf60-a3b2-4add-b5b1-c0e945fd5416';
  
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .insert([
        {
          user_id: userId,
          role: 'manager',
        }
      ])
      .select();

    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('✓ Manager role assigned successfully to victorndiritu@gmail.com');
      console.log('User can now approve/reject tenders and manage tasks');
    }
  } catch (err: any) {
    console.error('Failed:', err.message);
  }
}

assignManagerRole();
