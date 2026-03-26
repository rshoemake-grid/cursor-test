/**
 * Marketplace Integration Hook
 * Handles adding agents from marketplace to workflow canvas
 * Refactored to use extracted utilities for better SOLID compliance and mutation resistance
 */ import { useEffect, useRef, useCallback } from 'react';
import { logger as defaultLogger } from '../../utils/logger';
import { calculateMultipleNodePositions } from '../utils/nodePositioning';
// Removed logicalOrToEmptyArray import - replaced with explicit checks
import { convertAgentsToNodes } from '../utils/agentNodeConversion';
import { convertToolsToNodes } from '../utils/toolNodeConversion';
import { isValidPendingAgents, isPendingAgentsValid, isPendingAgentsForDifferentTab, isPendingAgentsTooOld } from '../utils/pendingAgentsValidation';
import { PENDING_AGENTS_STORAGE_KEY, PENDING_TOOLS_STORAGE_KEY, PENDING_AGENTS } from '../utils/marketplaceConstants';
import { MARKETPLACE_EVENTS } from '../utils/marketplaceEventConstants';
import { updateDraftStorage, resetFlagAfterDelay } from '../utils/draftUpdateService';
import { createPendingAgentsPolling } from '../utils/pendingAgentsPolling';
import { clearPendingAgents } from '../utils/pendingAgentsStorage';
export function useMarketplaceIntegration({ tabId, storage, setNodes, notifyModified, localWorkflowId, localWorkflowName, localWorkflowDescription, tabIsUnsaved, tabDraftsRef, saveDraftsToStorage, logger: injectedLogger = defaultLogger }) {
    const isAddingAgentsRef = useRef(false);
    const addToolsToCanvas = useCallback((toolsToAdd)=>{
        injectedLogger.debug('[useMarketplaceIntegration] addToolsToCanvas called with', toolsToAdd.length, 'tools');
        isAddingAgentsRef.current = true;
        const currentTabId = tabId;
        const currentWorkflowId = localWorkflowId;
        const currentWorkflowName = localWorkflowName;
        const currentWorkflowDescription = localWorkflowDescription;
        const currentTabIsUnsaved = tabIsUnsaved;
        setNodes((currentNodes)=>{
            const positions = calculateMultipleNodePositions(currentNodes, toolsToAdd.length);
            const xyPositions = positions.map((p)=>({
                    x: p.x,
                    y: p.y
                }));
            const newNodes = convertToolsToNodes(toolsToAdd, xyPositions);
            const updatedNodes = [
                ...currentNodes,
                ...newNodes
            ];
            updateDraftStorage(tabDraftsRef, currentTabId, updatedNodes, currentWorkflowId, currentWorkflowName, currentWorkflowDescription, currentTabIsUnsaved, saveDraftsToStorage, injectedLogger);
            resetFlagAfterDelay(isAddingAgentsRef, injectedLogger);
            return updatedNodes;
        });
        notifyModified();
    }, [
        tabId,
        localWorkflowId,
        localWorkflowName,
        localWorkflowDescription,
        tabIsUnsaved,
        setNodes,
        notifyModified,
        tabDraftsRef,
        saveDraftsToStorage,
        injectedLogger
    ]);
    const addAgentsToCanvas = useCallback((agentsToAdd)=>{
        injectedLogger.debug('[useMarketplaceIntegration] addAgentsToCanvas called with', agentsToAdd.length, 'agents');
        injectedLogger.debug('[useMarketplaceIntegration] Current tabId:', tabId);
        isAddingAgentsRef.current = true;
        // Get current state values
        const currentTabId = tabId;
        const currentWorkflowId = localWorkflowId;
        const currentWorkflowName = localWorkflowName;
        const currentWorkflowDescription = localWorkflowDescription;
        const currentTabIsUnsaved = tabIsUnsaved;
        // Add each agent as a node
        // Use functional update to get current nodes for positioning
        setNodes((currentNodes)=>{
            injectedLogger.debug('[useMarketplaceIntegration] Current nodes before adding:', currentNodes.length);
            // Calculate positions for all new nodes
            const positions = calculateMultipleNodePositions(currentNodes, agentsToAdd.length);
            // Convert Position[] from nodePositioning to XYPosition[] from @xyflow/react
            // Both have same structure (x, y) but TypeScript sees them as different types
            const xyPositions = positions.map((p)=>({
                    x: p.x,
                    y: p.y
                }));
            // Use extracted conversion utility - mutation-resistant
            const newNodes = convertAgentsToNodes(agentsToAdd, xyPositions);
            const updatedNodes = [
                ...currentNodes,
                ...newNodes
            ];
            injectedLogger.debug('[useMarketplaceIntegration] Total nodes after adding:', updatedNodes.length);
            // Use extracted draft update service - mutation-resistant and DRY
            updateDraftStorage(tabDraftsRef, currentTabId, updatedNodes, currentWorkflowId, currentWorkflowName, currentWorkflowDescription, currentTabIsUnsaved, saveDraftsToStorage, injectedLogger);
            // Reset flag after a delay to allow state update
            resetFlagAfterDelay(isAddingAgentsRef, injectedLogger);
            return updatedNodes;
        });
        notifyModified();
    }, [
        tabId,
        localWorkflowId,
        localWorkflowName,
        localWorkflowDescription,
        tabIsUnsaved,
        setNodes,
        notifyModified,
        tabDraftsRef,
        saveDraftsToStorage,
        injectedLogger
    ]);
    useEffect(()=>{
        const handleAddAgentsToWorkflow = (event)=>{
            const { agents: agentsToAdd, tabId: targetTabId } = event.detail;
            injectedLogger.debug(`[useMarketplaceIntegration] Received ${MARKETPLACE_EVENTS.ADD_AGENTS_TO_WORKFLOW} event:`, {
                targetTabId,
                currentTabId: tabId,
                agentCount: agentsToAdd.length
            });
            // Only process if this is the active tab
            // Explicit boolean check to prevent mutation survivors
            const isDifferentTab = targetTabId !== tabId;
            if (isDifferentTab === true) {
                injectedLogger.debug('[useMarketplaceIntegration] Event for different tab, ignoring');
                return;
            }
            injectedLogger.debug('[useMarketplaceIntegration] Adding agents via event');
            addAgentsToCanvas(agentsToAdd);
        };
        const handleAddToolsToWorkflow = (event)=>{
            const { tools: toolsToAdd, tabId: targetTabId } = event.detail;
            if (targetTabId !== tabId) return;
            addToolsToCanvas(toolsToAdd);
        };
        const checkPendingTools = ()=>{
            if (!storage) return;
            try {
                const pendingData = storage.getItem(PENDING_TOOLS_STORAGE_KEY);
                if (pendingData) {
                    const parsed = JSON.parse(pendingData);
                    if (parsed?.tabId === tabId && Array.isArray(parsed?.tools) && parsed.tools.length > 0) {
                        const age = Date.now() - (parsed.timestamp || 0);
                        if (age < PENDING_AGENTS.MAX_AGE) {
                            addToolsToCanvas(parsed.tools);
                            storage.removeItem(PENDING_TOOLS_STORAGE_KEY);
                        } else {
                            storage.removeItem(PENDING_TOOLS_STORAGE_KEY);
                        }
                    }
                }
            } catch (e) {
                injectedLogger.error('Failed to process pending tools:', e);
                storage.removeItem(PENDING_TOOLS_STORAGE_KEY);
            }
        };
        // Check storage for pending agents (more reliable than events)
        const checkPendingAgents = ()=>{
            // Explicit null/undefined check to prevent mutation survivors
            const hasStorage = storage !== null && storage !== undefined;
            if (hasStorage === false) return;
            try {
                const pendingData = storage.getItem(PENDING_AGENTS_STORAGE_KEY);
                // Explicit null/undefined/empty check to prevent mutation survivors
                const hasPendingData = pendingData !== null && pendingData !== undefined && pendingData !== '';
                if (hasPendingData === true) {
                    const parsed = JSON.parse(pendingData);
                    // Use extracted validation utility - mutation-resistant
                    // Explicit boolean check to prevent mutation survivors
                    const isValid = isValidPendingAgents(parsed) === true;
                    if (isValid === false) {
                        injectedLogger.debug('[useMarketplaceIntegration] Invalid pending agents data, clearing');
                        clearPendingAgents(storage);
                        return;
                    }
                    const pending = parsed;
                    injectedLogger.debug('[useMarketplaceIntegration] Found pending agents:', {
                        pendingTabId: pending.tabId,
                        currentTabId: tabId,
                        age: Date.now() - pending.timestamp
                    });
                    // Use extracted validation utilities - mutation-resistant
                    // Explicit boolean checks to prevent mutation survivors
                    const isPendingValid = isPendingAgentsValid(pending, tabId, PENDING_AGENTS.MAX_AGE) === true;
                    if (isPendingValid === true) {
                        injectedLogger.debug('[useMarketplaceIntegration] Adding agents to canvas:', pending.agents.length);
                        addAgentsToCanvas(pending.agents);
                        // Clear after processing - use extracted utility (DRY)
                        clearPendingAgents(storage);
                    } else {
                        // Explicit boolean checks to prevent mutation survivors
                        const isDifferentTab = isPendingAgentsForDifferentTab(pending, tabId) === true;
                        const isTooOld = isPendingAgentsTooOld(pending, PENDING_AGENTS.MAX_AGE) === true;
                        if (isDifferentTab === true) {
                            // Clear if it's for a different tab - use extracted utility (DRY)
                            injectedLogger.debug('[useMarketplaceIntegration] Pending agents for different tab, clearing');
                            clearPendingAgents(storage);
                        } else if (isTooOld === true) {
                            // Clear if too old - use extracted utility (DRY)
                            injectedLogger.debug('[useMarketplaceIntegration] Pending agents too old, clearing');
                            clearPendingAgents(storage);
                        }
                    }
                }
            } catch (e) {
                injectedLogger.error('Failed to process pending agents:', e);
                // Use extracted utility (DRY)
                // Explicit null check to prevent mutation survivors
                const hasStorage = storage !== null && storage !== undefined;
                if (hasStorage === true) {
                    clearPendingAgents(storage);
                }
            }
        };
        // Check immediately when tab becomes active
        checkPendingAgents();
        checkPendingTools();
        // Also listen for events
        const isBrowser = typeof window !== 'undefined';
        if (isBrowser === true) {
            window.addEventListener(MARKETPLACE_EVENTS.ADD_AGENTS_TO_WORKFLOW, handleAddAgentsToWorkflow);
            window.addEventListener(MARKETPLACE_EVENTS.ADD_TOOLS_TO_WORKFLOW, handleAddToolsToWorkflow);
        }
        const { cleanup: cleanupPolling } = createPendingAgentsPolling(()=>{
            checkPendingAgents();
            checkPendingTools();
        }, injectedLogger);
        return ()=>{
            if (isBrowser === true) {
                window.removeEventListener(MARKETPLACE_EVENTS.ADD_AGENTS_TO_WORKFLOW, handleAddAgentsToWorkflow);
                window.removeEventListener(MARKETPLACE_EVENTS.ADD_TOOLS_TO_WORKFLOW, handleAddToolsToWorkflow);
            }
            cleanupPolling();
        };
    }, [
        tabId,
        storage,
        addAgentsToCanvas,
        addToolsToCanvas,
        injectedLogger
    ]);
    return {
        isAddingAgentsRef,
        addAgentsToCanvas
    };
}
