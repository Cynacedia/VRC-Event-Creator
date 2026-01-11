import { dom } from "./state.js";
import { applyTranslations, t } from "./i18n/index.js";

export function initDemoControls(api, refreshUpdates) {
  if (!dom.viewAbout) {
    return;
  }
  const settingsSave = document.getElementById("settings-save");
  if (!settingsSave || !settingsSave.parentNode) {
    return;
  }

  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("h3");
  title.textContent = t("demo.controls.title");
  title.setAttribute("data-i18n", "demo.controls.title");
  card.appendChild(title);

  const field = document.createElement("div");
  field.className = "field";

  const label = document.createElement("label");
  label.className = "toggle";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = "demo-update-required";

  const span = document.createElement("span");
  span.textContent = t("demo.controls.updateGateLabel");
  span.setAttribute("data-i18n", "demo.controls.updateGateLabel");

  label.appendChild(input);
  label.appendChild(span);
  field.appendChild(label);

  const hint = document.createElement("div");
  hint.className = "hint";
  hint.textContent = t("demo.controls.updateGateHint");
  hint.setAttribute("data-i18n", "demo.controls.updateGateHint");
  field.appendChild(hint);

  card.appendChild(field);

  settingsSave.parentNode.insertBefore(card, settingsSave);
  applyTranslations(card);

  if (api?.checkForUpdate) {
    api.checkForUpdate().then(result => {
      if (result && typeof result.updateAvailable === "boolean") {
        input.checked = result.updateAvailable;
      }
    });
  }

  input.addEventListener("change", async () => {
    if (api?.setDemoUpdateAvailable) {
      await api.setDemoUpdateAvailable(input.checked);
    }
    if (typeof refreshUpdates === "function") {
      await refreshUpdates();
    }
  });
}
