"use client";

import { useEffect, useRef, useState } from "react";
import { HomeScreen } from "@/components/HomeScreen";
import { ConversationScreen } from "@/components/ConversationScreen";
import { CelebrationScreen } from "@/components/CelebrationScreen";
import { useConversationMachine } from "@/hooks/useConversationMachine";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { getChildName, getStorage } from "@/lib/storage/storage";
import { defaultStorage } from "@/lib/storage/schema";

type Screen = "home" | "conversation" | "celebration";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");

  const { value: childName, refresh: refreshChildName } = useLocalStorageState(
    () => getChildName() ?? "",
    "",
  );
  const { value: storage, refresh: refreshStorage } = useLocalStorageState(
    getStorage,
    defaultStorage(),
  );

  const machine = useConversationMachine(
    childName,
    storage.settings.exchangeTarget,
    storage.settings.sfxMuted,
  );
  const lastPhaseRef = useRef(machine.state.phase);
  const [starsEarned, setStarsEarned] = useState(0);

  // Enter the celebration screen the moment the phase first reaches
  // CELEBRATION, and stay there regardless of the machine's own later
  // auto-reset to IDLE — only the Home button (or fallback timer's state
  // reset) should ever navigate away. The exchange count is captured here
  // rather than read live on the celebration screen: the hook's own
  // fallback timer resets it back to 0 a few seconds later, which would
  // otherwise make the star count visibly drop while still on-screen.
  useEffect(() => {
    if (machine.state.phase === "CELEBRATION" && lastPhaseRef.current !== "CELEBRATION") {
      setStarsEarned(machine.state.exchangeCount);
      setScreen("celebration");
    }
    lastPhaseRef.current = machine.state.phase;
  }, [machine.state.phase, machine.state.exchangeCount]);

  const handlePlay = () => {
    machine.startSession();
    setScreen("conversation");
  };

  const handleBackHome = () => {
    machine.finishCelebration();
    refreshStorage();
    setScreen("home");
  };

  if (screen === "celebration") {
    return <CelebrationScreen starsEarned={starsEarned} onBackHome={handleBackHome} />;
  }

  if (screen === "conversation") {
    return (
      <ConversationScreen machine={machine} captionsEnabled={storage.settings.captionsEnabled} />
    );
  }

  return (
    <HomeScreen
      childName={childName}
      streakCount={storage.sessions.streakCount}
      settings={storage.settings}
      onPlay={handlePlay}
      onChanged={() => {
        refreshChildName();
        refreshStorage();
      }}
    />
  );
}
