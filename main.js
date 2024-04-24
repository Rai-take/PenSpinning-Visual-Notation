const canvas = document.getElementById("musicCanvas");
const ctx = canvas.getContext("2d");
const pointRadius = 10;
const toggleButton = document.getElementById('toggleOrientation');

let isHorizontal = true;

let state = {
  points: [],
  lines: [],
  isDrawing: false,
  currentLine: {},
};

toggleButton.addEventListener('click', () => {
    if (isHorizontal) {
      canvas.style.transform = "rotate(90deg) translateX(25%)";
      canvas.style.transformOrigin = "center center";
    } else {
      canvas.style.transform = "none";
      canvas.style.transformOrigin = "center center";
    }
    isHorizontal = !isHorizontal;
  });

const drawStaff = () => {
  [...Array(7).keys()].forEach((i) => {
    ctx.moveTo(0, 50 * (i + 1));
    ctx.lineTo(canvas.width, 50 * (i + 1));
  });
  ctx.stroke();
};

const drawPoint = (x, y, isActive) => {
  ctx.beginPath();
  ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
  ctx.fillStyle = isActive ? "black" : "white";
  ctx.fill();
  ctx.strokeStyle = "black";
  ctx.stroke();
};

const drawLine = (fromX, fromY, toX, toY) => {
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(fromX, toY);
  ctx.stroke();
};

const clearCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

const redrawEverything = (state) => {
  clearCanvas();
  drawStaff();
  state.lines.forEach(({ start, end }) => {
    const startPoint = state.points[start];
    const endPoint = state.points[end];
    if (startPoint.active && endPoint.active) {
      drawLine(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
    }
  });
  state.points.forEach(({ x, y, active }) => drawPoint(x, y, active));
};

const getNearestLine = (y) => 50 * Math.round(y / 50);

const togglePointState = (points, index) => {
  const newPoints = [...points];
  newPoints[index] = { ...newPoints[index], active: !newPoints[index].active };
  return newPoints;
};

canvas.addEventListener("mousedown", (e) => {
  const { offsetX, offsetY } = e;
  const nearY = getNearestLine(offsetY);
  const pointIndex = state.points.findIndex(
    (p) => Math.hypot(p.x - offsetX, p.y - nearY) < pointRadius
  );
  if (pointIndex !== -1) {
    state.points = togglePointState(state.points, pointIndex);
  } else if (state.isDrawing) {
    state.points.push({ x: state.currentLine.startX, y: nearY, active: true });
    state.lines.push({
      start: state.points.length - 2,
      end: state.points.length - 1,
    });
    state.isDrawing = false;
  } else {
    state.currentLine = { startX: offsetX, startY: nearY };
    state.points.push({ x: offsetX, y: nearY, active: true });
    state.isDrawing = true;
  }
  redrawEverything(state);
});

canvas.addEventListener("mousemove", (e) => {
  if (state.isDrawing) {
    redrawEverything(state);
    const { offsetX, offsetY } = e;
    drawLine(state.currentLine.startX, state.currentLine.startY, offsetX, getNearestLine(offsetY));
  }
});

redrawEverything(state);
