import { createSlice } from "@reduxjs/toolkit";
import { fetchExecutionsRequested } from "./executionsActions";

/** Normalize status for list UI (API may use enums or mixed casing). */
function normalizeExecutionListItem(raw) {
  if (!raw || typeof raw !== "object") {
    return raw;
  }
  let status = raw.status;
  if (typeof status !== "string") {
    if (status && typeof status === "object" && status.value != null) {
      status = String(status.value);
    } else {
      status = String(status ?? "");
    }
  }
  let s = status.toLowerCase().trim();
  if (s === "canceled") {
    s = "cancelled";
  }
  if (!s) {
    const err =
      raw.error != null && String(raw.error).trim() !== "";
    const done =
      raw.completed_at != null && String(raw.completed_at).trim() !== "";
    if (err && done) {
      s = "failed";
    } else {
      s = "pending";
    }
  }
  return {
    ...raw,
    status: s,
  };
}

const initialState = {
  status: "idle",
  items: [],
  error: null,
};

const executionsSlice = createSlice({
  name: "executions",
  initialState,
  reducers: {
    resetExecutions: () => ({ ...initialState }),
    fetchSuccess: (state, action) => {
      state.status = "success";
      const payload = action.payload;
      state.items = Array.isArray(payload)
        ? payload.map(normalizeExecutionListItem)
        : [];
      state.error = null;
    },
    fetchFailed: (state, action) => {
      state.status = "error";
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchExecutionsRequested, (state) => {
      state.status = "pending";
      state.error = null;
    });
  },
});

export const { resetExecutions, fetchSuccess, fetchFailed } =
  executionsSlice.actions;

export const executionsReducer = executionsSlice.reducer;

export { initialState };
