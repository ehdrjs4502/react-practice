import { useRef, useEffect, MouseEvent } from "react";

const CompassDrawing = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef<boolean>(false);
  const isMovingMarker = useRef<boolean>(false);
  const prevAngle = useRef<number | null>(null);

  const centerX = 400;
  const centerY = 150;
  const radius = 120;

  // 각도를 0~2π 범위로 변환
  const normalizeAngle = (angle: number): number => (angle + Math.PI * 2) % (Math.PI * 2);

  // 두 각도 차이 계산 (가장 짧은 방향으로)
  const getAngleDifference = (a1: number, a2: number): number => {
    let diff = normalizeAngle(a2) - normalizeAngle(a1);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  };

  // 마우스 좌표를 원 기준 각도로 변환
  const getMouseAngle = (e: MouseEvent<HTMLDivElement | HTMLCanvasElement>): number => {
    const rect = containerRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    return normalizeAngle(Math.atan2(mouseY - centerY, mouseX - centerX));
  };

  // 마커 위치 이동 (항상 원의 경계 유지)
  const moveMarker = (angle: number): void => {
    const marker = markerRef.current;
    if (!marker) return;
    const newX = centerX + radius * Math.cos(angle);
    const newY = centerY + radius * Math.sin(angle);
    marker.style.left = `${newX}px`;
    marker.style.top = `${newY}px`;
  };

  // 캔버스에 원의 가이드라인 그리기 (초기 실행)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#ddd";
    ctx.stroke();
  }, []);

  // 마우스 드래그 시작
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.button === 0) {
      isDragging.current = true;
      prevAngle.current = getMouseAngle(e);
    }
  };

  // 우클릭으로 마커 이동
  const handleContextMenu = (e: MouseEvent<HTMLDivElement | HTMLCanvasElement>): void => {
    e.preventDefault();
    isMovingMarker.current = true;
    const angle = getMouseAngle(e);
    moveMarker(angle);
    prevAngle.current = angle;
  };

  // 마우스 이동 시 원호 그리기
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>): void => {
    if (!isDragging.current && !isMovingMarker.current) return;
    const angle = getMouseAngle(e);
    moveMarker(angle);

    if (isDragging.current && prevAngle.current !== null) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const angleDiff = getAngleDifference(prevAngle.current, angle);
      const anticlockwise = angleDiff < 0;

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#000";
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, prevAngle.current, angle, anticlockwise);
      ctx.stroke();

      console.log(centerX, centerY, radius, prevAngle.current, angle, anticlockwise);
    }

    prevAngle.current = angle;
  };

  // 마우스 드래그 종료
  const handleMouseUp = (): void => {
    isDragging.current = false;
    isMovingMarker.current = false;
  };

  return (
    <div
      className="container"
      ref={containerRef}
      style={{
        position: "relative",
        width: "800px",
        height: "1200px",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      <canvas
        ref={canvasRef}
        width="800px"
        height="1200px"
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      />
      <div
        ref={markerRef}
        className="marker"
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          width: "20px",
          height: "20px",
          backgroundColor: "red",
          borderRadius: "50%",
          cursor: "grab",
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
};

export default CompassDrawing;
