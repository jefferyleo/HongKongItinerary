"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import type { ItineraryItem, Place, SlotKey } from "@/lib/types";
import {
  deletePlace,
  loadItinerary,
  loadPlaces,
  newItemId,
  newPlaceId,
  persistItinerary,
  reindex,
  removeItem,
  upsertPlace,
  type CloudStatus,
} from "@/lib/itinerary";
import { DayColumn } from "./DayColumn";
import { DayTabs } from "./DayTabs";
import { PlacePool } from "./PlacePool";
import { EditItemDialog } from "./EditItemDialog";
import { EditPlaceDialog } from "./EditPlaceDialog";
import { ItinerarySearch } from "./ItinerarySearch";

const DAYS = [1, 2, 3, 4, 5, 6, 7];

function StatusPill({
  cloud,
  saveState,
  saving,
  saved,
}: {
  cloud: CloudStatus;
  saveState: "idle" | "saving" | "saved";
  saving: string;
  saved: string;
}) {
  const cfg = {
    cloud: { dot: "bg-emerald-500", label: "Cloud · synced", title: "Saving to Supabase" },
    local: { dot: "bg-amber-500", label: "Local only", title: "No Supabase configured — using localStorage" },
    error: { dot: "bg-rose-500", label: "Cloud error · local fallback", title: "Supabase reachable but rejected the request — see browser console" },
  }[cloud];

  const showSave = saveState !== "idle";
  return (
    <span
      className="glass-pill inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] whitespace-nowrap"
      title={cfg.title}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${saveState === "saving" ? "animate-pulse" : ""}`}
        aria-hidden
      />
      <span>{cfg.label}</span>
      <span
        className={`mono-num t-mute transition-all ${
          showSave ? "opacity-100 ml-0.5" : "opacity-0 w-0 ml-0 overflow-hidden"
        }`}
        aria-live="polite"
      >
        {saveState === "saving" ? `· ${saving}` : saveState === "saved" ? `· ✓ ${saved}` : ""}
      </span>
    </span>
  );
}

function inferSlot(category: Place["category"]): SlotKey {
  switch (category) {
    case "food": return "lunch";
    case "drink": return "drinks";
    case "dessert": return "dessert";
    case "sight": return "sightseeing";
    case "event": return "event";
    case "hotel": return "checkin";
    default: return "activity";
  }
}

function readDayFromHash(): number {
  if (typeof window === "undefined") return 1;
  const m = window.location.hash.match(/day-(\d)/);
  if (!m) return 1;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= 7 ? n : 1;
}

export function ItineraryBoard() {
  const t = useTranslations("drag");
  const tEdit = useTranslations("edit");

  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [cloud, setCloud] = useState<CloudStatus>("local");

  const [editingItem, setEditingItem] = useState<{ initial: Partial<ItineraryItem> | null } | null>(null);
  const [editingPlace, setEditingPlace] = useState<{ initial: Place | null } | null>(null);

  useEffect(() => {
    setActiveDay(readDayFromHash());
    const onHash = () => setActiveDay(readDayFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    (async () => {
      // Load places FIRST so the cloud table is populated before
      // itinerary_items tries to satisfy its place_id foreign key.
      const { places: pl, source: plSrc } = await loadPlaces();
      setPlaces(pl);
      const { items: it, source: itSrc } = await loadItinerary();
      setItems(it);
      // Worst of the two wins (cloud > local > error).
      const order: Record<CloudStatus, number> = { cloud: 0, local: 1, error: 2 };
      setCloud(order[itSrc] >= order[plSrc] ? itSrc : plSrc);
    })();
  }, []);

  const placeMap = useMemo(() => {
    const m = new Map<string, Place>();
    for (const p of places) m.set(p.id, p);
    return m;
  }, [places]);

  const itemsByDay = useMemo(() => {
    const m = new Map<number, ItineraryItem[]>();
    for (const d of DAYS) m.set(d, []);
    for (const it of items) m.get(it.day)?.push(it);
    for (const d of DAYS) m.get(d)!.sort((a, b) => a.position - b.position);
    return m;
  }, [items]);

  const counts = useMemo(() => {
    const c: Record<number, number> = {};
    for (const d of DAYS) c[d] = itemsByDay.get(d)?.length ?? 0;
    return c;
  }, [itemsByDay]);

  const scheduledPlaceIds = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) if (it.place_id) s.add(it.place_id);
    return s;
  }, [items]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const persist = async (next: ItineraryItem[]) => {
    setSaveState("saving");
    try {
      const status = await persistItinerary(next);
      setCloud(status);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1200);
    } catch (e) {
      console.error("[persist] threw:", e);
      setCloud("error");
      setSaveState("idle");
    }
  };

  const setDay = (d: number) => {
    setActiveDay(d);
    if (typeof window !== "undefined") {
      history.replaceState(null, "", `#day-${d}`);
    }
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const activeData = active.data.current as
      | { type: "item"; item: ItineraryItem }
      | { type: "pool-item"; place: Place }
      | undefined;
    const overData = over.data.current as
      | { type: "item"; item: ItineraryItem }
      | { type: "day"; day: number }
      | { type: "pool" }
      | undefined;

    if (activeData?.type === "pool-item") {
      const place = activeData.place;
      let targetDay = activeDay;
      let insertIndex = (itemsByDay.get(targetDay)?.length ?? 0);
      if (overData?.type === "day") {
        targetDay = overData.day;
        insertIndex = (itemsByDay.get(targetDay)?.length ?? 0);
      } else if (overData?.type === "item") {
        targetDay = overData.item.day;
        const list = itemsByDay.get(targetDay) ?? [];
        insertIndex = list.findIndex((i) => i.id === overData.item.id);
      }
      const newItem: ItineraryItem = {
        id: newItemId(),
        day: targetDay,
        position: insertIndex + 1,
        slot: inferSlot(place.category),
        place_id: place.id,
      };
      const dayList = (itemsByDay.get(targetDay) ?? []).slice();
      dayList.splice(insertIndex, 0, newItem);
      const otherItems = items.filter((i) => i.day !== targetDay);
      const next = reindex([...otherItems, ...dayList]);
      setItems(next);
      setDay(targetDay);
      await persist(next);
      return;
    }

    if (activeData?.type === "item" && overData?.type === "pool") {
      const id = activeData.item.id;
      const next = reindex(items.filter((i) => i.id !== id));
      setItems(next);
      await removeItem(id);
      await persist(next);
      return;
    }

    if (activeData?.type === "item") {
      const moving = activeData.item;
      let targetDay = moving.day;
      let targetIndex = -1;

      if (overData?.type === "day") {
        targetDay = overData.day;
        targetIndex = itemsByDay.get(targetDay)?.length ?? 0;
      } else if (overData?.type === "item") {
        targetDay = overData.item.day;
        const list = itemsByDay.get(targetDay) ?? [];
        targetIndex = list.findIndex((i) => i.id === overData.item.id);
      } else {
        return;
      }

      let next: ItineraryItem[];
      if (targetDay === moving.day) {
        const list = (itemsByDay.get(targetDay) ?? []).slice();
        const fromIdx = list.findIndex((i) => i.id === moving.id);
        if (fromIdx === -1 || targetIndex === -1) return;
        const reordered = arrayMove(list, fromIdx, targetIndex);
        const others = items.filter((i) => i.day !== targetDay);
        next = reindex([...others, ...reordered]);
      } else {
        const sourceList = (itemsByDay.get(moving.day) ?? []).filter((i) => i.id !== moving.id);
        const targetList = (itemsByDay.get(targetDay) ?? []).slice();
        const moved = { ...moving, day: targetDay };
        if (targetIndex < 0 || targetIndex > targetList.length) targetIndex = targetList.length;
        targetList.splice(targetIndex, 0, moved);
        const others = items.filter((i) => i.day !== moving.day && i.day !== targetDay);
        next = reindex([...others, ...sourceList, ...targetList]);
        setDay(targetDay);
      }
      setItems(next);
      await persist(next);
    }
  };

  const handleRemove = async (id: string) => {
    const next = reindex(items.filter((i) => i.id !== id));
    setItems(next);
    await removeItem(id);
    await persist(next);
  };

  const handleEditItem = (item: ItineraryItem) => setEditingItem({ initial: item });
  const handleAddStop = () => setEditingItem({ initial: null });

  const handleSaveItem = async (form: Partial<ItineraryItem>) => {
    const isNew = !form.id;
    const targetDay = form.day ?? activeDay;
    let next: ItineraryItem[];
    if (isNew) {
      const dayList = (itemsByDay.get(targetDay) ?? []).slice();
      const created: ItineraryItem = {
        id: newItemId(),
        day: targetDay,
        position: dayList.length + 1,
        slot: (form.slot as SlotKey) ?? "activity",
        time_hint: form.time_hint || undefined,
        place_id: form.place_id || undefined,
        custom_title_en: form.custom_title_en || undefined,
        custom_title_zh: form.custom_title_zh || undefined,
        custom_note_en: form.custom_note_en || undefined,
        custom_note_zh: form.custom_note_zh || undefined,
      };
      const others = items.filter((i) => i.day !== targetDay);
      next = reindex([...others, ...dayList, created]);
    } else {
      next = items.map((i) =>
        i.id === form.id
          ? {
              ...i,
              ...form,
              time_hint: form.time_hint || undefined,
              place_id: form.place_id || undefined,
              custom_title_en: form.custom_title_en || undefined,
              custom_title_zh: form.custom_title_zh || undefined,
              custom_note_en: form.custom_note_en || undefined,
              custom_note_zh: form.custom_note_zh || undefined,
            }
          : i
      );
    }
    setItems(next);
    setEditingItem(null);
    await persist(next);
  };

  const handleDeleteItem = async () => {
    if (!editingItem?.initial?.id) return;
    const id = editingItem.initial.id;
    setEditingItem(null);
    await handleRemove(id);
  };

  // Place catalog actions
  const handleAddPlace = () => setEditingPlace({ initial: null });
  const handleEditPlace = (place: Place) => setEditingPlace({ initial: place });

  const handleSavePlace = async (place: Place) => {
    const id = place.id || newPlaceId();
    const toSave: Place = { ...place, id };
    const { places: nextPlaces, source } = await upsertPlace(toSave, places);
    setPlaces(nextPlaces);
    setCloud(source);
    setEditingPlace(null);
  };

  const handleDeletePlace = async () => {
    const id = editingPlace?.initial?.id;
    if (!id) return;
    if (!window.confirm(tEdit("confirmDeletePlace"))) return;
    const { places: nextPlaces, source } = await deletePlace(id, places);
    setPlaces(nextPlaces);
    setCloud(source);
    // Unlink from any items.
    const cleaned = items.map((i) => (i.place_id === id ? { ...i, place_id: undefined } : i));
    setItems(cleaned);
    await persist(cleaned);
    setEditingPlace(null);
  };

  const activeItem = activeId ? items.find((i) => i.id === activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <DayTabs activeDay={activeDay} onChange={setDay} counts={counts} />

      <div className="flex items-center mt-4 mb-3 px-1 gap-3">
        <p className="text-[12px] t-mute flex-1 min-w-0 truncate">{t("hint")}</p>
        <ItinerarySearch
          items={items}
          placeMap={placeMap}
          onJump={(d, itemId) => {
            setDay(d);
            setTimeout(() => {
              const el = document.getElementById(`item-${itemId}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("flash-highlight");
                setTimeout(() => el.classList.remove("flash-highlight"), 1600);
              }
            }, 60);
          }}
        />
        <StatusPill
          cloud={cloud}
          saveState={saveState}
          saving={t("saving")}
          saved={t("saved")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div>
          <DayColumn
            key={activeDay}
            day={activeDay}
            items={itemsByDay.get(activeDay) ?? []}
            places={placeMap}
            onRemove={handleRemove}
            onEdit={handleEditItem}
            onAdd={handleAddStop}
          />
        </div>
        <PlacePool
          places={places}
          scheduledIds={scheduledPlaceIds}
          onAddPlace={handleAddPlace}
          onEditPlace={handleEditPlace}
        />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="glass-soft px-4 py-3 max-w-md text-[13px] font-semibold tracking-tight">
            {placeMap.get(activeItem.place_id ?? "")?.name_en ??
              activeItem.custom_title_en ??
              activeItem.custom_title_zh ??
              "—"}
          </div>
        ) : null}
      </DragOverlay>

      <EditItemDialog
        open={!!editingItem}
        initial={editingItem?.initial ?? null}
        day={activeDay}
        places={places}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveItem}
        onDelete={editingItem?.initial?.id ? handleDeleteItem : undefined}
      />

      <EditPlaceDialog
        open={!!editingPlace}
        initial={editingPlace?.initial ?? null}
        onClose={() => setEditingPlace(null)}
        onSave={handleSavePlace}
        onDelete={editingPlace?.initial?.id ? handleDeletePlace : undefined}
      />
    </DndContext>
  );
}
