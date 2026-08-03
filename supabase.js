console.log("Supabase.js loaded");

const SUPABASE_URL = "https://qzjxghkuaveoaobnimlb.supabase.co";

const SUPABASE_ANON_KEY = "https://qzjxghkuaveoaobnimlb.supabase.co";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log(window.supabaseClient);