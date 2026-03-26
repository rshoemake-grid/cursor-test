import { jsx as _jsx } from "react/jsx-runtime";
// Jest globals - no import needed
import { render, screen } from '@testing-library/react';
import ExecutionStatusBadge from './ExecutionStatusBadge';
import { isValidExecutionStatus } from '../utils/executionStatus';
describe('ExecutionStatusBadge', ()=>{
    it('should render completed status', ()=>{
        render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
            status: "completed"
        }));
        expect(screen.getByText('completed')).toBeInTheDocument();
    });
    it('should render failed status', ()=>{
        render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
            status: "failed"
        }));
        expect(screen.getByText('failed')).toBeInTheDocument();
    });
    it('should render running status', ()=>{
        render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
            status: "running"
        }));
        expect(screen.getByText('running')).toBeInTheDocument();
    });
    it('should render pending status', ()=>{
        render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
            status: "pending"
        }));
        expect(screen.getByText('pending')).toBeInTheDocument();
    });
    it('should render paused status', ()=>{
        render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
            status: "paused"
        }));
        expect(screen.getByText('paused')).toBeInTheDocument();
        // Verify the exact status string to kill mutants
        const badge = screen.getByText('paused');
        expect(badge.textContent).toBe('paused');
    });
    it('should apply correct classes for paused status', ()=>{
        const { container } = render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
            status: "paused"
        }));
        const badge = container.firstChild;
        expect(badge.className).toContain('bg-gray-900');
        expect(badge.className).toContain('text-gray-200');
    });
    it('should use dark variant by default', ()=>{
        const { container } = render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
            status: "completed"
        }));
        const badge = container.firstChild;
        expect(badge.className).toContain('bg-green-900');
    });
    it('should use light variant when specified', ()=>{
        const { container } = render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
            status: "completed",
            variant: "light"
        }));
        const badge = container.firstChild;
        expect(badge.className).toContain('bg-green-100');
    });
    it('should normalize invalid status to pending', ()=>{
        render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
            status: "invalid-status"
        }));
        expect(screen.getByText('pending')).toBeInTheDocument();
    });
    it('should apply custom className', ()=>{
        const { container } = render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
            status: "completed",
            className: "custom-class"
        }));
        const badge = container.firstChild;
        expect(badge.className).toContain('custom-class');
    });
    describe('edge cases', ()=>{
        it('should handle variant being undefined', ()=>{
            render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                status: "running"
            }));
            const badge = screen.getByText('running');
            expect(badge).toBeInTheDocument();
            // Should use default 'dark' variant
            expect(badge.className).toContain('bg-');
        });
        it('should handle variant being "light"', ()=>{
            render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                status: "running",
                variant: "light"
            }));
            const badge = screen.getByText('running');
            expect(badge).toBeInTheDocument();
            // Should use light variant colors
            expect(badge.className).toContain('bg-');
        });
        it('should handle variant being "dark"', ()=>{
            render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                status: "running",
                variant: "dark"
            }));
            const badge = screen.getByText('running');
            expect(badge).toBeInTheDocument();
            // Should use dark variant colors
            expect(badge.className).toContain('bg-');
        });
        it('should handle className being empty string', ()=>{
            render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                status: "running",
                className: ""
            }));
            const badge = screen.getByText('running');
            expect(badge).toBeInTheDocument();
        });
        it('should handle className being provided', ()=>{
            render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                status: "running",
                className: "custom-class"
            }));
            const badge = screen.getByText('running');
            expect(badge.className).toContain('custom-class');
        });
        it('should handle variant === "light" check', ()=>{
            // Test both branches of variant === 'light' ? getExecutionStatusColorLight : getExecutionStatusColor
            const { unmount: unmount1 } = render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                status: "running",
                variant: "light"
            }));
            const badge1 = screen.getByText('running');
            expect(badge1).toBeInTheDocument();
            unmount1();
            document.body.innerHTML = '';
            const { unmount: unmount2 } = render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                status: "running",
                variant: "dark"
            }));
            const badge2 = screen.getByText('running');
            expect(badge2).toBeInTheDocument();
            unmount2();
        });
        it('should handle isValidExecutionStatus check for all statuses', ()=>{
            const statuses = [
                'running',
                'completed',
                'failed',
                'pending',
                'paused',
                'INVALID'
            ];
            for (const status of statuses){
                const { unmount } = render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                    status: status
                }));
                const badge = screen.getByText(isValidExecutionStatus(status) ? status : 'pending');
                expect(badge).toBeInTheDocument();
                unmount();
                document.body.innerHTML = '';
            }
        });
        it('should handle all variant values', ()=>{
            const variants = [
                'dark',
                'light'
            ];
            for (const variant of variants){
                const { unmount } = render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                    status: "running",
                    variant: variant
                }));
                const badge = screen.getByText('running');
                expect(badge).toBeInTheDocument();
                unmount();
            }
        });
        it('should handle status being empty string', ()=>{
            render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                status: ""
            }));
            // Empty string is invalid, should normalize to 'pending'
            expect(screen.getByText('pending')).toBeInTheDocument();
        });
        it('should handle status being null', ()=>{
            render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                status: null
            }));
            // null is invalid, should normalize to 'pending'
            expect(screen.getByText('pending')).toBeInTheDocument();
        });
        it('should handle status being undefined', ()=>{
            render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                status: undefined
            }));
            // undefined is invalid, should normalize to 'pending'
            expect(screen.getByText('pending')).toBeInTheDocument();
        });
        it('should handle className concatenation with empty className', ()=>{
            const { container } = render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                status: "completed",
                className: ""
            }));
            const badge = container.firstChild;
            // Should still have base classes
            expect(badge.className).toContain('px-3');
            expect(badge.className).toContain('py-1');
        });
        it('should handle className concatenation with multiple classes', ()=>{
            const { container } = render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                status: "completed",
                className: "class1 class2 class3"
            }));
            const badge = container.firstChild;
            expect(badge.className).toContain('class1');
            expect(badge.className).toContain('class2');
            expect(badge.className).toContain('class3');
        });
        it('should handle all valid statuses with light variant', ()=>{
            const statuses = [
                'running',
                'completed',
                'failed',
                'pending',
                'paused'
            ];
            for (const status of statuses){
                const { unmount, container } = render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                    status: status,
                    variant: "light"
                }));
                const badge = container.firstChild;
                expect(badge.textContent).toBe(status);
                expect(badge.className).toContain('bg-');
                unmount();
                document.body.innerHTML = '';
            }
        });
        it('should handle all valid statuses with dark variant', ()=>{
            const statuses = [
                'running',
                'completed',
                'failed',
                'pending',
                'paused'
            ];
            for (const status of statuses){
                const { unmount, container } = render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                    status: status,
                    variant: "dark"
                }));
                const badge = container.firstChild;
                expect(badge.textContent).toBe(status);
                expect(badge.className).toContain('bg-');
                unmount();
                document.body.innerHTML = '';
            }
        });
        it('should handle className prop being undefined', ()=>{
            const { container } = render(/*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                status: "completed",
                className: undefined
            }));
            const badge = container.firstChild;
            // Should still render with base classes
            expect(badge.className).toContain('px-3');
        });
    });
});
