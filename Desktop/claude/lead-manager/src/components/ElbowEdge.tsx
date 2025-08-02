import React from 'react';
import { EdgeProps, getSmoothStepPath } from 'reactflow';

export const ElbowEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 10,
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path stroke-gray-400 stroke-2 fill-none"
        d={edgePath}
        markerEnd={markerEnd}
      />
    </>
  );
};