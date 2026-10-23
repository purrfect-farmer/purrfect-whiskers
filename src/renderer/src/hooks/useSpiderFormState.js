import { useMemo, useState } from "react";

/** Inputs of the Spider purchase form */
export default function useSpiderFormState() {
  const [count, setCount] = useState(1);
  const [batch, setBatch] = useState(1);
  const [password, setPassword] = useState("");
  const [titlePrefix, setTitlePrefix] = useState("");
  const [startNumber, setStartNumber] = useState(1);
  const [tags, setTags] = useState([]);
  const [enableLocalTelegramSession, setEnableLocalTelegramSession] =
    useState(true);

  return useMemo(
    () => ({
      count,
      setCount,
      batch,
      setBatch,
      password,
      setPassword,
      titlePrefix,
      setTitlePrefix,
      startNumber,
      setStartNumber,
      tags,
      setTags,
      enableLocalTelegramSession,
      setEnableLocalTelegramSession,
    }),
    [
      count,
      batch,
      password,
      titlePrefix,
      startNumber,
      tags,
      enableLocalTelegramSession,
    ],
  );
}
