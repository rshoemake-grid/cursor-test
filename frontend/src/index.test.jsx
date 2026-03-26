/**
 * Tests for src/index.js entry — ensures bootstrap runs (mocked DOM).
 */ jest.mock('./index.css', ()=>({}));
jest.mock('@xyflow/react/dist/style.css', ()=>({}));
jest.mock('./App', ()=>{
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require('react');
    return {
        __esModule: true,
        default: ()=>React.createElement('div', null, 'Mocked App')
    };
});
const mockRender = jest.fn();
const mockCreateRoot = jest.fn(()=>({
        render: mockRender
    }));
jest.mock('react-dom/client', ()=>({
        __esModule: true,
        default: {
            createRoot: mockCreateRoot
        },
        createRoot: mockCreateRoot
    }));
jest.mock('./store', ()=>({
        store: {
            dispatch: jest.fn(),
            getState: jest.fn(()=>({})),
            subscribe: jest.fn(),
            replaceReducer: jest.fn()
        }
    }));
const mockRootElement = {
    id: 'root'
};
describe('index.js', ()=>{
    beforeEach(()=>{
        jest.resetModules();
        jest.clearAllMocks();
        mockRender.mockClear();
        mockCreateRoot.mockClear();
        document.getElementById = jest.fn(()=>mockRootElement);
    });
    it('bootstraps the app root', ()=>{
        require('./index');
        expect(document.getElementById).toHaveBeenCalledWith('root');
        expect(mockCreateRoot).toHaveBeenCalledWith(mockRootElement);
    });
});
