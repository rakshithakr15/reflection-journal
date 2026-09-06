import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { sanitizeFirestoreData } from './lib/sanitizer';
import { JournalInteraction, ReflectionMode, ChatMessage, GeminiReflectResponse } from './types';
import { Navbar } from './components/Navbar';
import { AuthLanding } from './components/AuthLanding';
import { HistorySidebar } from './components/HistorySidebar';
import { JournalEditor } from './components/JournalEditor';
import { ErrorBanner } from './components/ErrorBanner';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Firestore Interactions State
  const [interactions, setInteractions] = useState<JournalInteraction[]>([]);
  const [activeInteractionId, setActiveInteractionId] = useState<string | null>(null);
  const [firestoreLoading, setFirestoreLoading] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Error Handling & Recovery
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingRetryAction, setPendingRetryAction] = useState<(() => Promise<void>) | null>(null);

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setInteractions([]);
        setActiveInteractionId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Isolated Firestore Listener for Authenticated User
  useEffect(() => {
    if (!user) return;

    setFirestoreLoading(true);
    setErrorMessage(null);

    // Strict path isolation: /users/{userId}/interactions
    const interactionsRef = collection(db, 'users', user.uid, 'interactions');
    const q = query(interactionsRef, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: JournalInteraction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            userId: data.userId || user.uid,
            title: data.title || 'Untitled Reflection',
            category: data.category || 'reflection',
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
            messages: Array.isArray(data.messages) ? data.messages : [],
            summary: data.summary,
          });
        });

        setInteractions(items);
        setFirestoreLoading(false);

        // Auto-select latest or maintain active
        setActiveInteractionId((prev) => {
          if (prev && items.some((i) => i.id === prev)) {
            return prev;
          }
          return items.length > 0 ? items[0].id : null;
        });
      },
      (error) => {
        console.error('Firestore listener error:', error);
        setFirestoreLoading(false);
        setErrorMessage(
          `Unable to sync reflections with Firestore: ${error.message}. Verify that database security rules allow read/write for your account.`
        );
      }
    );

    return () => unsubscribe();
  }, [user]);

  const activeInteraction =
    interactions.find((item) => item.id === activeInteractionId) || null;

  // 3. Send Message and Persist to Firestore with Guaranteed Transaction Verification
  const handleSendMessage = async (
    promptText: string,
    mode: ReflectionMode
  ): Promise<boolean> => {
    if (!user) {
      setErrorMessage('You must be signed in to submit reflections.');
      return false;
    }

    setIsProcessingAI(true);
    setErrorMessage(null);

    try {
      const isNewThread = !activeInteraction;
      const historyPayload = activeInteraction
        ? activeInteraction.messages.map((m) => ({
            role: m.role,
            content: m.content,
          }))
        : [];

      // Call server-side Gemini API proxy
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptText,
          mode,
          history: historyPayload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Server returned error status: ${response.status}`
        );
      }

      const geminiResult: GeminiReflectResponse = await response.json();

      // Formulate messages
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: promptText,
        timestamp: Date.now(),
        mode,
      };

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: geminiResult.reply,
        timestamp: Date.now(),
      };

      setIsSaving(true);

      if (isNewThread) {
        // Create new document reference in user-isolated path
        const interactionsColl = collection(db, 'users', user.uid, 'interactions');
        const newDocRef = doc(interactionsColl);

        const newInteractionData: JournalInteraction = {
          id: newDocRef.id,
          userId: user.uid,
          title:
            geminiResult.suggestedTitle ||
            (promptText.length > 35 ? `${promptText.slice(0, 35)}...` : promptText),
          category: mode,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [userMsg, assistantMsg],
        };

        // Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
        const sanitized = sanitizeFirestoreData(newInteractionData);
        await setDoc(newDocRef, sanitized);

        setActiveInteractionId(newDocRef.id);
      } else {
        // Update existing document
        const existingDocRef = doc(
          db,
          'users',
          user.uid,
          'interactions',
          activeInteraction.id
        );

        const updatedMessages = [...activeInteraction.messages, userMsg, assistantMsg];
        const updateData = sanitizeFirestoreData({
          messages: updatedMessages,
          updatedAt: Date.now(),
          category: mode,
        });

        await updateDoc(existingDocRef, updateData);
      }

      setIsSaving(false);
      setIsProcessingAI(false);
      return true; // Successfully saved
    } catch (err: any) {
      console.error('Error during reflection generation or persistence:', err);
      setIsSaving(false);
      setIsProcessingAI(false);

      const friendlyMsg =
        err?.message || 'An unexpected error occurred while communicating with Gemini or Firestore.';
      setErrorMessage(`Reflection could not be saved: ${friendlyMsg}`);

      // Provide retry action
      setPendingRetryAction(() => async () => {
        setErrorMessage(null);
        await handleSendMessage(promptText, mode);
      });

      return false; // Retain user input in the editor
    }
  };

  // 4. Update Interaction Title
  const handleUpdateTitle = async (newTitle: string) => {
    if (!user || !activeInteraction) return;

    try {
      const docRef = doc(db, 'users', user.uid, 'interactions', activeInteraction.id);
      await updateDoc(
        docRef,
        sanitizeFirestoreData({
          title: newTitle,
          updatedAt: Date.now(),
        })
      );
    } catch (err: any) {
      console.error('Failed to update reflection title:', err);
      setErrorMessage(`Failed to update title: ${err.message}`);
    }
  };

  // 5. Delete Interaction
  const handleDeleteInteraction = async (id: string) => {
    if (!user) return;

    try {
      const docRef = doc(db, 'users', user.uid, 'interactions', id);
      await deleteDoc(docRef);

      if (activeInteractionId === id) {
        const remaining = interactions.filter((i) => i.id !== id);
        setActiveInteractionId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: any) {
      console.error('Failed to delete interaction:', err);
      setErrorMessage(`Failed to delete reflection: ${err.message}`);
    }
  };

  // 6. Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // 7. Loading Splash
  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F9F7F2]">
        <div className="flex flex-col items-center gap-3 text-[#5A5A58]">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E6E1D3] border-t-[#7D8471]" />
          <span className="text-xs font-medium tracking-wide">Initializing secure session...</span>
        </div>
      </div>
    );
  }

  // 8. Unauthenticated User Landing Page
  if (!user) {
    return <AuthLanding onAuthSuccess={() => {}} />;
  }

  // 9. Authenticated Dashboard
  return (
    <div id="reflection-app" className="flex h-screen w-screen flex-col bg-[#F9F7F2] text-[#3A3A38] overflow-hidden">
      <Navbar user={user} onSignOut={handleSignOut} isSaving={isSaving} />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* History Sidebar */}
        <HistorySidebar
          interactions={interactions}
          activeInteractionId={activeInteractionId}
          onSelectInteraction={(id) => setActiveInteractionId(id)}
          onNewInteraction={() => setActiveInteractionId(null)}
          onDeleteInteraction={handleDeleteInteraction}
          isLoading={firestoreLoading}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Workspace Container */}
        <main className="flex flex-1 flex-col overflow-hidden relative">
          {errorMessage && (
            <div className="p-4 pb-0">
              <ErrorBanner
                message={errorMessage}
                onRetry={
                  pendingRetryAction
                    ? async () => {
                        const action = pendingRetryAction;
                        setPendingRetryAction(null);
                        await action();
                      }
                    : undefined
                }
                onDismiss={() => {
                  setErrorMessage(null);
                  setPendingRetryAction(null);
                }}
              />
            </div>
          )}

          <JournalEditor
            interaction={activeInteraction}
            onSendMessage={handleSendMessage}
            onUpdateTitle={handleUpdateTitle}
            isProcessing={isProcessingAI}
            onToggleSidebarMobile={() => setIsMobileSidebarOpen((prev) => !prev)}
          />
        </main>
      </div>
    </div>
  );
}
