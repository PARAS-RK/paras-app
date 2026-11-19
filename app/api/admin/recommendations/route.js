import http from 'node:http';
import https from 'node:https';
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://127.0.0.1:8000';
const PRIVATE = { headers: { 'Cache-Control': 'private, no-store' } };

function postToBackend(pathname, body) {
    const backendUrl = new URL(pathname, FASTAPI_BASE_URL);
    const client = backendUrl.protocol === 'https:' ? https : http;
    const requestBody = JSON.stringify(body);

    return new Promise((resolve, reject) => {
        const backendRequest = client.request(
            backendUrl,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody),
                },
                timeout: 120000,
            },
            (response) => {
                let responseBody = '';
                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    responseBody += chunk;
                });
                response.on('end', () => {
                    resolve({
                        status: response.statusCode || 500,
                        body: responseBody,
                    });
                });
            },
        );

        backendRequest.on('timeout', () => {
            backendRequest.destroy(new Error('Backend request timed out'));
        });
        backendRequest.on('error', reject);
        backendRequest.write(requestBody);
        backendRequest.end();
    });
}

export async function POST(request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Sesi admin tidak ditemukan' }, { status: 401 }, PRIVATE);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON tidak valid' }, { status: 400 }, PRIVATE);
  }

  const report = String(payload?.report ?? '').trim();
  if (!report) {
    return NextResponse.json({ error: 'Teks laporan diperlukan' }, { status: 400 }, PRIVATE);
  }

  const topK = Number.isFinite(Number(payload?.topK))
    ? Math.min(5, Math.max(1, Number(payload.topK)))
    : 2;

  try {
    const backendResponse = await postToBackend('/recommendations/community', {
      report,
      region_id:
        payload?.regionId != null
          ? String(payload.regionId)
          : admin.regionId != null
            ? String(admin.regionId)
            : null,
      top_k: topK,
    });

    const data = JSON.parse(backendResponse.body || '{}');
    if (backendResponse.status < 200 || backendResponse.status >= 300) {
      throw new Error(data?.detail || 'Gagal membuat rekomendasi dari backend AI');
    }

    return NextResponse.json(
      {
        success: true,
        results: Array.isArray(data.results) ? data.results : [],
        text: typeof data.text === 'string' ? data.text : '',
        draft: data.draft && typeof data.draft === 'object' ? data.draft : null,
      },
      PRIVATE,
    );
  } catch (error) {
    const debug = {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      cause: error?.cause,
    };
    console.error('[POST /api/admin/recommendations]', debug, error);
    return NextResponse.json(
      { error: JSON.stringify(debug) },
      { status: 502 },
      PRIVATE,
    );
  }
}
