const canvas = document.getElementById("musicCanvas");
const ctx = canvas.getContext("2d");
const pointRadius = 10;
const toggleButton = document.getElementById("toggleOrientation");
const eraserButton = document.getElementById("toggleEraserMode");
let isEraserMode = false;

//最初から縦に変換する(暫定対処なのでキャンバスサイズを後で変える)
let isHorizontal = false;
canvas.style.transform = "rotate(90deg) translateX(25%)";
canvas.style.transformOrigin = "center center";

//状態管理
let state = {
  points: [],
  lines: [],
  isDrawing: false,
  currentLine: {},
};

const deletePointAndConnectedElements = (pointIndex) => {
  state.lines = state.lines.filter(
    (line) => line.start !== pointIndex && line.end !== pointIndex
  );

  state.points[pointIndex] = null;

  state.points = state.points.filter((p) => p !== null);

  state.lines.forEach((line) => {
    if (line.start > pointIndex) line.start--;
    if (line.end > pointIndex) line.end--;
  });
};

toggleButton.addEventListener("click", () => {
  if (isHorizontal) {
    canvas.style.transform = "rotate(90deg) translateX(25%)";
    canvas.style.transformOrigin = "center center";
  } else {
    canvas.style.transform = "none";
    canvas.style.transformOrigin = "center center";
  }
  isHorizontal = !isHorizontal;
});

eraserButton.addEventListener("click", () => {
  isEraserMode = !isEraserMode;
  eraserButton.textContent = isEraserMode ? "描画モード" : "削除モード";
});

const drawStaff = () => {
  ctx.beginPath();
  ctx.strokeStyle = "#808080";
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
  ctx.strokeStyle = "black";
  ctx.stroke();

  const lineX = toX + pointRadius; // △の位置を調整する場合はこの値を変更

  const startLine = Math.ceil(Math.min(fromY, toY) / 50);
  const endLine = Math.floor(Math.max(fromY, toY) / 50);
  for (let line = startLine + 1; line < endLine; line++) {
    // 点の位置を含まないようにしてる
    const posY = line * 50.8; //△のよこ軸の位置？
    // const posY = line * 50;
    drawTriangle(lineX, posY);
  }
};

//△の位置が統一されていないけど角度と△の大きさを無理やりいじった版
//こっちにする場合 △のよこ軸の位置？ってコメント書いてあるところを有効化し、line * 50の方をコメントにする
// 掌側

// 三角の回転系がうまくいってないのは、縦モード時の三角頂点を特定できてないからだと思う

const drawTriangle = (x, y) => {
  // △のサイズ
  const triangleHeight = 15.3;
  const triangleBase = 9;

  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y); // 回転の原点を指定
  ctx.rotate(Math.PI / 5.83);
  ctx.moveTo(0, -triangleHeight);
  ctx.lineTo(triangleBase, 0);
  ctx.lineTo(-triangleBase, 0);
  ctx.closePath();
  ctx.strokeStyle = "black";
  ctx.stroke();
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.restore();
};

//三角の位置が統一されているけど角度がおかしい版
// const drawTriangle = (x, y) => {
//   // △のサイズ
//   const triangleHeight = 15;
//   const triangleBase = 9;

//   ctx.beginPath();
//   ctx.moveTo(x, y - triangleHeight);
//   ctx.lineTo(x + triangleBase, y);
//   ctx.lineTo(x - triangleBase, y);
//   ctx.closePath();
//   ctx.strokeStyle = 'black';
//   ctx.stroke();
//   ctx.fillStyle = 'white';
//   ctx.fill();
// };

const clearCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

const redrawEverything = (state) => {
  clearCanvas();
  drawStaff();
  state.lines.forEach((line) => {
    const startPoint = state.points[line.start];
    const endPoint = state.points[line.end];
    if (startPoint && endPoint) {
      drawLine(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
    }
  });
  state.points.forEach((point) => {
    if (point) {
      drawPoint(point.x, point.y, point.active);
    }
  });
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

  // △のクリック判定
  const triangleClicked = state.lines.some((line, index) => {
    const startPoint = state.points[line.start];
    const endPoint = state.points[line.end];
    if (!startPoint || !endPoint) return false; // 点が存在しない場合はスキップ

    const lineX = endPoint.x + pointRadius;
    const startLine = Math.ceil(Math.min(startPoint.y, endPoint.y) / 50);
    const endLine = Math.floor(Math.max(startPoint.y, endPoint.y) / 50);
    for (let line = startLine + 1; line < endLine; line++) {
      const posY = line * 50.8;
      if (Math.hypot(lineX - offsetX, posY - offsetY) < pointRadius) {
        // 線の反対側に反転させる処理 (なぜかできない！)
        [state.points[line.start].y, state.points[line.end].y] = [
          state.points[line.end].y,
          state.points[line.start].y,
        ];
        redrawEverything(state);
        return true;
      }
    }
    return false;
  });

  if (triangleClicked) return; // △がクリックされた場合はここで処理を終了

  if (isEraserMode) {
    const pointIndex = state.points.findIndex(
      (p) => Math.hypot(p.x - offsetX, p.y - nearY) < pointRadius
    );
    if (pointIndex !== -1) {
      deletePointAndConnectedElements(pointIndex);
      redrawEverything(state);
    }
    return;
  }

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
    drawLine(
      state.currentLine.startX,
      state.currentLine.startY,
      offsetX,
      getNearestLine(offsetY)
    );
  }
});

redrawEverything(state);
