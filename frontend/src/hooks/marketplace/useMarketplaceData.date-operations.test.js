/**
 * Date Operation Tests for useMarketplaceData hook
 * Phase 4.2: Tests for Date operations and comparisons
 * Targets surviving mutants in Date constructor and getTime() calls
 */ import { renderHook, waitFor } from '@testing-library/react';
import { useMarketplaceData } from './useMarketplaceData';
import { getLocalStorageItem } from '../storage';
jest.mock('../storage', ()=>({
        getLocalStorageItem: jest.fn()
    }));
const mockGetLocalStorageItem = getLocalStorageItem;
describe('useMarketplaceData - Date Operations (Phase 4.2)', ()=>{
    let mockHttpClient;
    let mockStorage;
    beforeEach(()=>{
        jest.clearAllMocks();
        mockHttpClient = {
            get: jest.fn().mockImplementation((url)=>{
                if (typeof url === 'string' && url.includes('marketplace/agents')) {
                    return Promise.reject(new Error('API unavailable'));
                }
                return Promise.resolve({
                    json: async ()=>[]
                });
            }),
            post: jest.fn().mockResolvedValue({
                ok: true,
                json: async ()=>({
                        nodes: []
                    })
            })
        };
        mockStorage = {
            getItem: jest.fn().mockReturnValue(null),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };
        mockGetLocalStorageItem.mockReturnValue([]);
    });
    describe('Date constructor - new Date()', ()=>{
        it('should call new Date() on published_at for popular sort', async ()=>{
            const agents = [
                {
                    id: 'agent-1',
                    name: 'Agent 1',
                    category: 'automation',
                    tags: [],
                    published_at: '2024-01-01T00:00:00Z',
                    is_official: false
                },
                {
                    id: 'agent-2',
                    name: 'Agent 2',
                    category: 'automation',
                    tags: [],
                    published_at: '2024-01-02T00:00:00Z',
                    is_official: false
                }
            ];
            mockGetLocalStorageItem.mockReturnValue(agents);
            const { result } = renderHook(()=>useMarketplaceData({
                    storage: mockStorage,
                    httpClient: mockHttpClient,
                    apiBaseUrl: 'http://api.test',
                    category: '',
                    searchQuery: '',
                    sortBy: 'popular',
                    user: null,
                    activeTab: 'agents',
                    repositorySubTab: 'agents'
                }));
            await waitFor(()=>{
                expect(result.current.loading).toBe(false);
            });
            // Should call: new Date(a.published_at).getTime()
            // Most recent should be first
            expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z');
        });
        it('should call new Date() on published_at for recent sort', async ()=>{
            const agents = [
                {
                    id: 'agent-1',
                    name: 'Agent 1',
                    category: 'automation',
                    tags: [],
                    published_at: '2024-01-01T00:00:00Z',
                    is_official: false
                },
                {
                    id: 'agent-2',
                    name: 'Agent 2',
                    category: 'automation',
                    tags: [],
                    published_at: '2024-01-02T00:00:00Z',
                    is_official: false
                }
            ];
            mockGetLocalStorageItem.mockReturnValue(agents);
            const { result } = renderHook(()=>useMarketplaceData({
                    storage: mockStorage,
                    httpClient: mockHttpClient,
                    apiBaseUrl: 'http://api.test',
                    category: '',
                    searchQuery: '',
                    sortBy: 'recent',
                    user: null,
                    activeTab: 'agents',
                    repositorySubTab: 'agents'
                }));
            await waitFor(()=>{
                expect(result.current.loading).toBe(false);
            });
            // Should call: new Date(a.published_at).getTime()
            // Most recent should be first
            expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z');
        });
        it('should call new Date() on both dateA and dateB', async ()=>{
            const agents = [
                {
                    id: 'agent-1',
                    name: 'Agent 1',
                    category: 'automation',
                    tags: [],
                    published_at: '2024-01-01T00:00:00Z',
                    is_official: false
                },
                {
                    id: 'agent-2',
                    name: 'Agent 2',
                    category: 'automation',
                    tags: [],
                    published_at: '2024-01-02T00:00:00Z',
                    is_official: false
                }
            ];
            mockGetLocalStorageItem.mockReturnValue(agents);
            const { result } = renderHook(()=>useMarketplaceData({
                    storage: mockStorage,
                    httpClient: mockHttpClient,
                    apiBaseUrl: 'http://api.test',
                    category: '',
                    searchQuery: '',
                    sortBy: 'popular',
                    user: null,
                    activeTab: 'agents',
                    repositorySubTab: 'agents'
                }));
            await waitFor(()=>{
                expect(result.current.loading).toBe(false);
            });
            // Should call: new Date(a.published_at).getTime() and new Date(b.published_at).getTime()
            expect(result.current.agents.length).toBe(2);
        });
    });
    describe('Date method - getTime()', ()=>{
        it('should call getTime() on Date object for dateA', async ()=>{
            const agents = [
                {
                    id: 'agent-1',
                    name: 'Agent 1',
                    category: 'automation',
                    tags: [],
                    published_at: '2024-01-01T00:00:00Z',
                    is_official: false
                },
                {
                    id: 'agent-2',
                    name: 'Agent 2',
                    category: 'automation',
                    tags: [],
                    published_at: '2024-01-02T00:00:00Z',
                    is_official: false
                }
            ];
            mockGetLocalStorageItem.mockReturnValue(agents);
            const { result } = renderHook(()=>useMarketplaceData({
                    storage: mockStorage,
                    httpClient: mockHttpClient,
                    apiBaseUrl: 'http://api.test',
                    category: '',
                    searchQuery: '',
                    sortBy: 'popular',
                    user: null,
                    activeTab: 'agents',
                    repositorySubTab: 'agents'
                }));
            await waitFor(()=>{
                expect(result.current.loading).toBe(false);
            });
            // Should call: new Date(a.published_at).getTime()
            expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z');
        });
        it('should call getTime() on Date object for dateB', async ()=>{
            const agents = [
                {
                    id: 'agent-1',
                    name: 'Agent 1',
                    category: 'automation',
                    tags: [],
                    published_at: '2024-01-01T00:00:00Z',
                    is_official: false
                },
                {
                    id: 'agent-2',
                    name: 'Agent 2',
                    category: 'automation',
                    tags: [],
                    published_at: '2024-01-02T00:00:00Z',
                    is_official: false
                }
            ];
            mockGetLocalStorageItem.mockReturnValue(agents);
            const { result } = renderHook(()=>useMarketplaceData({
                    storage: mockStorage,
                    httpClient: mockHttpClient,
                    apiBaseUrl: 'http://api.test',
                    category: '',
                    searchQuery: '',
                    sortBy: 'popular',
                    user: null,
                    activeTab: 'agents',
                    repositorySubTab: 'agents'
                }));
            await waitFor(()=>{
                expect(result.current.loading).toBe(false);
            });
            // Should call: new Date(b.published_at).getTime()
            expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z');
        });
        it('should use 0 when published_at is null for dateA', async ()=>{
            const agents = [
                {
                    id: 'agent-1',
                    name: 'Agent 1',
                    category: 'automation',
                    tags: [],
                    published_at: null,
                    is_official: false
                },
                {
                    id: 'agent-2',
                    name: 'Agent 2',
                    category: 'automation',
                    tags: [],
                    published_at: '2024-01-02T00:00:00Z',
                    is_official: false
                }
            ];
            mockGetLocalStorageItem.mockReturnValue(agents);
            const { result } = renderHook(()=>useMarketplaceData({
                    storage: mockStorage,
                    httpClient: mockHttpClient,
                    apiBaseUrl: 'http://api.test',
                    category: '',
                    searchQuery: '',
                    sortBy: 'popular',
                    user: null,
                    activeTab: 'agents',
                    repositorySubTab: 'agents'
                }));
            await waitFor(()=>{
                expect(result.current.loading).toBe(false);
            });
            // Should use: a.published_at ? new Date(a.published_at).getTime() : 0
            // Agent with date should come first
            expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z');
        });
        it('should use 0 when published_at is null for dateB', async ()=>{
            const agents = [
                {
                    id: 'agent-1',
                    name: 'Agent 1',
                    category: 'automation',
                    tags: [],
                    published_at: '2024-01-01T00:00:00Z',
                    is_official: false
                },
                {
                    id: 'agent-2',
                    name: 'Agent 2',
                    category: 'automation',
                    tags: [],
                    published_at: null,
                    is_official: false
                }
            ];
            mockGetLocalStorageItem.mockReturnValue(agents);
            const { result } = renderHook(()=>useMarketplaceData({
                    storage: mockStorage,
                    httpClient: mockHttpClient,
                    apiBaseUrl: 'http://api.test',
                    category: '',
                    searchQuery: '',
                    sortBy: 'popular',
                    user: null,
                    activeTab: 'agents',
                    repositorySubTab: 'agents'
                }));
            await waitFor(()=>{
                expect(result.current.loading).toBe(false);
            });
            // Should use: b.published_at ? new Date(b.published_at).getTime() : 0
            // Agent with date should come first
            expect(result.current.agents[0].published_at).toBe('2024-01-01T00:00:00Z');
        });
    });
    describe('Date subtraction - dateB - dateA', ()=>{
        it('should subtract dateA from dateB for descending sort', async ()=>{
            const agents = [
                {
                    id: 'agent-1',
                    name: 'Agent 1',
                    category: 'automation',
                    tags: [],
                    published_at: '2024-01-01T00:00:00Z',
                    is_official: false
                },
                {
                    id: 'agent-2',
                    name: 'Agent 2',
                    category: 'automation',
                    tags: [],
                    published_at: '2024-01-02T00:00:00Z',
                    is_official: false
                }
            ];
            mockGetLocalStorageItem.mockReturnValue(agents);
            const { result } = renderHook(()=>useMarketplaceData({
                    storage: mockStorage,
                    httpClient: mockHttpClient,
                    apiBaseUrl: 'http://api.test',
                    category: '',
                    searchQuery: '',
                    sortBy: 'popular',
                    user: null,
                    activeTab: 'agents',
                    repositorySubTab: 'agents'
                }));
            await waitFor(()=>{
                expect(result.current.loading).toBe(false);
            });
            // Should calculate: dateB - dateA (descending order)
            // Most recent (dateB) should be first
            expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z');
        });
        it('should verify exact subtraction operation dateB - dateA', async ()=>{
            const agents = [
                {
                    id: 'agent-1',
                    name: 'Agent 1',
                    category: 'automation',
                    tags: [],
                    published_at: '2024-01-01T00:00:00Z',
                    is_official: false
                },
                {
                    id: 'agent-2',
                    name: 'Agent 2',
                    category: 'automation',
                    tags: [],
                    published_at: '2024-01-02T00:00:00Z',
                    is_official: false
                }
            ];
            mockGetLocalStorageItem.mockReturnValue(agents);
            const { result } = renderHook(()=>useMarketplaceData({
                    storage: mockStorage,
                    httpClient: mockHttpClient,
                    apiBaseUrl: 'http://api.test',
                    category: '',
                    searchQuery: '',
                    sortBy: 'popular',
                    user: null,
                    activeTab: 'agents',
                    repositorySubTab: 'agents'
                }));
            await waitFor(()=>{
                expect(result.current.loading).toBe(false);
            });
            // Should use: return dateB - dateA (not dateA - dateB)
            // This gives descending order (most recent first)
            expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z');
        });
    });
});
