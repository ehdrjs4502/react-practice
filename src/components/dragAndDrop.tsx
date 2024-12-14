import React, { useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  UniqueIdentifier,
  useSensors,
  useSensor,
  TouchSensor,
  MouseSensor,
} from "@dnd-kit/core";
import styled from "styled-components";

interface Props {
  sentences: { textBefore: string; textAfter: string }[];
  options: string[];
  correctAnswers: string[];
  showAnswer: boolean;
  activeInteraction: () => void;
}

export function DragAndDrop({ sentences, options, correctAnswers, showAnswer, activeInteraction }: Props) {
  const [availableOptions, setAvailableOptions] = useState(options);
  const [blanks, setBlanks] = useState<{ [key: string]: string }>(
    Object.fromEntries(correctAnswers.map((_, idx) => [`blank${idx + 1}`, ""]))
  );
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = (event: { active: { id: UniqueIdentifier } }) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: { active: { id: UniqueIdentifier }; over: { id: UniqueIdentifier } | null }) => {
    const { active, over } = event;

    if (over) {
      const targetId = over.id;
      const draggedId = active.id;

      setBlanks((prev) => {
        const updatedBlanks = { ...prev };

        // 기존 값 추출
        const currentContent = updatedBlanks[targetId];

        // 블랭크에서 드래그 시작한 경우
        const sourceBlank = Object.keys(prev).find((key) => prev[key] === draggedId);

        if (sourceBlank) {
          updatedBlanks[sourceBlank] = "";
        }

        // 드롭존 간 교체
        if (currentContent && sourceBlank) {
          updatedBlanks[sourceBlank] = currentContent;
        } else if (currentContent) {
          // 기존 값이 옵션으로 돌아감
          setAvailableOptions((prevOptions) => [...prevOptions, currentContent]);
        }

        // 새 드롭존 값 설정
        updatedBlanks[targetId] = draggedId as string;

        return updatedBlanks;
      });

      // 옵션에서 드래그 시작한 경우
      if (!Object.values(blanks).includes(activeId as string)) {
        setAvailableOptions((prevOptions) => prevOptions.filter((option) => option !== activeId));
      }
    }

    setActiveId(null);
    activeInteraction();
  };

  return (
    <Container>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} sensors={sensors}>
        {sentences.map((sentence, idx) => (
          <Paragraph key={idx}>
            {sentence.textBefore}{" "}
            <DropZone
              id={`blank${idx + 1}`}
              blanks={blanks}
              showAnswer={showAnswer}
              correctAnswer={correctAnswers[idx]}
            >
              {showAnswer
                ? correctAnswers[idx]
                : blanks[`blank${idx + 1}`] && (
                    <Draggable id={blanks[`blank${idx + 1}`]}>{blanks[`blank${idx + 1}`]}</Draggable>
                  )}
            </DropZone>{" "}
            {sentence.textAfter}
          </Paragraph>
        ))}

        {!showAnswer && (
          <>
            <Instruction>* 아래 버튼을 드래그하여 올바른 위치에 놓아보세요.</Instruction>
            <ButtonContainer>
              {availableOptions.map((option) => (
                <Draggable key={option} id={option}>
                  {option}
                </Draggable>
              ))}
            </ButtonContainer>
          </>
        )}
      </DndContext>
    </Container>
  );
}

const Draggable = ({ id, children }: { id: UniqueIdentifier; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <DraggableBox ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </DraggableBox>
  );
};

const DropZone = ({
  id,
  blanks,
  correctAnswer,
  showAnswer,
  children,
}: {
  id: string;
  blanks: { [key: string]: string };
  correctAnswer: string;
  showAnswer: boolean;
  children: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const isFilled = !!blanks[id];
  const isCorrect = blanks[id] === correctAnswer;

  return (
    <DropZoneBox ref={setNodeRef} $isOver={isOver} $isFilled={isFilled} $isCorrect={isCorrect} $showAnswer={showAnswer}>
      {children || "\u00A0"}
    </DropZoneBox>
  );
};

const Container = styled.div`
  position: relative;
`;

const Paragraph = styled.p`
  font-size: 15px;
  margin-bottom: 20px;
`;

const DropZoneBox = styled.div<{
  $isOver: boolean;
  $isFilled: boolean;
  $isCorrect: boolean;
  $showAnswer: boolean;
}>`
  display: inline-block;
  width: ${(props) => (props.$showAnswer || props.$isFilled ? "" : "178px")};
  height: ${(props) => (props.$showAnswer || props.$isFilled ? "" : "30px")};
  border: 1px solid ${(props) => (props.$isOver ? "green" : "gray")};
  background-color: ${(props) =>
    props.$showAnswer ? (props.$isCorrect ? "blue" : "red") : props.$isFilled ? "yellow" : "white"};
  text-align: center;
  line-height: 30px;
  margin: 0 5px;
  border-radius: 4px;
  padding: ${(props) => (props.$showAnswer ? "7px 8px" : "0px")};
`;

const DraggableBox = styled.div`
  display: inline-flex;
  padding: 7px 8px;
  background-color: yellow;
  border-radius: 4px;
  cursor: grab;
  text-align: center;
  touch-action: manipulation;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 15px;
`;

const Instruction = styled.p`
  font-size: 15px;
  color: black;
`;
