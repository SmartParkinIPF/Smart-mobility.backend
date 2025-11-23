import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || "4001"),
  HOST: process.env.HOST || "0.0.0.0",
  JWT_SECRET: process.env.JWT_SECRET || "hs<ifñ<lfj<ffs<uhlk<sgb",
  SUPABASE_URL:
    process.env.SUPABASE_URL || "https://jydqxbzwtfaiqclqoxdl.supabase.co",
  SUPABASE_KEY:
    process.env.SUPABASE_ANNON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZHF4Ynp3dGZhaXFjbHFveGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MzI3OTUsImV4cCI6MjA3MjQwODc5NX0.mIk6YJ7EKcWi8cYvKNhC5jEP7xC6y1mSynlc6ZjUS7Y",
  SERVICE_ROL:
    process.env.SUPABASE_SERVICE_ROL ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZHF4Ynp3dGZhaXFjbHFveGRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgzMjc5NSwiZXhwIjoyMDcyNDA4Nzk1fQ.AWdy8t7MyyDv3PN2Nyt2NBw0LbRzj_DutYUgIJ_a7dQ",
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || "",
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || "",
  PAYPAL_API_BASE: process.env.PAYPAL_API_BASE || "",
};
