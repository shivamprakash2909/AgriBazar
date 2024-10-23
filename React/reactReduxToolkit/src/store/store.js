import { configureStore, createSlice } from "@reduxjs/toolkit";
import counterReducer from "../features/counter/counterSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});

// create store
// wrap app under provider
// create createSlice
// register reducer to store
