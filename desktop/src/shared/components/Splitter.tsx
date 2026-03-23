export function Splitter(props: { orientation: "vertical" | "horizontal"; onDrag: (delta: number) => void }) {
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const startX = event.clientX;
    const startY = event.clientY;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const delta = props.orientation === "vertical" ? moveEvent.clientX - startX : moveEvent.clientY - startY;
      props.onDrag(delta);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return <div className={`splitter ${props.orientation}`} onPointerDown={handlePointerDown} role="separator" />;
}
