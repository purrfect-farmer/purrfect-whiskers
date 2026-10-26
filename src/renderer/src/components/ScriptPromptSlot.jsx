import useScriptRunStore, {
  selectPrompt,
  selectWaiting,
} from "../store/useScriptRunStore";

import ScriptPrompt from "./ScriptPrompt";
import { memo } from "react";

/** The oldest waiting prompt of the script run, if any */
export default memo(function ScriptPromptSlot({ onAnswer }) {
  const prompt = useScriptRunStore(selectPrompt);
  const waiting = useScriptRunStore(selectWaiting);

  return prompt ? (
    <ScriptPrompt
      key={prompt.id}
      prompt={prompt}
      waiting={waiting}
      onAnswer={onAnswer}
    />
  ) : null;
});
