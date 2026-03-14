import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'

const initialState = {
  value: null,
  loading: true
}

export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (token, { rejectWithValue }) => {
    try {

      const { data } = await api.get('/api/user/data', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        return data.user
      }

      return rejectWithValue(data.message)

    } catch (error) {

      return rejectWithValue(error.response?.data?.message || error.message)

    }
  }
)

export const updateUser = createAsyncThunk(
  'user/update',
  async ({ userData, token }, { rejectWithValue }) => {

    try {

      const { data } = await api.post(
        '/api/user/update',
        userData,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        return data.user
      }

      return rejectWithValue(data.message)

    } catch (error) {

      toast.error(error.message)
      return rejectWithValue(error.message)

    }

  }
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {

    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true
      })

      .addCase(fetchUser.fulfilled, (state, action) => {
        state.value = action.payload
        state.loading = false
      })

      .addCase(fetchUser.rejected, (state) => {
        state.loading = false
        state.value = null
      })

      .addCase(updateUser.fulfilled, (state, action) => {
        state.value = action.payload
      })

  }
})

export default userSlice.reducer