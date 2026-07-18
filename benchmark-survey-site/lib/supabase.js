import { createClient } from '@supabase/supabase-js';

// Server-only client. Uses the service role key, so this file must never be
// imported into a Client Component or exposed to the browser.
let client;

export function getSupabase() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
      );
    }
    client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export async function getSiteContent() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('site_content')
    .select('content')
    .eq('id', 1)
    .single();

  if (error) throw error;
  return data.content;
}

export async function updateSiteContent(content) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('site_content')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', 1);

  if (error) throw error;
}

export async function insertLead({ name, email, phone, message }) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('leads')
    .insert([{ name, email, phone, message }]);

  if (error) throw error;
}

export async function getLeads() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

const RESUME_BUCKET = 'resumes';

export async function insertApplication({ name, email, phone, position, message, resumeFile }) {
  const supabase = getSupabase();

  let resume_path = null;
  let resume_filename = null;

  if (resumeFile) {
    const safeName = resumeFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const buffer = Buffer.from(await resumeFile.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(RESUME_BUCKET)
      .upload(path, buffer, {
        contentType: resumeFile.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) throw uploadError;
    resume_path = path;
    resume_filename = resumeFile.name;
  }

  const { error } = await supabase
    .from('applications')
    .insert([{ name, email, phone, position, message, resume_path, resume_filename }]);

  if (error) throw error;
}

export async function getApplications() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getResumeSignedUrl(path) {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(path, 60 * 10); // valid for 10 minutes

  if (error) throw error;
  return data.signedUrl;
}
