import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv";
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// console.log(process.env.SUPABASE_URL);

export default supabase;