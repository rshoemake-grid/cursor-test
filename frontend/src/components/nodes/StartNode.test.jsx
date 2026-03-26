import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { render, screen } from '@testing-library/react';
import StartNode from './StartNode';
import { ReactFlowProvider } from '@xyflow/react';
const renderWithProvider = (component)=>{
    return render(/*#__PURE__*/ _jsx(ReactFlowProvider, {
        children: component
    }));
};
describe('StartNode', ()=>{
    it('should render start node', ()=>{
        renderWithProvider(/*#__PURE__*/ _jsx(StartNode, {
            selected: false,
            data: {},
            id: "start-1"
        }));
        expect(screen.getByText('Start')).toBeInTheDocument();
    });
    it('should show selected state', ()=>{
        const { container } = renderWithProvider(/*#__PURE__*/ _jsx(StartNode, {
            selected: true,
            data: {},
            id: "start-1"
        }));
        const node = container.querySelector('.border-primary-700');
        expect(node).toBeInTheDocument();
    });
    it('should show unselected state', ()=>{
        const { container } = renderWithProvider(/*#__PURE__*/ _jsx(StartNode, {
            selected: false,
            data: {},
            id: "start-1"
        }));
        const node = container.querySelector('.border-primary-700');
        expect(node).not.toBeInTheDocument();
    });
});
