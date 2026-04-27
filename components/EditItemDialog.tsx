"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { ItineraryItem, Place, SlotKey } from "@/lib/types";
import { Btn, Field, Modal, Select, TextArea, TextInput } from "./Modal";

const SLOTS: SlotKey[] = [
  "transit", "checkin", "checkout", "breakfast", "brunch", "lunch", "snack",
  "dinner", "dessert", "drinks", "coffee", "activity", "sightseeing", "rest",
  "event", "shopping",
];

export function EditItemDialog({
  open,
  initial,
  day,
  places,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  initial: Partial<ItineraryItem> | null; // null = creating
  day: number;
  places: Place[];
  onClose: () => void;
  onSave: (item: Partial<ItineraryItem>) => void;
  onDelete?: () => void;
}) {
  const t = useTranslations("edit");
  const tSlot = useTranslations("slots");
  const tCard = useTranslations("card");

  const isNew = !initial?.id;
  const [form, setForm] = useState<Partial<ItineraryItem>>({});

  useEffect(() => {
    if (open) {
      setForm(
        initial ?? {
          slot: "activity",
          time_hint: "",
          day,
        }
      );
    }
  }, [open, initial, day]);

  const set = <K extends keyof ItineraryItem>(k: K, v: ItineraryItem[K] | null | undefined) =>
    setForm((f) => ({ ...f, [k]: v ?? undefined }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? t("addStop") : t("editStop")}
      size="md"
      footer={
        <>
          {!isNew && onDelete && (
            <Btn variant="danger" onClick={onDelete} className="mr-auto">
              {t("delete")}
            </Btn>
          )}
          <Btn onClick={onClose}>{t("cancel")}</Btn>
          <Btn variant="primary" onClick={() => onSave(form)}>
            {t("save")}
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t("field.time")}>
          <TextInput
            value={form.time_hint ?? ""}
            onChange={(e) => set("time_hint", e.target.value)}
            placeholder="13:30"
            className="mono-num"
          />
        </Field>
        <Field label={t("field.slot")}>
          <Select
            value={(form.slot as string) ?? "activity"}
            onChange={(e) => set("slot", e.target.value as SlotKey)}
          >
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {tSlot(s)}
              </option>
            ))}
          </Select>
        </Field>

        <div className="sm:col-span-2">
          <Field label={t("field.linkedPlace")}>
            <Select
              value={form.place_id ?? ""}
              onChange={(e) => set("place_id", e.target.value || null)}
            >
              <option value="">{t("field.noPlace")}</option>
              {places
                .slice()
                .sort((a, b) => a.name_en.localeCompare(b.name_en))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name_en} · {p.name_zh}
                  </option>
                ))}
            </Select>
          </Field>
        </div>

        <Field label={t("field.titleEn")}>
          <TextInput
            value={form.custom_title_en ?? ""}
            onChange={(e) => set("custom_title_en", e.target.value)}
            placeholder={form.place_id ? "—" : "Free dinner near hotel"}
          />
        </Field>
        <Field label={t("field.titleZh")}>
          <TextInput
            value={form.custom_title_zh ?? ""}
            onChange={(e) => set("custom_title_zh", e.target.value)}
            placeholder={form.place_id ? "—" : "酒店附近食晚飯"}
            className="zh"
          />
        </Field>
        <Field label={t("field.noteEn")}>
          <TextArea
            value={form.custom_note_en ?? ""}
            onChange={(e) => set("custom_note_en", e.target.value)}
            placeholder="≈ 5 min · HK$11.5"
          />
        </Field>
        <Field label={t("field.noteZh")}>
          <TextArea
            value={form.custom_note_zh ?? ""}
            onChange={(e) => set("custom_note_zh", e.target.value)}
            placeholder="約 5 分鐘 · HK$11.5"
            className="zh"
          />
        </Field>
      </div>
      <p className="mt-3 text-[11px] t-faint">
        {tCard("openInMaps")} · {tCard("hours")}: linked place data takes priority over custom fields.
      </p>
    </Modal>
  );
}
