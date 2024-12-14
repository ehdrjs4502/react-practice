import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';

interface Props {
  sentences: any[];
  options: string[];
  activeInteraction: () => void;
  showAnswer: boolean;
  correctAnswers: string[];
}

export function DragAndDrop({
  sentences,
  options,
  correctAnswers,
  activeInteraction,
  showAnswer,
}: Props) {
  const [availableOptions, setAvailableOptions] = useState(options);
  const [blanks, setBlanks] = useState<{ [key: string]: string }>(
    Object.fromEntries(correctAnswers.map((_, idx) => [`blank${idx + 1}`, ''])),
  );

  const [draggingOption, setDraggingOption] = useState<string | null>(null);
  const dragOverlayRef = useRef<HTMLDivElement | null>(null);

  const handlePointerDown = (e: React.PointerEvent | React.TouchEvent, option: string) => {
    e.preventDefault();
    setDraggingOption(option);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (dragOverlayRef.current) {
      dragOverlayRef.current.style.display = 'block';
      dragOverlayRef.current.style.left = `${clientX}px`;
      dragOverlayRef.current.style.top = `${clientY}px`;
      dragOverlayRef.current.textContent = option;
    }
  };

  const handlePointerMove = (e: PointerEvent | TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as PointerEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as PointerEvent).clientY;

    if (draggingOption && dragOverlayRef.current) {
      dragOverlayRef.current.style.left = `${clientX}px`;
      dragOverlayRef.current.style.top = `${clientY}px`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent | React.TouchEvent, blankId?: string) => {
    e.preventDefault();
  
    if (draggingOption) {
      if (blankId) {
        setBlanks(prev => {
          const updatedBlanks = { ...prev };
  
          // 현재 DropZone의 기존 내용을 가져옴
          const currentContent = updatedBlanks[blankId];
  
          // 드래그 시작 위치가 드랍존인지 확인
          const sourceBlank = Object.keys(prev).find(key => prev[key] === draggingOption);
  
          if (sourceBlank) {
            // 이전 DropZone에서 값을 제거
            updatedBlanks[sourceBlank] = '';
          }
  
          // 새 DropZone에 값 추가
          updatedBlanks[blankId] = draggingOption;
  
          // 기존 DropZone 값 복구
          if (currentContent && sourceBlank) {
            updatedBlanks[sourceBlank] = currentContent;
          } else if (currentContent) {
            // 기존 값이 옵션으로 가야 하는 경우
            setAvailableOptions(prevOptions => [...prevOptions, currentContent]);
          }
  
          // 드래그 시작 위치가 옵션인 경우 제거
          if (!sourceBlank) {
            setAvailableOptions(prevOptions =>
              prevOptions.filter(option => option !== draggingOption),
            );
          }
  
          return updatedBlanks;
        });
      } else {
        // 실패 시 드래그된 값을 옵션으로 복구
        setAvailableOptions(prev => {
          if (!prev.includes(draggingOption)) {
            return [...prev, draggingOption];
          }
          return prev;
        });
      }
  
      // 드래그 종료
      setDraggingOption(null);
  
      // 드래그 오버레이 숨김
      if (dragOverlayRef.current) {
        dragOverlayRef.current.style.display = 'none';
      }
  
      activeInteraction();
    }
  };  

  useEffect(() => {
    const moveHandler = (e: PointerEvent | TouchEvent) => handlePointerMove(e);
    window.addEventListener('pointermove', moveHandler);
    window.addEventListener('touchmove', moveHandler);

    return () => {
      window.removeEventListener('pointermove', moveHandler);
      window.removeEventListener('touchmove', moveHandler);
    };
  }, [draggingOption]);

  return (
    <Container>
      <DragOverlay ref={dragOverlayRef} />
      {sentences.map((sentence, idx) => (
        <Paragraph key={idx}>
          {sentence.textBefore}{' '}
          <DropZone
            onPointerUp={e => handlePointerUp(e, `blank${idx + 1}`)}
            onPointerDown={
                blanks[`blank${idx + 1}`]
                ? e => handlePointerDown(e, blanks[`blank${idx + 1}`])
                : undefined
            }
            $isFilled={!!blanks[`blank${idx + 1}`]}
            >
            {blanks[`blank${idx + 1}`] || '\u00A0'}
            </DropZone>
            {' '}
          {sentence.textAfter}
        </Paragraph>
      ))}
      {!showAnswer && (
        <>
          <Instruction>* 아래 버튼을 드래그하여 올바른 위치에 놓아보세요.</Instruction>
          <ButtonContainer>
            {availableOptions.map(option => (
              <DraggableButton
                key={option}
                onPointerDown={e => handlePointerDown(e, option)}
                onTouchStart={e => handlePointerDown(e, option)}
                onPointerUp={e => handlePointerUp(e)}
              >
                {option}
              </DraggableButton>
            ))}
          </ButtonContainer>
        </>
      )}
    </Container>
  );
}

const Container = styled.div``;

const Paragraph = styled.p`
  font-size: 15px;
  margin-bottom: 20px;
`;

const DropZone = styled.div<{
  $isFilled: boolean;
}>`
  display: inline-block;
  width: ${props => (props.$isFilled ? '' : '178px')};
  height: 30px;
  box-sizing: border-box;
  border: ${props => (props.$isFilled ? '' : '1px solid gray')};
  text-align: center;
  border-radius: 4px;
  line-height: 30px;
  margin: 0 5px;
  font-size: 14px;
  background-color: ${props => (props.$isFilled ? 'yellow' : '#fff')};
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 15px;
`;

const DraggableButton = styled.div`
  display: inline-flex;
  padding: 7px 8px;
  box-sizing: border-box;
  background-color: yellow;
  color: black;
  border-radius: 4px;
  cursor: grab;
  text-align: center;
  font-size: 14px;

  &:active {
    cursor: grabbing;
  }
`;

const DragOverlay = styled.div`
  position: absolute;
  display: none;
  background-color: yellow;
  color: black;
  font-size: 14px;
  padding: 5px;
  border-radius: 4px;
  pointer-events: none;
`;

const Instruction = styled.p`
  font-size: 15px;
  color: black;
`;
