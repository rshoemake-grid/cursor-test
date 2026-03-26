/**
 * Workflow State Hook
 * Manages local workflow state (id, name, description, variables)
 */ import { useState, useEffect, useRef } from 'react';
export function useWorkflowState({ workflowId: initialWorkflowId, tabName }) {
    const [localWorkflowId, setLocalWorkflowId] = useState(initialWorkflowId);
    const [localWorkflowName, setLocalWorkflowName] = useState('Untitled Workflow');
    const [localWorkflowDescription, setLocalWorkflowDescription] = useState('');
    const [variables, setVariables] = useState({});
    const tabNameRef = useRef(tabName);
    // Sync workflow name with tab name
    useEffect(()=>{
        if (tabName !== tabNameRef.current) {
            tabNameRef.current = tabName;
            setLocalWorkflowName(tabName);
        }
    }, [
        tabName
    ]);
    // Sync local workflow ID with prop
    useEffect(()=>{
        if (initialWorkflowId !== localWorkflowId) {
            setLocalWorkflowId(initialWorkflowId);
        }
    }, [
        initialWorkflowId
    ]);
    return {
        localWorkflowId,
        setLocalWorkflowId,
        localWorkflowName,
        setLocalWorkflowName,
        localWorkflowDescription,
        setLocalWorkflowDescription,
        variables,
        setVariables
    };
}
