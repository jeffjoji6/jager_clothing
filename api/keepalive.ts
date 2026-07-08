// Vercel cron hits this every 2 days (see vercel.json) so the
// Supabase free-tier project registers activity and never auto-pauses.
export default async function handler(req: any, res: any) {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
        return res.status(500).json({ ok: false, error: "Supabase env vars missing" });
    }

    try {
        const response = await fetch(`${url}/rest/v1/products?select=id&limit=1`, {
            headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
        });

        return res.status(200).json({
            ok: response.ok,
            status: response.status,
            pingedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, error: error.message });
    }
}
