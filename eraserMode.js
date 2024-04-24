export const deletePointAndLines = (state, pointIndex) => {
  const affectedLines = state.lines.filter(line => line.start === pointIndex || line.end === pointIndex);
  affectedLines.forEach(line => {
    if (line.start === pointIndex) {
      state.points[line.end].active = false;
    } else {
      state.points[line.start].active = false;
    }
  });
  state.lines = state.lines.filter(line => line.start !== pointIndex && line.end !== pointIndex);
  state.points.splice(pointIndex, 1);
  return state;
};
