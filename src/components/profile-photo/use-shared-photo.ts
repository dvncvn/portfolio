"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { INITIAL_PHOTO, parsePhotoEdit, photoFingerprint, type PhotoEdit, type PhotoRecipe } from "@/lib/shared-photo";
import { createPhotoEditId } from "@/lib/photo-edit-id";

type PendingSave = { id: string; recipe: PhotoRecipe; shareLocation: boolean };
type SaveStatus = "loading" | "idle" | "saving" | "saved" | "error";

export function useSharedPhoto() {
  const [recipe, setRecipe] = useState<PhotoRecipe>(INITIAL_PHOTO);
  const recipeRef = useRef(recipe);
  const touched = useRef(false);
  const baseline = useRef(photoFingerprint(INITIAL_PHOTO));
  const [savedEdit, setSavedEdit] = useState<PhotoEdit | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [shareLocation, setShareLocation] = useState(true);
  const [status, setStatus] = useState<SaveStatus>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const pending = useRef<PendingSave | null>(null);
  const saving = useRef(false);
  const saveStarted = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/photo", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Load failed");
        const data = await response.json();
        const edit = data.current ? parsePhotoEdit(data.current) : null;
        if (controller.signal.aborted) return;
        setLocation(typeof data.location === "string" ? data.location : null);
        // A late initial response must never roll back a new edit or save.
        if (saveStarted.current) return;
        setSavedEdit(edit);
        baseline.current = photoFingerprint(edit?.recipe ?? INITIAL_PHOTO);
        if (!touched.current && edit) {
          recipeRef.current = edit.recipe;
          setRecipe(edit.recipe);
        }
        setStatus("idle");
      } catch {
        if (controller.signal.aborted || saveStarted.current) return;
        setStatus("error");
        setMessage("Couldn't load the last edit. You can still play with the photo.");
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  const changeRecipe = useCallback((update: (current: PhotoRecipe) => PhotoRecipe) => {
    touched.current = true;
    const next = update(recipeRef.current);
    recipeRef.current = next;
    setRecipe(next);
  }, []);

  const saveOnClose = useCallback(async () => {
    try {
      const snapshot = recipeRef.current;
      if (!touched.current || (!saving.current && photoFingerprint(snapshot) === baseline.current)) return;
      // Coalesce quick open/edit/close cycles; an older response cannot replace newer local settings.
      pending.current = { id: createPhotoEditId(), recipe: snapshot, shareLocation };
    } catch {
      setStatus("error");
      setMessage("Couldn't prepare this edit to save. Open and close the controls to try again.");
      return;
    }
    if (saving.current) return;
    saving.current = true;
    saveStarted.current = true;
    setStatus("saving");
    setMessage(null);
    try {
      while (pending.current) {
        const request = pending.current;
        pending.current = null;
        if (photoFingerprint(request.recipe) === baseline.current) continue;
        let response: Response | undefined;
        for (let attempt = 0; attempt < 3; attempt++) {
          response = await fetch("/api/photo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
            keepalive: true,
            signal: AbortSignal.timeout(15000),
          });
          if (response.status !== 429 || attempt === 2) break;
          const seconds = Math.min(5, Math.max(1, Number(response.headers.get("Retry-After")) || 1));
          await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
        }
        if (!response?.ok) throw new Error("Save failed");
        const data = await response.json();
        const edit = parsePhotoEdit(data.current);
        baseline.current = photoFingerprint(edit.recipe);
        setSavedEdit(edit);
      }
      setStatus("saved");
    } catch {
      pending.current = null;
      setStatus("error");
      setMessage("Couldn't save. Open and close the controls to try again.");
    } finally { saving.current = false; }
  }, [shareLocation]);

  return { recipe, changeRecipe, savedEdit, location, shareLocation, setShareLocation, status, message, saveOnClose };
}
