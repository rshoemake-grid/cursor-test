# Plan to Achieve 80% Statement Coverage

**Current Coverage:** 20.42%  
**Target Coverage:** 80%  
**Gap:** ~59.58% (~7,600 statements to cover)

## Strategy

Focus on files that provide the highest coverage impact:
1. **Large files with 0% coverage** (biggest impact)
2. **Smaller utility/component files** (easier wins)
3. **Critical business logic** (high value)

## Phase 1: High-Impact Large Files (Target: +30% coverage)

### Priority 1: Core Components (Estimated +15% coverage)
1. ✅ `App.tsx` (237 lines) - Main app component
2. ✅ `WorkflowBuilder.tsx` (1,487 lines) - Core workflow builder
3. ✅ `PropertyPanel.tsx` (1,630 lines) - Property configuration panel
4. ✅ `WorkflowTabs.tsx` (956 lines) - Tab management
5. ✅ `WorkflowList.tsx` (506 lines) - Workflow listing

### Priority 2: Execution Components (Estimated +8% coverage)
6. ✅ `ExecutionConsole.tsx` (300 lines) - Execution monitoring
7. ✅ `ExecutionViewer.tsx` (273 lines) - Execution display
8. ✅ `ExecutionInputDialog.tsx` (158 lines) - Input dialog

### Priority 3: Supporting Components (Estimated +7% coverage)
9. ✅ `WorkflowChat.tsx` (217 lines) - Chat interface
10. ✅ `NodePanel.tsx` (236 lines) - Node panel
11. ✅ `MarketplaceDialog.tsx` (398 lines) - Marketplace dialog
12. ✅ `NodeContextMenu.tsx` (151 lines) - Context menu

## Phase 2: Pages (Estimated +10% coverage)

13. ✅ `MarketplacePage.tsx` (1,316 lines) - Marketplace page
14. ✅ `SettingsPage.tsx` (774 lines) - Settings page
15. ✅ `AuthPage.tsx` (198 lines) - Authentication page
16. ✅ `ForgotPasswordPage.tsx` (143 lines) - Password reset
17. ✅ `ResetPasswordPage.tsx` (188 lines) - Password reset confirmation

## Phase 3: Node Components (Estimated +5% coverage)

18. ✅ All node components (13 files, ~613 lines total)
   - StartNode, EndNode, AgentNode, ConditionNode, LoopNode, etc.

## Phase 4: Remaining Files (Estimated +5% coverage)

19. ✅ `main.tsx` (10 lines) - Entry point
20. ✅ Any remaining untested utilities

## Execution Order

1. Start with smaller, easier files (App.tsx, main.tsx, smaller components)
2. Move to medium complexity (ExecutionConsole, WorkflowChat)
3. Tackle large complex components (WorkflowBuilder, PropertyPanel)
4. Finish with pages (can be tested via integration/E2E if needed)

## Testing Approach

- **Components**: Use React Testing Library for rendering and interaction tests
- **Pages**: Focus on critical user flows and form submissions
- **Node Components**: Test rendering and basic interactions
- **Complex Components**: Break into smaller testable units, mock dependencies

## Success Metrics

- **Target**: 80% statement coverage
- **Minimum**: 75% (acceptable threshold)
- **Stretch**: 85% (excellent coverage)

---

**Estimated Total Tests Needed**: ~200-300 additional tests  
**Estimated Time**: 4-6 hours of focused testing
