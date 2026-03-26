import { jsx as _jsx } from "react/jsx-runtime";
// Jest globals - no import needed
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConditionNodeEditor from './ConditionNodeEditor';
const mockNode = {
    id: 'test-condition',
    type: 'condition',
    data: {
        name: 'Test Condition',
        condition_config: {
            condition_type: 'equals',
            field: 'status',
            value: 'active'
        }
    },
    position: {
        x: 0,
        y: 0
    }
};
describe('ConditionNodeEditor', ()=>{
    const mockOnConfigUpdate = jest.fn();
    beforeEach(()=>{
        jest.clearAllMocks();
    });
    it('should render condition configuration fields', ()=>{
        render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: mockNode,
            onConfigUpdate: mockOnConfigUpdate
        }));
        expect(screen.getByLabelText(/condition type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^field$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^value$/i)).toBeInTheDocument();
    });
    it('should display current condition type', ()=>{
        render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: mockNode,
            onConfigUpdate: mockOnConfigUpdate
        }));
        const conditionTypeSelect = screen.getByLabelText(/condition type/i);
        expect(conditionTypeSelect.value).toBe('equals');
    });
    it('should call onConfigUpdate when condition type changes', async ()=>{
        const user = userEvent.setup();
        render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: mockNode,
            onConfigUpdate: mockOnConfigUpdate
        }));
        const conditionTypeSelect = screen.getByLabelText(/condition type/i);
        await user.selectOptions(conditionTypeSelect, 'not_equals');
        expect(mockOnConfigUpdate).toHaveBeenCalledWith('condition_config', 'condition_type', 'not_equals');
    });
    it('should call onConfigUpdate when field changes', async ()=>{
        const user = userEvent.setup();
        render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: mockNode,
            onConfigUpdate: mockOnConfigUpdate
        }));
        const fieldInput = screen.getByLabelText(/^field$/i);
        await user.clear(fieldInput);
        await user.type(fieldInput, 'newField');
        expect(mockOnConfigUpdate).toHaveBeenCalledWith('condition_config', 'field', 'newField');
    });
    it('should call onConfigUpdate when value changes', async ()=>{
        const user = userEvent.setup();
        render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: mockNode,
            onConfigUpdate: mockOnConfigUpdate
        }));
        const valueInput = screen.getByLabelText(/value/i);
        await user.clear(valueInput);
        await user.type(valueInput, 'newValue');
        expect(mockOnConfigUpdate).toHaveBeenCalledWith('condition_config', 'value', 'newValue');
    });
    it('should hide value field for empty/not_empty conditions', ()=>{
        const nodeWithoutValue = {
            ...mockNode,
            data: {
                ...mockNode.data,
                condition_config: {
                    condition_type: 'empty',
                    field: 'status'
                }
            }
        };
        render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: nodeWithoutValue,
            onConfigUpdate: mockOnConfigUpdate
        }));
        expect(screen.queryByLabelText(/value/i)).not.toBeInTheDocument();
    });
    it('should show value field for other condition types', ()=>{
        render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: mockNode,
            onConfigUpdate: mockOnConfigUpdate
        }));
        expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
    });
    it('should hide value field for not_empty condition', ()=>{
        const nodeNotEmpty = {
            ...mockNode,
            data: {
                ...mockNode.data,
                condition_config: {
                    condition_type: 'not_empty',
                    field: 'status'
                }
            }
        };
        render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: nodeNotEmpty,
            onConfigUpdate: mockOnConfigUpdate
        }));
        expect(screen.queryByLabelText(/value/i)).not.toBeInTheDocument();
    });
    it('should show value field for all condition types except empty/not_empty', async ()=>{
        const conditionTypes = [
            'equals',
            'not_equals',
            'contains',
            'not_contains',
            'greater_than',
            'not_greater_than',
            'less_than',
            'not_less_than',
            'custom'
        ];
        for (const conditionType of conditionTypes){
            const node = {
                ...mockNode,
                data: {
                    ...mockNode.data,
                    condition_config: {
                        condition_type: conditionType,
                        field: 'status',
                        value: 'test'
                    }
                }
            };
            const { unmount } = render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
                node: node,
                onConfigUpdate: mockOnConfigUpdate
            }));
            expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
            unmount();
        }
    });
    it('should use default condition_type when not provided', ()=>{
        const nodeWithoutType = {
            ...mockNode,
            data: {
                ...mockNode.data,
                condition_config: {
                    field: 'status',
                    value: 'active'
                }
            }
        };
        render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: nodeWithoutType,
            onConfigUpdate: mockOnConfigUpdate
        }));
        const conditionTypeSelect = screen.getByLabelText(/condition type/i);
        expect(conditionTypeSelect.value).toBe('equals');
    });
    it('should handle undefined condition_config', ()=>{
        const nodeWithoutConfig = {
            ...mockNode,
            data: {}
        };
        render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: nodeWithoutConfig,
            onConfigUpdate: mockOnConfigUpdate
        }));
        const conditionTypeSelect = screen.getByLabelText(/condition type/i);
        expect(conditionTypeSelect.value).toBe('equals');
        const fieldInput = screen.getByLabelText(/^field$/i);
        expect(fieldInput.value).toBe('');
    });
    it('should handle null condition_config values', ()=>{
        const nodeWithNulls = {
            ...mockNode,
            data: {
                ...mockNode.data,
                condition_config: {
                    condition_type: null,
                    field: null,
                    value: null
                }
            }
        };
        render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: nodeWithNulls,
            onConfigUpdate: mockOnConfigUpdate
        }));
        const conditionTypeSelect = screen.getByLabelText(/condition type/i);
        expect(conditionTypeSelect.value).toBe('equals');
        const fieldInput = screen.getByLabelText(/^field$/i);
        expect(fieldInput.value).toBe('');
    });
    it('should sync local state when node data changes', ()=>{
        const { rerender } = render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: mockNode,
            onConfigUpdate: mockOnConfigUpdate
        }));
        const fieldInput = screen.getByLabelText(/^field$/i);
        expect(fieldInput.value).toBe('status');
        const updatedNode = {
            ...mockNode,
            data: {
                ...mockNode.data,
                condition_config: {
                    ...mockNode.data.condition_config,
                    field: 'updated-field'
                }
            }
        };
        rerender(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: updatedNode,
            onConfigUpdate: mockOnConfigUpdate
        }));
        expect(fieldInput.value).toBe('updated-field');
    });
    it('should not update local state when field input is focused', ()=>{
        const { rerender } = render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: mockNode,
            onConfigUpdate: mockOnConfigUpdate
        }));
        const fieldInput = screen.getByLabelText(/^field$/i);
        fieldInput.focus();
        const updatedNode = {
            ...mockNode,
            data: {
                ...mockNode.data,
                condition_config: {
                    ...mockNode.data.condition_config,
                    field: 'updated-field'
                }
            }
        };
        rerender(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: updatedNode,
            onConfigUpdate: mockOnConfigUpdate
        }));
        // Value should not change because input is focused
        expect(fieldInput.value).toBe('status');
    });
    it('should not update local state when value input is focused', ()=>{
        const { rerender } = render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: mockNode,
            onConfigUpdate: mockOnConfigUpdate
        }));
        const valueInput = screen.getByLabelText(/value/i);
        valueInput.focus();
        const updatedNode = {
            ...mockNode,
            data: {
                ...mockNode.data,
                condition_config: {
                    ...mockNode.data.condition_config,
                    value: 'updated-value'
                }
            }
        };
        rerender(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: updatedNode,
            onConfigUpdate: mockOnConfigUpdate
        }));
        // Value should not change because input is focused
        expect(valueInput.value).toBe('active');
    });
    it('should handle all condition type options', async ()=>{
        const user = userEvent.setup();
        render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: mockNode,
            onConfigUpdate: mockOnConfigUpdate
        }));
        const conditionTypeSelect = screen.getByLabelText(/condition type/i);
        const allOptions = [
            'equals',
            'not_equals',
            'contains',
            'not_contains',
            'greater_than',
            'not_greater_than',
            'less_than',
            'not_less_than',
            'empty',
            'not_empty',
            'custom'
        ];
        for (const option of allOptions){
            await user.selectOptions(conditionTypeSelect, option);
            expect(mockOnConfigUpdate).toHaveBeenCalledWith('condition_config', 'condition_type', option);
        }
    });
    it('should toggle value field visibility when switching between empty and other types', async ()=>{
        const user = userEvent.setup();
        const { rerender } = render(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: mockNode,
            onConfigUpdate: mockOnConfigUpdate
        }));
        // Should show value field for 'equals'
        expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
        // Switch to 'empty'
        const conditionTypeSelect = screen.getByLabelText(/condition type/i);
        await user.selectOptions(conditionTypeSelect, 'empty');
        const nodeEmpty = {
            ...mockNode,
            data: {
                ...mockNode.data,
                condition_config: {
                    condition_type: 'empty',
                    field: 'status'
                }
            }
        };
        rerender(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: nodeEmpty,
            onConfigUpdate: mockOnConfigUpdate
        }));
        // Should hide value field for 'empty'
        expect(screen.queryByLabelText(/value/i)).not.toBeInTheDocument();
        // Switch back to 'equals'
        await user.selectOptions(conditionTypeSelect, 'equals');
        rerender(/*#__PURE__*/ _jsx(ConditionNodeEditor, {
            node: mockNode,
            onConfigUpdate: mockOnConfigUpdate
        }));
        // Should show value field again
        expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
    });
});
