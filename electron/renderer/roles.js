import { state } from "./state.js";

function getRoleId(role) {
  return role?.id || role?.roleId || role?.groupRoleId || role?.groupRoleID || null;
}

function getRoleName(role) {
  return role?.name || role?.displayName || role?.title || "Role";
}

function isManagementRole(role) {
  return Boolean(
    role?.isManagementRole
    ?? role?.isManagement
    ?? role?.isModeratorRole
    ?? role?.isOwnerRole
  );
}

export function normalizeRoleList(rawRoles) {
  const list = Array.isArray(rawRoles)
    ? rawRoles
    : Array.isArray(rawRoles?.roles)
      ? rawRoles.roles
      : Array.isArray(rawRoles?.data)
        ? rawRoles.data
        : [];
  return list
    .map((role, index) => {
      const id = getRoleId(role);
      if (!id) {
        return null;
      }
      return {
        id,
        name: getRoleName(role),
        isManagement: isManagementRole(role),
        order: Number.isFinite(role?.order) ? role.order : null,
        index
      };
    })
    .filter(Boolean);
}

export async function fetchGroupRoles(api, groupId) {
  if (!groupId) {
    return [];
  }
  if (state.groupRoles?.[groupId]) {
    return state.groupRoles[groupId];
  }
  if (!api?.getGroupRoles) {
    return [];
  }
  const roles = await api.getGroupRoles({ groupId });
  const normalized = normalizeRoleList(roles);
  state.groupRoles[groupId] = normalized;
  return normalized;
}

function sortByRoleOrder(roles) {
  return roles.slice().sort((a, b) => {
    const aOrder = typeof a.order === "number" ? a.order : null;
    const bOrder = typeof b.order === "number" ? b.order : null;
    if (aOrder !== null && bOrder !== null && aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    if (aOrder !== null && bOrder === null) {
      return -1;
    }
    if (aOrder === null && bOrder !== null) {
      return 1;
    }
    return a.index - b.index;
  });
}

export function renderRoleList({ container, roles, selectedIds, labels, onChange }) {
  if (!container) {
    return;
  }
  const safeRoles = Array.isArray(roles) ? roles : [];
  const selection = new Set(selectedIds || []);
  const updateSelection = next => {
    onChange(next);
    renderRoleList({
      container,
      roles: safeRoles,
      selectedIds: next,
      labels,
      onChange
    });
  };

  container.innerHTML = "";
  const allRow = document.createElement("label");
  allRow.className = "role-item is-all";
  const allText = document.createElement("span");
  allText.textContent = labels.allAccess;
  const allToggle = document.createElement("input");
  allToggle.type = "checkbox";
  allToggle.checked = selection.size === 0;
  allToggle.addEventListener("change", () => updateSelection([]));
  allRow.appendChild(allText);
  allRow.appendChild(allToggle);
  container.appendChild(allRow);

  if (!safeRoles.length) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = labels.noRoles;
    container.appendChild(empty);
    return;
  }

  const managementRoles = [];
  const memberRoles = [];
  safeRoles.forEach(role => {
    if (role.isManagement) {
      managementRoles.push(role);
    } else {
      memberRoles.push(role);
    }
  });

  const renderSection = (title, sectionRoles) => {
    if (!sectionRoles.length) {
      return;
    }
    const titleEl = document.createElement("div");
    titleEl.className = "role-section-title";
    titleEl.textContent = title;
    container.appendChild(titleEl);

    sortByRoleOrder(sectionRoles).forEach(role => {
      const row = document.createElement("label");
      row.className = "role-item";
      const label = document.createElement("span");
      label.textContent = role.name;
      const toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.checked = selection.has(role.id);
      toggle.addEventListener("change", () => {
        const next = new Set(selectedIds || []);
        if (toggle.checked) {
          next.add(role.id);
        } else {
          next.delete(role.id);
        }
        updateSelection(Array.from(next));
      });
      row.appendChild(label);
      row.appendChild(toggle);
      container.appendChild(row);
    });
  };

  renderSection(labels.managementRoles, managementRoles);
  renderSection(labels.roles, memberRoles);
}
