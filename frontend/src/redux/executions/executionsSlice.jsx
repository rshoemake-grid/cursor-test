import { createSlice } from "@reduxjs/toolkit";
import { normalizeExecutionListItem } from "../../hooks/utils/apiExecutionStatus";
import { fetchExecutionsRequested } from "./executionsActions";

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
