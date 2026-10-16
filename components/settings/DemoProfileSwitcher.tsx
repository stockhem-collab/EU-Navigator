"use client";

import { useEffect, useState } from "react";
import ConfirmButton from "@/components/ConfirmButton";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { DEMO_PROFILES, demoProfile, DemoProfileId } from "@/lib/data/demoProfiles";
import { activeProfileId, switchProfile } from "@/lib/demoProfile";

/** Picks which municipality the demo is shown as (lib/demoProfile.ts). */
export default function DemoProfileSwitcher() {
  const { t } = useLanguage();
  const os = t.orgSettings;
  const [active, setActive] = useState<DemoProfileId | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => setActive(activeProfileId()), []);
  if (!active) return null;
  const activeName = demoProfile(active).preset.organisationName;

  const onSwitch = (id: DemoProfileId) => {
    try {
      switchProfile(id);
    } catch {
      setFailed(true);
    }
  };

  return (
    <section className="mt-6 rounded-xl border border-gold-300 bg-gold-50 p-5" data-testid="demo-profile">
      <h2 className="font-bold text-navy-900">{os.profileTitle}</h2>
      <p className="mt-1 text-sm text-navy-600">{os.profileHint}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {DEMO_PROFILES.map(({ id, preset }) =>
          id === active ? (
            <span
              key={id}
              aria-current="true"
              className="rounded-md bg-navy-700 px-3 py-2 text-xs font-semibold text-white"
            >
              {preset.organisationName} · {os.profileActive}
            </span>
          ) : (
            <ConfirmButton
              key={id}
              label={os.profileSwitch(preset.organisationName)}
              message={os.confirmProfileSwitch(activeName, preset.organisationName)}
              confirmLabel={os.yesProfileSwitch}
              cancelLabel={t.confirm.cancel}
              onConfirm={() => onSwitch(id)}
              className="rounded-md border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-50"
            />
          ),
        )}
      </div>
      {failed && <p className="mt-2 text-xs font-semibold text-red-700">{os.profileSwitchFailed}</p>}
    </section>
  );
}
