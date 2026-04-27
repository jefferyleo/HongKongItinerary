"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Category, Place } from "@/lib/types";
import { Btn, Field, Modal, Select, TextArea, TextInput } from "./Modal";

const CATS: Category[] = ["food", "drink", "dessert", "sight", "event", "hotel", "transit"];

export function EditPlaceDialog({
  open,
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  initial: Place | null;
  onClose: () => void;
  onSave: (place: Place) => void;
  onDelete?: () => void;
}) {
  const t = useTranslations("edit");

  const isNew = !initial;
  const [form, setForm] = useState<Place>({
    id: "",
    name_en: "",
    name_zh: "",
    category: "food",
  });

  useEffect(() => {
    if (open) {
      setForm(
        initial ?? {
          id: "",
          name_en: "",
          name_zh: "",
          category: "food",
        }
      );
    }
  }, [open, initial]);

  const set = <K extends keyof Place>(k: K, v: Place[K]) => setForm((f) => ({ ...f, [k]: v }));

  const valid = form.name_en.trim().length > 0 || form.name_zh.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? t("addPlace") : t("editPlace")}
      size="lg"
      footer={
        <>
          {!isNew && onDelete && (
            <Btn variant="danger" onClick={onDelete} className="mr-auto">
              {t("deletePlace")}
            </Btn>
          )}
          <Btn onClick={onClose}>{t("cancel")}</Btn>
          <Btn variant="primary" disabled={!valid} onClick={() => valid && onSave(form)}>
            {t("save")}
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t("field.nameEn")}>
          <TextInput
            value={form.name_en}
            onChange={(e) => set("name_en", e.target.value)}
            placeholder="Tim Ho Wan"
          />
        </Field>
        <Field label={t("field.nameZh")}>
          <TextInput
            value={form.name_zh}
            onChange={(e) => set("name_zh", e.target.value)}
            placeholder="添好運"
            className="zh"
          />
        </Field>
        <Field label={t("field.category")}>
          <Select
            value={form.category}
            onChange={(e) => set("category", e.target.value as Category)}
          >
            {CATS.map((c) => (
              <option key={c} value={c}>
                {t(`category.${c}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("field.hours")}>
          <TextInput
            value={form.hours ?? ""}
            onChange={(e) => set("hours", e.target.value)}
            placeholder="10 am – 9 pm"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t("field.address")}>
            <TextInput
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
              placeholder="9-11 Fuk Wing Street, Sham Shui Po, Hong Kong"
            />
          </Field>
        </div>
        <Field label={t("field.mrtEn")}>
          <TextInput
            value={form.mrt_en ?? ""}
            onChange={(e) => set("mrt_en", e.target.value)}
            placeholder="Sham Shui Po"
          />
        </Field>
        <Field label={t("field.mrtZh")}>
          <TextInput
            value={form.mrt_zh ?? ""}
            onChange={(e) => set("mrt_zh", e.target.value)}
            placeholder="深水埗"
            className="zh"
          />
        </Field>
        <Field label={t("field.exit")}>
          <TextInput
            value={form.exit ?? ""}
            onChange={(e) => set("exit", e.target.value)}
            placeholder="B2"
          />
        </Field>
        <div />
        <Field label={t("field.descriptionEn")}>
          <TextArea
            value={form.description_en ?? ""}
            onChange={(e) => set("description_en", e.target.value)}
            placeholder="Dim sum institution"
          />
        </Field>
        <Field label={t("field.descriptionZh")}>
          <TextArea
            value={form.description_zh ?? ""}
            onChange={(e) => set("description_zh", e.target.value)}
            placeholder="點心"
            className="zh"
          />
        </Field>
      </div>
    </Modal>
  );
}
