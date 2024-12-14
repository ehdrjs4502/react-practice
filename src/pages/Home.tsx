import { Link } from "react-router-dom";
import { DragAndDrop } from "../components/dragAndDrop";
import { useState } from "react";

const Home = () => {
  const [active, setActive] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false)

  const activeInteraction = () => {
    setActive(true)
  }

  return (
    <div>
      <h1>Home 페이지</h1>
      <button onClick={() => setShowAnswer(true)}>정답보기</button>
      <DragAndDrop activeInteraction={activeInteraction} showAnswer={showAnswer} correctAnswers={['테스트1','테스트2']} options={['테스트1','테스트2','테스트3']} sentences={[{textBefore:'asd', textAfter:'asd'},{textBefore:'asd', textAfter:'asd'},{textBefore:'asd', textAfter:'asd'}]}/>
      <Link to="/index">홈으로 이동</Link>
    </div>
  );
};

export default Home; 