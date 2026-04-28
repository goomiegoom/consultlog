import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !key) {
  document.getElementById('root')!.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui;background:#faf9f7">
      <div style="max-width:420px;padding:32px;background:#fff;border:1px solid #e8e5de;border-radius:12px;text-align:center">
        <div style="font-size:32px;margin-bottom:12px">⚙️</div>
        <div style="font-size:16px;font-weight:600;margin-bottom:8px">Missing environment variables</div>
        <div style="font-size:13px;color:#666;line-height:1.6">
          Add <code style="background:#f5f4f0;padding:2px 6px;border-radius:4px">VITE_SUPABASE_URL</code> and
          <code style="background:#f5f4f0;padding:2px 6px;border-radius:4px">VITE_SUPABASE_ANON_KEY</code>
          to your Vercel project settings, then redeploy.
        </div>
      </div>
    </div>`;
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url, key);
