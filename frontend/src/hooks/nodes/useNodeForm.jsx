import { useState, useEffect, useRef } from "react";
import { logicalOr, logicalOrToEmptyObject } from "../utils/logicalOr";
function useNodeForm({ selectedNode, onUpdate }) {
  const [nameValue, setNameValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const nameInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  useEffect(() => {
    if (!selectedNode) {
      setNameValue("");
      setDescriptionValue("");
      return;
    }
    const nodeData = logicalOrToEmptyObject(selectedNode.data);
    const nodeName = logicalOr(
      typeof nodeData.name === "string" ? nodeData.name : "",
      logicalOr(typeof nodeData.label === "string" ? nodeData.label : "", ""),
    );
    const nodeDescription = logicalOr(
      typeof nodeData.description === "string" ? nodeData.description : "",
      "",
    );
    if (document.activeElement !== nameInputRef.current) {
      const nameStr = nodeName !== null && nodeName !== void 0 ? nodeName : "";
      setNameValue(nameStr);
    }
    if (document.activeElement !== descriptionInputRef.current) {
      const descStr =
        nodeDescription !== null && nodeDescription !== void 0
          ? nodeDescription
          : "";
      setDescriptionValue(descStr);
    }
  }, [selectedNode]);
  const handleNameChange = (value) => {
    setNameValue(value);
    if (selectedNode) {
      onUpdate("name", value);
    }
  };
  const handleDescriptionChange = (value) => {
    setDescriptionValue(value);
    if (selectedNode) {
      onUpdate("description", value);
    }
  };
  return {
    nameValue,
    descriptionValue,
    nameInputRef,
    descriptionInputRef,
    setNameValue,
    setDescriptionValue,
    handleNameChange,
    handleDescriptionChange,
  };
}
export { useNodeForm };
