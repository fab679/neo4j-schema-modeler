import { useState, useCallback } from "react";
import type {
  Node,
  Edge,
  Neo4jNodeData,
  Neo4jEdgeData,
  PropertyType,
} from "../types";
import { DEFAULT_NODE_COLORS } from "../constants";

interface UseSchemaStateProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

export function useSchemaState({
  initialNodes = [],
  initialEdges = [],
}: UseSchemaStateProps = {}) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // Node operations
  const getNodeById = useCallback(
    (id: string) => nodes.find((n) => n.id === id),
    [nodes]
  );

  const addNode = useCallback(
    (position: { x: number; y: number }, data?: Partial<Neo4jNodeData>) => {
      const newNode: Node = {
        id: Date.now().toString(),
        x: position.x,
        y: position.y,
        data: {
          label: data?.label || "NewNode",
          properties: data?.properties || [],
          color:
            data?.color ||
            DEFAULT_NODE_COLORS[nodes.length % DEFAULT_NODE_COLORS.length],
          definition: data?.definition || "",
          propertyPanelPosition: data?.propertyPanelPosition || "auto",
        },
      };
      setNodes((prev) => [...prev, newNode]);
      return newNode;
    },
    [nodes.length]
  );

  const updateNode = useCallback((id: string, updates: Partial<Node>) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
  }, []);

  const updateNodeData = useCallback(
    (id: string, data: Partial<Neo4jNodeData>) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...data } } : n
        )
      );
    },
    []
  );

  const updateNodePosition = useCallback((id: string, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
  }, []);

  const deleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
  }, []);

  const duplicateNode = useCallback(
    (id: string) => {
      const node = nodes.find((n) => n.id === id);
      if (node) {
        const newNode: Node = {
          id: Date.now().toString(),
          x: node.x + 120,
          y: node.y + 60,
          data: {
            ...node.data,
            label: `${node.data.label}_copy`,
            properties: [...node.data.properties],
          },
        };
        setNodes((prev) => [...prev, newNode]);
        return newNode;
      }
      return null;
    },
    [nodes]
  );

  // Edge operations
  const getEdgeById = useCallback(
    (id: string) => edges.find((e) => e.id === id),
    [edges]
  );

  const addEdge = useCallback(
    (sourceId: string, targetId: string, data?: Partial<Neo4jEdgeData>) => {
      const isSelf = sourceId === targetId;
      const newEdge: Edge = {
        id: Date.now().toString(),
        source: sourceId,
        target: targetId,
        data: {
          relationshipType:
            data?.relationshipType || (isSelf ? "SELF_REF" : "RELATES_TO"),
          properties: data?.properties || [],
          color: data?.color || "#6b7280",
          labelStyle: data?.labelStyle || "badge",
        },
      };
      setEdges((prev) => [...prev, newEdge]);
      return newEdge;
    },
    []
  );

  const updateEdgeData = useCallback(
    (id: string, data: Partial<Neo4jEdgeData>) => {
      setEdges((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, data: { ...e.data, ...data } } : e
        )
      );
    },
    []
  );

  const deleteEdge = useCallback((id: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const reverseEdge = useCallback((id: string) => {
    setEdges((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, source: e.target, target: e.source } : e
      )
    );
  }, []);

  // Property operations
  const addNodeProperty = useCallback(
    (nodeId: string, property?: PropertyType) => {
      const newProp: PropertyType = property || {
        name: "newProperty",
        type: "String",
      };
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        updateNodeData(nodeId, {
          properties: [...node.data.properties, newProp],
        });
      }
    },
    [nodes, updateNodeData]
  );

  const updateNodeProperty = useCallback(
    (nodeId: string, index: number, property: PropertyType) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        const props = [...node.data.properties];
        props[index] = property;
        updateNodeData(nodeId, { properties: props });
      }
    },
    [nodes, updateNodeData]
  );

  const deleteNodeProperty = useCallback(
    (nodeId: string, index: number) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        updateNodeData(nodeId, {
          properties: node.data.properties.filter((_, i) => i !== index),
        });
      }
    },
    [nodes, updateNodeData]
  );

  const addEdgeProperty = useCallback(
    (edgeId: string, property?: PropertyType) => {
      const newProp: PropertyType = property || {
        name: "newProperty",
        type: "String",
      };
      const edge = edges.find((e) => e.id === edgeId);
      if (edge) {
        updateEdgeData(edgeId, {
          properties: [...edge.data.properties, newProp],
        });
      }
    },
    [edges, updateEdgeData]
  );

  const updateEdgeProperty = useCallback(
    (edgeId: string, index: number, property: PropertyType) => {
      const edge = edges.find((e) => e.id === edgeId);
      if (edge) {
        const props = [...edge.data.properties];
        props[index] = property;
        updateEdgeData(edgeId, { properties: props });
      }
    },
    [edges, updateEdgeData]
  );

  const deleteEdgeProperty = useCallback(
    (edgeId: string, index: number) => {
      const edge = edges.find((e) => e.id === edgeId);
      if (edge) {
        updateEdgeData(edgeId, {
          properties: edge.data.properties.filter((_, i) => i !== index),
        });
      }
    },
    [edges, updateEdgeData]
  );

  // Bulk operations
  const clearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, []);

  const loadSchema = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    // Node operations
    getNodeById,
    addNode,
    updateNode,
    updateNodeData,
    updateNodePosition,
    deleteNode,
    duplicateNode,
    // Edge operations
    getEdgeById,
    addEdge,
    updateEdgeData,
    deleteEdge,
    reverseEdge,
    // Property operations
    addNodeProperty,
    updateNodeProperty,
    deleteNodeProperty,
    addEdgeProperty,
    updateEdgeProperty,
    deleteEdgeProperty,
    // Bulk operations
    clearAll,
    loadSchema,
  };
}
