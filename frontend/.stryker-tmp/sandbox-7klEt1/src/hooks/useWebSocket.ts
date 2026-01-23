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
import { logger } from '../utils/logger';
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
  executionStatus?: 'running' | 'completed' | 'failed' | 'pending' | 'paused'; // Current execution status
  onLog?: (log: WebSocketMessage['log']) => void;
  onStatus?: (status: string) => void;
  onNodeUpdate?: (nodeId: string, nodeState: any) => void;
  onCompletion?: (result: any) => void;
  onError?: (error: string) => void;
}
export function useWebSocket({
  executionId,
  executionStatus,
  onLog,
  onStatus,
  onNodeUpdate,
  onCompletion,
  onError
}: UseWebSocketOptions) {
  if (stryMutAct_9fa48("509")) {
    {}
  } else {
    stryCov_9fa48("509");
    const [isConnected, setIsConnected] = useState(stryMutAct_9fa48("510") ? true : (stryCov_9fa48("510"), false));
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const lastKnownStatusRef = useRef<string | undefined>(executionStatus);
    const connect = useCallback(() => {
      if (stryMutAct_9fa48("511")) {
        {}
      } else {
        stryCov_9fa48("511");
        if (stryMutAct_9fa48("514") ? false : stryMutAct_9fa48("513") ? true : stryMutAct_9fa48("512") ? executionId : (stryCov_9fa48("512", "513", "514"), !executionId)) {
          if (stryMutAct_9fa48("515")) {
            {}
          } else {
            stryCov_9fa48("515");
            return;
          }
        }

        // Don't connect to temporary execution IDs (they don't exist in backend)
        if (stryMutAct_9fa48("518") ? executionId.endsWith('pending-') : stryMutAct_9fa48("517") ? false : stryMutAct_9fa48("516") ? true : (stryCov_9fa48("516", "517", "518"), executionId.startsWith(stryMutAct_9fa48("519") ? "" : (stryCov_9fa48("519"), 'pending-')))) {
          if (stryMutAct_9fa48("520")) {
            {}
          } else {
            stryCov_9fa48("520");
            logger.debug(stryMutAct_9fa48("521") ? `` : (stryCov_9fa48("521"), `[WebSocket] Skipping connection to temporary execution ID: ${executionId}`));
            return;
          }
        }

        // Don't connect if execution is already completed or failed
        const currentStatus = stryMutAct_9fa48("524") ? executionStatus && lastKnownStatusRef.current : stryMutAct_9fa48("523") ? false : stryMutAct_9fa48("522") ? true : (stryCov_9fa48("522", "523", "524"), executionStatus || lastKnownStatusRef.current);
        if (stryMutAct_9fa48("527") ? currentStatus === 'completed' && currentStatus === 'failed' : stryMutAct_9fa48("526") ? false : stryMutAct_9fa48("525") ? true : (stryCov_9fa48("525", "526", "527"), (stryMutAct_9fa48("529") ? currentStatus !== 'completed' : stryMutAct_9fa48("528") ? false : (stryCov_9fa48("528", "529"), currentStatus === (stryMutAct_9fa48("530") ? "" : (stryCov_9fa48("530"), 'completed')))) || (stryMutAct_9fa48("532") ? currentStatus !== 'failed' : stryMutAct_9fa48("531") ? false : (stryCov_9fa48("531", "532"), currentStatus === (stryMutAct_9fa48("533") ? "" : (stryCov_9fa48("533"), 'failed')))))) {
          if (stryMutAct_9fa48("534")) {
            {}
          } else {
            stryCov_9fa48("534");
            logger.debug(stryMutAct_9fa48("535") ? `` : (stryCov_9fa48("535"), `[WebSocket] Skipping connection - execution ${executionId} is ${currentStatus}`));
            return;
          }
        }

        // Close existing connection if any
        if (stryMutAct_9fa48("537") ? false : stryMutAct_9fa48("536") ? true : (stryCov_9fa48("536", "537"), wsRef.current)) {
          if (stryMutAct_9fa48("538")) {
            {}
          } else {
            stryCov_9fa48("538");
            wsRef.current.close();
            wsRef.current = null;
          }
        }

        // Determine WebSocket URL
        // Use /ws path which is proxied by Vite to backend
        const protocol = (stryMutAct_9fa48("541") ? window.location.protocol !== 'https:' : stryMutAct_9fa48("540") ? false : stryMutAct_9fa48("539") ? true : (stryCov_9fa48("539", "540", "541"), window.location.protocol === (stryMutAct_9fa48("542") ? "" : (stryCov_9fa48("542"), 'https:')))) ? stryMutAct_9fa48("543") ? "" : (stryCov_9fa48("543"), 'wss:') : stryMutAct_9fa48("544") ? "" : (stryCov_9fa48("544"), 'ws:');
        const host = window.location.host;
        const wsUrl = stryMutAct_9fa48("545") ? `` : (stryCov_9fa48("545"), `${protocol}//${host}/ws/executions/${executionId}`);
        logger.debug(stryMutAct_9fa48("546") ? `` : (stryCov_9fa48("546"), `[WebSocket] Connecting to ${wsUrl} for execution ${executionId}`));
        try {
          if (stryMutAct_9fa48("547")) {
            {}
          } else {
            stryCov_9fa48("547");
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;
            ws.onopen = () => {
              if (stryMutAct_9fa48("548")) {
                {}
              } else {
                stryCov_9fa48("548");
                logger.debug(stryMutAct_9fa48("549") ? `` : (stryCov_9fa48("549"), `[WebSocket] Connected to execution ${executionId}`));
                setIsConnected(stryMutAct_9fa48("550") ? false : (stryCov_9fa48("550"), true));
                reconnectAttempts.current = 0;
              }
            };
            ws.onmessage = event => {
              if (stryMutAct_9fa48("551")) {
                {}
              } else {
                stryCov_9fa48("551");
                try {
                  if (stryMutAct_9fa48("552")) {
                    {}
                  } else {
                    stryCov_9fa48("552");
                    const message: WebSocketMessage = JSON.parse(event.data);
                    switch (message.type) {
                      case stryMutAct_9fa48("554") ? "" : (stryCov_9fa48("554"), 'log'):
                        if (stryMutAct_9fa48("553")) {} else {
                          stryCov_9fa48("553");
                          if (stryMutAct_9fa48("557") ? message.log || onLog : stryMutAct_9fa48("556") ? false : stryMutAct_9fa48("555") ? true : (stryCov_9fa48("555", "556", "557"), message.log && onLog)) {
                            if (stryMutAct_9fa48("558")) {
                              {}
                            } else {
                              stryCov_9fa48("558");
                              onLog(message.log);
                            }
                          }
                          break;
                        }
                      case stryMutAct_9fa48("560") ? "" : (stryCov_9fa48("560"), 'status'):
                        if (stryMutAct_9fa48("559")) {} else {
                          stryCov_9fa48("559");
                          if (stryMutAct_9fa48("563") ? message.status || onStatus : stryMutAct_9fa48("562") ? false : stryMutAct_9fa48("561") ? true : (stryCov_9fa48("561", "562", "563"), message.status && onStatus)) {
                            if (stryMutAct_9fa48("564")) {
                              {}
                            } else {
                              stryCov_9fa48("564");
                              onStatus(message.status);
                            }
                          }
                          break;
                        }
                      case stryMutAct_9fa48("566") ? "" : (stryCov_9fa48("566"), 'node_update'):
                        if (stryMutAct_9fa48("565")) {} else {
                          stryCov_9fa48("565");
                          if (stryMutAct_9fa48("569") ? message.node_state || onNodeUpdate : stryMutAct_9fa48("568") ? false : stryMutAct_9fa48("567") ? true : (stryCov_9fa48("567", "568", "569"), message.node_state && onNodeUpdate)) {
                            if (stryMutAct_9fa48("570")) {
                              {}
                            } else {
                              stryCov_9fa48("570");
                              // Extract node_id from message - backend sends it as top-level field
                              const nodeId = stryMutAct_9fa48("573") ? ((message as any).node_id || message.node_state.node_id) && message.node_state.node_id : stryMutAct_9fa48("572") ? false : stryMutAct_9fa48("571") ? true : (stryCov_9fa48("571", "572", "573"), (stryMutAct_9fa48("575") ? (message as any).node_id && message.node_state.node_id : stryMutAct_9fa48("574") ? false : (stryCov_9fa48("574", "575"), (message as any).node_id || message.node_state.node_id)) || message.node_state.node_id);
                              if (stryMutAct_9fa48("577") ? false : stryMutAct_9fa48("576") ? true : (stryCov_9fa48("576", "577"), nodeId)) {
                                if (stryMutAct_9fa48("578")) {
                                  {}
                                } else {
                                  stryCov_9fa48("578");
                                  onNodeUpdate(nodeId, message.node_state);
                                }
                              }
                            }
                          }
                          break;
                        }
                      case stryMutAct_9fa48("580") ? "" : (stryCov_9fa48("580"), 'completion'):
                        if (stryMutAct_9fa48("579")) {} else {
                          stryCov_9fa48("579");
                          if (stryMutAct_9fa48("582") ? false : stryMutAct_9fa48("581") ? true : (stryCov_9fa48("581", "582"), onCompletion)) {
                            if (stryMutAct_9fa48("583")) {
                              {}
                            } else {
                              stryCov_9fa48("583");
                              onCompletion(message.result);
                            }
                          }
                          break;
                        }
                      case stryMutAct_9fa48("585") ? "" : (stryCov_9fa48("585"), 'error'):
                        if (stryMutAct_9fa48("584")) {} else {
                          stryCov_9fa48("584");
                          if (stryMutAct_9fa48("588") ? message.error || onError : stryMutAct_9fa48("587") ? false : stryMutAct_9fa48("586") ? true : (stryCov_9fa48("586", "587", "588"), message.error && onError)) {
                            if (stryMutAct_9fa48("589")) {
                              {}
                            } else {
                              stryCov_9fa48("589");
                              onError(message.error);
                            }
                          }
                          break;
                        }
                    }
                  }
                } catch (error) {
                  if (stryMutAct_9fa48("590")) {
                    {}
                  } else {
                    stryCov_9fa48("590");
                    logger.error(stryMutAct_9fa48("591") ? "" : (stryCov_9fa48("591"), '[WebSocket] Failed to parse message:'), error);
                  }
                }
              }
            };
            ws.onerror = error => {
              if (stryMutAct_9fa48("592")) {
                {}
              } else {
                stryCov_9fa48("592");
                // Extract more details from the error event
                const errorMessage = error instanceof Error ? error.message : stryMutAct_9fa48("593") ? "" : (stryCov_9fa48("593"), 'Unknown WebSocket error');
                const wsState = ws.readyState;
                const wsStateText = (stryMutAct_9fa48("596") ? wsState !== WebSocket.CONNECTING : stryMutAct_9fa48("595") ? false : stryMutAct_9fa48("594") ? true : (stryCov_9fa48("594", "595", "596"), wsState === WebSocket.CONNECTING)) ? stryMutAct_9fa48("597") ? "" : (stryCov_9fa48("597"), 'CONNECTING') : (stryMutAct_9fa48("600") ? wsState !== WebSocket.OPEN : stryMutAct_9fa48("599") ? false : stryMutAct_9fa48("598") ? true : (stryCov_9fa48("598", "599", "600"), wsState === WebSocket.OPEN)) ? stryMutAct_9fa48("601") ? "" : (stryCov_9fa48("601"), 'OPEN') : (stryMutAct_9fa48("604") ? wsState !== WebSocket.CLOSING : stryMutAct_9fa48("603") ? false : stryMutAct_9fa48("602") ? true : (stryCov_9fa48("602", "603", "604"), wsState === WebSocket.CLOSING)) ? stryMutAct_9fa48("605") ? "" : (stryCov_9fa48("605"), 'CLOSING') : (stryMutAct_9fa48("608") ? wsState !== WebSocket.CLOSED : stryMutAct_9fa48("607") ? false : stryMutAct_9fa48("606") ? true : (stryCov_9fa48("606", "607", "608"), wsState === WebSocket.CLOSED)) ? stryMutAct_9fa48("609") ? "" : (stryCov_9fa48("609"), 'CLOSED') : stryMutAct_9fa48("610") ? "" : (stryCov_9fa48("610"), 'UNKNOWN');
                logger.error(stryMutAct_9fa48("611") ? `` : (stryCov_9fa48("611"), `[WebSocket] Connection error for execution ${executionId}:`), stryMutAct_9fa48("612") ? {} : (stryCov_9fa48("612"), {
                  message: errorMessage,
                  readyState: wsStateText,
                  url: wsUrl
                }));
                setIsConnected(stryMutAct_9fa48("613") ? true : (stryCov_9fa48("613"), false));
              }
            };
            ws.onclose = event => {
              if (stryMutAct_9fa48("614")) {
                {}
              } else {
                stryCov_9fa48("614");
                const {
                  code,
                  reason,
                  wasClean
                } = event;
                logger.debug(stryMutAct_9fa48("615") ? `` : (stryCov_9fa48("615"), `[WebSocket] Disconnected from execution ${executionId}`), stryMutAct_9fa48("616") ? {} : (stryCov_9fa48("616"), {
                  code,
                  reason: stryMutAct_9fa48("619") ? reason && 'No reason provided' : stryMutAct_9fa48("618") ? false : stryMutAct_9fa48("617") ? true : (stryCov_9fa48("617", "618", "619"), reason || (stryMutAct_9fa48("620") ? "" : (stryCov_9fa48("620"), 'No reason provided'))),
                  wasClean,
                  reconnectAttempts: reconnectAttempts.current
                }));
                setIsConnected(stryMutAct_9fa48("621") ? true : (stryCov_9fa48("621"), false));
                wsRef.current = null;

                // Don't reconnect to temporary execution IDs
                if (stryMutAct_9fa48("624") ? executionId || executionId.startsWith('pending-') : stryMutAct_9fa48("623") ? false : stryMutAct_9fa48("622") ? true : (stryCov_9fa48("622", "623", "624"), executionId && (stryMutAct_9fa48("625") ? executionId.endsWith('pending-') : (stryCov_9fa48("625"), executionId.startsWith(stryMutAct_9fa48("626") ? "" : (stryCov_9fa48("626"), 'pending-')))))) {
                  if (stryMutAct_9fa48("627")) {
                    {}
                  } else {
                    stryCov_9fa48("627");
                    logger.debug(stryMutAct_9fa48("628") ? `` : (stryCov_9fa48("628"), `[WebSocket] Skipping reconnect for temporary execution ID: ${executionId}`));
                    return;
                  }
                }

                // Don't reconnect if execution is completed or failed
                const currentStatus = stryMutAct_9fa48("631") ? executionStatus && lastKnownStatusRef.current : stryMutAct_9fa48("630") ? false : stryMutAct_9fa48("629") ? true : (stryCov_9fa48("629", "630", "631"), executionStatus || lastKnownStatusRef.current);
                if (stryMutAct_9fa48("634") ? currentStatus === 'completed' && currentStatus === 'failed' : stryMutAct_9fa48("633") ? false : stryMutAct_9fa48("632") ? true : (stryCov_9fa48("632", "633", "634"), (stryMutAct_9fa48("636") ? currentStatus !== 'completed' : stryMutAct_9fa48("635") ? false : (stryCov_9fa48("635", "636"), currentStatus === (stryMutAct_9fa48("637") ? "" : (stryCov_9fa48("637"), 'completed')))) || (stryMutAct_9fa48("639") ? currentStatus !== 'failed' : stryMutAct_9fa48("638") ? false : (stryCov_9fa48("638", "639"), currentStatus === (stryMutAct_9fa48("640") ? "" : (stryCov_9fa48("640"), 'failed')))))) {
                  if (stryMutAct_9fa48("641")) {
                    {}
                  } else {
                    stryCov_9fa48("641");
                    logger.debug(stryMutAct_9fa48("642") ? `` : (stryCov_9fa48("642"), `[WebSocket] Skipping reconnect - execution ${executionId} is ${currentStatus}`));
                    return;
                  }
                }

                // Don't reconnect if connection was closed cleanly and execution might be done
                if (stryMutAct_9fa48("645") ? wasClean || code === 1000 : stryMutAct_9fa48("644") ? false : stryMutAct_9fa48("643") ? true : (stryCov_9fa48("643", "644", "645"), wasClean && (stryMutAct_9fa48("647") ? code !== 1000 : stryMutAct_9fa48("646") ? true : (stryCov_9fa48("646", "647"), code === 1000)))) {
                  if (stryMutAct_9fa48("648")) {
                    {}
                  } else {
                    stryCov_9fa48("648");
                    logger.debug(stryMutAct_9fa48("649") ? `` : (stryCov_9fa48("649"), `[WebSocket] Connection closed cleanly, not reconnecting`));
                    return;
                  }
                }

                // Attempt to reconnect if execution might still be running
                if (stryMutAct_9fa48("652") ? reconnectAttempts.current < maxReconnectAttempts || executionId : stryMutAct_9fa48("651") ? false : stryMutAct_9fa48("650") ? true : (stryCov_9fa48("650", "651", "652"), (stryMutAct_9fa48("655") ? reconnectAttempts.current >= maxReconnectAttempts : stryMutAct_9fa48("654") ? reconnectAttempts.current <= maxReconnectAttempts : stryMutAct_9fa48("653") ? true : (stryCov_9fa48("653", "654", "655"), reconnectAttempts.current < maxReconnectAttempts)) && executionId)) {
                  if (stryMutAct_9fa48("656")) {
                    {}
                  } else {
                    stryCov_9fa48("656");
                    stryMutAct_9fa48("657") ? reconnectAttempts.current-- : (stryCov_9fa48("657"), reconnectAttempts.current++);
                    const delay = stryMutAct_9fa48("658") ? Math.max(1000 * Math.pow(2, reconnectAttempts.current), 10000) : (stryCov_9fa48("658"), Math.min(stryMutAct_9fa48("659") ? 1000 / Math.pow(2, reconnectAttempts.current) : (stryCov_9fa48("659"), 1000 * Math.pow(2, reconnectAttempts.current)), 10000));
                    logger.debug(stryMutAct_9fa48("660") ? `` : (stryCov_9fa48("660"), `[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`));
                    reconnectTimeoutRef.current = setTimeout(() => {
                      if (stryMutAct_9fa48("661")) {
                        {}
                      } else {
                        stryCov_9fa48("661");
                        connect();
                      }
                    }, delay);
                  }
                } else if (stryMutAct_9fa48("665") ? reconnectAttempts.current < maxReconnectAttempts : stryMutAct_9fa48("664") ? reconnectAttempts.current > maxReconnectAttempts : stryMutAct_9fa48("663") ? false : stryMutAct_9fa48("662") ? true : (stryCov_9fa48("662", "663", "664", "665"), reconnectAttempts.current >= maxReconnectAttempts)) {
                  if (stryMutAct_9fa48("666")) {
                    {}
                  } else {
                    stryCov_9fa48("666");
                    logger.warn(stryMutAct_9fa48("667") ? `` : (stryCov_9fa48("667"), `[WebSocket] Max reconnect attempts (${maxReconnectAttempts}) reached for execution ${executionId}`));
                    if (stryMutAct_9fa48("669") ? false : stryMutAct_9fa48("668") ? true : (stryCov_9fa48("668", "669"), onError)) {
                      if (stryMutAct_9fa48("670")) {
                        {}
                      } else {
                        stryCov_9fa48("670");
                        onError(stryMutAct_9fa48("671") ? `` : (stryCov_9fa48("671"), `WebSocket connection failed after ${maxReconnectAttempts} attempts`));
                      }
                    }
                  }
                }
              }
            };
          }
        } catch (error) {
          if (stryMutAct_9fa48("672")) {
            {}
          } else {
            stryCov_9fa48("672");
            logger.error(stryMutAct_9fa48("673") ? `` : (stryCov_9fa48("673"), `[WebSocket] Failed to create connection for execution ${executionId}:`), error);
            setIsConnected(stryMutAct_9fa48("674") ? true : (stryCov_9fa48("674"), false));
            if (stryMutAct_9fa48("676") ? false : stryMutAct_9fa48("675") ? true : (stryCov_9fa48("675", "676"), onError)) {
              if (stryMutAct_9fa48("677")) {
                {}
              } else {
                stryCov_9fa48("677");
                onError(error instanceof Error ? error.message : stryMutAct_9fa48("678") ? "" : (stryCov_9fa48("678"), 'Failed to create WebSocket connection'));
              }
            }
          }
        }
      }
    }, stryMutAct_9fa48("679") ? [] : (stryCov_9fa48("679"), [executionId, executionStatus, onLog, onStatus, onNodeUpdate, onCompletion, onError]));

    // Update last known status when it changes
    useEffect(() => {
      if (stryMutAct_9fa48("680")) {
        {}
      } else {
        stryCov_9fa48("680");
        if (stryMutAct_9fa48("682") ? false : stryMutAct_9fa48("681") ? true : (stryCov_9fa48("681", "682"), executionStatus)) {
          if (stryMutAct_9fa48("683")) {
            {}
          } else {
            stryCov_9fa48("683");
            lastKnownStatusRef.current = executionStatus;

            // If execution completed or failed, close connection
            if (stryMutAct_9fa48("686") ? executionStatus === 'completed' && executionStatus === 'failed' : stryMutAct_9fa48("685") ? false : stryMutAct_9fa48("684") ? true : (stryCov_9fa48("684", "685", "686"), (stryMutAct_9fa48("688") ? executionStatus !== 'completed' : stryMutAct_9fa48("687") ? false : (stryCov_9fa48("687", "688"), executionStatus === (stryMutAct_9fa48("689") ? "" : (stryCov_9fa48("689"), 'completed')))) || (stryMutAct_9fa48("691") ? executionStatus !== 'failed' : stryMutAct_9fa48("690") ? false : (stryCov_9fa48("690", "691"), executionStatus === (stryMutAct_9fa48("692") ? "" : (stryCov_9fa48("692"), 'failed')))))) {
              if (stryMutAct_9fa48("693")) {
                {}
              } else {
                stryCov_9fa48("693");
                if (stryMutAct_9fa48("695") ? false : stryMutAct_9fa48("694") ? true : (stryCov_9fa48("694", "695"), wsRef.current)) {
                  if (stryMutAct_9fa48("696")) {
                    {}
                  } else {
                    stryCov_9fa48("696");
                    logger.debug(stryMutAct_9fa48("697") ? `` : (stryCov_9fa48("697"), `[WebSocket] Closing connection - execution ${executionId} is ${executionStatus}`));
                    wsRef.current.close(1000, stryMutAct_9fa48("698") ? "" : (stryCov_9fa48("698"), 'Execution completed'));
                    wsRef.current = null;
                  }
                }
                setIsConnected(stryMutAct_9fa48("699") ? true : (stryCov_9fa48("699"), false));
                // Clear any pending reconnection attempts
                if (stryMutAct_9fa48("701") ? false : stryMutAct_9fa48("700") ? true : (stryCov_9fa48("700", "701"), reconnectTimeoutRef.current)) {
                  if (stryMutAct_9fa48("702")) {
                    {}
                  } else {
                    stryCov_9fa48("702");
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                  }
                }
              }
            }
          }
        }
      }
    }, stryMutAct_9fa48("703") ? [] : (stryCov_9fa48("703"), [executionId, executionStatus]));
    useEffect(() => {
      if (stryMutAct_9fa48("704")) {
        {}
      } else {
        stryCov_9fa48("704");
        // Clear any pending reconnection attempts when execution ID changes
        if (stryMutAct_9fa48("706") ? false : stryMutAct_9fa48("705") ? true : (stryCov_9fa48("705", "706"), reconnectTimeoutRef.current)) {
          if (stryMutAct_9fa48("707")) {
            {}
          } else {
            stryCov_9fa48("707");
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        }

        // Reset reconnect attempts when execution ID changes
        reconnectAttempts.current = 0;
        if (stryMutAct_9fa48("709") ? false : stryMutAct_9fa48("708") ? true : (stryCov_9fa48("708", "709"), executionId)) {
          if (stryMutAct_9fa48("710")) {
            {}
          } else {
            stryCov_9fa48("710");
            // Don't connect to temporary execution IDs
            if (stryMutAct_9fa48("713") ? executionId.endsWith('pending-') : stryMutAct_9fa48("712") ? false : stryMutAct_9fa48("711") ? true : (stryCov_9fa48("711", "712", "713"), executionId.startsWith(stryMutAct_9fa48("714") ? "" : (stryCov_9fa48("714"), 'pending-')))) {
              if (stryMutAct_9fa48("715")) {
                {}
              } else {
                stryCov_9fa48("715");
                // Close any existing connection
                if (stryMutAct_9fa48("717") ? false : stryMutAct_9fa48("716") ? true : (stryCov_9fa48("716", "717"), wsRef.current)) {
                  if (stryMutAct_9fa48("718")) {
                    {}
                  } else {
                    stryCov_9fa48("718");
                    wsRef.current.close();
                    wsRef.current = null;
                  }
                }
                setIsConnected(stryMutAct_9fa48("719") ? true : (stryCov_9fa48("719"), false));
                return;
              }
            }

            // Don't connect if execution is already completed or failed
            const currentStatus = stryMutAct_9fa48("722") ? executionStatus && lastKnownStatusRef.current : stryMutAct_9fa48("721") ? false : stryMutAct_9fa48("720") ? true : (stryCov_9fa48("720", "721", "722"), executionStatus || lastKnownStatusRef.current);
            if (stryMutAct_9fa48("725") ? currentStatus === 'completed' && currentStatus === 'failed' : stryMutAct_9fa48("724") ? false : stryMutAct_9fa48("723") ? true : (stryCov_9fa48("723", "724", "725"), (stryMutAct_9fa48("727") ? currentStatus !== 'completed' : stryMutAct_9fa48("726") ? false : (stryCov_9fa48("726", "727"), currentStatus === (stryMutAct_9fa48("728") ? "" : (stryCov_9fa48("728"), 'completed')))) || (stryMutAct_9fa48("730") ? currentStatus !== 'failed' : stryMutAct_9fa48("729") ? false : (stryCov_9fa48("729", "730"), currentStatus === (stryMutAct_9fa48("731") ? "" : (stryCov_9fa48("731"), 'failed')))))) {
              if (stryMutAct_9fa48("732")) {
                {}
              } else {
                stryCov_9fa48("732");
                logger.debug(stryMutAct_9fa48("733") ? `` : (stryCov_9fa48("733"), `[WebSocket] Skipping connection - execution ${executionId} is ${currentStatus}`));
                return;
              }
            }
            connect();
          }
        } else {
          if (stryMutAct_9fa48("734")) {
            {}
          } else {
            stryCov_9fa48("734");
            // Close connection if no execution ID
            if (stryMutAct_9fa48("736") ? false : stryMutAct_9fa48("735") ? true : (stryCov_9fa48("735", "736"), wsRef.current)) {
              if (stryMutAct_9fa48("737")) {
                {}
              } else {
                stryCov_9fa48("737");
                wsRef.current.close();
                wsRef.current = null;
              }
            }
            setIsConnected(stryMutAct_9fa48("738") ? true : (stryCov_9fa48("738"), false));
          }
        }
        return () => {
          if (stryMutAct_9fa48("739")) {
            {}
          } else {
            stryCov_9fa48("739");
            if (stryMutAct_9fa48("741") ? false : stryMutAct_9fa48("740") ? true : (stryCov_9fa48("740", "741"), reconnectTimeoutRef.current)) {
              if (stryMutAct_9fa48("742")) {
                {}
              } else {
                stryCov_9fa48("742");
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
              }
            }
            if (stryMutAct_9fa48("744") ? false : stryMutAct_9fa48("743") ? true : (stryCov_9fa48("743", "744"), wsRef.current)) {
              if (stryMutAct_9fa48("745")) {
                {}
              } else {
                stryCov_9fa48("745");
                wsRef.current.close();
                wsRef.current = null;
              }
            }
            setIsConnected(stryMutAct_9fa48("746") ? true : (stryCov_9fa48("746"), false));
          }
        };
      }
    }, stryMutAct_9fa48("747") ? [] : (stryCov_9fa48("747"), [executionId, executionStatus, connect]));
    return stryMutAct_9fa48("748") ? {} : (stryCov_9fa48("748"), {
      isConnected
    });
  }
}