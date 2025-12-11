// redux/audit/audit-slice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuditState, AuditFilters } from "./audit-slice-types";
import {
  Audit,
  AuditPlanCreate,

  AuditRescheduleHistory,
  AuditRescheduleRequest,
} from "./audit-types";
import { apiGetAudits, apiGetAuditHistory, apiPlanAudit, apiRescheduleAudit } from "./audit";

// ---------- Thunks ----------

// Load all audits
export const fetchAudits = createAsyncThunk<
  Audit[],
  void,
  { rejectValue: string }
>("audit/fetchAudits", async (_, { rejectWithValue }) => {
  try {
    const audits = await apiGetAudits();
    return audits;
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.detail || error.message || "Failed to fetch audits"
    );
  }
});

// Plan a new audit
export const planAuditThunk = createAsyncThunk<
  Audit,           // what API returns
  AuditPlanCreate,
  { rejectValue: string }
>("audit/planAudit", async (payload, { rejectWithValue }) => {
  try {
    const created = await apiPlanAudit(payload);
    return created;
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.detail || error.message || "Failed to plan audit"
    );
  }
});

// Fetch reschedule history
export const fetchAuditHistory = createAsyncThunk<
  AuditRescheduleHistory[],   // ⬅️ just the array
  number,                     // auditId as argument
  { rejectValue: string }
>("audit/fetchAuditHistory", async (auditId, { rejectWithValue }) => {
  try {
    const history = await apiGetAuditHistory(auditId);
    return history; // already an array
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.detail ||
        error.message ||
        "Failed to fetch audit history"
    );
  }
});

// Reschedule an Audit
export const rescheduleAudit = createAsyncThunk<
  Audit,
  { auditId: number; data: AuditRescheduleRequest },
  { rejectValue: string }
>("audit/rescheduleAudit", async ({ auditId, data }, { rejectWithValue }) => {
  try {
    return await apiRescheduleAudit(auditId, data);
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.detail ||
        error.message ||
        "Failed to reschedule audit"
    );
  }
});



// ---------- Initial State ----------

const initialFilters: AuditFilters = {
  search: "",
  status: "",
  plant: "",
  questionnaire: "",
  dateFrom: "",
  dateTo: "",
  auditor: "",
  auditee: "",
};

const initialState: AuditState = {
  items: [],
  loading: false,
  error: null,

  filters: initialFilters,

  historyByAuditId:[],
  historyLoading: false,
  historyError: null,

  planningLoading: false,
  planningError: null,
  rescheduleLoading: false,
rescheduleError: null,

};

// ---------- Slice ----------

const auditSlice = createSlice({
  name: "audit",
  initialState,
  reducers: {
    setAuditFilters(state, action: PayloadAction<Partial<AuditFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearAuditFilters(state) {
      state.filters = initialFilters;
    },
    getAuditorsByAuditorRequest(state) {
      state.loading = true;
      state.error = null;
    },
    getAuditorsByAuditorSuccess(state, action) {
      state.loading = false;
      state.items = action.payload;
    },
    getAuditorsByAuditorFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    }
  },
  extraReducers: (builder) => {
    // fetchAudits
    builder
      .addCase(fetchAudits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAudits.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAudits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch audits";
      });

    // planAuditThunk
    builder
      .addCase(planAuditThunk.pending, (state) => {
        state.planningLoading = true;
        state.planningError = null;
      })
      .addCase(planAuditThunk.fulfilled, (state, action) => {
  state.planningLoading = false;

  const createdAudit = action.payload; // full Audit

  state.items.unshift(createdAudit);
})
      .addCase(planAuditThunk.rejected, (state, action) => {
        state.planningLoading = false;
        state.planningError = action.payload || "Failed to plan audit";
      });

    // fetchAuditHistory
builder
  .addCase(fetchAuditHistory.pending, (state) => {
    state.historyLoading = true;
    state.historyError = null;
  })
  .addCase(fetchAuditHistory.fulfilled, (state, action) => {
    state.historyLoading = false;
    state.historyByAuditId = action.payload;
  })
  .addCase(fetchAuditHistory.rejected, (state, action) => {
    state.historyLoading = false;
    state.historyError = action.payload || "Failed to fetch audit history";
    state.historyByAuditId = [];
  });


  //reschedule Audit
    builder
  .addCase(rescheduleAudit.pending, (state) => {
  state.rescheduleLoading = true;
  state.rescheduleError = null;
})

.addCase(rescheduleAudit.fulfilled, (state, action) => {
  state.rescheduleLoading = false;

  const updatedAudit = action.payload;

  // replace the audit inside the state list
  const index = state.items.findIndex(a => a.id === updatedAudit.id);
  if (index !== -1) {
    state.items[index] = updatedAudit; // update existing audit
  }
})

.addCase(rescheduleAudit.rejected, (state, action) => {
  state.rescheduleLoading = false;
  state.rescheduleError = action.payload || "Failed to reschedule audit";
});

  },
  
});

export const { 
  setAuditFilters, 
  clearAuditFilters,
  getAuditorsByAuditorRequest,
  getAuditorsByAuditorSuccess,
  getAuditorsByAuditorFailure
} = auditSlice.actions;
export default auditSlice.reducer;
