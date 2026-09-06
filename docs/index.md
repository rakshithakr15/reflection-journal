🚀 Built something I’ve been wanting to experiment with for a while — a private AI companion for reflection and journaling.

<img width="1279" height="772" alt="image" src="https://github.com/user-attachments/assets/e3d46231-5317-4312-a2c3-b493bfd872b3" />

<img width="1435" height="763" alt="image" src="https://github.com/user-attachments/assets/c9bbf8bb-8c28-4576-978b-d71171e6d7e1" />

As part of the **#AccelerateAIwithCloudRun** cohort, I built a reflection journal that combines **Gemini, Firebase Authentication, Firestore, Secret Manager, and Cloud Run**.

But the interesting part for me wasn’t simply getting an AI response on the screen.

I wanted to answer a more practical question:

**What would it take to make an AI journaling experience that feels genuinely private, reliable, and useful?**

So I built a few things around that idea:

🔐 **Privacy by design**
Users authenticate with Google, and their reflections are isolated under their own Firebase user path. Firestore rules ensure one user cannot access another user's interactions.

🤖 **Gemini-powered conversations**
The app supports different ways of working with your thoughts — reflection, summarization, and brainstorming — rather than treating every prompt the same way.

🧠 **Multi-turn context**
A reflection isn't just a one-shot prompt. Conversations can continue within the same session, with the interaction history persisted in Firestore.

🛡️ **Resilience beyond the happy path**
I added a Gemini fallback strategy so that temporary model/API issues don't immediately break the experience.

☁️ **Cloud Run deployment**
The application runs on Google Cloud Run, while the Gemini API key is kept server-side using **Secret Manager** rather than exposing credentials in the frontend.

✨ One detail I particularly liked building: the user's input is only cleared **after the AI response and Firestore save succeed**. If something fails, the user's thought isn't simply lost.

That small detail made me think more about AI applications as products rather than just demos.

I also created an end-to-end walkthrough covering authentication, reflection sessions, multi-turn conversations, mode switching, search/filtering, title editing, deletion, error recovery, and sign-out.

This project gave me a chance to explore how **Gemini + Google Cloud services can come together to build something that is not only AI-powered, but also secure and production-minded.**

Big learning for me:
**The AI response is only one part of an AI product. Identity, data isolation, reliability, failure handling, and user experience matter just as much.**

#AccelerateAIwithCloudRun #GoogleCloud #Gemini #GoogleAIStudio #CloudRun #Firebase #Firestore #GenerativeAI #AIEngineering
