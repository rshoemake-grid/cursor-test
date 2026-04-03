import { createSlice } from "@reduxjs/toolkit";
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
      state.items = action.payload;
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
