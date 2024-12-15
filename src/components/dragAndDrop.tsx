import React, { useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
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
  const [remainingOptions, setRemainingOptions] = useState(options);
  const [dropZoneContents, setDropZoneContents] = useState<{ [key: string]: string }>(
    Object.fromEntries(correctAnswers.map((_, index) => [`dropZone${index + 1}`, ""]))
  );
  const [currentDragId, setCurrentDragId] = useState<UniqueIdentifier | null>(null);

  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = (event: { active: { id: UniqueIdentifier } }) => {
    setCurrentDragId(event.active.id);
  };

  const handleDragEnd = (event: { active: { id: UniqueIdentifier }; over: { id: UniqueIdentifier } | null }) => {
    const { active, over } = event;

    if (over) {
      const draggedItemId = active.id;
      const targetId = over.id;

      if (targetId === "optionContainer") {
        // 옵션 영역으로 드랍된 경우
        setRemainingOptions((prevOptions) =>
          prevOptions.includes(draggedItemId as string) ? prevOptions : [...prevOptions, draggedItemId as string]
        );

        // 드랍존에서 제거
        setDropZoneContents((prev) => {
          const updatedContents = { ...prev };
          const sourceDropZoneId = Object.keys(prev).find((key) => prev[key] === draggedItemId);
          if (sourceDropZoneId) updatedContents[sourceDropZoneId] = "";
          return updatedContents;
        });
      } else {
        setDropZoneContents((previousContents) => {
          const updatedContents = { ...previousContents };

          // 기존 값 추출
          const currentDropZoneContent = updatedContents[targetId];

          // 드래그 시작 위치가 드랍존인지 확인
          const sourceDropZoneId = Object.keys(previousContents).find((key) => previousContents[key] === draggedItemId);

          if (sourceDropZoneId) {
            updatedContents[sourceDropZoneId] = "";
          }

          // 드롭존 간 교체
          if (currentDropZoneContent && sourceDropZoneId) {
            updatedContents[sourceDropZoneId] = currentDropZoneContent;
          } else if (currentDropZoneContent && !sourceDropZoneId) {
            // 기존 값이 옵션으로 돌아가야 하는 경우만 추가
            setRemainingOptions((prevOptions) =>
              prevOptions.includes(currentDropZoneContent) ? prevOptions : [...prevOptions, currentDropZoneContent]
            );
          }

          // 새 드롭존 값 설정
          updatedContents[targetId] = draggedItemId as string;

          return updatedContents;
        });

        // 옵션에서 드래그 시작한 경우
        if (!Object.values(dropZoneContents).includes(currentDragId as string)) {
          setRemainingOptions((prevOptions) => prevOptions.filter((option) => option !== currentDragId));
        }
      }
    }

    setCurrentDragId(null);
    activeInteraction();
  };

  return (
    <Container>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} sensors={sensors}>
        {sentences.map((sentence, index) => (
          <Paragraph key={index}>
            {sentence.textBefore}{" "}
            <DropZone
              id={`dropZone${index + 1}`}
              contents={dropZoneContents}
              showAnswer={showAnswer}
              correctAnswer={correctAnswers[index]}
            >
              {showAnswer
                ? correctAnswers[index]
                : dropZoneContents[`dropZone${index + 1}`] && (
                    <Draggable id={dropZoneContents[`dropZone${index + 1}`]}>
                      {dropZoneContents[`dropZone${index + 1}`]}
                    </Draggable>
                  )}
            </DropZone>{" "}
            {sentence.textAfter}
          </Paragraph>
        ))}

        {!showAnswer && (
          <>
            <Instruction>* 아래 버튼을 드래그하여 올바른 위치에 놓아보세요.</Instruction>
            <OptionContainer id="optionContainer">
              {remainingOptions.map((option) => (
                <Draggable key={option} id={option}>
                  {option}
                </Draggable>
              ))}
            </OptionContainer>
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
  contents,
  correctAnswer,
  showAnswer,
  children,
}: {
  id: string;
  contents: { [key: string]: string };
  correctAnswer: string;
  showAnswer: boolean;
  children: React.ReactNode;
}) => {
  const { setNodeRef } = useDroppable({ id });

  const isFilled = !!contents[id];
  const isCorrect = contents[id] === correctAnswer;

  return (
    <DropZoneBox ref={setNodeRef} $isFilled={isFilled} $isCorrect={isCorrect} $showAnswer={showAnswer}>
      {children || "\u00A0"}
    </DropZoneBox>
  );
};

const OptionContainer = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <OptionBox ref={setNodeRef} $isOver={isOver}>
      {children}
    </OptionBox>
  );
};

const OptionBox = styled.div<{ $isOver: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 15px;
  border: 1px dashed gray;
  padding: 10px;
  min-height: 50px;
  background-color: ${(props) => (props.$isOver ? "#f0f8ff" : "white")};
`;

const Container = styled.div`
  position: relative;
`;

const Paragraph = styled.div`
  font-size: 15px;
  margin-bottom: 20px;
`;

const DropZoneBox = styled.div<{ $isFilled: boolean; $isCorrect: boolean; $showAnswer: boolean }>`
  display: inline-block;
  width: ${(props) => (props.$showAnswer || props.$isFilled ? "" : "178px")};
  height: ${(props) => (props.$showAnswer || props.$isFilled ? "" : "30px")};
  border: 1px solid gray;
  background-color: ${(props) => (props.$showAnswer ? (props.$isCorrect ? "blue" : "red") : "white")};
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
  touch-action: none;
`;

// const OptionContainer = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 6px;
//   margin-top: 15px;
// `;

const Instruction = styled.p`
  font-size: 15px;
  color: black;
`;
