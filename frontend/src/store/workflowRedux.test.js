import { configureStore } from '@reduxjs/toolkit';
import workflowReducer from './reducers/workflowReducer';
import { workflowActions } from './actions/workflowActions';
import { selectWorkflowToDefinition } from './selectors/workflowSelectors';
function createTestStore() {
    return configureStore({
        reducer: {
            workflow: workflowReducer
        },
        middleware: (getDefaultMiddleware)=>getDefaultMiddleware({
                thunk: false,
                serializableCheck: false
            })
    });
}
describe('workflow Redux slice', ()=>{
    let store;
    beforeEach(()=>{
        store = createTestStore();
    });
    describe('Initial state', ()=>{
        it('should have initial state', ()=>{
            const state = store.getState().workflow;
            expect(state.workflowId).toBeNull();
            expect(state.workflowName).toBe('Untitled Workflow');
            expect(state.workflowDescription).toBe('');
            expect(state.nodes).toEqual([]);
            expect(state.edges).toEqual([]);
            expect(state.variables).toEqual({});
        });
    });
    describe('Setters', ()=>{
        it('should set workflowId', ()=>{
            store.dispatch(workflowActions.setWorkflowId('workflow-1'));
            expect(store.getState().workflow.workflowId).toBe('workflow-1');
        });
        it('should set workflowName', ()=>{
            store.dispatch(workflowActions.setWorkflowName('My Workflow'));
            expect(store.getState().workflow.workflowName).toBe('My Workflow');
        });
        it('should set workflowDescription', ()=>{
            store.dispatch(workflowActions.setWorkflowDescription('Description'));
            expect(store.getState().workflow.workflowDescription).toBe('Description');
        });
        it('should set nodes', ()=>{
            const nodes = [
                {
                    id: '1',
                    type: 'start',
                    position: {
                        x: 0,
                        y: 0
                    },
                    data: {}
                },
                {
                    id: '2',
                    type: 'end',
                    position: {
                        x: 100,
                        y: 100
                    },
                    data: {}
                }
            ];
            store.dispatch(workflowActions.setNodes(nodes));
            expect(store.getState().workflow.nodes).toEqual(nodes);
        });
        it('should set edges', ()=>{
            const edges = [
                {
                    id: 'e1',
                    source: '1',
                    target: '2'
                }
            ];
            store.dispatch(workflowActions.setEdges(edges));
            expect(store.getState().workflow.edges).toEqual(edges);
        });
        it('should set variables', ()=>{
            const variables = {
                var1: 'value1',
                var2: 42
            };
            store.dispatch(workflowActions.setVariables(variables));
            expect(store.getState().workflow.variables).toEqual(variables);
        });
    });
    describe('Node operations', ()=>{
        it('should add node', ()=>{
            const node = {
                id: '1',
                type: 'start',
                position: {
                    x: 0,
                    y: 0
                },
                data: {}
            };
            store.dispatch(workflowActions.addNode(node));
            expect(store.getState().workflow.nodes).toHaveLength(1);
            expect(store.getState().workflow.nodes[0]).toEqual(node);
        });
        it('should update node', ()=>{
            const node = {
                id: '1',
                type: 'start',
                position: {
                    x: 0,
                    y: 0
                },
                data: {
                    label: 'Start'
                }
            };
            store.dispatch(workflowActions.addNode(node));
            store.dispatch(workflowActions.updateNode('1', {
                label: 'Updated Start'
            }));
            expect(store.getState().workflow.nodes[0].data.label).toBe('Updated Start');
        });
        it('should not update non-existent node', ()=>{
            const node = {
                id: '1',
                type: 'start',
                position: {
                    x: 0,
                    y: 0
                },
                data: {
                    label: 'Start'
                }
            };
            store.dispatch(workflowActions.addNode(node));
            store.dispatch(workflowActions.updateNode('2', {
                label: 'Updated'
            }));
            expect(store.getState().workflow.nodes[0].data.label).toBe('Start');
        });
        it('should remove node', ()=>{
            const node1 = {
                id: '1',
                type: 'start',
                position: {
                    x: 0,
                    y: 0
                },
                data: {}
            };
            const node2 = {
                id: '2',
                type: 'end',
                position: {
                    x: 100,
                    y: 100
                },
                data: {}
            };
            store.dispatch(workflowActions.addNode(node1));
            store.dispatch(workflowActions.addNode(node2));
            store.dispatch(workflowActions.removeNode('1'));
            expect(store.getState().workflow.nodes).toHaveLength(1);
            expect(store.getState().workflow.nodes[0].id).toBe('2');
        });
        it('should remove edges connected to removed node', ()=>{
            const node1 = {
                id: '1',
                type: 'start',
                position: {
                    x: 0,
                    y: 0
                },
                data: {}
            };
            const node2 = {
                id: '2',
                type: 'end',
                position: {
                    x: 100,
                    y: 100
                },
                data: {}
            };
            store.dispatch(workflowActions.addNode(node1));
            store.dispatch(workflowActions.addNode(node2));
            const edge1 = {
                id: 'e1',
                source: '1',
                target: '2'
            };
            const edge2 = {
                id: 'e2',
                source: '2',
                target: '3'
            };
            store.dispatch(workflowActions.addEdge(edge1));
            store.dispatch(workflowActions.addEdge(edge2));
            store.dispatch(workflowActions.removeNode('1'));
            expect(store.getState().workflow.edges).toHaveLength(1);
            expect(store.getState().workflow.edges[0].id).toBe('e2');
        });
    });
    describe('Edge operations', ()=>{
        it('should add edge', ()=>{
            const edge = {
                id: 'e1',
                source: '1',
                target: '2'
            };
            store.dispatch(workflowActions.addEdge(edge));
            expect(store.getState().workflow.edges).toHaveLength(1);
            expect(store.getState().workflow.edges[0]).toEqual(edge);
        });
        it('should remove edge', ()=>{
            const edge1 = {
                id: 'e1',
                source: '1',
                target: '2'
            };
            const edge2 = {
                id: 'e2',
                source: '2',
                target: '3'
            };
            store.dispatch(workflowActions.addEdge(edge1));
            store.dispatch(workflowActions.addEdge(edge2));
            store.dispatch(workflowActions.removeEdge('e1'));
            expect(store.getState().workflow.edges).toHaveLength(1);
            expect(store.getState().workflow.edges[0].id).toBe('e2');
        });
    });
    describe('Workflow management', ()=>{
        it('should load workflow', ()=>{
            const workflow = {
                id: 'workflow-1',
                name: 'Test Workflow',
                description: 'Test Description',
                nodes: [
                    {
                        id: '1',
                        type: 'start',
                        name: 'Start',
                        position: {
                            x: 0,
                            y: 0
                        }
                    }
                ],
                edges: [
                    {
                        id: 'e1',
                        source: '1',
                        target: '2'
                    }
                ],
                variables: {
                    var1: 'value1'
                }
            };
            store.dispatch(workflowActions.loadWorkflow(workflow));
            const state = store.getState().workflow;
            expect(state.workflowId).toBe('workflow-1');
            expect(state.workflowName).toBe('Test Workflow');
            expect(state.workflowDescription).toBe('Test Description');
            expect(state.nodes).toHaveLength(1);
            expect(state.edges).toHaveLength(1);
            expect(state.variables).toEqual({
                var1: 'value1'
            });
        });
        it('should load workflow without id', ()=>{
            const workflow = {
                id: undefined,
                name: 'Test Workflow',
                description: 'Test Description',
                nodes: [],
                edges: [],
                variables: {}
            };
            store.dispatch(workflowActions.loadWorkflow(workflow));
            expect(store.getState().workflow.workflowId).toBeNull();
        });
        it('should load workflow with nested data structure', ()=>{
            const workflow = {
                id: 'workflow-1',
                name: 'Test Workflow',
                description: 'Test Description',
                nodes: [
                    {
                        id: '1',
                        type: 'start',
                        name: 'Start',
                        position: {
                            x: 0,
                            y: 0
                        },
                        data: {
                            label: 'Start Node',
                            name: 'start'
                        }
                    }
                ],
                edges: [],
                variables: {}
            };
            store.dispatch(workflowActions.loadWorkflow(workflow));
            const node = store.getState().workflow.nodes[0];
            expect(node.data.label).toBe('Start Node');
            expect(node.data.name).toBe('start');
        });
        it('should clear workflow', ()=>{
            const workflow = {
                id: 'workflow-1',
                name: 'Test Workflow',
                description: 'Test Description',
                nodes: [
                    {
                        id: '1',
                        type: 'start',
                        name: 'Start',
                        position: {
                            x: 0,
                            y: 0
                        }
                    }
                ],
                edges: [
                    {
                        id: 'e1',
                        source: '1',
                        target: '2'
                    }
                ],
                variables: {
                    var1: 'value1'
                }
            };
            store.dispatch(workflowActions.loadWorkflow(workflow));
            store.dispatch(workflowActions.clearWorkflow());
            const state = store.getState().workflow;
            expect(state.workflowId).toBeNull();
            expect(state.workflowName).toBe('Untitled Workflow');
            expect(state.workflowDescription).toBe('');
            expect(state.nodes).toEqual([]);
            expect(state.edges).toEqual([]);
            expect(state.variables).toEqual({});
        });
        it('should convert to workflow definition', ()=>{
            const node = {
                id: '1',
                type: 'start',
                position: {
                    x: 0,
                    y: 0
                },
                data: {
                    label: 'Start',
                    name: 'start',
                    description: 'Start node'
                }
            };
            const edge = {
                id: 'e1',
                source: '1',
                target: '2'
            };
            store.dispatch(workflowActions.setWorkflowName('My Workflow'));
            store.dispatch(workflowActions.setWorkflowDescription('Description'));
            store.dispatch(workflowActions.addNode(node));
            store.dispatch(workflowActions.addEdge(edge));
            store.dispatch(workflowActions.setVariables({
                var1: 'value1'
            }));
            const workflow = selectWorkflowToDefinition(store.getState());
            expect(workflow.name).toBe('My Workflow');
            expect(workflow.description).toBe('Description');
            expect(workflow.nodes).toHaveLength(1);
            expect(workflow.nodes[0].id).toBe('1');
            // The name comes from node.data.label || node.data.name || node.id
            // Since we set label: 'Start', it should be 'Start'
            expect(workflow.nodes[0].name).toBe('Start');
            expect(workflow.edges).toHaveLength(1);
            expect(workflow.variables).toEqual({
                var1: 'value1'
            });
        });
        it('should convert node with label fallback to name', ()=>{
            const node = {
                id: '1',
                type: 'start',
                position: {
                    x: 0,
                    y: 0
                },
                data: {
                    label: 'Start Label'
                }
            };
            store.dispatch(workflowActions.addNode(node));
            const workflow = selectWorkflowToDefinition(store.getState());
            expect(workflow.nodes[0].name).toBe('Start Label');
        });
        it('should convert node with name fallback to id', ()=>{
            const node = {
                id: 'node-1',
                type: 'start',
                position: {
                    x: 0,
                    y: 0
                },
                data: {}
            };
            store.dispatch(workflowActions.addNode(node));
            const workflow = selectWorkflowToDefinition(store.getState());
            expect(workflow.nodes[0].name).toBe('node-1');
        });
        it('should convert node with agent_config', ()=>{
            const node = {
                id: '1',
                type: 'agent',
                position: {
                    x: 0,
                    y: 0
                },
                data: {
                    label: 'Agent Node',
                    agent_config: {
                        model: 'gpt-4',
                        temperature: 0.7
                    }
                }
            };
            store.dispatch(workflowActions.addNode(node));
            const workflow = selectWorkflowToDefinition(store.getState());
            expect(workflow.nodes[0].agent_config).toEqual({
                model: 'gpt-4',
                temperature: 0.7
            });
        });
        it('should convert node with condition_config', ()=>{
            const node = {
                id: '1',
                type: 'condition',
                position: {
                    x: 0,
                    y: 0
                },
                data: {
                    label: 'Condition Node',
                    condition_config: {
                        expression: 'x > 10'
                    }
                }
            };
            store.dispatch(workflowActions.addNode(node));
            const workflow = selectWorkflowToDefinition(store.getState());
            expect(workflow.nodes[0].condition_config).toEqual({
                condition_type: 'equals',
                field: '',
                value: ''
            });
        });
        it('should convert node with loop_config', ()=>{
            const node = {
                id: '1',
                type: 'loop',
                position: {
                    x: 0,
                    y: 0
                },
                data: {
                    label: 'Loop Node',
                    loop_config: {
                        max_iterations: 10
                    }
                }
            };
            store.dispatch(workflowActions.addNode(node));
            const workflow = selectWorkflowToDefinition(store.getState());
            expect(workflow.nodes[0].loop_config).toEqual({
                loop_type: 'for_each',
                max_iterations: 10
            });
        });
        it('should convert node with inputs', ()=>{
            const node = {
                id: '1',
                type: 'start',
                position: {
                    x: 0,
                    y: 0
                },
                data: {
                    label: 'Start',
                    inputs: [
                        'input1',
                        'input2'
                    ]
                }
            };
            store.dispatch(workflowActions.addNode(node));
            const workflow = selectWorkflowToDefinition(store.getState());
            expect(workflow.nodes[0].inputs).toEqual([
                {
                    name: 'input1',
                    source_node: undefined,
                    source_field: ''
                },
                {
                    name: 'input2',
                    source_node: undefined,
                    source_field: ''
                }
            ]);
        });
        it('should convert node with empty inputs array', ()=>{
            const node = {
                id: '1',
                type: 'start',
                position: {
                    x: 0,
                    y: 0
                },
                data: {
                    label: 'Start',
                    inputs: []
                }
            };
            store.dispatch(workflowActions.addNode(node));
            const workflow = selectWorkflowToDefinition(store.getState());
            expect(workflow.nodes[0].inputs).toEqual([]);
        });
        it('should convert node without inputs (defaults to empty array)', ()=>{
            const node = {
                id: '1',
                type: 'start',
                position: {
                    x: 0,
                    y: 0
                },
                data: {
                    label: 'Start'
                }
            };
            store.dispatch(workflowActions.addNode(node));
            const workflow = selectWorkflowToDefinition(store.getState());
            expect(workflow.nodes[0].inputs).toEqual([]);
        });
        it('should load workflow with empty description', ()=>{
            const workflow = {
                id: 'workflow-1',
                name: 'Test Workflow',
                description: '',
                nodes: [],
                edges: [],
                variables: {}
            };
            store.dispatch(workflowActions.loadWorkflow(workflow));
            expect(store.getState().workflow.workflowDescription).toBe('');
        });
        it('should load workflow with undefined description', ()=>{
            const workflow = {
                id: 'workflow-1',
                name: 'Test Workflow',
                description: undefined,
                nodes: [],
                edges: [],
                variables: {}
            };
            store.dispatch(workflowActions.loadWorkflow(workflow));
            expect(store.getState().workflow.workflowDescription).toBe('');
        });
        it('should load workflow node with missing position (defaults to 0,0)', ()=>{
            const workflow = {
                id: 'workflow-1',
                name: 'Test Workflow',
                description: 'Test',
                nodes: [
                    {
                        id: '1',
                        type: 'start',
                        name: 'Start',
                        position: undefined
                    }
                ],
                edges: [],
                variables: {}
            };
            store.dispatch(workflowActions.loadWorkflow(workflow));
            const node = store.getState().workflow.nodes[0];
            expect(node.position).toEqual({
                x: 0,
                y: 0
            });
        });
        it('should handle node data with all fallback options', ()=>{
            const workflow = {
                id: 'workflow-1',
                name: 'Test Workflow',
                description: 'Test',
                nodes: [
                    {
                        id: '1',
                        type: 'start',
                        name: 'Node Name',
                        position: {
                            x: 0,
                            y: 0
                        },
                        data: {
                            label: 'Label',
                            name: 'Data Name'
                        }
                    }
                ],
                edges: [],
                variables: {}
            };
            store.dispatch(workflowActions.loadWorkflow(workflow));
            const node = store.getState().workflow.nodes[0];
            // Should prefer data.label, then data.name, then wfNode.name, then wfNode.type
            expect(node.data.label).toBe('Label');
            expect(node.data.name).toBe('Data Name');
        });
        it('should handle node data fallback chain correctly', ()=>{
            const workflow = {
                id: 'workflow-1',
                name: 'Test Workflow',
                description: 'Test',
                nodes: [
                    {
                        id: '1',
                        type: 'start',
                        name: 'Workflow Node Name',
                        position: {
                            x: 0,
                            y: 0
                        }
                    }
                ],
                edges: [],
                variables: {}
            };
            store.dispatch(workflowActions.loadWorkflow(workflow));
            const node = store.getState().workflow.nodes[0];
            // Should use wfNode.name when data.label and data.name are missing
            expect(node.data.label).toBe('Workflow Node Name');
            expect(node.data.name).toBe('Workflow Node Name');
        });
        it('should handle node data fallback to type', ()=>{
            const workflow = {
                id: 'workflow-1',
                name: 'Test Workflow',
                description: 'Test',
                nodes: [
                    {
                        id: '1',
                        type: 'agent',
                        position: {
                            x: 0,
                            y: 0
                        }
                    }
                ],
                edges: [],
                variables: {}
            };
            store.dispatch(workflowActions.loadWorkflow(workflow));
            const node = store.getState().workflow.nodes[0];
            // Should use type when all other options are missing
            expect(node.data.label).toBe('agent');
            expect(node.data.name).toBe('agent');
        });
    });
});
