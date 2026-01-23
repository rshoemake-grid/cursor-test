// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { useEffect, useRef, useState, useCallback } from 'react';
interface WebSocketMessage {
  type: 'log' | 'status' | 'node_update' | 'completion' | 'error';
  execution_id: string;
  log?: {
    timestamp: string;
    level: string;
    node_id?: string;
    message: string;
  };
  status?: string;
  node_state?: any;
  result?: any;
  error?: string;
  timestamp?: string;
}
interface UseWebSocketOptions {
  executionId: string | null;
  onLog?: (log: WebSocketMessage['log']) => void;
  onStatus?: (status: string) => void;
  onNodeUpdate?: (nodeId: string, nodeState: any) => void;
  onCompletion?: (result: any) => void;
  onError?: (error: string) => void;
}
export function useWebSocket({
  executionId,
  onLog,
  onStatus,
  onNodeUpdate,
  onCompletion,
  onError
}: UseWebSocketOptions) {
  if (stryMutAct_9fa48("480")) {
    {}
  } else {
    stryCov_9fa48("480");
    const [isConnected, setIsConnected] = useState(stryMutAct_9fa48("481") ? true : (stryCov_9fa48("481"), false));
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const connect = useCallback(() => {
      if (stryMutAct_9fa48("482")) {
        {}
      } else {
        stryCov_9fa48("482");
        if (stryMutAct_9fa48("485") ? false : stryMutAct_9fa48("484") ? true : stryMutAct_9fa48("483") ? executionId : (stryCov_9fa48("483", "484", "485"), !executionId)) {
          if (stryMutAct_9fa48("486")) {
            {}
          } else {
            stryCov_9fa48("486");
            return;
          }
        }

        // Don't connect to temporary execution IDs (they don't exist in backend)
        if (stryMutAct_9fa48("489") ? executionId.endsWith('pending-') : stryMutAct_9fa48("488") ? false : stryMutAct_9fa48("487") ? true : (stryCov_9fa48("487", "488", "489"), executionId.startsWith(stryMutAct_9fa48("490") ? "" : (stryCov_9fa48("490"), 'pending-')))) {
          if (stryMutAct_9fa48("491")) {
            {}
          } else {
            stryCov_9fa48("491");
            console.log(stryMutAct_9fa48("492") ? `` : (stryCov_9fa48("492"), `[WebSocket] Skipping connection to temporary execution ID: ${executionId}`));
            return;
          }
        }

        // Close existing connection if any
        if (stryMutAct_9fa48("494") ? false : stryMutAct_9fa48("493") ? true : (stryCov_9fa48("493", "494"), wsRef.current)) {
          if (stryMutAct_9fa48("495")) {
            {}
          } else {
            stryCov_9fa48("495");
            wsRef.current.close();
            wsRef.current = null;
          }
        }

        // Determine WebSocket URL
        const protocol = (stryMutAct_9fa48("498") ? window.location.protocol !== 'https:' : stryMutAct_9fa48("497") ? false : stryMutAct_9fa48("496") ? true : (stryCov_9fa48("496", "497", "498"), window.location.protocol === (stryMutAct_9fa48("499") ? "" : (stryCov_9fa48("499"), 'https:')))) ? stryMutAct_9fa48("500") ? "" : (stryCov_9fa48("500"), 'wss:') : stryMutAct_9fa48("501") ? "" : (stryCov_9fa48("501"), 'ws:');
        const host = window.location.host;
        const wsUrl = stryMutAct_9fa48("502") ? `` : (stryCov_9fa48("502"), `${protocol}//${host}/api/ws/executions/${executionId}`);
        try {
          if (stryMutAct_9fa48("503")) {
            {}
          } else {
            stryCov_9fa48("503");
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;
            ws.onopen = () => {
              if (stryMutAct_9fa48("504")) {
                {}
              } else {
                stryCov_9fa48("504");
                console.log(stryMutAct_9fa48("505") ? `` : (stryCov_9fa48("505"), `[WebSocket] Connected to execution ${executionId}`));
                setIsConnected(stryMutAct_9fa48("506") ? false : (stryCov_9fa48("506"), true));
                reconnectAttempts.current = 0;
              }
            };
            ws.onmessage = event => {
              if (stryMutAct_9fa48("507")) {
                {}
              } else {
                stryCov_9fa48("507");
                try {
                  if (stryMutAct_9fa48("508")) {
                    {}
                  } else {
                    stryCov_9fa48("508");
                    const message: WebSocketMessage = JSON.parse(event.data);
                    switch (message.type) {
                      case stryMutAct_9fa48("510") ? "" : (stryCov_9fa48("510"), 'log'):
                        if (stryMutAct_9fa48("509")) {} else {
                          stryCov_9fa48("509");
                          if (stryMutAct_9fa48("513") ? message.log || onLog : stryMutAct_9fa48("512") ? false : stryMutAct_9fa48("511") ? true : (stryCov_9fa48("511", "512", "513"), message.log && onLog)) {
                            if (stryMutAct_9fa48("514")) {
                              {}
                            } else {
                              stryCov_9fa48("514");
                              onLog(message.log);
                            }
                          }
                          break;
                        }
                      case stryMutAct_9fa48("516") ? "" : (stryCov_9fa48("516"), 'status'):
                        if (stryMutAct_9fa48("515")) {} else {
                          stryCov_9fa48("515");
                          if (stryMutAct_9fa48("519") ? message.status || onStatus : stryMutAct_9fa48("518") ? false : stryMutAct_9fa48("517") ? true : (stryCov_9fa48("517", "518", "519"), message.status && onStatus)) {
                            if (stryMutAct_9fa48("520")) {
                              {}
                            } else {
                              stryCov_9fa48("520");
                              onStatus(message.status);
                            }
                          }
                          break;
                        }
                      case stryMutAct_9fa48("522") ? "" : (stryCov_9fa48("522"), 'node_update'):
                        if (stryMutAct_9fa48("521")) {} else {
                          stryCov_9fa48("521");
                          if (stryMutAct_9fa48("525") ? message.node_state || onNodeUpdate : stryMutAct_9fa48("524") ? false : stryMutAct_9fa48("523") ? true : (stryCov_9fa48("523", "524", "525"), message.node_state && onNodeUpdate)) {
                            if (stryMutAct_9fa48("526")) {
                              {}
                            } else {
                              stryCov_9fa48("526");
                              // Extract node_id from message - backend sends it as top-level field
                              const nodeId = stryMutAct_9fa48("529") ? ((message as any).node_id || message.node_state.node_id) && message.node_state.node_id : stryMutAct_9fa48("528") ? false : stryMutAct_9fa48("527") ? true : (stryCov_9fa48("527", "528", "529"), (stryMutAct_9fa48("531") ? (message as any).node_id && message.node_state.node_id : stryMutAct_9fa48("530") ? false : (stryCov_9fa48("530", "531"), (message as any).node_id || message.node_state.node_id)) || message.node_state.node_id);
                              if (stryMutAct_9fa48("533") ? false : stryMutAct_9fa48("532") ? true : (stryCov_9fa48("532", "533"), nodeId)) {
                                if (stryMutAct_9fa48("534")) {
                                  {}
                                } else {
                                  stryCov_9fa48("534");
                                  onNodeUpdate(nodeId, message.node_state);
                                }
                              }
                            }
                          }
                          break;
                        }
                      case stryMutAct_9fa48("536") ? "" : (stryCov_9fa48("536"), 'completion'):
                        if (stryMutAct_9fa48("535")) {} else {
                          stryCov_9fa48("535");
                          if (stryMutAct_9fa48("538") ? false : stryMutAct_9fa48("537") ? true : (stryCov_9fa48("537", "538"), onCompletion)) {
                            if (stryMutAct_9fa48("539")) {
                              {}
                            } else {
                              stryCov_9fa48("539");
                              onCompletion(message.result);
                            }
                          }
                          break;
                        }
                      case stryMutAct_9fa48("541") ? "" : (stryCov_9fa48("541"), 'error'):
                        if (stryMutAct_9fa48("540")) {} else {
                          stryCov_9fa48("540");
                          if (stryMutAct_9fa48("544") ? message.error || onError : stryMutAct_9fa48("543") ? false : stryMutAct_9fa48("542") ? true : (stryCov_9fa48("542", "543", "544"), message.error && onError)) {
                            if (stryMutAct_9fa48("545")) {
                              {}
                            } else {
                              stryCov_9fa48("545");
                              onError(message.error);
                            }
                          }
                          break;
                        }
                    }
                  }
                } catch (error) {
                  if (stryMutAct_9fa48("546")) {
                    {}
                  } else {
                    stryCov_9fa48("546");
                    console.error(stryMutAct_9fa48("547") ? "" : (stryCov_9fa48("547"), '[WebSocket] Failed to parse message:'), error);
                  }
                }
              }
            };
            ws.onerror = error => {
              if (stryMutAct_9fa48("548")) {
                {}
              } else {
                stryCov_9fa48("548");
                console.error(stryMutAct_9fa48("549") ? "" : (stryCov_9fa48("549"), '[WebSocket] Error:'), error);
                setIsConnected(stryMutAct_9fa48("550") ? true : (stryCov_9fa48("550"), false));
              }
            };
            ws.onclose = () => {
              if (stryMutAct_9fa48("551")) {
                {}
              } else {
                stryCov_9fa48("551");
                console.log(stryMutAct_9fa48("552") ? `` : (stryCov_9fa48("552"), `[WebSocket] Disconnected from execution ${executionId}`));
                setIsConnected(stryMutAct_9fa48("553") ? true : (stryCov_9fa48("553"), false));
                wsRef.current = null;

                // Don't reconnect to temporary execution IDs
                if (stryMutAct_9fa48("556") ? executionId || executionId.startsWith('pending-') : stryMutAct_9fa48("555") ? false : stryMutAct_9fa48("554") ? true : (stryCov_9fa48("554", "555", "556"), executionId && (stryMutAct_9fa48("557") ? executionId.endsWith('pending-') : (stryCov_9fa48("557"), executionId.startsWith(stryMutAct_9fa48("558") ? "" : (stryCov_9fa48("558"), 'pending-')))))) {
                  if (stryMutAct_9fa48("559")) {
                    {}
                  } else {
                    stryCov_9fa48("559");
                    console.log(stryMutAct_9fa48("560") ? `` : (stryCov_9fa48("560"), `[WebSocket] Skipping reconnect for temporary execution ID: ${executionId}`));
                    return;
                  }
                }

                // Attempt to reconnect if execution might still be running
                if (stryMutAct_9fa48("563") ? reconnectAttempts.current < maxReconnectAttempts || executionId : stryMutAct_9fa48("562") ? false : stryMutAct_9fa48("561") ? true : (stryCov_9fa48("561", "562", "563"), (stryMutAct_9fa48("566") ? reconnectAttempts.current >= maxReconnectAttempts : stryMutAct_9fa48("565") ? reconnectAttempts.current <= maxReconnectAttempts : stryMutAct_9fa48("564") ? true : (stryCov_9fa48("564", "565", "566"), reconnectAttempts.current < maxReconnectAttempts)) && executionId)) {
                  if (stryMutAct_9fa48("567")) {
                    {}
                  } else {
                    stryCov_9fa48("567");
                    stryMutAct_9fa48("568") ? reconnectAttempts.current-- : (stryCov_9fa48("568"), reconnectAttempts.current++);
                    const delay = stryMutAct_9fa48("569") ? Math.max(1000 * Math.pow(2, reconnectAttempts.current), 10000) : (stryCov_9fa48("569"), Math.min(stryMutAct_9fa48("570") ? 1000 / Math.pow(2, reconnectAttempts.current) : (stryCov_9fa48("570"), 1000 * Math.pow(2, reconnectAttempts.current)), 10000));
                    console.log(stryMutAct_9fa48("571") ? `` : (stryCov_9fa48("571"), `[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`));
                    reconnectTimeoutRef.current = setTimeout(() => {
                      if (stryMutAct_9fa48("572")) {
                        {}
                      } else {
                        stryCov_9fa48("572");
                        connect();
                      }
                    }, delay);
                  }
                }
              }
            };
          }
        } catch (error) {
          if (stryMutAct_9fa48("573")) {
            {}
          } else {
            stryCov_9fa48("573");
            console.error(stryMutAct_9fa48("574") ? "" : (stryCov_9fa48("574"), '[WebSocket] Failed to create connection:'), error);
            setIsConnected(stryMutAct_9fa48("575") ? true : (stryCov_9fa48("575"), false));
          }
        }
      }
    }, stryMutAct_9fa48("576") ? [] : (stryCov_9fa48("576"), [executionId, onLog, onStatus, onNodeUpdate, onCompletion, onError]));
    useEffect(() => {
      if (stryMutAct_9fa48("577")) {
        {}
      } else {
        stryCov_9fa48("577");
        // Clear any pending reconnection attempts when execution ID changes
        if (stryMutAct_9fa48("579") ? false : stryMutAct_9fa48("578") ? true : (stryCov_9fa48("578", "579"), reconnectTimeoutRef.current)) {
          if (stryMutAct_9fa48("580")) {
            {}
          } else {
            stryCov_9fa48("580");
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        }

        // Reset reconnect attempts when execution ID changes
        reconnectAttempts.current = 0;
        if (stryMutAct_9fa48("582") ? false : stryMutAct_9fa48("581") ? true : (stryCov_9fa48("581", "582"), executionId)) {
          if (stryMutAct_9fa48("583")) {
            {}
          } else {
            stryCov_9fa48("583");
            // Don't connect to temporary execution IDs
            if (stryMutAct_9fa48("586") ? executionId.endsWith('pending-') : stryMutAct_9fa48("585") ? false : stryMutAct_9fa48("584") ? true : (stryCov_9fa48("584", "585", "586"), executionId.startsWith(stryMutAct_9fa48("587") ? "" : (stryCov_9fa48("587"), 'pending-')))) {
              if (stryMutAct_9fa48("588")) {
                {}
              } else {
                stryCov_9fa48("588");
                // Close any existing connection
                if (stryMutAct_9fa48("590") ? false : stryMutAct_9fa48("589") ? true : (stryCov_9fa48("589", "590"), wsRef.current)) {
                  if (stryMutAct_9fa48("591")) {
                    {}
                  } else {
                    stryCov_9fa48("591");
                    wsRef.current.close();
                    wsRef.current = null;
                  }
                }
                setIsConnected(stryMutAct_9fa48("592") ? true : (stryCov_9fa48("592"), false));
                return;
              }
            }
            connect();
          }
        } else {
          if (stryMutAct_9fa48("593")) {
            {}
          } else {
            stryCov_9fa48("593");
            // Close connection if no execution ID
            if (stryMutAct_9fa48("595") ? false : stryMutAct_9fa48("594") ? true : (stryCov_9fa48("594", "595"), wsRef.current)) {
              if (stryMutAct_9fa48("596")) {
                {}
              } else {
                stryCov_9fa48("596");
                wsRef.current.close();
                wsRef.current = null;
              }
            }
            setIsConnected(stryMutAct_9fa48("597") ? true : (stryCov_9fa48("597"), false));
          }
        }
        return () => {
          if (stryMutAct_9fa48("598")) {
            {}
          } else {
            stryCov_9fa48("598");
            if (stryMutAct_9fa48("600") ? false : stryMutAct_9fa48("599") ? true : (stryCov_9fa48("599", "600"), reconnectTimeoutRef.current)) {
              if (stryMutAct_9fa48("601")) {
                {}
              } else {
                stryCov_9fa48("601");
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
              }
            }
            if (stryMutAct_9fa48("603") ? false : stryMutAct_9fa48("602") ? true : (stryCov_9fa48("602", "603"), wsRef.current)) {
              if (stryMutAct_9fa48("604")) {
                {}
              } else {
                stryCov_9fa48("604");
                wsRef.current.close();
                wsRef.current = null;
              }
            }
            setIsConnected(stryMutAct_9fa48("605") ? true : (stryCov_9fa48("605"), false));
          }
        };
      }
    }, stryMutAct_9fa48("606") ? [] : (stryCov_9fa48("606"), [executionId, connect]));
    return stryMutAct_9fa48("607") ? {} : (stryCov_9fa48("607"), {
      isConnected
    });
  }
}