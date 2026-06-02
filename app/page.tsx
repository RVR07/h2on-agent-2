"use client";

import { ConversationProvider } from "@elevenlabs/react";
import H2OnWidget from "./components/H2OnWidget";

export default function Home() {
  return (
    <ConversationProvider>
      <H2OnWidget />
    </ConversationProvider>
  );
}
