/**
 * Response helpers for fetch-based API client
 */ export async function extractData(response) {
    if (!response.ok) {
        let data = {};
        try {
            data = await response.clone().json();
        } catch  {
            try {
                const text = await response.text();
                data = {
                    detail: text || `HTTP ${response.status}`
                };
            } catch  {
                data = {
                    detail: `HTTP ${response.status}`
                };
            }
        }
        const detail = typeof data.detail === 'string' ? data.detail : typeof data.message === 'string' ? data.message : `HTTP ${response.status}`;
        const err = new Error(detail);
        err.response = {
            status: response.status,
            data
        };
        throw err;
    }
    if (response.status === 204) {
        return undefined;
    }
    const text = await response.text();
    if (!text.trim()) {
        return undefined;
    }
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        try {
            return JSON.parse(text);
        } catch  {
            return text;
        }
    }
    return text;
}
