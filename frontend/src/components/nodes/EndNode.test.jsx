import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { render, screen } from '@testing-library/react';
import EndNode from './EndNode';
import { ReactFlowProvider } from '@xyflow/react';
const renderWithProvider = (component)=>{
    return render(/*#__PURE__*/ _jsx(ReactFlowProvider, {
        children: component
    }));
};
describe('EndNode', ()=>{
    it('should render end node', ()=>{
        renderWithProvider(/*#__PURE__*/ _jsx(EndNode, {
            selected: false,
            data: {},
            id: "end-1"
        }));
        expect(screen.getByText('End')).toBeInTheDocument();
    });
    it('should show selected state', ()=>{
        const { container } = renderWithProvider(/*#__PURE__*/ _jsx(EndNode, {
            selected: true,
            data: {},
            id: "end-1"
        }));
        const node = container.querySelector('.border-gray-800');
        expect(node).toBeInTheDocument();
    });
    it('should show unselected state', ()=>{
        const { container } = renderWithProvider(/*#__PURE__*/ _jsx(EndNode, {
            selected: false,
            data: {},
            id: "end-1"
        }));
        const node = container.querySelector('.border-gray-800');
        expect(node).not.toBeInTheDocument();
    });
});
