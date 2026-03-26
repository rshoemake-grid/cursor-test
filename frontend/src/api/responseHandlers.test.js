/**
 * Tests for fetch Response helper extractData
 */ import { extractData } from './responseHandlers';
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
describe('responseHandlers', ()=>{
    describe('extractData', ()=>{
        it('should parse JSON body on success', async ()=>{
            const res = jsonResponse({
                id: '1',
                name: 'Test'
            });
            const result = await extractData(res);
            expect(result).toEqual({
                id: '1',
                name: 'Test'
            });
        });
        it('should handle array responses', async ()=>{
            const res = jsonResponse([
                1,
                2,
                3
            ]);
            const result = await extractData(res);
            expect(result).toEqual([
                1,
                2,
                3
            ]);
        });
        it('should return undefined for 204', async ()=>{
            const res = new Response(null, {
                status: 204
            });
            const result = await extractData(res);
            expect(result).toBeUndefined();
        });
        it('should return undefined for empty JSON body', async ()=>{
            const res = new Response('', {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const result = await extractData(res);
            expect(result).toBeUndefined();
        });
        it('throws with response shape on error status', async ()=>{
            const res = jsonResponse({
                detail: 'Not found'
            }, 404);
            try {
                await extractData(res);
                expect.fail('expected throw');
            } catch (e) {
                expect(e.message).toBe('Not found');
                expect(e.response?.status).toBe(404);
            }
        });
    });
});
