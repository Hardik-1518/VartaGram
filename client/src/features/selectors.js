import { createSelector } from '@reduxjs/toolkit'

export const selectUser = (state) => state.user.value
export const selectUserLoading = (state) => state.user.loading

export const selectConnections = (state) => state.connections.connections
export const selectPendingConnections = (state) => state.connections.pendingConnections
export const selectFollowers = (state) => state.connections.followers
export const selectFollowing = (state) => state.connections.following

export const selectConnectionsSummary = createSelector(
  [selectConnections, selectPendingConnections, selectFollowers, selectFollowing],
  (connections, pendingConnections, followers, following) => ({
    connections,
    pendingConnections,
    followers,
    following,
  })
)

export const selectConnectionById = createSelector(
  [selectConnections, (_, userId) => userId],
  (connections, userId) => connections.find((connection) => connection._id === userId) || null
)

export const selectMessages = (state) => state.messages.messages
export const selectSortedMessages = createSelector([selectMessages], (messages) => {
  if (!Array.isArray(messages)) return []
  return [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
})

export const selectReelItems = (state) => state.reels.items
export const selectReelPage = (state) => state.reels.page
export const selectReelHasMore = (state) => state.reels.hasMore
export const selectReelLoading = (state) => state.reels.loading
export const selectReelUploadLoading = (state) => state.reels.uploadLoading
export const selectReelError = (state) => state.reels.error

export const selectReelMeta = createSelector(
  [selectReelItems, selectReelPage, selectReelHasMore, selectReelLoading, selectReelUploadLoading, selectReelError],
  (items, page, hasMore, loading, uploadLoading, error) => ({
    items,
    page,
    hasMore,
    loading,
    uploadLoading,
    error,
  })
)
