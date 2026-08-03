console.log("Supabase.js loaded");

const SUPABASE_URL = "https://qzjxghkuaveoaobnimlb.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_6WOKjoz6ecfsczekrbzNGw_4QltwAEK";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
console.log(supabaseClient);