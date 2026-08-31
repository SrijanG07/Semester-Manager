const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('🗄️  Supabase Storage configured:', supabaseUrl);
    } catch (err) {
        console.warn('⚠️ Supabase initialization failed:', err.message);
    }
} else {
    console.warn('⚠️ Supabase credentials not set. File uploads will not work.');
}

module.exports = supabase;
