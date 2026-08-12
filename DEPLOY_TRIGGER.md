# Deploy Trigger

2026-08-12 — force production build to promote the assistant-ui ChatWidget (PR #99) to production.

Production had been stuck on the pre-assistant-ui build (3f8b128) because the post-merge deploy was eaten by the Vercel spend-management pause. Pause now lifted; this commit forces a fresh production build of main.

main HEAD verified: components/ChatWidget.tsx imports @assistant-ui/react + useExternalStoreRuntime, zero dangerouslySetInnerHTML.
